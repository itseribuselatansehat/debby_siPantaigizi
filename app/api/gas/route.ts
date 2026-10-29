import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'global-settings.json');
const DEFAULT_DRIVE_FOLDER_ID = '1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk';

function getStoredGasSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  return {};
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stored = getStoredGasSettings();

    // Support both direct gasWebAppUrl or fallback to global settings
    const gasWebAppUrl = body.gasWebAppUrl || stored.gasWebAppUrl;
    const action = body.action;
    const payload = body.payload || {};

    // Forward drive folder parameters if uploading photo
    const folderId = body.folderId || payload.folderId || stored.googleDriveFolderId || DEFAULT_DRIVE_FOLDER_ID;
    const base64Data = body.base64Data || payload.base64Data;
    const fileName = body.fileName || payload.fileName;
    const mimeType = body.mimeType || payload.mimeType;

    if (!gasWebAppUrl || typeof gasWebAppUrl !== 'string') {
      return NextResponse.json(
        { status: 'ERROR', message: 'URL Web App Google Apps Script belum dikonfigurasi di Pengaturan Administrator.' },
        { status: 400 }
      );
    }

    if (!gasWebAppUrl.startsWith('https://script.google.com/macros/s/')) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Format URL Web App Google Apps Script tidak valid. Harus diawali https://script.google.com/macros/s/...' },
        { status: 400 }
      );
    }

    // Call Google Apps Script Web App endpoint with redirect follow (GAS uses 302 redirects)
    const postPayload = {
      action,
      payload,
      folderId,
      base64Data,
      fileName,
      mimeType,
      ...body,
    };

    const gasResponse = await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postPayload),
      redirect: 'follow',
    });

    const responseText = await gasResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { status: 'RAW_RESPONSE', text: responseText };
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      status: gasResponse.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'ERROR',
        message: error?.message || 'Gagal terhubung ke Google Apps Script Web App.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stored = getStoredGasSettings();
  const gasWebAppUrl = searchParams.get('url') || stored.gasWebAppUrl;
  const action = searchParams.get('action') || 'ping';

  if (!gasWebAppUrl) {
    return NextResponse.json({ status: 'ERROR', message: 'Parameter url diperlukan atau belum disetting' }, { status: 400 });
  }

  try {
    const response = await fetch(`${gasWebAppUrl}?action=${encodeURIComponent(action)}`, {
      method: 'GET',
      redirect: 'follow',
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'ERROR', message: error?.message || 'Koneksi ke GAS gagal' },
      { status: 500 }
    );
  }
}
