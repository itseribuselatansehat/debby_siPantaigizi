/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { DbStore } from '@/lib/db-store';
import { GOOGLE_APPS_SCRIPT_CODE } from '@/lib/gas-script-template';
import { formatJakartaDateTime } from '@/lib/date-utils';
import { uploadPhotoToDrive, TARGET_GOOGLE_DRIVE_FOLDER_ID, TARGET_GOOGLE_DRIVE_FOLDER_URL } from '@/lib/drive-upload';
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  RotateCcw,
  Shield,
  Layers,
  HardDrive,
  Camera,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import {
  formatDriveOrDirectImageUrl,
  DEFAULT_DKI_LOGO,
  DEFAULT_KEMENKES_LOGO,
} from '@/lib/print-bast-service';

export function GasSettingsModule() {
  const db = DbStore.getInstance();
  const settings = db.getSettings();

  const [gasUrl, setGasUrl] = useState(settings.gasWebAppUrl || '');
  const [spreadsheetId, setSpreadsheetId] = useState(settings.spreadsheetId || '');
  const [driveFolderId, setDriveFolderId] = useState(settings.googleDriveFolderId || TARGET_GOOGLE_DRIVE_FOLDER_ID);
  const [dkiLogoUrl, setDkiLogoUrl] = useState(settings.dkiLogoUrl || DEFAULT_DKI_LOGO);
  const [kemenkesLogoUrl, setKemenkesLogoUrl] = useState(settings.kemenkesLogoUrl || DEFAULT_KEMENKES_LOGO);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [driveTestResult, setDriveTestResult] = useState<{ success: boolean; message: string; fileUrl?: string } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings({
      gasWebAppUrl: gasUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
      googleDriveFolderId: driveFolderId.trim() || TARGET_GOOGLE_DRIVE_FOLDER_ID,
      dkiLogoUrl: dkiLogoUrl.trim() || DEFAULT_DKI_LOGO,
      kemenkesLogoUrl: kemenkesLogoUrl.trim() || DEFAULT_KEMENKES_LOGO,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleSetupDatabase = async () => {
    if (!gasUrl.trim()) {
      alert('Silakan masukkan URL Web App Google Apps Script terlebih dahulu sebelum melakukan setup database.');
      return;
    }

    setIsSettingUp(true);
    setSetupResult(null);

    try {
      // First save to global settings
      db.updateSettings({
        gasWebAppUrl: gasUrl.trim(),
        spreadsheetId: spreadsheetId.trim(),
        googleDriveFolderId: driveFolderId.trim() || TARGET_GOOGLE_DRIVE_FOLDER_ID,
      });

      const response = await fetch('/api/gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasWebAppUrl: gasUrl.trim(),
          action: 'setupDatabase',
          payload: { spreadsheetId: spreadsheetId.trim() },
        }),
      });

      const data = await response.json();
      if (data.success && data.data && (data.data.status === 'SUCCESS' || data.data.sheets)) {
        setSetupResult({
          success: true,
          message: `Setup Database Berhasil! Seluruh lembar kerja (MealOrders, Patients, Users, Menus, DietTypes, Providers, AuditLogs, AppSettings) telah dibuat otomatis di Spreadsheet: "${data.data.spreadsheetName || 'Database SI PANTAI GIZI'}".`,
          details: data.data,
        });
        db.updateSettings({ lastGasSyncAt: new Date().toISOString() });
      } else {
        setSetupResult({
          success: false,
          message: data.message || data.data?.message || 'Gagal menjalankan setupDatabase otomatis. Pastikan Web App di-deploy dengan akses Anyone.',
          details: data,
        });
      }
    } catch (err: any) {
      setSetupResult({
        success: false,
        message: err?.message || 'Terjadi kesalahan jaringan saat menjalankan setup database.',
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      alert('Silakan masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/gas?url=${encodeURIComponent(gasUrl.trim())}`);
      const data = await response.json();

      if (data.success && data.data && data.data.status === 'SUCCESS') {
        setTestResult({
          success: true,
          message: `Koneksi Berhasil! Terhubung ke Google Spreadsheet: "${data.data.spreadsheetName || 'Database Gizi'}"`,
          details: data.data,
        });
        db.updateSettings({ lastGasSyncAt: new Date().toISOString() });
      } else {
        setTestResult({
          success: false,
          message: data.message || data.data?.message || 'Gagal tersambung ke endpoint GAS. Pastikan deployment diset Anyone.',
          details: data,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Terjadi kesalahan saat menguji koneksi.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestDriveUpload = async () => {
    if (!gasUrl.trim()) {
      alert('Silakan simpan URL Web App Google Apps Script terlebih dahulu sebelum menguji upload Google Drive.');
      return;
    }

    setIsTestingDrive(true);
    setDriveTestResult(null);

    try {
      // Create a small base64 test badge image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('SI PANTAI GIZI TEST FOTO', 40, 120);
        ctx.font = '14px sans-serif';
        ctx.fillText('Puskesmas Kepulauan Seribu Selatan', 40, 160);
        ctx.fillText(new Date().toLocaleString('id-ID'), 40, 190);
      }
      const testBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const res = await uploadPhotoToDrive({
        base64Data: testBase64,
        fileName: `test_upload_${Date.now()}.jpg`,
        folderId: driveFolderId.trim() || TARGET_GOOGLE_DRIVE_FOLDER_ID,
      });

      if (res.success) {
        setDriveTestResult({
          success: true,
          message: `Uji Upload Sukses! Foto berhasil dibuat dan tersimpan di folder Google Drive ${driveFolderId}.`,
          fileUrl: res.fileUrl,
        });
      } else {
        setDriveTestResult({
          success: false,
          message: res.message || 'Gagal mengunggah ke Google Drive. Pastikan izin akses Drive diberikan pada deploy Apps Script.',
        });
      }
    } catch (err: any) {
      setDriveTestResult({
        success: false,
        message: err?.message || 'Terjadi kesalahan saat menguji upload Google Drive.',
      });
    } finally {
      setIsTestingDrive(false);
    }
  };

  const handleSyncToSheets = async () => {
    if (!gasUrl.trim()) {
      alert('URL Web App Google Apps Script belum dikonfigurasi.');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const orders = db.getOrders();
      const auditLogs = db.getAuditLogs();
      const patients = db.getPatients();

      const response = await fetch('/api/gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasWebAppUrl: gasUrl.trim(),
          action: 'syncAll',
          payload: {
            orders,
            auditLogs,
            patients,
          },
        }),
      });

      const res = await response.json();
      if (res.success) {
        setSyncResult(`Sinkronisasi berhasil! ${orders.length} order, ${patients.length} data pasien rawat inap, dan ${auditLogs.length} audit logs tersimpan di Google Sheets.`);
        db.updateSettings({ lastGasSyncAt: new Date().toISOString() });
      } else {
        setSyncResult(`Gagal sinkronisasi: ${res.message || 'Cek URL Web App GAS Anda.'}`);
      }
    } catch (err: any) {
      setSyncResult(`Gagal sinkronisasi: ${err?.message || 'Terjadi error jaringan.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data demo ke kondisi awal Puskesmas?')) {
      db.resetToInitialSeedData();
      alert('Data berhasil direset.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <span>Pengaturan Integrasi Google Apps Script (GAS), Google Sheets & Drive</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Khusus Administrator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Database utama Spreadsheet dan penyimpanan cloud seluruh foto sajian makanan ke Google Drive tersimpan secara global di semua browser
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data Demo Awal</span>
        </button>
      </div>

      {/* Global Persistence Callout */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-blue-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3 text-xs">
        <Globe className="w-5 h-5 text-teal-700 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">
            Penyimpanan Konfigurasi Global Server-Side (Semua Browser & Perangkat Petugas)
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Pengaturan URL Google Apps Script dan Folder Google Drive di bawah ini disimpan di file <code>global-settings.json</code> pada server. Seluruh petugas (Dokter, Perawat, Ahli Gizi, Penyedia Makanan, dan Pramusaji) di perangkat manapun akan otomatis terhubung ke Spreadsheet & Google Drive ini tanpa perlu mengisi ulang.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Configuration & Sync Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>Konfigurasi Spreadsheet & Google Drive</span>
            </h3>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Konfigurasi GAS & Google Drive berhasil disimpan secara global di server & semua browser!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Web App Google Apps Script (Akhiran /exec) *
                </label>
                <input
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Didapatkan setelah menerapkan skrip sebagai Web App dengan akses &quot;Anyone&quot;.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ID Google Spreadsheet (Opsional)
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Google Drive Folder ID Input & Link */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-blue-950">
                    ID Folder Google Drive untuk Penyimpanan Foto *
                  </label>
                  <a
                    href={`https://drive.google.com/drive/folders/${driveFolderId.trim() || TARGET_GOOGLE_DRIVE_FOLDER_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 underline"
                  >
                    <span>Buka Folder Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg font-mono text-xs bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Seluruh foto dokumentasi makanan yang diambil oleh pramusaji/PJLP saat penyajian ke pasien akan otomatis masuk ke folder Google Drive ini.
                </p>
              </div>

              {/* Pengaturan Logo Kop Surat Resmi (DKI Jakarta & Kementerian Kesehatan) */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-teal-800" />
                    <h4 className="font-bold text-teal-950 text-xs">
                      Logo Kop Surat Resmi Dokumen (DKI Jakarta &amp; Kemenkes)
                    </h4>
                  </div>
                  <span className="text-[10px] bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">
                    Tersimpan Global &amp; Tampil di Semua Cetak PDF
                  </span>
                </div>
                <p className="text-[11px] text-teal-900 leading-relaxed">
                  Kedua logo ini akan otomatis dicetak pada Kop Surat Berita Acara Serah Terima (BAST-GIZI), Bukti Penyerahan Pasien (BPM-GIZI), dan Rekap Tagihan. Anda dapat memasukkan link URL langsung atau link Google Drive asset (contoh: <code>drive.google.com/file/d/ID/view</code>).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Logo Jaya Raya DKI Jakarta */}
                  <div className="bg-white p-3 rounded-lg border border-teal-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-[11px]">
                        1. Logo Jaya Raya DKI Jakarta (Kiri Kop)
                      </label>
                      <button
                        type="button"
                        onClick={() => setDkiLogoUrl(DEFAULT_DKI_LOGO)}
                        className="text-[10px] text-teal-700 hover:text-teal-900 underline font-medium"
                      >
                        Reset Default Resmi
                      </button>
                    </div>
                    <input
                      type="text"
                      value={dkiLogoUrl}
                      onChange={(e) => setDkiLogoUrl(e.target.value)}
                      placeholder="Link Google Drive / URL Logo DKI Jakarta"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                    />
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-12 h-12 rounded border border-slate-200 bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <img
                          src={formatDriveOrDirectImageUrl(dkiLogoUrl) || DEFAULT_DKI_LOGO}
                          alt="Preview Logo DKI"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700 block">Pratinjau Logo DKI Jakarta</span>
                        Tampil pada sisi kiri kop surat resmi Puskesmas.
                      </div>
                    </div>
                  </div>

                  {/* Logo Kementerian Kesehatan RI */}
                  <div className="bg-white p-3 rounded-lg border border-teal-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-[11px]">
                        2. Logo Kesehatan / Kemenkes RI (Kanan Kop)
                      </label>
                      <button
                        type="button"
                        onClick={() => setKemenkesLogoUrl(DEFAULT_KEMENKES_LOGO)}
                        className="text-[10px] text-teal-700 hover:text-teal-900 underline font-medium"
                      >
                        Reset Default Resmi
                      </button>
                    </div>
                    <input
                      type="text"
                      value={kemenkesLogoUrl}
                      onChange={(e) => setKemenkesLogoUrl(e.target.value)}
                      placeholder="Link Google Drive / URL Logo Kemenkes RI"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                    />
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-12 h-12 rounded border border-slate-200 bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <img
                          src={formatDriveOrDirectImageUrl(kemenkesLogoUrl) || DEFAULT_KEMENKES_LOGO}
                          alt="Preview Logo Kemenkes"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700 block">Pratinjau Logo Kemenkes RI</span>
                        Tampil pada sisi kanan kop surat resmi Puskesmas.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Kop Preview Box */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 mt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Simulasi Tampilan Kop Surat Cetak (A4 PDF):
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b-2 border-black pb-2 pt-1 text-center">
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                      <img
                        src={formatDriveOrDirectImageUrl(dkiLogoUrl) || DEFAULT_DKI_LOGO}
                        alt="DKI"
                        className="max-h-12 max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-0.5 text-[9px] text-black">
                      <div className="font-bold uppercase tracking-wide">PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA</div>
                      <div className="font-bold uppercase tracking-wide">DINAS KESEHATAN KABUPATEN ADMINISTRASI KEPULAUAN SERIBU</div>
                      <div className="font-extrabold uppercase text-[11px] tracking-wider">PUSKESMAS KEPULAUAN SERIBU SELATAN</div>
                      <div className="text-slate-600 text-[8.5px]">Jl. Dermaga Pelabuhan Utama No. 4, Pulau Tidung · Telp: (021) 645-8901</div>
                    </div>
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                      <img
                        src={formatDriveOrDirectImageUrl(kemenkesLogoUrl) || DEFAULT_KEMENKES_LOGO}
                        alt="Kemenkes"
                        className="max-h-12 max-w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Simpan Konfigurasi Global
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi GAS'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestDriveUpload}
                  disabled={isTestingDrive || !gasUrl}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  title="Kirim sampel foto uji coba ke Google Drive Folder"
                >
                  <Camera className={`w-3.5 h-3.5 ${isTestingDrive ? 'animate-spin' : ''}`} />
                  <span>{isTestingDrive ? 'Menguji Upload...' : 'Uji Upload Drive'}</span>
                </button>
              </div>
            </form>

            {/* Test Result Indicator */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.details && (
                  <pre className="p-2 bg-black/5 rounded text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Drive Upload Test Result */}
            {driveTestResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  driveTestResult.success
                    ? 'bg-blue-50 border-blue-200 text-blue-950 font-medium'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {driveTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{driveTestResult.message}</span>
                </div>
                {driveTestResult.fileUrl && (
                  <a
                    href={driveTestResult.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                  >
                    <span>Lihat Sampel Foto di Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* 1-Click Setup Database Card */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-3.5 rounded-xl border border-teal-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-teal-700 text-white rounded-md text-[10px] font-bold">1-KLIK</span>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Setup Database Otomatis di Google Sheets
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Inisialisasi seluruh tabel database (<strong>MealOrders, Patients, Users, Menus, DietTypes, Providers, AuditLogs, AppSettings</strong>) langsung di spreadsheet Anda secara otomatis tanpa perlu setup manual.
                </p>
                <button
                  type="button"
                  onClick={handleSetupDatabase}
                  disabled={isSettingUp || !gasUrl}
                  className={`w-full py-2 rounded-lg font-bold shadow-xs text-xs flex items-center justify-center gap-1.5 transition-colors ${
                    gasUrl
                      ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSettingUp ? 'animate-spin' : ''}`} />
                  <span>
                    {isSettingUp
                      ? 'Sedang Menyiapkan Seluruh Tabel...'
                      : '⚡ Setup Database Google Sheets Sekarang'}
                  </span>
                </button>
              </div>

              {/* Setup Result Indicator */}
              {setupResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    setupResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {setupResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{setupResult.message}</span>
                  </div>
                  {setupResult.details && (
                    <pre className="p-2 bg-black/5 rounded text-[10px] font-mono overflow-x-auto">
                      {JSON.stringify(setupResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Sync Action Button */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="font-semibold text-slate-800 block">Kirim & Sinkronkan Data Sekarang:</span>
              <button
                type="button"
                onClick={handleSyncToSheets}
                disabled={isSyncing || !gasUrl}
                className={`w-full py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-colors ${
                  gasUrl
                    ? 'bg-teal-700 hover:bg-teal-800 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing ? 'Menyinkronkan ke Google Sheets...' : 'Kirim Seluruh Data ke Google Spreadsheet'}
                </span>
              </button>

              {syncResult && (
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-center font-medium">
                  {syncResult}
                </p>
              )}

              {settings.lastGasSyncAt && (
                <p className="text-[11px] text-slate-400 text-center">
                  Sinkronisasi terakhir: {formatJakartaDateTime(settings.lastGasSyncAt)}
                </p>
              )}
            </div>
          </div>

          {/* Quick Guide */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-700" />
              <span>Langkah Cepat Setup Google Sheets & Google Drive:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
              <li>Buka Google Spreadsheet baru di Google Drive Anda.</li>
              <li>Buka menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
              <li>Hapus kode bawaan, lalu salin dan tempel skrip di panel kanan.</li>
              <li>
                Jalankan fungsi <code>setupDatabaseSheets</code> untuk membuat seluruh tabel secara otomatis.
              </li>
              <li>
                Klik tombol <strong>Terapkan (Deploy) &gt; Penerapan Baru &gt; Aplikasi Web</strong>.
              </li>
              <li>
                Pilih <em>Jalankan sebagai: Saya</em> dan <em>Siapa saja yang memiliki akses: Siapa saja (Anyone)</em>.
              </li>
              <li>
                Berikan otorisasi izin Spreadsheet & Google Drive saat diminta.
              </li>
              <li>Salin URL Web App dan tempel ke kolom di atas, lalu klik <strong>Simpan Konfigurasi Global</strong>.</li>
            </ol>
          </div>

          {/* Hostinger 403 Forbidden Solution Guide */}
          <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Globe className="w-4 h-4 text-amber-700" />
              <h4>Panduan Solusi 403 Forbidden di Hostinger (sipantaigizi.puskesmasseribuselatan.com)</h4>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Jika domain menampilkan <strong className="text-rose-700">403 Forbidden (Access to this resource on the server is denied!)</strong>, itu berarti repository Git sudah ditarik ke Hostinger namun <strong>Node.js Application</strong> di hPanel belum diaktifkan atau belum menjalankan build.
            </p>
            <div className="bg-white rounded-lg p-3.5 border border-amber-200/80 space-y-2 text-slate-700">
              <p className="font-semibold text-slate-900">3 Langkah Mengaktifkan di hPanel Hostinger:</p>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[11px]">
                <li>
                  Buka <strong>hPanel Hostinger</strong> &gt; Masuk ke <strong>Websites</strong> &gt; Pilih domain <code>sipantaigizi.puskesmasseribuselatan.com</code>.
                </li>
                <li>
                  Di menu kiri, buka <strong>Advanced &gt; Node.js</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1 text-slate-600 space-y-0.5">
                    <li>Node.js version: <strong>20.x</strong></li>
                    <li>Application root: <code>public_html</code> (atau folder repo subdomain Anda)</li>
                    <li>Application startup file: <code>server.js</code></li>
                  </ul>
                </li>
                <li>
                  Klik tombol <strong>Run NPM Install</strong>, kemudian di terminal jalankan <code>npm run build</code>, dan klik <strong>Start / Restart</strong>.
                </li>
              </ol>
              <p className="text-[11px] text-teal-800 font-medium pt-1 border-t border-slate-100">
                ✓ File <code>.htaccess</code> dan <code>server.js</code> di repository ini sudah diperbarui otomatis untuk menangani proxy Hostinger secara mulus.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Code.gs Copyable Script */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Kode Google Apps Script (Code.gs)</h3>
              <p className="text-[11px] text-slate-500">Salin skrip ini ke editor Google Apps Script</p>
            </div>
            <button
              type="button"
              onClick={handleCopyScript}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                copiedCode
                  ? 'bg-emerald-700 text-white'
                  : 'bg-teal-700 hover:bg-teal-800 text-white'
              }`}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Tersalin!' : 'Salin Kode GAS'}</span>
            </button>
          </div>

          <div className="relative flex-1 bg-slate-900 rounded-xl p-4 text-[11px] font-mono text-slate-200 overflow-y-auto max-h-[580px] leading-relaxed border border-slate-800 select-all">
            <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
