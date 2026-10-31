'use client';

import {
  AppSettings,
  AuditLogEntry,
  DietType,
  DigitalSignature,
  MealOrder,
  MealSchedule,
  MenuItem,
  Patient,
  Provider,
  QualityCheckItem,
  SopStatus,
  UserProfile,
  UserRole,
} from '@/types/nutrition';
import {
  DEFAULT_QUALITY_CHECKLIST_TEMPLATE,
  INITIAL_APP_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DIET_TYPES,
  INITIAL_MEAL_ORDERS,
  INITIAL_MENUS,
  INITIAL_PATIENTS,
  INITIAL_PROVIDERS,
  INITIAL_ROOMS,
  INITIAL_USERS,
} from './initial-data';
import { calculateAgeAtDate, getTodayISODateJakarta } from './date-utils';

const STORAGE_KEY_PREFIX = 'SI_PANTAI_GIZI_';

interface DatabaseState {
  users: UserProfile[];
  currentUser: UserProfile;
  patients: Patient[];
  rooms: typeof INITIAL_ROOMS;
  dietTypes: DietType[];
  menus: MenuItem[];
  providers: Provider[];
  orders: MealOrder[];
  auditLogs: AuditLogEntry[];
  settings: AppSettings;
}

export class DbStore {
  private static instance: DbStore;
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSyncIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private isAutoSyncActive: boolean = true;
  private isSyncingWithGas: boolean = false;
  private lastAutoSyncStatus: { success: boolean; message: string; timestamp: string } | null = null;

  private constructor() {
    this.state = this.loadInitialState();
  }

  public static getInstance(): DbStore {
    if (!DbStore.instance) {
      DbStore.instance = new DbStore();
    }
    return DbStore.instance;
  }

  private loadInitialState(): DatabaseState {
    return {
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[3], // Default to Ahli Gizi for richest initial view
      patients: INITIAL_PATIENTS,
      rooms: INITIAL_ROOMS,
      dietTypes: INITIAL_DIET_TYPES,
      menus: INITIAL_MENUS,
      providers: INITIAL_PROVIDERS,
      orders: INITIAL_MEAL_ORDERS,
      auditLogs: INITIAL_AUDIT_LOGS,
      settings: INITIAL_APP_SETTINGS,
    };
  }

