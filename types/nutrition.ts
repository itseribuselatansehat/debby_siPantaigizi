// Types and interfaces for SI PANTAI GIZI

export type UserRole =
  | 'ADMIN'
  | 'DOKTER_PERAWAT'
  | 'AHLI_GIZI'
  | 'PENYEDIA'
  | 'PJLP_PRAMUSAJI';

export interface UserProfile {
  id: string;
  name: string;
  nipOrNik: string;
  role: UserRole;
  email: string;
  phoneNumber?: string;
  unitOrWard?: string;
  providerId?: string; // If role === 'PENYEDIA'
}

export type MealSchedule = 'SARAPAN' | 'SIANG' | 'MALAM' | 'SORE';

export const MEAL_PRICES: Record<MealSchedule, number> = {
  SARAPAN: 25000,
  SIANG: 45000,
  MALAM: 45000,
  SORE: 15000,
};

export type SopStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'NUTRITION_REVIEW'
  | 'NUTRITION_APPROVED'
  | 'SENT_TO_PROVIDER'
  | 'PROVIDER_ACCEPTED'
  | 'FOOD_PREPARATION'
  | 'READY_TO_DELIVER'
  | 'IN_DELIVERY'
  | 'RECEIVED_BY_WAITER'
  | 'DISTRIBUTION_IN_PROGRESS'
  | 'DELIVERED_TO_PATIENT'
  | 'CONSUMPTION_RECORDED'
  | 'COMPLETED'
  | 'RETURNED_FOR_REVISION'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DELIVERY_EXCEPTION'
  | 'PATIENT_UNAVAILABLE'
  | 'MEAL_NOT_CONSUMED';

export interface Patient {
  id: string;
  mrn: string; // Nomor Rekam Medis (RM)
  name: string;
  gender: 'L' | 'P';
  birthDate: string; // YYYY-MM-DD
  room: string; // e.g. "Ruang Teratai - Pulau Tidung"
  bed: string; // e.g. "Bed 01"
  admissionDate: string;
  dischargeDate?: string;
  dischargedAt?: string;
  dischargedBy?: string;
  dischargeNotes?: string;
  status: 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED';
  clinicalDiagnosis: string;
  foodAllergies: string[];
  dietaryRestrictions: string;
}

export interface DietType {
  id: string;
  code: string;
  name: string; // e.g. "Diet Rendah Garam (RG)", "Diet Diabetes Mellitus (DM)"
  description: string;
  allowedTextures: string[]; // e.g. ["Biasa", "Lunak", "Saring", "Cair"]
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  dietCategoryId: string;
  dietCategoryName: string;
  texture: string;
  components: string[]; // e.g. ["Nasi Tim", "Sup Kakap Segar", "Tempe Bacem", "Buah Pisang Raja"]
  providerId: string;
  pricePerPortion: number;
  contractReference: string;
  activeFrom: string;
  activeUntil?: string;
}

export interface Provider {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  address: string;
  contractNumber: string;
  contractStart: string;
  contractEnd: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface QualityCheckItem {
  id: string;
  parameterName: string;
  category: 'DIET' | 'HYGIENE' | 'TEMPERATURE' | 'PORTION' | 'PACKAGING' | 'TASTE_AROMA';
  isCritical: boolean;
  standardSpec: string;
  actualMeasuredValue?: string; // e.g. "62" for temp
  unit?: string; // e.g. "°C"
  result: 'SESUAI' | 'TIDAK_SESUAI' | 'TIDAK_BERLAKU';
  notes?: string;
}

export interface DigitalSignature {
  signerName: string;
  signerRole: string;
  signerRelation?: string; // For patient family: "Pasien", "Istri", "Anak", "Orang Tua", "Wali"
  signatureDataUrl: string; // Base64 PNG
  timestamp: string;
  notes?: string;
  isException?: boolean;
  exceptionReason?: string;
}

export interface MealOrder {
  id: string;
  orderNumber: string; // e.g. ORD-20261029-001
  createdAt: string;
  serviceDate: string; // YYYY-MM-DD
  schedule: MealSchedule; // Primary schedule or current meal
  selectedSchedules?: MealSchedule[]; // Multiple meal checkbox: Sarapan (25k), Siang (45k), Malam (45k)
  patientId: string;
  patientMrn: string;
  patientName: string;
  patientAgeYears: number;
  patientAgeMonths: number;
  room: string;
  bed: string;
  medicalDiagnosis: string;
  allergies: string[];
  dietTypeName: string;
  texture: string;
  menuId?: string;
  menuName?: string;
  portionCount: number;
  pricePerPortionSnapshot: number;
  totalEstimatedPrice: number;
  specialClinicalNotes?: string;
  
