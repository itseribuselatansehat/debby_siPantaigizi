import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'global-database.json');

function getLiveDatabaseSnapshot() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Gagal membaca database snapshot:', err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, reply: 'Silakan ajukan pertanyaan seputar data aplikasi SI PANTAI GIZI.' },
        { status: 400 }
      );
    }

    const lowerQuery = message.toLowerCase();

    // 1. FILTER PRIVASI KETAT: Periksa jika ada indikasi menanyakan NIK, Nama Pasien, atau Diagnosa Medis
    const isAskingPatientIdentity =
      lowerQuery.includes('nik') ||
      lowerQuery.includes('ktp') ||
      lowerQuery.includes('nama pasien') ||
      lowerQuery.includes('siapa pasien') ||
      lowerQuery.includes('nama lengkap pasien') ||
      lowerQuery.includes('identitas pasien') ||
      lowerQuery.includes('diagnosa') ||
      lowerQuery.includes('diagnosis') ||
      lowerQuery.includes('penyakit pasien') ||
      lowerQuery.includes('sakit apa');

    if (isAskingPatientIdentity) {
      return NextResponse.json({
        success: true,
        reply:
          'Mohon maaf, sesuai kebijakan privasi dan Undang-Undang Perlindungan Data Pribadi serta Standar Rekam Medis Pasien, saya **TIDAK DAPAT** memberikan informasi mengenai **NIK, Nama Pasien, maupun Diagnosa Medis Pasien**.\n\nSaya dapat membantu Anda memberikan data agregat lainnya seperti **jumlah pasien rawat inap, total dan rincian tagihan, kapasitas kamar, tarif porsi, jadwal distribusi makanan, maupun statistik sisa makan Comstock**.',
        isPrivacyRefusal: true,
      });
    }

    // 2. Ambil snapshot data operasional real dari database server
    const db = getLiveDatabaseSnapshot() || {};
    const patients = Array.isArray(db.patients) ? db.patients : [];
    const orders = Array.isArray(db.orders) ? db.orders : [];
    const rooms = Array.isArray(db.rooms) ? db.rooms : [];
    const menus = Array.isArray(db.menus) ? db.menus : [];
    const providers = Array.isArray(db.providers) ? db.providers : [];
    const settings = db.settings || {};

    // Hitung statistik agregat (TANPA NIK, NAMA, ATAU DIAGNOSA)
    const totalPatients = patients.length;
    const activeInpatients = patients.filter((p: any) => p.status === 'RAWAT_INAP').length;
    const dischargedPatients = patients.filter((p: any) => p.status === 'PULANG').length;

    // Hitung total tagihan
    const totalBilledAmount = orders.reduce((sum: number, o: any) => sum + (Number(o.price) || 0), 0);
    const completedOrders = orders.filter((o: any) => o.status === 'DELIVERED_TO_PATIENT').length;
    const pendingOrders = orders.filter((o: any) => o.status !== 'DELIVERED_TO_PATIENT' && o.status !== 'CANCELLED').length;
    const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED').length;

    // Rincian per jadwal makan
    const breakfastOrders = orders.filter((o: any) => o.mealCategory === 'SARAPAN').length;
    const lunchOrders = orders.filter((o: any) => o.mealCategory === 'SIANG').length;
    const dinnerOrders = orders.filter((o: any) => o.mealCategory === 'MALAM').length;

    // Rincian kamar
    const totalRooms = rooms.length;
    const occupiedRooms = new Set(patients.filter((p: any) => p.status === 'RAWAT_INAP').map((p: any) => p.roomBed)).size;

    // Susun Ringkasan Data Aman (Privasi Sanitized)
    const sanitizedContext = `
[DATA OPERASIONAL REAL APLIKASI SI PANTAI GIZI - PUSKESMAS KEPULAUAN SERIBU SELATAN]
Waktu Server: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
Kepala Puskesmas: ${settings.headOfPuskesmasName || 'dr. Ignatius Dendy Purnama'} (NIP: ${settings.headOfPuskesmasNip || '198607192014031004'})
Instansi: ${settings.puskesmasName || 'Puskesmas Kepulauan Seribu Selatan'}

1. STATISTIK PASIEN:
- Total Pasien Terdaftar: ${totalPatients} orang
- Pasien Rawat Inap Aktif: ${activeInpatients} orang
- Pasien Sudah Pulang: ${dischargedPatients} orang

2. STATISTIK TAGIHAN & PESANAN MAKAN:
- Total Nominal Tagihan Terbit: Rp ${totalBilledAmount.toLocaleString('id-ID')}
- Total Porsi Pesanan Makan: ${orders.length} porsi
- Porsi Selesai Diterima Pasien: ${completedOrders} porsi
- Porsi Sedang Dalam Proses/Pengiriman: ${pendingOrders} porsi
- Porsi Dibatalkan (misal karena pasien pulang): ${cancelledOrders} porsi
- Rincian Jadwal Makan: Sarapan (${breakfastOrders} porsi), Makan Siang (${lunchOrders} porsi), Makan Malam (${dinnerOrders} porsi)
- Standar Tarif Kontrak: Sarapan Rp 25.000, Makan Siang Rp 47.000, Makan Malam Rp 47.000

3. KAPASITAS KAMAR & TEMPAT TIDUR:
- Total Tempat Tidur Tersedia: ${totalRooms} bed
- Tempat Tidur Terisi Saat Ini: ${occupiedRooms} bed
- Tempat Tidur Kosong: ${Math.max(0, totalRooms - occupiedRooms)} bed
- Ruang Rawat: Ruang Rawat Inap Lt. 1, Ruang Rawat Inap Lt. 2 Laki-laki, Ruang Rawat Inap Lt. 2 Perempuan, Ruang Rawat Inap Lt. 2 Anak-anak

4. REKANAN PENYEDIA KATERING:
${providers.map((pr: any) => `- ${pr.name} (Kontrak: ${pr.contractNumber || 'Aktif'})`).join('\n') || '- CV Berkah Bahari Boga Mandiri'}

5. INTEGRASI:
- Google Drive Folder ID: 1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk
- Status Sinkronisasi: Database global persisten & otomatis tersambung Google Spreadsheet
`.trim();

    // 3. Gunakan Gemini API jika GEMINI_API_KEY tersedia
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `
Anda adalah "Asisten AI SI PANTAI GIZI" resmi di Puskesmas Kepulauan Seribu Selatan.
Tugas Anda adalah menjawab pertanyaan pengguna secara ramah, profesional, akurat, dan berbasis data real yang disediakan.

ATURAN PRIVASI MEDIS KETAT (DILARANG DILANGGAR):
1. DILARANG KERAS MENYEBUTKAN NIK, NAMA LENGKAP PASIEN, ATAU DIAGNOSA PENYAKIT PASIEN DALAM KEADAAN APA PUN.
2. Jika ada pertanyaan yang menyinggung nama pasien, NIK, atau diagnosa penyakit pasien, tolak dengan sopan dan jelaskan bahwa data tersebut adalah rahasia rekam medis yang dilindungi undang-undang.
3. Anda hanya boleh menjawab data agregat dan statistik seperti: jumlah pasien aktif, pasien pulang, total tagihan, rincian biaya porsi, alur distribusi makanan, kapasitas kamar/bed, dan informasi umum SOP rawat inap.
4. Gunakan format Markdown yang rapi (bullet points, bold text).

Data operasional terkini:
${sanitizedContext}
`.trim();

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: message }],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });

        if (response && response.text) {
          return NextResponse.json({
            success: true,
            reply: response.text,
            source: 'GEMINI_AI',
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to local reasoning:', geminiError?.message);
      }
    }

    // 4. Heuristic Fallback (Menjawab akurat bahkan jika offline / tanpa API Key)
    let fallbackReply = '';
    if (lowerQuery.includes('pasien')) {
      fallbackReply = `📊 **Statistik Pasien Rawat Inap SI PANTAI GIZI:**\n\n- **Pasien Rawat Inap Aktif:** ${activeInpatients} orang\n- **Pasien Sudah Pulang:** ${dischargedPatients} orang\n- **Total Pasien Terdaftar:** ${totalPatients} orang\n\n*(Catatan Privasi: Sesuai regulasi rekam medis, rincian identitas nama lengkap, NIK, dan diagnosa pasien tidak ditampilkan).*`;
    } else if (lowerQuery.includes('tagihan') || lowerQuery.includes('biaya') || lowerQuery.includes('tarif')) {
      fallbackReply = `💰 **Informasi Tagihan & Tarif Gizi Puskesmas Kepulauan Seribu Selatan:**\n\n- **Total Nominal Tagihan:** Rp ${totalBilledAmount.toLocaleString('id-ID')}\n- **Total Porsi Pesanan:** ${orders.length} porsi\n- **Porsi Selesai Diterima Pasien:** ${completedOrders} porsi\n- **Rincian Tarif Kontrak:**\n  1. Sarapan: **Rp 25.000 / porsi**\n  2. Makan Siang: **Rp 47.000 / porsi**\n  3. Makan Malam: **Rp 47.000 / porsi**`;
    } else if (lowerQuery.includes('kamar') || lowerQuery.includes('bed') || lowerQuery.includes('ruang')) {
      fallbackReply = `🛏️ **Kapasitas Ruang & Tempat Tidur:**\n\n- **Total Bed Tersedia:** ${totalRooms} bed\n- **Bed Terisi Saat Ini:** ${occupiedRooms} bed\n- **Bed Kosong:** ${Math.max(0, totalRooms - occupiedRooms)} bed\n\n**Daftar Ruang Rawat:**\n1. Ruang Rawat Inap Lt. 1\n2. Ruang Rawat Inap Lt. 2 Laki-laki\n3. Ruang Rawat Inap Lt. 2 Perempuan\n4. Ruang Rawat Inap Lt. 2 Anak-anak`;
    } else if (lowerQuery.includes('kepala') || lowerQuery.includes('pimpinan')) {
      fallbackReply = `👤 **Pimpinan Puskesmas:**\n\nKepala Puskesmas Kepulauan Seribu Selatan saat ini adalah **dr. Ignatius Dendy Purnama** (NIP. 198607192014031004).`;
    } else {
      fallbackReply = `Halo! Saya **Asisten AI SI PANTAI GIZI** Puskesmas Kepulauan Seribu Selatan.\n\nBerikut ringkasan data operasional saat ini:\n- **Pasien Rawat Inap Aktif:** ${activeInpatients} orang\n- **Total Tagihan Terbit:** Rp ${totalBilledAmount.toLocaleString('id-ID')} (${orders.length} porsi)\n- **Kapasitas Bed Terisi:** ${occupiedRooms} dari ${totalRooms} bed\n\nAnda dapat menanyakan hal lain seperti statistik distribusi, porsi per kategori makan, maupun kapasitas kamar.`;
    }

    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      source: 'LOCAL_ANALYTICS',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        reply: 'Terjadi kendala saat memproses pertanyaan Anda. Silakan coba sesaat lagi.',
        error: error?.message,
      },
      { status: 500 }
    );
  }
}
