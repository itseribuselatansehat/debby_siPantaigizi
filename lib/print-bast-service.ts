/**
 * Service Pencetakan Resmi Berita Acara Serah Terima (BAST-GIZI) & Bukti Penyerahan Makanan Pasien (BPM-GIZI)
 * Dilengkapi Kop Surat Resmi 2 Logo (DKI Jakarta & Kementerian Kesehatan),
 * Fitur Buka di New Tab dengan Toolbar Cetak (window.print()) & Tombol Download Dokumen.
 */

import { AppSettings, MealOrder } from '@/types/nutrition';
import { formatJakartaDate, formatJakartaDateTime, formatRupiah } from './date-utils';

// Preset Logo Resmi Kualitas Tinggi
export const DEFAULT_DKI_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Coat_of_arms_of_Jakarta.svg/480px-Coat_of_arms_of_Jakarta.svg.png';
export const DEFAULT_KEMENKES_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Kementerian_Kesehatan_Republik_Indonesia.svg/512px-Kementerian_Kesehatan_Republik_Indonesia.svg.png';

/**
 * Normalisasi URL gambar dari Google Drive (file view link / thumbnail) ke format direct viewable
 */
export function formatDriveOrDirectImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Pola 1: drive.google.com/file/d/FILE_ID/view
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // Pola 2: drive.google.com/open?id=FILE_ID atau uc?id=FILE_ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
  }

  // Pola 3: Raw ID string (panjang ~33 karakter tanpa slash atau protocol)
  if (!trimmed.includes('/') && trimmed.length >= 25 && /^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }

  return trimmed;
}

/**
 * Menghasilkan HTML Kop Surat Resmi 2 Logo Puskesmas Kepulauan Seribu Selatan
 */
export function generateOfficialKopHtml(settings: AppSettings): string {
  const dkiLogo = formatDriveOrDirectImageUrl(settings.dkiLogoUrl) || DEFAULT_DKI_LOGO;
  const kemenkesLogo = formatDriveOrDirectImageUrl(settings.kemenkesLogoUrl) || DEFAULT_KEMENKES_LOGO;

  return `
    <div class="kop-container">
      <div class="kop-logo-left">
        <img src="${dkiLogo}" alt="Logo Pemprov DKI Jakarta" onerror="this.style.display='none'" />
      </div>
      <div class="kop-text">
        <div class="kop-line-1">PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA</div>
        <div class="kop-line-2">DINAS KESEHATAN KABUPATEN ADMINISTRASI KEPULAUAN SERIBU</div>
        <div class="kop-line-3">PUSKESMAS KEPULAUAN SERIBU SELATAN</div>
        <div class="kop-line-4">Jl. Dermaga Pelabuhan Utama No. 4, Pulau Tidung, Kepulauan Seribu · Telp: (021) 645-8901</div>
        <div class="kop-line-5">Unit Pelayanan Gizi &amp; Instalasi Dapur Rawat Inap Puskesmas</div>
      </div>
      <div class="kop-logo-right">
        <img src="${kemenkesLogo}" alt="Logo Kementerian Kesehatan" onerror="this.style.display='none'" />
      </div>
    </div>
    <div class="kop-divider"></div>
  `;
}

/**
 * Membuka dokumen cetak di Tab Baru lengkap dengan Toolbar Cetak & Download
 */