  public async hydrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // 1. Fetch server-side global settings first so any new browser gets the GAS Web App & Sheets settings immediately!
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          if (json?.settings && typeof json.settings === 'object') {
            this.state.settings = {
              ...this.state.settings,
              ...json.settings,
            };
            localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(this.state.settings));
          }
        }
      } catch {
        // ignore offline / server fetch error
      }

      const storedOrders = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
      const storedPatients = localStorage.getItem(`${STORAGE_KEY_PREFIX}patients`);
      const storedUsers = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
      const storedCurrentUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}currentUser`);
      const storedMenus = localStorage.getItem(`${STORAGE_KEY_PREFIX}menus`);
      const storedDietTypes = localStorage.getItem(`${STORAGE_KEY_PREFIX}dietTypes`);
      const storedProviders = localStorage.getItem(`${STORAGE_KEY_PREFIX}providers`);
      const storedAuditLogs = localStorage.getItem(`${STORAGE_KEY_PREFIX}auditLogs`);
      const storedSettings = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
      const storedRooms = localStorage.getItem(`${STORAGE_KEY_PREFIX}rooms`);

      if (
        storedOrders ||
        storedPatients ||
        storedUsers ||
        storedCurrentUser ||
        storedMenus ||
        storedDietTypes ||
        storedProviders ||
        storedAuditLogs ||
        storedSettings ||
        storedRooms
      ) {
        const users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
        const currentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : INITIAL_USERS[3];
        const parsedSettings = storedSettings ? JSON.parse(storedSettings) : this.state.settings;
        let loadedRooms = storedRooms ? JSON.parse(storedRooms) : INITIAL_ROOMS;

        // Auto-migrate to new 4 ward rooms if cached rooms still contain legacy names
        const hasNewRooms = Array.isArray(loadedRooms) && loadedRooms.some((r: any) => r?.room?.includes('Lt. 1') || r?.room?.includes('Lt. 2'));
        if (!hasNewRooms || !loadedRooms || loadedRooms.length === 0) {
          loadedRooms = INITIAL_ROOMS;
          localStorage.setItem(`${STORAGE_KEY_PREFIX}rooms`, JSON.stringify(INITIAL_ROOMS));
        }

        let loadedPatients = storedPatients ? JSON.parse(storedPatients) : INITIAL_PATIENTS;
        // Migrate any patient with legacy room names
        if (Array.isArray(loadedPatients)) {
          loadedPatients = loadedPatients.map((p: Patient) => {
            if (p.room === 'Ruang Teratai') {
              return { ...p, room: p.gender === 'L' ? 'Ruang Rawat Inap Lt. 2 Laki-laki' : 'Ruang Rawat Inap Lt. 2 Perempuan' };
            }
            if (p.room === 'Ruang Dahlia') {
              return { ...p, room: 'Ruang Rawat Inap Lt. 2 Anak-anak' };
            }
            if (p.room === 'Ruang Flamboyan' || p.room === 'Ruang Bougenville') {
              return { ...p, room: 'Ruang Rawat Inap Lt. 1' };
            }
            return p;
          });
        }

        let loadedOrders = storedOrders ? JSON.parse(storedOrders) : INITIAL_MEAL_ORDERS;
        if (Array.isArray(loadedOrders)) {
          loadedOrders = loadedOrders.map((o: MealOrder) => {
            if (o.room === 'Ruang Teratai') {
              return { ...o, room: 'Ruang Rawat Inap Lt. 2 Laki-laki' };
            }
            if (o.room === 'Ruang Dahlia') {
              return { ...o, room: 'Ruang Rawat Inap Lt. 2 Anak-anak' };
            }
            if (o.room === 'Ruang Flamboyan' || o.room === 'Ruang Bougenville') {
              return { ...o, room: 'Ruang Rawat Inap Lt. 1' };
            }
            return o;
          });
        }

        this.state = {
          users,
          currentUser,
          patients: loadedPatients,
          rooms: loadedRooms,
          dietTypes: storedDietTypes ? JSON.parse(storedDietTypes) : INITIAL_DIET_TYPES,
          menus: storedMenus ? JSON.parse(storedMenus) : INITIAL_MENUS,
          providers: storedProviders ? JSON.parse(storedProviders) : INITIAL_PROVIDERS,
          orders: loadedOrders,
          auditLogs: storedAuditLogs ? JSON.parse(storedAuditLogs) : INITIAL_AUDIT_LOGS,
          settings: {
            ...INITIAL_APP_SETTINGS,
            ...this.state.settings,
            ...parsedSettings,
            dkiLogoUrl: parsedSettings?.dkiLogoUrl || this.state.settings?.dkiLogoUrl || INITIAL_APP_SETTINGS.dkiLogoUrl,
            kemenkesLogoUrl: parsedSettings?.kemenkesLogoUrl || this.state.settings?.kemenkesLogoUrl || INITIAL_APP_SETTINGS.kemenkesLogoUrl,
          },
        };
        this.notify();
      }
      // Start 3-second auto-sync loop across the application
      this.startAutoSyncLoop(3000);
    } catch {
      // keep baseline state if parsing fails
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(this.state.orders));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}patients`, JSON.stringify(this.state.patients));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(this.state.users));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}currentUser`, JSON.stringify(this.state.currentUser));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}menus`, JSON.stringify(this.state.menus));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}dietTypes`, JSON.stringify(this.state.dietTypes));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}providers`, JSON.stringify(this.state.providers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}auditLogs`, JSON.stringify(this.state.auditLogs));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(this.state.settings));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}rooms`, JSON.stringify(this.state.rooms));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
    this.notify();
    // Auto-sync whenever data is added or updated (patient, order, qc, handover, leftover)
    this.triggerBackgroundGasSync();
  }

  // --- Auto-Sync to Google Apps Script & Google Sheets ---
  public isAutoSyncRunning(): boolean {
    return this.isAutoSyncActive;
  }

  public setAutoSyncRunning(active: boolean) {
    this.isAutoSyncActive = active;
    if (active) {
      this.startAutoSyncLoop(3000);
      this.triggerBackgroundGasSync(true);
    }
    this.notify();
  }

  public getAutoSyncStatus() {
    return this.lastAutoSyncStatus;
  }

  public startAutoSyncLoop(intervalMs = 3000) {
    if (typeof window === 'undefined') return;
    if (this.autoSyncIntervalTimer) {
      clearInterval(this.autoSyncIntervalTimer);
      this.autoSyncIntervalTimer = null;
    }

    this.autoSyncIntervalTimer = setInterval(() => {
      if (this.isAutoSyncActive && this.state.settings.gasWebAppUrl && !this.isSyncingWithGas) {
        this.triggerBackgroundGasSync(false);
      }
    }, intervalMs);
  }

  public triggerBackgroundGasSync(immediate = false) {
    if (typeof window === 'undefined') return;
    const gasUrl = this.state.settings.gasWebAppUrl;
    if (!gasUrl || typeof gasUrl !== 'string' || !gasUrl.startsWith('https://script.google.com/macros/s/')) {
      return;
    }

    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }

    const runSync = async () => {
      if (this.isSyncingWithGas) return;
      this.isSyncingWithGas = true;
      try {
        const payload = {
          orders: this.state.orders,
          auditLogs: this.state.auditLogs,
          patients: this.state.patients,
        };
        const response = await fetch('/api/gas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gasWebAppUrl: gasUrl.trim(),
            action: 'syncAll',
            payload,
          }),
        });

        if (response.ok) {
          const nowIso = new Date().toISOString();
          this.state.settings.lastGasSyncAt = nowIso;
          this.lastAutoSyncStatus = {
            success: true,
            message: 'Tersinkronisasi otomatis ke Google Spreadsheet',
            timestamp: nowIso,
          };
          this.notify();
        }
      } catch (err: any) {
        this.lastAutoSyncStatus = {
          success: false,
          message: err?.message || 'Gagal sinkronisasi background ke Google Sheets',
          timestamp: new Date().toISOString(),
        };
      } finally {
        this.isSyncingWithGas = false;
      }
    };

    if (immediate) {
      runSync();
    } else {
      this.syncDebounceTimer = setTimeout(runSync, 400);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // --- User & Role Management ---
  public getCurrentUser(): UserProfile {
    return this.state.currentUser;
  }

  public setCurrentUser(user: UserProfile) {
    this.state.currentUser = user;
    this.saveState();
  }

  public switchRole(role: UserRole) {
    const userForRole = this.state.users.find((u) => u.role === role);
    if (userForRole) {
      this.state.currentUser = userForRole;
      this.saveState();
    }
  }

  public getUsers(): UserProfile[] {
    return [...this.state.users];
  }

  // --- Audit Logging ---
  public logAudit(action: string, module: string, referenceId: string, details: string) {
    const log: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: this.state.currentUser.id,
      userName: this.state.currentUser.name,
      userRole: this.state.currentUser.role,
      action,
      module,
      referenceId,
      details,
    };
    this.state.auditLogs = [log, ...this.state.auditLogs];
    this.saveState();
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.state.auditLogs];
  }

  // --- Patient Management ---
  public getPatients(): Patient[] {
    return [...this.state.patients];
  }

  public getPatientById(id: string): Patient | undefined {
    return this.state.patients.find((p) => p.id === id);
  }

  public getOrdersForPatient(patientId: string): MealOrder[] {
    return this.state.orders.filter((o) => o.patientId === patientId);
  }

  public getPatientMealFrequencySummary(patientId: string) {
    const orders = this.getOrdersForPatient(patientId).filter(
      (o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED'
    );
    let sarapanCount = 0;
    let siangCount = 0;
    let malamCount = 0;
    let servedCount = 0;
    let totalCost = 0;
    let comstockSum = 0;
    let comstockEvaluatedCount = 0;

    orders.forEach((o) => {
      const isServed = ['DELIVERED_TO_PATIENT', 'CONSUMPTION_RECORDED', 'COMPLETED'].includes(o.status);
      if (isServed) servedCount += (o.billedPortionCount || o.portionCount || 1);

      if (o.schedule === 'SARAPAN') sarapanCount += (o.portionCount || 1);
      else if (o.schedule === 'SIANG') siangCount += (o.portionCount || 1);
      else if (o.schedule === 'MALAM') malamCount += (o.portionCount || 1);

      totalCost += (o.finalBilledAmount || o.totalEstimatedPrice || 0);

      if (o.leftoverAssessment && o.leftoverAssessment.consumptionPercentage !== undefined) {
        comstockSum += o.leftoverAssessment.consumptionPercentage;
        comstockEvaluatedCount++;
      }
    });

    const avgConsumptionPercentage = comstockEvaluatedCount > 0 ? Math.round(comstockSum / comstockEvaluatedCount) : 100;

    return {
      totalOrders: orders.length,
      servedCount,
      sarapanCount,
      siangCount,
      malamCount,
      totalCost,
      avgConsumptionPercentage,
      orders,
    };
  }

  public addPatient(patientData: Omit<Patient, 'id'>): Patient {
    const newPatient: Patient = {
      ...patientData,
      id: `PAT-${Date.now().toString().slice(-4)}`,
    };
    this.state.patients.push(newPatient);
    this.logAudit('CREATE_PATIENT', 'Data Pasien Rawat Inap', newPatient.mrn, `Pendaftaran pasien baru: ${newPatient.name} (${newPatient.mrn}) di ${newPatient.room} ${newPatient.bed}`);
    this.saveState();
    return newPatient;
  }

  public updatePatient(patient: Patient) {
    const idx = this.state.patients.findIndex((p) => p.id === patient.id);
    if (idx !== -1) {
      this.state.patients[idx] = patient;
      this.logAudit('UPDATE_PATIENT', 'Data Pasien Rawat Inap', patient.mrn, `Pembaruan data pasien: ${patient.name}`);
      this.saveState();
    }
  }

  /**
   * Ahli gizi atau dokter memulangkan pasien rawat inap
   * Otomatis membatalkan pesanan makanan yang belum terdistribusi ke pasien
   */
  public dischargePatient(params: {
    patientId: string;
    dischargedBy: string;
    dischargeNotes?: string;
    dischargeDate?: string;
  }): { success: boolean; message: string; cancelledOrdersCount: number } {
    const patient = this.state.patients.find((p) => p.id === params.patientId);
    if (!patient) {
      return { success: false, message: 'Data pasien tidak ditemukan.', cancelledOrdersCount: 0 };
    }

    const todayJakarta = params.dischargeDate || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    patient.status = 'DISCHARGED';
    patient.dischargeDate = todayJakarta;
    patient.dischargedAt = nowIso;
    patient.dischargedBy = params.dischargedBy;
    patient.dischargeNotes = params.dischargeNotes || 'Pasien dinyatakan sembuh / diizinkan rawat jalan.';

    // Cancel unserved pending meal orders for this patient
    const cancellableStatuses = [
      'DRAFT',
      'SUBMITTED',
      'NUTRITION_REVIEW',
      'NUTRITION_APPROVED',
      'SENT_TO_PROVIDER',
      'PROVIDER_ACCEPTED',
      'FOOD_PREPARATION',
      'READY_TO_DELIVER',
    ];

    let cancelledCount = 0;
    this.state.orders.forEach((o) => {
      if (o.patientId === patient.id && cancellableStatuses.includes(o.status)) {
        o.status = 'CANCELLED';
        o.cancellationReason = `[PASIEN PULANG] Dihentikan oleh ${params.dischargedBy}. Catatan: ${params.dischargeNotes || 'Pasien telah pulang'}`;
        o.billingStatus = 'TIDAK_DAPAT_DITAGIHKAN';
        o.statusHistory.push({
          status: 'CANCELLED',
          timestamp: nowIso,
          changedBy: params.dischargedBy,
          role: 'AHLI_GIZI',
          reasonOrNotes: o.cancellationReason,
        });
        cancelledCount++;
      }
    });

    this.logAudit(
      'DISCHARGE_PATIENT',
      'Data Pasien Rawat Inap',
      patient.mrn,
      `Pasien ${patient.name} (${patient.mrn}) dipulangkan oleh ${params.dischargedBy}. ${cancelledCount} order makanan yang belum tersaji otomatis dibatalkan.`
    );

    this.saveState();
    return {
      success: true,
      message: `Pasien ${patient.name} berhasil diberi status PULANG. ${cancelledCount} pesanan makanan yang belum tersaji otomatis dibatalkan.`,
      cancelledOrdersCount: cancelledCount,
    };
  }

  /**
   * Rawat kembali pasien jika ada penerimaan rawat inap ulang
   */
  public readmitPatient(params: {
    patientId: string;
    room: string;
    bed: string;
    readmittedBy: string;
    clinicalDiagnosis?: string;
  }): { success: boolean; message: string } {
    const patient = this.state.patients.find((p) => p.id === params.patientId);
    if (!patient) return { success: false, message: 'Data pasien tidak ditemukan.' };

    const todayJakarta = new Date().toISOString().split('T')[0];
    patient.status = 'ACTIVE';
    patient.room = params.room;
    patient.bed = params.bed;
    patient.admissionDate = todayJakarta;
    patient.dischargeDate = undefined;
    patient.dischargedAt = undefined;
    patient.dischargedBy = undefined;
    patient.dischargeNotes = undefined;
    if (params.clinicalDiagnosis) patient.clinicalDiagnosis = params.clinicalDiagnosis;

    this.logAudit(
      'READMIT_PATIENT',
      'Data Pasien Rawat Inap',
      patient.mrn,
      `Pasien ${patient.name} dirawat kembali oleh ${params.readmittedBy} di ${params.room} ${params.bed}`
    );

    this.saveState();
    return { success: true, message: `Pasien ${patient.name} aktif kembali di ${params.room} ${params.bed}` };
  }

  // --- Master Data ---
  public getRooms() {
    return [...this.state.rooms];
  }

  public getDietTypes(): DietType[] {
    return [...this.state.dietTypes];
  }

  public getMenus(): MenuItem[] {
    return [...this.state.menus];
  }

  public getProviders(): Provider[] {
    return [...this.state.providers];
  }

  public getSettings(): AppSettings {
    return { ...this.state.settings };
  }

  public updateSettings(newSettings: Partial<AppSettings>) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.logAudit('UPDATE_SETTINGS', 'Pengaturan Aplikasi', 'APP-CONFIG', 'Konfigurasi Puskesmas dan Integrasi Google Apps Script diperbarui');
    this.saveState();

    // Persist globally across all browsers via server API
    if (typeof window !== 'undefined') {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state.settings),
      }).catch(() => {
        // network / offline fallback
      });
    }
  }

  // --- Meal Order Management & SOP State Machine ---
  public getOrders(): MealOrder[] {
    return [...this.state.orders];
  }

  public getOrderById(id: string): MealOrder | undefined {
    return this.state.orders.find((o) => o.id === id);
  }

  /**
   * Validasi idempotensi: cegah order dobel pasien yang sama di jadwal & tanggal yang sama
   */
  public isDuplicateOrder(patientId: string, schedule: MealSchedule, serviceDate: string, excludeOrderId?: string): boolean {
    return this.state.orders.some((o) => {
      if (excludeOrderId && o.id === excludeOrderId) return false;
      if (o.status === 'CANCELLED' || o.status === 'REJECTED') return false;
      return o.patientId === patientId && o.schedule === schedule && o.serviceDate === serviceDate;
    });
  }

  public createOrder(params: {
    serviceDate: string;
    patientId: string;
    portionCount?: number;
    specialClinicalNotes?: string;
    dietaryNotes?: string;
  }): { success: boolean; order?: MealOrder; message?: string } {
    const patient = this.getPatientById(params.patientId);
    if (!patient) return { success: false, message: 'Data pasien tidak ditemukan.' };

    const age = calculateAgeAtDate(patient.birthDate, params.serviceDate);
    const orderDateClean = params.serviceDate.replace(/-/g, '');
    const seq = String(this.state.orders.length + 1).padStart(3, '0');
    const orderNumber = `ORD-${orderDateClean}-${seq}`;
    const nowIso = new Date().toISOString();

    const provider = this.state.providers[0];
    const portionCount = params.portionCount || 1;

    const newOrder: MealOrder = {
      id: orderNumber,
      orderNumber,
      createdAt: nowIso,
      serviceDate: params.serviceDate,
      schedule: 'SIANG',
      selectedSchedules: ['SIANG'],
      patientId: patient.id,
      patientMrn: patient.mrn,
      patientName: patient.name,
      patientAgeYears: age.years,
      patientAgeMonths: age.months,
      room: patient.room,
      bed: patient.bed,
      medicalDiagnosis: patient.clinicalDiagnosis,
      allergies: patient.foodAllergies,
      dietTypeName: params.dietaryNotes || 'Perlu Telaah Diet Gizi',
      texture: 'Biasa',
      menuId: undefined,
      menuName: params.dietaryNotes || 'Instruksi Dokter: ' + (params.specialClinicalNotes || 'Diet Seimbang'),
      portionCount,
      pricePerPortionSnapshot: 0,
      totalEstimatedPrice: 0,
      specialClinicalNotes: params.specialClinicalNotes,
      orderedByUserId: this.state.currentUser.id,
      orderedByName: this.state.currentUser.name,
      orderedByRole: this.state.currentUser.role,
      providerId: provider?.id,
      providerName: provider?.name,
      billingStatus: 'BELUM_DIREKAP',
      billedPortionCount: 0,
      finalBilledAmount: 0,
      status: 'SUBMITTED',
      statusHistory: [
        {
          status: 'DRAFT',
          timestamp: nowIso,
          changedBy: this.state.currentUser.name,
          role: this.state.currentUser.role,
          reasonOrNotes: 'Order diajukan dokter/perawat',
        },
        {
          status: 'SUBMITTED',
          timestamp: nowIso,
          changedBy: this.state.currentUser.name,
          role: this.state.currentUser.role,
          reasonOrNotes: 'Terkirim ke Instalasi Gizi',
        },
      ],
    };

    this.state.orders.unshift(newOrder);
    this.logAudit(
      'CREATE_ORDER',
      'Order Makan Pasien',
      newOrder.orderNumber,
      `Pemesanan makan pasien ${newOrder.patientName} (${newOrder.patientMrn}) oleh ${newOrder.orderedByName}. Catatan: ${params.specialClinicalNotes || '-'}`
    );
    this.saveState();
    return { success: true, order: newOrder };
  }

  public cancelOrder(orderId: string, reason: string): { success: boolean; message?: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Order tidak ditemukan' };

    const disallowedStatuses: SopStatus[] = [
      'FOOD_PREPARATION',
      'READY_TO_DELIVER',
      'IN_DELIVERY',
      'RECEIVED_BY_WAITER',
      'DISTRIBUTION_IN_PROGRESS',
      'DELIVERED_TO_PATIENT',
      'CONSUMPTION_RECORDED',
      'COMPLETED',
    ];
    if (disallowedStatuses.includes(order.status)) {
      return {
        success: false,
        message: 'Order tidak dapat dibatalkan karena makanan telah atau sedang diproses oleh penyedia. Silakan koordinasi langsung dengan ahli gizi!',
      };
    }

    const nowIso = new Date().toISOString();
    order.status = 'CANCELLED';
    order.billingStatus = 'TIDAK_DAPAT_DITAGIHKAN';
    order.statusHistory.push({
      status: 'CANCELLED',
      timestamp: nowIso,
      changedBy: this.state.currentUser.name,
      role: this.state.currentUser.role,
      reasonOrNotes: reason,
    });

    this.logAudit('CANCEL_ORDER', 'Order Makan Pasien', order.orderNumber, `Order dibatalkan. Alasan: ${reason}`);
    this.saveState();
    return { success: true };
  }

  // --- Ahli Gizi Review ---
  public reviewOrder(params: {
    orderId: string;
    decision: 'APPROVE' | 'REJECT' | 'RETURN';
    selectedSchedules?: MealSchedule[];
    menuId?: string;
    menuName?: string;
    dietTypeName?: string;
    texture?: string;
    notes?: string;
    revisionReason?: string;
    adjustedPortion?: number;
  }): { success: boolean; message?: string } {
    const order = this.getOrderById(params.orderId);
    if (!order) return { success: false, message: 'Order tidak ditemukan' };

    const nowIso = new Date().toISOString();
    order.reviewedByUserId = this.state.currentUser.id;
    order.reviewedByName = this.state.currentUser.name;
    order.reviewedAt = nowIso;
    order.reviewNotes = params.notes;

    if (params.decision === 'APPROVE') {
      const schedules = params.selectedSchedules && params.selectedSchedules.length > 0
        ? params.selectedSchedules
        : ['SIANG' as MealSchedule];

      order.selectedSchedules = schedules;
      order.schedule = schedules[0]; // primary schedule

      // Standard tariff pricing: Sarapan 25.000, Siang 45.000, Malam 45.000
      let unitPriceSum = 0;
      schedules.forEach((sch) => {
        if (sch === 'SARAPAN') unitPriceSum += 25000;
        else if (sch === 'SIANG') unitPriceSum += 45000;
        else if (sch === 'MALAM') unitPriceSum += 45000;
        else unitPriceSum += 15000;
      });

      if (params.menuId) {
        order.menuId = params.menuId;
        const menuObj = this.state.menus.find((m) => m.id === params.menuId);
        if (menuObj) {
          order.menuName = menuObj.name;
          order.dietTypeName = params.dietTypeName || menuObj.dietCategoryName;
          order.texture = params.texture || menuObj.texture;
        }
      } else if (params.menuName) {
        order.menuName = params.menuName;
      }

      if (params.dietTypeName) order.dietTypeName = params.dietTypeName;
      if (params.texture) order.texture = params.texture;

      const portions = params.adjustedPortion || order.portionCount || 1;
      order.portionCount = portions;
      order.pricePerPortionSnapshot = unitPriceSum;
      order.totalEstimatedPrice = unitPriceSum * portions;

      order.status = 'SENT_TO_PROVIDER';
      order.statusHistory.push(
        {
          status: 'NUTRITION_APPROVED',
          timestamp: nowIso,
          changedBy: this.state.currentUser.name,
          role: this.state.currentUser.role,
          reasonOrNotes: params.notes || `Disetujui untuk: ${schedules.join(', ')} (Tarif: Rp ${unitPriceSum.toLocaleString('id-ID')})`,
        },
        {
          status: 'SENT_TO_PROVIDER',
          timestamp: nowIso,
          changedBy: this.state.currentUser.name,
          role: this.state.currentUser.role,
          reasonOrNotes: `Diteruskan ke penyedia ${order.providerName || 'Katering'}`,
        }
      );
      this.logAudit(
        'APPROVE_ORDER',
        'Persetujuan Ahli Gizi',
        order.orderNumber,
        `Order disetujui untuk ${schedules.join(', ')}. Total: Rp ${order.totalEstimatedPrice.toLocaleString('id-ID')}`
      );
    } else if (params.decision === 'RETURN') {
      order.status = 'RETURNED_FOR_REVISION';
      order.revisionReason = params.revisionReason || params.notes || 'Perlu perbaikan order';
      order.statusHistory.push({
        status: 'RETURNED_FOR_REVISION',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: order.revisionReason,
      });
      this.logAudit('RETURN_ORDER', 'Persetujuan Ahli Gizi', order.orderNumber, `Order dikembalikan untuk revisi: ${order.revisionReason}`);
    } else {
      order.status = 'REJECTED';
      order.billingStatus = 'TIDAK_DAPAT_DITAGIHKAN';
      order.statusHistory.push({
        status: 'REJECTED',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: params.notes || 'Order ditolak ahli gizi',
      });
      this.logAudit('REJECT_ORDER', 'Persetujuan Ahli Gizi', order.orderNumber, `Order ditolak oleh ahli gizi: ${params.notes}`);
    }

    this.saveState();
    return { success: true };
  }

  // --- Provider Handlers ---
  public providerRespondOrder(orderId: string, accept: boolean, rejectReason?: string): { success: boolean; message?: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Order tidak ditemukan' };

    const nowIso = new Date().toISOString();
    if (accept) {
      order.status = 'PROVIDER_ACCEPTED';
      order.providerAcceptedAt = nowIso;
      order.statusHistory.push({
        status: 'PROVIDER_ACCEPTED',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: 'Penyedia menerima pesanan makanan',
      });
      this.logAudit('PROVIDER_ACCEPT', 'Penyedia Makanan', order.orderNumber, 'Penyedia menerima pesanan makanan');
    } else {
      order.status = 'REJECTED';
      order.providerRejectReason = rejectReason || 'Kapasitas penuh / kendala teknis';
      order.billingStatus = 'TIDAK_DAPAT_DITAGIHKAN';
      order.statusHistory.push({
        status: 'REJECTED',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: `Penyedia menolak: ${order.providerRejectReason}`,
      });
      this.logAudit('PROVIDER_REJECT', 'Penyedia Makanan', order.orderNumber, `Penyedia menolak pesanan: ${order.providerRejectReason}`);
    }

    this.saveState();
    return { success: true };
  }

  public providerStartPreparation(orderId: string) {
    const order = this.getOrderById(orderId);
    if (!order) return;
    const nowIso = new Date().toISOString();
    order.status = 'FOOD_PREPARATION';
    order.preparedPortionCount = order.portionCount;
    order.statusHistory.push({
      status: 'FOOD_PREPARATION',
      timestamp: nowIso,
      changedBy: this.state.currentUser.name,
      role: this.state.currentUser.role,
      reasonOrNotes: 'Makanan sedang dipersiapkan di dapur katering',
    });
    this.logAudit('PREPARATION_STARTED', 'Penyedia Makanan', order.orderNumber, 'Memulai pengolahan makanan di dapur');
    this.saveState();
  }

  public providerShipFood(params: {
    orderId: string;
    shippedPortionCount: number;
    courierName: string;
    notes?: string;
  }): { success: boolean; message?: string } {
    const order = this.getOrderById(params.orderId);
    if (!order) return { success: false, message: 'Order tidak ditemukan' };

    const nowIso = new Date().toISOString();
    order.shippedPortionCount = params.shippedPortionCount;
    order.courierName = params.courierName;
    order.shippedAt = nowIso;
    order.status = 'IN_DELIVERY';
    order.statusHistory.push(
      {
        status: 'READY_TO_DELIVER',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: 'Makanan selesai dikemas dan siap diantar',
      },
      {
        status: 'IN_DELIVERY',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: `Kurir: ${params.courierName}. Dikirim ke Puskesmas. ${params.notes || ''}`,
      }
    );

    this.logAudit('FOOD_SHIPPED', 'Penyedia Makanan', order.orderNumber, `Makanan dikirim ke Puskesmas. Kurir: ${params.courierName}, Porsi: ${params.shippedPortionCount}`);
    this.saveState();
    return { success: true };
  }

  // --- Receiving & Handover Check ---
  public receiveAndInspectFood(params: {
    orderId: string;
    qualityChecklist: QualityCheckItem[];
    discrepancyAction: 'DITERIMA_SESUAI' | 'DITERIMA_DENGAN_CATATAN' | 'DITOLAK_MINTA_GANTI' | 'DIBATALKAN';
    discrepancyNotes?: string;
    providerSignature: DigitalSignature;
    waiterSignature: DigitalSignature;
  }): { success: boolean; message?: string } {
    const order = this.getOrderById(params.orderId);
    if (!order) return { success: false, message: 'Order tidak ditemukan' };

    const nowIso = new Date().toISOString();
    const criticalFailed = params.qualityChecklist.some((item) => item.isCritical && item.result === 'TIDAK_SESUAI');

    if (criticalFailed && params.discrepancyAction === 'DITERIMA_SESUAI') {
      return {
        success: false,
        message: 'Terdapat checklist kritis yang TIDAK SESUAI (misal: label, diet, alergen, atau suhu). Makanan tidak boleh diterima tanpa catatan atau tindakan koreksi!',
      };
    }

    order.receivedByWaiterId = this.state.currentUser.id;
    order.receivedByWaiterName = this.state.currentUser.name;
    order.receivedAt = nowIso;
    order.qualityChecklist = params.qualityChecklist;
    order.checklistPassed = !criticalFailed;
    order.discrepancyAction = params.discrepancyAction;
    order.discrepancyNotes = params.discrepancyNotes;
    order.handoverProviderSignature = params.providerSignature;
    order.handoverWaiterSignature = params.waiterSignature;

    if (params.discrepancyAction === 'DITOLAK_MINTA_GANTI' || params.discrepancyAction === 'DIBATALKAN') {
      order.status = 'DELIVERY_EXCEPTION';
      order.statusHistory.push({
        status: 'DELIVERY_EXCEPTION',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: `Penerimaan ditolak: ${params.discrepancyNotes || 'Ketidaksesuaian mutu kritis'}`,
      });
      this.logAudit('FOOD_INSPECTION_REJECTED', 'Penerimaan Makanan', order.orderNumber, `Makanan tidak lolos inspeksi mutu. Tindakan: ${params.discrepancyAction}`);
    } else {
      order.status = 'RECEIVED_BY_WAITER';
      order.statusHistory.push({
        status: 'RECEIVED_BY_WAITER',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: `Diterima oleh pramusaji dengan status: ${params.discrepancyAction}`,
      });
      this.logAudit('FOOD_INSPECTION_PASSED', 'Penerimaan Makanan', order.orderNumber, `Makanan diterima dan ditandatangani serah terima. Tindakan: ${params.discrepancyAction}`);
    }

    this.saveState();
    return { success: true };
  }

  // --- Patient Distribution ---
  public distributeToPatient(params: {
    orderId: string;
    servedMealPhotoUrl: string;
    recipientSignature: DigitalSignature;
    distributionNotes?: string;
  }): { success: boolean; message?: string } {
    const order = this.getOrderById(params.orderId);
    if (!order) return { success: false, message: 'Order tidak ditemukan' };

    const nowIso = new Date().toISOString();
    order.distributionStartedAt = order.distributionStartedAt || nowIso;
    order.deliveredToPatientAt = nowIso;
    order.servedMealPhotoUrl = params.servedMealPhotoUrl;
    order.recipientSignature = params.recipientSignature;
    order.distributionNotes = params.distributionNotes;
    order.status = 'DELIVERED_TO_PATIENT';
    
    // Default billing readiness once safely delivered
    order.billedPortionCount = order.portionCount;
    order.finalBilledAmount = order.pricePerPortionSnapshot * order.portionCount;
    order.billingStatus = 'MENUNGGU_VERIFIKASI';

    order.statusHistory.push(
      {
        status: 'DISTRIBUTION_IN_PROGRESS',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: 'Membawa makanan ke ruang perawatan pasien',
      },
      {
        status: 'DELIVERED_TO_PATIENT',
        timestamp: nowIso,
        changedBy: this.state.currentUser.name,
        role: this.state.currentUser.role,
        reasonOrNotes: `Makanan tersaji ke ${order.patientName}. Diterima oleh ${params.recipientSignature.signerName} (${params.recipientSignature.signerRelation || 'Pasien'})`,
      }
    );

    this.logAudit(
      'DELIVER_TO_PATIENT',
      'Distribusi Makanan Pasien',
      order.orderNumber,
      `Penyajian makanan selesai. Foto sajian aktual dan tanda tangan penerima (${params.recipientSignature.signerName}) tersimpan.`
    );
    this.saveState();
    return { success: true };
  }

  public markEtiketPrinted(orderId: string) {
    const order = this.getOrderById(orderId);
    if (!order) return;
    order.etiketPrintedAt = new Date().toISOString();
    this.logAudit(
      'PRINT_ETIKET',
      'Distribusi Makanan Pasien',
      order.orderNumber,
      `Etiket stiker makanan dicetak untuk ditempel pada wadah pasien ${order.patientName} (${order.room} ${order.bed})`
    );
    this.saveState();
  }

  // --- Leftover Assessment (Comstock) ---
  public recordLeftoverAssessment(params: {
    orderId: string;
    consumptionCategory: 'HABIS_100' | 'SISA_SEPEREMPAT' | 'SISA_SETENGAH' | 'SISA_TIGAPEREMPAT' | 'TIDAK_DIMAKAN_0' | 'TIDAK_DAPAT_DINILAI';
    reasons: string[];
    otherReasonNotes?: string;
    leftoverPhotoUrl?: string;
    clinicalFollowupRecommendation?: string;
  }): { success: boolean; message?: string } {
    const order = this.getOrderById(params.orderId);
    if (!order) return { success: false, message: 'Order tidak ditemukan' };

    const percentageMap = {
      HABIS_100: { consumed: 100, leftover: 0 },
      SISA_SEPEREMPAT: { consumed: 75, leftover: 25 },
      SISA_SETENGAH: { consumed: 50, leftover: 50 },
      SISA_TIGAPEREMPAT: { consumed: 25, leftover: 75 },
      TIDAK_DIMAKAN_0: { consumed: 0, leftover: 100 },
      TIDAK_DAPAT_DINILAI: { consumed: 0, leftover: 0 },
    };

    const perc = percentageMap[params.consumptionCategory];
    const nowIso = new Date().toISOString();

    order.leftoverAssessment = {
      assessedAt: nowIso,
      assessedByName: this.state.currentUser.name,
      consumptionCategory: params.consumptionCategory,
      consumptionPercentage: perc.consumed,
      leftoverPercentage: perc.leftover,
      reasons: params.reasons,
      otherReasonNotes: params.otherReasonNotes,
      leftoverPhotoUrl: params.leftoverPhotoUrl,
      clinicalFollowupRecommendation: params.clinicalFollowupRecommendation,
    };

    order.status = 'CONSUMPTION_RECORDED';
    order.statusHistory.push({
      status: 'CONSUMPTION_RECORDED',
      timestamp: nowIso,
      changedBy: this.state.currentUser.name,
      role: this.state.currentUser.role,
      reasonOrNotes: `Penilaian Comstock: ${params.consumptionCategory} (Konsumsi: ${perc.consumed}%). Alasan: ${params.reasons.join(', ') || '-'}`,
    });

    this.logAudit(
      'RECORD_LEFTOVERS',
      'Monitoring Sisa Makanan',
      order.orderNumber,
      `Evaluasi porsi pasien ${order.patientName}: Konsumsi ${perc.consumed}%, sisa ${perc.leftover}%. Alasan: ${params.reasons.join(', ') || 'Nafsu makan baik'}`
    );
    this.saveState();
    return { success: true };
  }

  // --- Finalize & Billing Verification ---
  public finalizeOrder(orderId: string): { success: boolean; message?: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Order tidak ditemukan' };

    const nowIso = new Date().toISOString();
    order.status = 'COMPLETED';
    order.billingStatus = 'TERVERIFIKASI';
    order.statusHistory.push({
      status: 'COMPLETED',
      timestamp: nowIso,
      changedBy: this.state.currentUser.name,
      role: this.state.currentUser.role,
      reasonOrNotes: 'Seluruh alur SOP pemberian makan dan monitoring telah lengkap',
    });

    this.logAudit('COMPLETE_ORDER_SOP', 'Persetujuan Ahli Gizi', order.orderNumber, 'Alur SOP selesai lengkap dan terverifikasi untuk tagihan bulanan');
    this.saveState();
    return { success: true };
  }

  public updateBillingAdjustment(orderId: string, billedPortionCount: number, billingNotes: string) {
    const order = this.getOrderById(orderId);
    if (!order) return;

    const oldAmount = order.finalBilledAmount;
    order.billedPortionCount = billedPortionCount;
    order.finalBilledAmount = order.pricePerPortionSnapshot * billedPortionCount;
    order.billingNotes = billingNotes;

    this.logAudit(
      'ADJUST_BILLING',
      'Rekap Tagihan Penyedia',
      order.orderNumber,
      `Koreksi penagihan: Porsi diubah menjadi ${billedPortionCount} porsi (Nilai: Rp ${oldAmount} -> Rp ${order.finalBilledAmount}). Alasan: ${billingNotes}`
    );
    this.saveState();
  }

  // Reset demo state
  public resetToInitialSeedData() {
    this.state = {
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[3],
      patients: INITIAL_PATIENTS,
      rooms: INITIAL_ROOMS,
      dietTypes: INITIAL_DIET_TYPES,
      menus: INITIAL_MENUS,
      providers: INITIAL_PROVIDERS,
      orders: INITIAL_MEAL_ORDERS,
      auditLogs: INITIAL_AUDIT_LOGS,
      settings: INITIAL_APP_SETTINGS,
    };
    this.saveState();
  }
}
