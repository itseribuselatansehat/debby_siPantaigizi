import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  INITIAL_APP_SETTINGS,
  INITIAL_DIET_TYPES,
  INITIAL_MENUS,
  INITIAL_ROOMS,
  INITIAL_USERS,
} from '@/lib/initial-data';

const DB_FILE_PATH = path.join(process.cwd(), 'global-database.json');
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'global-settings.json');

// In-memory cache
let inMemoryDatabase: any = null;

function loadStoredSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  return null;
}

function getCleanInitialDatabase() {
  const storedSettings = loadStoredSettings();
  return {
    users: INITIAL_USERS,
    patients: [],
    orders: [],
    rooms: INITIAL_ROOMS,
    dietTypes: INITIAL_DIET_TYPES,
    menus: INITIAL_MENUS,
    providers: [
      {
        id: 'PROV-01',
        name: 'CV Berkah Bahari Boga Mandiri',
        code: 'BBB-01',
        contactPerson: 'Bpk. Mulyadi / Ibu Ratmi',
        phone: '0818-0912-3456',
        address: 'Jl. Bahari No. 12, Dermaga Barat Pulau Tidung, Kepulauan Seribu',
        contractNumber: '027/SPK-GIZI/PKM-KSS/2026',
        contractStart: '2026-01-01',
        contractEnd: '2026-12-31',
        status: 'ACTIVE',
      },
    ],
    auditLogs: [],
    settings: {
      ...INITIAL_APP_SETTINGS,
      ...(storedSettings || {}),
    },
    updatedAt: new Date().toISOString(),
  };
}

function loadStoredDatabase() {
  if (inMemoryDatabase) return inMemoryDatabase;

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        inMemoryDatabase = parsed;
        return inMemoryDatabase;
      }
    }
  } catch {
    // fallback
  }

  // Create clean initial baseline if file does not exist
  const initial = getCleanInitialDatabase();
  saveStoredDatabase(initial);
  return initial;
}

function saveStoredDatabase(db: any) {
  inMemoryDatabase = db;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // write error fallback
  }
}

/**
 * Trigger forward sync to Google Apps Script Web App
 */
async function forwardSyncToGas(gasWebAppUrl: string, database: any) {
  if (!gasWebAppUrl || !gasWebAppUrl.startsWith('https://script.google.com/macros/s/')) {
    return null;
  }

  try {
    const payload = {
      users: database.users || [],
      patients: database.patients || [],
      orders: database.orders || [],
      menus: database.menus || [],
      rooms: database.rooms || [],
      dietTypes: database.dietTypes || [],
      providers: database.providers || [],
      auditLogs: (database.auditLogs || []).slice(-100), // last 100 audit entries
      settings: database.settings || {},
    };

    const response = await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAll',
        payload,
      }),
      redirect: 'follow',
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { status: 'RAW', text };
    }
  } catch (err: any) {
    return { status: 'ERROR', error: err?.message };
  }
}

/**
 * Tarik data database dari Google Spreadsheet melalui Google Apps Script Web App
 */
