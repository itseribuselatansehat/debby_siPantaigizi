'use client';

import React, { useState } from 'react';
import { DbStore } from '@/lib/db-store';
import { GOOGLE_APPS_SCRIPT_CODE } from '@/lib/gas-script-template';
import { formatJakartaDateTime } from '@/lib/date-utils';
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
} from 'lucide-react';

export function GasSettingsModule() {
  const db = DbStore.getInstance();
  const settings = db.getSettings();

  const [gasUrl, setGasUrl] = useState(settings.gasWebAppUrl || '');
  const [spreadsheetId, setSpreadsheetId] = useState(settings.spreadsheetId || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings({
      gasWebAppUrl: gasUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
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

      const response = await fetch('/api/gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasWebAppUrl: gasUrl.trim(),
          action: 'syncAll',
          payload: {
            orders,
            auditLogs,
          },
        }),
      });

      const res = await response.json();
      if (res.success) {
        setSyncResult(`Sinkronisasi berhasil! ${orders.length} order dan ${auditLogs.length} audit logs tersimpan di Google Sheets.`);
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
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span>Pengaturan Integrasi Google Apps Script (GAS) & Google Sheets</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan Google Spreadsheet sebagai database persisten cloud realtime untuk seluruh transaksi SOP SI PANTAI GIZI
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Configuration & Sync Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>Konfigurasi Endpoint Google Sheets</span>
            </h3>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Konfigurasi GAS berhasil disimpan secara global di server & semua browser!</span>
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

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Simpan Konfigurasi
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
              <span>Langkah Cepat Setup Google Sheets:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
              <li>Buat Google Spreadsheet baru di Google Drive Anda.</li>
              <li>Buka menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
              <li>Hapus kode bawaan, lalu salin dan tempel skrip di panel kanan.</li>
              <li>
                Jalankan fungsi <code>setupDatabaseSheets</code> untuk membuat seluruh tabel: MealOrders, Patients, Users, Menus, AuditLogs secara otomatis.
              </li>
              <li>
                Klik tombol <strong>Terapkan (Deploy) &gt; Penerapan Baru &gt; Aplikasi Web</strong>.
              </li>
              <li>
                Pilih <em>Jalankan sebagai: Saya</em> dan <em>Siapa saja yang memiliki akses: Siapa saja (Anyone)</em>.
              </li>
              <li>Salin URL Web App dan tempel ke kolom di atas.</li>
            </ol>
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

          <div className="relative flex-1 bg-slate-900 rounded-xl p-4 text-[11px] font-mono text-slate-200 overflow-y-auto max-h-[560px] leading-relaxed border border-slate-800 select-all">
            <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
