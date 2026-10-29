import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for global persistent settings across all browsers
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'global-settings.json');

// In-memory fallback
let inMemorySettings: any = null;

function loadStoredSettings() {
  if (inMemorySettings) return inMemorySettings;
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      inMemorySettings = JSON.parse(data);
      return inMemorySettings;
    }
  } catch {
    // fallback
  }
  return null;
}

function saveStoredSettings(settings: any) {
  inMemorySettings = settings;
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {
    // write error fallback
  }
}

export async function GET() {
  try {
    const settings = loadStoredSettings();
    return NextResponse.json({
      success: true,
      settings: settings || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memuat pengaturan global' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Data pengaturan tidak valid' },
        { status: 400 }
      );
    }

    const current = loadStoredSettings() || {};
    const updated = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    saveStoredSettings(updated);

    return NextResponse.json({
      success: true,
      message: 'Pengaturan Google Apps Script & Google Sheets berhasil disimpan secara global.',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal menyimpan pengaturan global' },
      { status: 500 }
    );
  }
}