export function openDocumentInNewTab(params: {
  title: string;
  filename: string;
  contentHtml: string;
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Browser memblokir popup window. Mohon izinkan popup untuk mencetak dokumen di tab baru.');
    return;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title} - SI PANTAI GIZI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      font-size: 12px;
      -webkit-font-smoothing: antialiased;
    }

    /* Floating Top Toolbar (Screen Only) */
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 999;
      background: #0f172a;
      color: #fff;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toolbar-title {
      font-weight: 700;
      font-size: 14px;
      letter-spacing: -0.01em;
    }
    .toolbar-badge {
      background: rgba(20, 184, 166, 0.2);
      border: 1px solid #14b8a6;
      color: #2dd4bf;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn-primary {
      background-color: #0d9488;
      color: #fff;
    }
    .btn-primary:hover {
      background-color: #0f766e;
    }
    .btn-download {
      background-color: #3b82f6;
      color: #fff;
    }
    .btn-download:hover {
      background-color: #2563eb;
    }
    .btn-close {
      background-color: #334155;
      color: #cbd5e1;
    }
    .btn-close:hover {
      background-color: #475569;
      color: #fff;
    }

    /* Paper Page Container */
    .page-container {
      display: flex;
      justify-content: center;
      padding: 28px 16px 60px 16px;
    }
    .paper-sheet {
      background: #fff;
      width: 100%;
      max-width: 800px;
      padding: 36px 42px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }

    /* KOP SURAT RESMI DUA LOGO */
    .kop-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 8px;
    }
    .kop-logo-left, .kop-logo-right {
      width: 78px;
      height: 78px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kop-logo-left img, .kop-logo-right img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .kop-text {
      flex: 1;
      text-align: center;
      color: #000;
    }
    .kop-line-1 {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #1e293b;
    }
    .kop-line-2 {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #1e293b;
    }
    .kop-line-3 {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #000;
      margin: 2px 0;
    }
    .kop-line-4 {
      font-size: 9.5px;
      color: #475569;
      margin-top: 1px;
    }
    .kop-line-5 {
      font-size: 9px;
      font-weight: 600;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .kop-divider {
      border-bottom: 3px double #000;
      margin: 8px 0 16px 0;
    }

    /* Document Structure */
    .doc-title-block {
      text-align: center;
      margin-bottom: 16px;
    }
    .doc-main-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #000;
      text-decoration: underline;
    }
    .doc-sub-number {
      font-size: 10.5px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #334155;
      margin-top: 2px;
    }

    /* Data Tables & Grids */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11px;
    }
    .info-table td {
      padding: 4px 6px;
      vertical-align: top;
    }
    .info-label {
      width: 28%;
      color: #475569;
      font-weight: 600;
    }
    .info-colon {
      width: 3%;
      text-align: center;
      font-weight: 700;
      color: #334155;
    }
    .info-val {
      color: #0f172a;
      font-weight: 500;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 10.5px;
    }
    .data-table th, .data-table td {
      border: 1px solid #94a3b8;
      padding: 6px 8px;
    }
    .data-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-size: 9.5px;
    }

    /* Section Headers */
    .section-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
      margin: 12px 0 6px 0;
      padding-bottom: 3px;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Signature Block */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .signature-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      background: #fafafa;
    }
    .sig-role {
      font-weight: 700;
      font-size: 10.5px;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .sig-image-box {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 6px 0;
    }
    .sig-image-box img {
      max-height: 65px;
      max-width: 180px;
      object-fit: contain;
    }
    .sig-name {
      font-weight: 700;
      font-size: 11px;
      color: #000;
      border-bottom: 1px solid #334155;
      display: inline-block;
      padding-bottom: 1px;
      margin-top: 4px;
    }
    .sig-meta {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Photos Section */
    .photo-preview-box {
      margin-top: 12px;
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    .photo-preview-box img {
      max-height: 180px;
      max-width: 100%;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      object-fit: cover;
    }

    /* Footer Legal */
    .doc-footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
    }

    /* PRINT STYLES */
    @media print {
      body {
        background: #fff !important;
        color: #000 !important;
        font-size: 11px;
      }
      .screen-toolbar, .no-print {
        display: none !important;
      }
      .page-container {
        padding: 0 !important;
        margin: 0 !important;
      }
      .paper-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
    }
  </style>
</head>
<body>
  <!-- Top Screen Floating Toolbar -->
  <div class="screen-toolbar no-print">
    <div class="toolbar-info">
      <span class="toolbar-title">${params.title}</span>
      <span class="toolbar-badge">DOKUMEN RESMI</span>
    </div>
    <div class="toolbar-actions">
      <button type="button" class="btn btn-primary" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        <span>Cetak Dokumen / Simpan PDF</span>
      </button>
      <button type="button" class="btn btn-download" onclick="downloadDocument()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Unduh File (HTML)</span>
      </button>
      <button type="button" class="btn btn-close" onclick="window.close()">
        <span>✕ Tutup</span>
      </button>
    </div>
  </div>

  <div class="page-container">
    <div class="paper-sheet" id="printable-content">
      ${params.contentHtml}
    </div>
  </div>

  <script>
    function downloadDocument() {
      var content = document.documentElement.outerHTML;
      var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '${params.filename}';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
  printWindow.focus();
}

/**
 * Menghasilkan Dokumen Berita Acara Serah Terima (BAST-GIZI) Antara Penyedia & PJLP Pramusaji
 */
export function printBastReceivingInNewTab(order: MealOrder, settings: AppSettings) {
  const kopHtml = generateOfficialKopHtml(settings);
  const nowStr = formatJakartaDateTime(new Date().toISOString());

  const scheduleLabels: Record<string, string> = {
    SARAPAN: 'Sarapan Pagi (06:30 - 07:30 WIB)',
    SIANG: 'Makan Siang (11:30 - 12:30 WIB)',
    MALAM: 'Makan Malam (17:30 - 18:30 WIB)',
    SORE: 'Selingan Sore (15:00 - 15:30 WIB)',
  };

  const scheduleLabel = scheduleLabels[order.schedule] || order.schedule;
  const deliveryPhoto = formatDriveOrDirectImageUrl(order.deliveryPhotoUrl);

  const checklistRows = (order.qualityChecklist || [])
    .map(
      (qc, idx) => `
      <tr>
        <td style="text-align: center; width: 30px;">${idx + 1}</td>
        <td><strong>${qc.parameterName}</strong><br/><span style="color:#64748b; font-size:9.5px;">Standar: ${qc.standardSpec}</span></td>
        <td style="text-align: center; width: 80px; font-weight: 700; color: ${qc.result === 'SESUAI' ? '#047857' : '#b91c1c'};">${qc.result}</td>
        <td style="text-align: center; width: 100px; font-family: monospace;">${qc.actualMeasuredValue ? qc.actualMeasuredValue + ' ' + (qc.unit || '') : 'Normal'}</td>
      </tr>
    `
    )
    .join('');

  const bodyHtml = `
    ${kopHtml}

    <div class="doc-title-block">
      <div class="doc-main-title">BERITA ACARA SERAH TERIMA MAKANAN (BAST-GIZI)</div>
      <div class="doc-sub-number">NOMOR: BAST-GIZI/${order.orderNumber}</div>
    </div>

    <p style="margin-bottom: 12px; text-align: justify; font-size: 11px;">
      Pada hari ini, <strong>${formatJakartaDate(order.serviceDate)}</strong>, bertempat di Ruang Instalasi Dapur &amp; Distribusi Gizi Puskesmas Kepulauan Seribu Selatan, telah dilaksanakan pemeriksaan mutu fisik dan serah terima paket makanan pasien rawat inap antara pihak Penyedia Makanan dan Petugas PJLP Pramusaji Puskesmas dengan rincian sebagai berikut:
    </p>

    <div class="section-title">I. DATA TRANSAKSI &amp; RUANG PERAWATAN</div>
    <table class="info-table">
      <tr>
        <td class="info-label">Nomor Pemesanan</td>
        <td class="info-colon">:</td>
        <td class="info-val" style="font-family: monospace; font-weight: 700;">${order.orderNumber}</td>
      </tr>
      <tr>
        <td class="info-label">Nama Pasien &amp; No. RM</td>
        <td class="info-colon">:</td>
        <td class="info-val"><strong>${order.patientName}</strong> (${order.patientMrn}) — Usia: ${order.patientAgeYears} Thn</td>
      </tr>
      <tr>
        <td class="info-label">Ruangan &amp; Tempat Tidur</td>
        <td class="info-colon">:</td>
        <td class="info-val"><strong style="color: #0f766e;">${order.room}</strong> — ${order.bed}</td>
      </tr>
      <tr>
        <td class="info-label">Jadwal Makan &amp; Porsi</td>
        <td class="info-colon">:</td>
        <td class="info-val"><strong>${scheduleLabel}</strong> (${order.portionCount} Porsi)</td>
      </tr>
      <tr>
        <td class="info-label">Penyedia Rekanan</td>
        <td class="info-colon">:</td>
        <td class="info-val">${order.providerName || 'CV Berkah Bahari Boga Mandiri'}</td>
      </tr>
    </table>

    <div class="section-title">II. RINCIAN MENU &amp; DIET KLINIS PASIEN</div>
    <table class="info-table">
      <tr>
        <td class="info-label">Nama Menu</td>
        <td class="info-colon">:</td>
        <td class="info-val"><strong>${order.menuName}</strong> (Rp ${formatRupiah(order.pricePerPortionSnapshot)} / porsi)</td>
      </tr>
      <tr>
        <td class="info-label">Jenis Diet &amp; Tekstur</td>
        <td class="info-colon">:</td>
        <td class="info-val">${order.dietTypeName} · Tekstur: <strong>${order.texture}</strong></td>
      </tr>
      <tr>
        <td class="info-label">Pantangan / Riwayat Alergi</td>
        <td class="info-colon">:</td>
        <td class="info-val" style="color: ${order.allergies && order.allergies.length > 0 ? '#b91c1c' : '#047857'}; font-weight: 600;">
          ${order.allergies && order.allergies.length > 0 ? order.allergies.join(', ') : 'Tidak Ada Riwayat Alergi'}
        </td>
      </tr>
      <tr>
        <td class="info-label">Catatan Khusus Dokter/Gizi</td>
        <td class="info-colon">:</td>
        <td class="info-val">${order.specialClinicalNotes || 'Sajikan tepat waktu dan higienis'}</td>
      </tr>
    </table>

    <div class="section-title">III. HASIL UJI MUTU FISIK &amp; ORGANOLEPTIK (CHECKLIST SOP)</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Parameter Pemeriksaan SOP</th>
          <th>Kesesuaian</th>
          <th>Hasil Ukur Fisik</th>
        </tr>
      </thead>
      <tbody>
        ${checklistRows}
      </tbody>
    </table>

    ${
      deliveryPhoto
        ? `
      <div class="photo-preview-box">
        <p style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 4px;">FOTO DOKUMENTASI SERAH TERIMA DARI KURIR PENYEDIA (GOOGLE DRIVE):</p>
        <img src="${deliveryPhoto}" alt="Foto Serah Terima Makanan" onerror="this.style.display='none'" />
      </div>
    `
        : ''
    }

    <!-- Signatures -->
    <div class="signature-grid">
      <div class="signature-card">
        <div class="sig-role">PIHAK PERTAMA<br/>Yang Menyerahkan (Penyedia/Kurir)</div>
        <div class="sig-image-box">
          ${
            order.handoverProviderSignature?.signatureDataUrl
              ? `<img src="${order.handoverProviderSignature.signatureDataUrl}" alt="TTD Penyedia" />`
              : `<span style="color:#94a3b8; font-style:italic;">(Tanda Tangan Tercatat Digital)</span>`
          }
        </div>
        <div class="sig-name">${order.handoverProviderSignature?.signerName || order.courierName || 'Supriyanto'}</div>
        <div class="sig-meta">CV Berkah Bahari Boga Mandiri<br/>Waktu: ${formatJakartaDateTime(order.handoverProviderSignature?.timestamp || order.shippedAt || new Date().toISOString())}</div>
      </div>

      <div class="signature-card">
        <div class="sig-role">PIHAK KEDUA<br/>Yang Menerima (PJLP Pramusaji)</div>
        <div class="sig-image-box">
          ${
            order.handoverWaiterSignature?.signatureDataUrl
              ? `<img src="${order.handoverWaiterSignature.signatureDataUrl}" alt="TTD PJLP" />`
              : `<span style="color:#94a3b8; font-style:italic;">(Tanda Tangan Tercatat Digital)</span>`
          }
        </div>
        <div class="sig-name">${order.handoverWaiterSignature?.signerName || order.receivedByWaiterName || 'Ahmad Zaki'}</div>
        <div class="sig-meta">Petugas Distribusi Gizi Puskesmas<br/>Waktu: ${formatJakartaDateTime(order.handoverWaiterSignature?.timestamp || order.receivedAt || new Date().toISOString())}</div>
      </div>
    </div>

    <div style="margin-top: 18px; text-align: center; font-size: 10.5px;">
      <div style="color: #475569; margin-bottom: 30px;">Mengetahui &amp; Memverifikasi:</div>
      <div style="font-weight: 700; text-decoration: underline;">${order.reviewedByName || 'Siti Rahmawati, S.Tr.Gz, RD'}</div>
      <div style="font-size: 9.5px; color: #64748b;">Ahli Gizi / Nutrisionis Puskesmas Kepulauan Seribu Selatan</div>
    </div>

    <div class="doc-footer">
      <span>SI PANTAI GIZI · Dokumen Sah Elektronik Puskesmas Kepulauan Seribu Selatan</span>
      <span>Dicetak: ${nowStr}</span>
    </div>
  `;

  openDocumentInNewTab({
    title: `BAST-GIZI ${order.orderNumber}`,
    filename: `BAST_GIZI_${order.orderNumber}.html`,
    contentHtml: bodyHtml,
  });
}

/**
 * Menghasilkan Dokumen Bukti Penyerahan Makanan Pasien (BPM-GIZI) Antara PJLP & Pasien/Keluarga
 */
export function printPatientDeliveryInNewTab(order: MealOrder, settings: AppSettings) {
  const kopHtml = generateOfficialKopHtml(settings);
  const nowStr = formatJakartaDateTime(new Date().toISOString());

  const scheduleLabels: Record<string, string> = {
    SARAPAN: 'Sarapan Pagi',
    SIANG: 'Makan Siang',
    MALAM: 'Makan Malam',
    SORE: 'Selingan Sore',
  };

  const scheduleLabel = scheduleLabels[order.schedule] || order.schedule;
  const servedPhoto = formatDriveOrDirectImageUrl(order.servedMealPhotoUrl);

  const bodyHtml = `
    ${kopHtml}

    <div class="doc-title-block">
      <div class="doc-main-title">BUKTI PENYERAHAN MAKANAN PASIEN (BPM-GIZI)</div>
      <div class="doc-sub-number">NOMOR BUKTI: BPM-GIZI/${order.orderNumber}</div>
    </div>

    <p style="margin-bottom: 12px; text-align: justify; font-size: 11px;">
      Telah diserahkan sajian makanan diet rawat inap kepada pasien/keluarga yang berwenang di ruang perawatan Puskesmas Kepulauan Seribu Selatan dengan verifikasi identitas 2 parameter (Nama &amp; Nomor Rekam Medis) dan rincian penyajian sebagai berikut:
    </p>

    <div class="section-title">I. IDENTITAS PASIEN &amp; RUANGAN RAWAT INAP</div>
    <table class="info-table">
      <tr>
        <td class="info-label">Nama Lengkap Pasien</td>
        <td class="info-colon">:</td>
        <td class="info-val"><strong style="font-size: 12px;">${order.patientName}</strong></td>
      </tr>
      <tr>
        <td class="info-label">Nomor Rekam Medis (RM)</td>
        <td class="info-colon">:</td>
        <td class="info-val" style="font-family: monospace; font-weight: 700;">${order.patientMrn}</td>
      </tr>
      <tr>
        <td class="info-label">Ruang Perawatan &amp; Bed</td>
        <td class="info-colon">:</td>
        <td class="info-val"><strong style="color: #0f766e;">${order.room}</strong> — ${order.bed}</td>
      </tr>
      <tr>
        <td class="info-label">Diagnosis Klinis Medis</td>
        <td class="info-colon">:</td>
        <td class="info-val">${order.medicalDiagnosis}</td>
      </tr>
    </table>

    <div class="section-title">II. MENU SAJIAN &amp; INSTRUKSI DIET KHUSUS</div>
    <table class="info-table">
      <tr>
        <td class="info-label">Jadwal Makan</td>
        <td class="info-colon">:</td>
        <td class="info-val"><strong>${scheduleLabel}</strong> · ${formatJakartaDate(order.serviceDate)}</td>
      </tr>
      <tr>
        <td class="info-label">Menu Makanan</td>
        <td class="info-colon">:</td>
        <td class="info-val"><strong>${order.menuName}</strong> (Tarif: Rp ${formatRupiah(order.pricePerPortionSnapshot)})</td>
      </tr>
      <tr>
        <td class="info-label">Diet &amp; Tekstur Makanan</td>
        <td class="info-colon">:</td>
        <td class="info-val">${order.dietTypeName} · Bentuk Tekstur: <strong>${order.texture}</strong></td>
      </tr>
      <tr>
        <td class="info-label">Catatan Distribusi</td>
        <td class="info-colon">:</td>
        <td class="info-val">${order.distributionNotes || 'Makanan hangat disajikan langsung di meja bed pasien'}</td>
      </tr>
    </table>

    ${
      servedPhoto
        ? `
      <div class="photo-preview-box">
        <p style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 4px;">DOKUMENTASI FOTO SAJIAN MAKANAN AKTUAL PASIEN (GOOGLE DRIVE):</p>
        <img src="${servedPhoto}" alt="Foto Sajian Pasien" onerror="this.style.display='none'" />
      </div>
    `
        : ''
    }

    ${
      order.leftoverAssessment
        ? `
      <div class="section-title" style="margin-top: 14px;">III. REKAPITULASI KONSUMSI MAKANAN (SKALA COMSTOCK)</div>
      <table class="info-table">
        <tr>
          <td class="info-label">Tingkat Konsumsi</td>
          <td class="info-colon">:</td>
          <td class="info-val"><strong>${order.leftoverAssessment.consumptionPercentage}% Dimakan</strong> (Sisa Porsi: ${order.leftoverAssessment.leftoverPercentage}%)</td>
        </tr>
        <tr>
          <td class="info-label">Rekomendasi Petugas</td>
          <td class="info-colon">:</td>
          <td class="info-val">${order.leftoverAssessment.clinicalFollowupRecommendation || 'Asupan nutrisi terpantau baik.'}</td>
        </tr>
      </table>
    `
        : ''
    }

    <!-- Signatures: Waiter & Patient -->
    <div class="signature-grid">
      <div class="signature-card">
        <div class="sig-role">PETUGAS PRAMUSAJI BANGSAL<br/>Yang Menyajikan Makanan</div>
        <div class="sig-image-box">
          ${
            order.handoverWaiterSignature?.signatureDataUrl
              ? `<img src="${order.handoverWaiterSignature.signatureDataUrl}" alt="TTD Pramusaji" />`
              : `<span style="color:#94a3b8; font-style:italic;">(Tanda Tangan Tercatat Digital)</span>`
          }
        </div>
        <div class="sig-name">${order.receivedByWaiterName || 'Ahmad Zaki'}</div>
        <div class="sig-meta">PJLP Pramusaji Puskesmas<br/>Waktu: ${formatJakartaDateTime(order.deliveredToPatientAt || new Date().toISOString())}</div>
      </div>

      <div class="signature-card">
        <div class="sig-role">PENERIMA MAKANAN<br/>Pasien / Keluarga yang Berwenang</div>
        <div class="sig-image-box">
          ${
            order.recipientSignature?.signatureDataUrl
              ? `<img src="${order.recipientSignature.signatureDataUrl}" alt="TTD Penerima" />`
              : `<span style="color:#94a3b8; font-style:italic;">(Tanda Tangan Tercatat Digital)</span>`
          }
        </div>
        <div class="sig-name">${order.recipientSignature?.signerName || order.patientName}</div>
        <div class="sig-meta">Hubungan: ${order.recipientSignature?.signerRelation || 'Pasien Sendiri'}<br/>Waktu: ${formatJakartaDateTime(order.recipientSignature?.timestamp || order.deliveredToPatientAt || new Date().toISOString())}</div>
      </div>
    </div>

    <div class="doc-footer">
      <span>SI PANTAI GIZI · Dokumen Elektronik Sah Pelayanan Gizi Puskesmas Kepulauan Seribu Selatan</span>
      <span>Dicetak: ${nowStr}</span>
    </div>
  `;

  openDocumentInNewTab({
    title: `BPM-GIZI ${order.orderNumber} - ${order.patientName}`,
    filename: `BPM_GIZI_${order.orderNumber}_${order.patientName.replace(/[^a-zA-Z0-9]/g, '_')}.html`,
    contentHtml: bodyHtml,
  });
}