  // Requester (Dokter / Perawat)
  orderedByUserId: string;
  orderedByName: string;
  orderedByRole: UserRole;

  // Nutritionist review (Ahli Gizi)
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  revisionReason?: string;

  // Provider (Penyedia Makanan)
  providerId?: string;
  providerName?: string;
  providerAcceptedAt?: string;
  providerRejectReason?: string;
  preparedPortionCount?: number;
  shippedPortionCount?: number;
  courierName?: string;
  shippedAt?: string;
  shippedCategory?: MealSchedule; // 'SARAPAN' | 'SIANG' | 'MALAM'

  // Receiving & Quality Inspection
  receivedByWaiterId?: string;
  receivedByWaiterName?: string;
  receivedAt?: string;
  receivedCategory?: MealSchedule;
  qualityChecklist?: QualityCheckItem[];
  checklistPassed?: boolean;
  measuredFoodTemperature?: string;
  discrepancyAction?: 'DITERIMA_SESUAI' | 'DITERIMA_DENGAN_CATATAN' | 'DITOLAK_MINTA_GANTI' | 'DIBATALKAN';
  discrepancyNotes?: string;
  handoverProviderSignature?: DigitalSignature;
  handoverWaiterSignature?: DigitalSignature;

  // Distribution to Patient & Etiket Printing
  distributionStartedAt?: string;
  deliveredToPatientAt?: string;
  servedMealPhotoUrl?: string;
  recipientSignature?: DigitalSignature;
  distributionNotes?: string;
  etiketPrintedAt?: string;

  // Leftovers Monitoring (Comstock scale)
  leftoverAssessment?: {
    assessedAt: string;
    assessedByName: string;
    consumptionCategory: 'HABIS_100' | 'SISA_SEPEREMPAT' | 'SISA_SETENGAH' | 'SISA_TIGAPEREMPAT' | 'TIDAK_DIMAKAN_0' | 'TIDAK_DAPAT_DINILAI';
    consumptionPercentage: number;
    leftoverPercentage: number;
    reasons: string[];
    otherReasonNotes?: string;
    leftoverPhotoUrl?: string;
    clinicalFollowupRecommendation?: string;
  };

  // Billing status
  billingStatus: 'BELUM_DIREKAP' | 'MENUNGGU_VERIFIKASI' | 'TERVERIFIKASI' | 'DIBAYAR' | 'TIDAK_DAPAT_DITAGIHKAN';
  billedPortionCount: number;
  finalBilledAmount: number;
  billingNotes?: string;
  cancellationReason?: string;

  // SOP State
  status: SopStatus;
  statusHistory: {
    status: SopStatus;
    timestamp: string;
    changedBy: string;
    role: string;
    reasonOrNotes?: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  referenceId: string;
  details: string;
  ipOrDevice?: string;
}

export interface AppSettings {
  puskesmasName: string;
  puskesmasRegion: string;
  address: string;
  phone: string;
  nutritionistPhone: string; // Nomor WA Petugas Gizi
  providerPhone: string; // Nomor WA Penyedia Katering
  gasWebAppUrl: string;
  spreadsheetId: string;
  autoSyncGas: boolean;
  lastGasSyncAt?: string;
  defaultSchedules: { id: MealSchedule; label: string; price: number; deliveryTime: string }[];
  minFoodTempServeCelsius: number;
  maxFoodTempServeCelsius: number;
}
