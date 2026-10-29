import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gasWebAppUrl, action, payload } = body;

    if (!gasWebAppUrl || typeof gasWebAppUrl !== 'string') {
      return NextResponse.json(
        { status: 'ERROR', message: 'URL Web App Google Apps Script belum diisi di Pengaturan.' },
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
    const gasResponse = await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        payload,
      }),
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
  const gasWebAppUrl = searchParams.get('url');
  const action = searchParams.get('action') || 'ping';

  if (!gasWebAppUrl) {
    return NextResponse.json({ status: 'ERROR', message: 'Parameter url diperlukan' }, { status: 400 });
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