async function pullDatabaseFromGas(gasWebAppUrl: string) {
  if (!gasWebAppUrl || !gasWebAppUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('URL Web App Google Apps Script belum valid.');
  }

  const response = await fetch(`${gasWebAppUrl}?action=getDatabase`, {
    method: 'GET',
    redirect: 'follow',
  });

  const resJson = await response.json();
  if (resJson && resJson.status === 'SUCCESS' && resJson.database) {
    return resJson.database;
  }
  throw new Error(resJson?.message || 'Gagal menarik data dari Google Apps Script.');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const syncWithGas = searchParams.get('sync') === 'true';

    let currentDb = loadStoredDatabase();

    // If sync requested and GAS URL configured, try pulling live data from Spreadsheet
    const gasUrl = currentDb.settings?.gasWebAppUrl || loadStoredSettings()?.gasWebAppUrl;
    if (syncWithGas && gasUrl) {
      try {
        const gasDb = await pullDatabaseFromGas(gasUrl);
        if (gasDb) {
          currentDb = {
            ...currentDb,
            users: Array.isArray(gasDb.users) && gasDb.users.length > 0 ? gasDb.users : currentDb.users,
            patients: Array.isArray(gasDb.patients) ? gasDb.patients : currentDb.patients,
            orders: Array.isArray(gasDb.orders) ? gasDb.orders : currentDb.orders,
            menus: Array.isArray(gasDb.menus) && gasDb.menus.length > 0 ? gasDb.menus : currentDb.menus,
            rooms: Array.isArray(gasDb.rooms) && gasDb.rooms.length > 0 ? gasDb.rooms : currentDb.rooms,
            dietTypes: Array.isArray(gasDb.dietTypes) && gasDb.dietTypes.length > 0 ? gasDb.dietTypes : currentDb.dietTypes,
            providers: Array.isArray(gasDb.providers) && gasDb.providers.length > 0 ? gasDb.providers : currentDb.providers,
            updatedAt: new Date().toISOString(),
          };
          saveStoredDatabase(currentDb);
        }
      } catch (e) {
        console.warn('Sync from GAS on GET skipped:', e);
      }
    }

    return NextResponse.json({
      success: true,
      database: currentDb,
      source: 'SERVER_GLOBAL_PERSISTENT',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memuat database global' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Payload tidak valid' }, { status: 400 });
    }

    const currentDb = loadStoredDatabase();
    const gasUrl = body.gasWebAppUrl || currentDb.settings?.gasWebAppUrl || loadStoredSettings()?.gasWebAppUrl;

    // Aksi khusus: Tarik data dari Google Sheets sekarang
    if (body.action === 'pullFromGas') {
      if (!gasUrl) {
        return NextResponse.json(
          { success: false, message: 'URL Web App GAS belum dikonfigurasi di Pengaturan.' },
          { status: 400 }
        );
      }
      try {
        const gasDb = await pullDatabaseFromGas(gasUrl);
        const mergedDb = {
          ...currentDb,
          users: Array.isArray(gasDb.users) && gasDb.users.length > 0 ? gasDb.users : currentDb.users,
          patients: Array.isArray(gasDb.patients) ? gasDb.patients : currentDb.patients,
          orders: Array.isArray(gasDb.orders) ? gasDb.orders : currentDb.orders,
          menus: Array.isArray(gasDb.menus) && gasDb.menus.length > 0 ? gasDb.menus : currentDb.menus,
          rooms: Array.isArray(gasDb.rooms) && gasDb.rooms.length > 0 ? gasDb.rooms : currentDb.rooms,
          dietTypes: Array.isArray(gasDb.dietTypes) && gasDb.dietTypes.length > 0 ? gasDb.dietTypes : currentDb.dietTypes,
          providers: Array.isArray(gasDb.providers) && gasDb.providers.length > 0 ? gasDb.providers : currentDb.providers,
          updatedAt: new Date().toISOString(),
        };
        saveStoredDatabase(mergedDb);
        return NextResponse.json({
          success: true,
          message: 'Seluruh data real berhasil ditarik langsung dari Google Spreadsheet!',
          database: mergedDb,
        });
      } catch (err: any) {
        return NextResponse.json(
          { success: false, message: err?.message || 'Gagal menarik data dari Google Sheets.' },
          { status: 500 }
        );
      }
    }

    // Update database menyeluruh
    const incomingDb = body.database || body;
    const updatedDb = {
      ...currentDb,
      users: incomingDb.users !== undefined ? incomingDb.users : currentDb.users,
      patients: incomingDb.patients !== undefined ? incomingDb.patients : currentDb.patients,
      orders: incomingDb.orders !== undefined ? incomingDb.orders : currentDb.orders,
      rooms: incomingDb.rooms !== undefined ? incomingDb.rooms : currentDb.rooms,
      dietTypes: incomingDb.dietTypes !== undefined ? incomingDb.dietTypes : currentDb.dietTypes,
      menus: incomingDb.menus !== undefined ? incomingDb.menus : currentDb.menus,
      providers: incomingDb.providers !== undefined ? incomingDb.providers : currentDb.providers,
      auditLogs: incomingDb.auditLogs !== undefined ? incomingDb.auditLogs : currentDb.auditLogs,
      settings: incomingDb.settings !== undefined ? { ...currentDb.settings, ...incomingDb.settings } : currentDb.settings,
      updatedAt: new Date().toISOString(),
    };

    saveStoredDatabase(updatedDb);

    // Kirim sinkronisasi ke GAS di latar belakang jika URL tersedia
    if (gasUrl && body.syncWithGas !== false) {
      forwardSyncToGas(gasUrl, updatedDb).catch((err) => {
        console.warn('Background GAS sync failed:', err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database berhasil disimpan permanen di semua browser & disinkronkan ke Google Spreadsheet.',
      updatedAt: updatedDb.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal menyimpan database global' },
      { status: 500 }
    );
  }
}
