/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { MealOrder, Patient } from '@/types/nutrition';
import { formatJakartaDate, formatRupiah } from '@/lib/date-utils';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Users,
  Utensils,
  Receipt,
  PieChart,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { DbStore } from '@/lib/db-store';
import {
  formatDriveOrDirectImageUrl,
  DEFAULT_DKI_LOGO,
  DEFAULT_KEMENKES_LOGO,
} from '@/lib/print-bast-service';

interface ReportsModuleProps {
  orders: MealOrder[];
  patients: Patient[];
}

export function ReportsModule({ orders, patients }: ReportsModuleProps) {
  const db = DbStore.getInstance();
  const settings = db.getSettings();
  const dkiLogo = formatDriveOrDirectImageUrl(settings.dkiLogoUrl) || DEFAULT_DKI_LOGO;
  const kemenkesLogo = formatDriveOrDirectImageUrl(settings.kemenkesLogoUrl) || DEFAULT_KEMENKES_LOGO;

  const [activeReportTab, setActiveReportTab] = useState<
    'PATIENT_RECAP' | 'MEAL_ORDERS' | 'BILLING' | 'LEFTOVERS' | 'SOP_QUALITY'
  >('PATIENT_RECAP');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  const filteredOrders = orders.filter((o) => o.serviceDate.startsWith(selectedMonth));

  // 1. Patient Recap Statistics
  const uniquePatientsInOrders = Array.from(new Set(filteredOrders.map((o) => o.patientId)));
  const totalPortionsOrdered = filteredOrders.reduce((sum, o) => sum + o.portionCount, 0);
  const totalPortionsServed = filteredOrders
    .filter((o) => ['DELIVERED_TO_PATIENT', 'CONSUMPTION_RECORDED', 'COMPLETED'].includes(o.status))
    .reduce((sum, o) => sum + (o.billedPortionCount || o.portionCount), 0);

  // 2. Meal Orders Breakdown per Schedule & Diet
  const scheduleBreakdown = {
    SIANG: filteredOrders.filter((o) => o.schedule === 'SIANG').length,
    SORE: filteredOrders.filter((o) => o.schedule === 'SORE').length,
    MALAM: filteredOrders.filter((o) => o.schedule === 'MALAM').length,
  };

  // 4. Leftovers Stats
  const leftoversOrders = filteredOrders.filter((o) => o.leftoverAssessment);
  const validLeftovers = leftoversOrders.filter(
    (o) => o.leftoverAssessment?.consumptionCategory !== 'TIDAK_DAPAT_DINILAI'
  );
  const avgLeftoverConsumption =
    validLeftovers.length > 0
      ? Math.round(
          validLeftovers.reduce((acc, o) => acc + (o.leftoverAssessment?.consumptionPercentage || 0), 0) /
            validLeftovers.length
        )
      : 85;

  // 5. SOP Quality Stats
  const ordersWithBothSignatures = filteredOrders.filter(
    (o) => o.handoverProviderSignature && o.handoverWaiterSignature
  ).length;
  const ordersWithPatientSignature = filteredOrders.filter((o) => o.recipientSignature).length;
  const ordersWithPhoto = filteredOrders.filter((o) => o.servedMealPhotoUrl).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `Laporan_${activeReportTab}_${selectedMonth}.csv`;

    if (activeReportTab === 'PATIENT_RECAP') {
      headers = ['No', 'No. RM', 'Nama Pasien', 'Ruang Rawat', 'Bed', 'Diagnosis Medis', 'Jumlah Order', 'Total Porsi Disajikan'];
      rows = patients.map((p, idx) => {
        const patientOrders = filteredOrders.filter((o) => o.patientId === p.id);
        const portions = patientOrders.reduce((s, o) => s + (o.billedPortionCount || o.portionCount), 0);
        return [idx + 1, `"${p.mrn}"`, `"${p.name}"`, `"${p.room}"`, `"${p.bed}"`, `"${p.clinicalDiagnosis}"`, patientOrders.length, portions];
      });
    } else if (activeReportTab === 'MEAL_ORDERS') {
      headers = ['Tgl', 'No. Order', 'No. RM', 'Pasien', 'Ruang', 'Jadwal', 'Diet', 'Menu', 'Porsi', 'Pemesan', 'Status'];
      rows = filteredOrders.map((o) => [
        `"${formatJakartaDate(o.serviceDate)}"`,
        `"${o.orderNumber}"`,
        `"${o.patientMrn}"`,
        `"${o.patientName}"`,
        `"${o.room}"`,
        `"${o.schedule}"`,
        `"${o.dietTypeName}"`,
        `"${o.menuName || o.dietTypeName || '-'}"`,
        o.portionCount,
        `"${o.orderedByName}"`,
        `"${o.status}"`,
      ]);
    } else if (activeReportTab === 'BILLING') {
      headers = ['Tgl', 'No. Order', 'Penyedia', 'Menu', 'Jadwal', 'Porsi Tertagih', 'Harga Satuan', 'Subtotal', 'Status Tagihan'];
      rows = filteredOrders.map((o) => [
        `"${formatJakartaDate(o.serviceDate)}"`,
        `"${o.orderNumber}"`,
        `"${o.providerName || '-'}"`,
        `"${o.menuName || o.dietTypeName || '-'}"`,
        `"${o.schedule}"`,
        o.billedPortionCount || o.portionCount,
        o.pricePerPortionSnapshot,
        o.finalBilledAmount || o.totalEstimatedPrice,
        `"${o.billingStatus}"`,
      ]);
    } else if (activeReportTab === 'LEFTOVERS') {
      headers = ['Tgl', 'No. Order', 'Pasien', 'Ruang', 'Menu', 'Kategori Sisa', '% Konsumsi', '% Sisa', 'Alasan Sisa', 'Penilai'];
      rows = leftoversOrders.map((o) => [
        `"${formatJakartaDate(o.serviceDate)}"`,
        `"${o.orderNumber}"`,
        `"${o.patientName}"`,
        `"${o.room}"`,
        `"${o.menuName || o.dietTypeName || '-'}"`,
        `"${o.leftoverAssessment?.consumptionCategory}"`,
        o.leftoverAssessment?.consumptionPercentage,
        o.leftoverAssessment?.leftoverPercentage,
        `"${o.leftoverAssessment?.reasons.join('; ') || '-'}"`,
        `"${o.leftoverAssessment?.assessedByName}"`,
      ]);
    } else {
      headers = ['No. Order', 'Tgl', 'Pasien', 'QC Mutu Lolos', 'TTD Serah Terima', 'Foto Sajian', 'TTD Pasien', 'Evaluasi Sisa'];
      rows = filteredOrders.map((o) => [
        `"${o.orderNumber}"`,
        `"${formatJakartaDate(o.serviceDate)}"`,
        `"${o.patientName}"`,
        o.checklistPassed ? 'SESUAI' : 'TIDAK SESUAI',
        o.handoverWaiterSignature ? 'LENGKAP' : 'BELUM',
        o.servedMealPhotoUrl ? 'LENGKAP' : 'BELUM',
        o.recipientSignature ? 'LENGKAP' : 'BELUM',
        o.leftoverAssessment ? 'LENGKAP' : 'BELUM',
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            <span>Laporan Resmi Pelayanan Gizi Rawat Inap</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            5 Laporan Wajib: Rekap Pasien, Pemesanan, Tagihan Penyedia, Evaluasi Sisa Makanan, dan Kepatuhan Mutu SOP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 font-mono"
          />
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Unduh CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs no-print">
        <button
          type="button"
          onClick={() => setActiveReportTab('PATIENT_RECAP')}
          className={`px-3 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'PATIENT_RECAP'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Rekap Pasien Rawat Inap</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('MEAL_ORDERS')}
          className={`px-3 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'MEAL_ORDERS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>2. Rekap Pemesanan Makanan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('BILLING')}
          className={`px-3 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'BILLING'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>3. Rekap Tagihan Bulanan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('LEFTOVERS')}
          className={`px-3 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'LEFTOVERS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>4. Rekap Sisa Makanan (Comstock)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('SOP_QUALITY')}
          className={`px-3 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'SOP_QUALITY'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>5. Kepatuhan Mutu SOP</span>
        </button>
      </div>

      {/* Report Content Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Printable Official Header Dua Logo */}
        <div className="pb-3 border-b-2 border-black">
          <div className="flex items-center justify-between gap-4 pb-2 border-b-2 border-black">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <img
                src={dkiLogo}
                alt="Logo DKI"
                className="max-h-16 max-w-full object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <div className="text-center flex-1 space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-900">
                PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-900">
                DINAS KESEHATAN KABUPATEN ADMINISTRASI KEPULAUAN SERIBU
              </p>
              <h2 className="text-base font-extrabold uppercase tracking-wider text-black">
                PUSKESMAS KEPULAUAN SERIBU SELATAN
              </h2>
              <p className="text-[10px] text-slate-600">
                Jl. Dermaga Pelabuhan Utama No. 4, Pulau Tidung, Kepulauan Seribu · Telp/WA: (021) 645-8901
              </p>
            </div>
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <img
                src={kemenkesLogo}
                alt="Logo Kemenkes"
                className="max-h-16 max-w-full object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          </div>
          <div className="text-center pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Instalasi Gizi &amp; Dietetika Rawat Inap — Laporan Rekapitulasi Periode: {selectedMonth}
            </p>
          </div>
        </div>

        {/* TAB 1: Rekap Pasien Rawat Inap */}
        {activeReportTab === 'PATIENT_RECAP' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Jumlah Pasien Unik:</span>
                <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{uniquePatientsInOrders.length} Pasien</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Total Transaksi Order Makan:</span>
                <p className="text-xl font-bold text-teal-800 font-mono mt-0.5">{filteredOrders.length} Order</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Total Porsi Tersaji:</span>
                <p className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{totalPortionsServed} Porsi</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2.5 px-3">No. RM</th>
                    <th className="py-2.5 px-3">Nama Pasien</th>
                    <th className="py-2.5 px-3">Ruang / Kamar</th>
                    <th className="py-2.5 px-3">Diagnosis Medis</th>
                    <th className="py-2.5 px-3 text-center">Tgl Masuk</th>
                    <th className="py-2.5 px-3 text-right">Jumlah Order</th>
                    <th className="py-2.5 px-3 text-right">Porsi Tersaji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => {
                    const patientOrders = filteredOrders.filter((o) => o.patientId === p.id);
                    const portions = patientOrders.reduce((s, o) => s + (o.billedPortionCount || o.portionCount), 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-teal-900">{p.mrn}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-2 px-3 text-slate-700">{p.room} ({p.bed})</td>
                        <td className="py-2 px-3 text-slate-600">{p.clinicalDiagnosis}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">{formatJakartaDate(p.admissionDate)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">{patientOrders.length}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">{portions}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Rekap Pemesanan Makanan */}
        {activeReportTab === 'MEAL_ORDERS' && (
          <div className="space-y-4 text-xs">
            <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p>Makan Siang: <strong>{scheduleBreakdown.SIANG} porsi</strong></p>
              <p>Snack Sore: <strong>{scheduleBreakdown.SORE} porsi</strong></p>
              <p>Makan Malam: <strong>{scheduleBreakdown.MALAM} porsi</strong></p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2 px-3">Tgl</th>
                    <th className="py-2 px-3">No. Order</th>
                    <th className="py-2 px-3">Pasien</th>
                    <th className="py-2 px-3">Jadwal</th>
                    <th className="py-2 px-3">Menu & Diet</th>
                    <th className="py-2 px-3">Porsi</th>
                    <th className="py-2 px-3">Dokter/Perawat</th>
                    <th className="py-2 px-3">Verifikator Gizi</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono">{formatJakartaDate(o.serviceDate)}</td>
                      <td className="py-2 px-3 font-mono font-bold text-teal-800">{o.orderNumber}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{o.patientName}</td>
                      <td className="py-2 px-3 font-bold text-slate-700">{o.schedule}</td>
                      <td className="py-2 px-3 truncate max-w-[150px]">
                        {o.menuName || o.dietTypeName || 'Menu Standar'} ({o.dietTypeName})
                      </td>
                      <td className="py-2 px-3 font-mono font-bold">{o.portionCount}</td>
                      <td className="py-2 px-3 text-slate-600">{o.orderedByName}</td>
                      <td className="py-2 px-3 text-slate-600">{o.reviewedByName || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-[10px]">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Rekap Tagihan Bulanan */}
        {activeReportTab === 'BILLING' && (
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2 px-3">Tgl</th>
                    <th className="py-2 px-3">No. Order</th>
                    <th className="py-2 px-3">Penyedia Rekanan</th>
                    <th className="py-2 px-3">Menu Disajikan</th>
                    <th className="py-2 px-3 text-right">Porsi</th>
                    <th className="py-2 px-3 text-right">Harga Kontrak</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                    <th className="py-2 px-3">Status Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono">{formatJakartaDate(o.serviceDate)}</td>
                      <td className="py-2 px-3 font-mono font-bold text-teal-800">{o.orderNumber}</td>
                      <td className="py-2 px-3 text-slate-700">{o.providerName || '-'}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{o.menuName || o.dietTypeName || 'Menu Standar'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{o.billedPortionCount || o.portionCount}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatRupiah(o.pricePerPortionSnapshot)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(o.finalBilledAmount || o.totalEstimatedPrice)}
                      </td>
                      <td className="py-2 px-3 font-semibold text-[10px]">{o.billingStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Rekap Sisa Makanan (Comstock) */}
        {activeReportTab === 'LEFTOVERS' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 flex items-center justify-between">
              <span>Rata-rata Konsumsi Makanan Pasien Bulan {selectedMonth}:</span>
              <strong className="text-base font-mono text-teal-900">{avgLeftoverConsumption}%</strong>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2 px-3">Pasien</th>
                    <th className="py-2 px-3">Ruang</th>
                    <th className="py-2 px-3">Menu Makanan</th>
                    <th className="py-2 px-3">Kategori Comstock</th>
                    <th className="py-2 px-3">% Konsumsi</th>
                    <th className="py-2 px-3">Alasan Sisa</th>
                    <th className="py-2 px-3">Pramusaji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leftoversOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{o.patientName}</td>
                      <td className="py-2 px-3 text-slate-600">{o.room} ({o.bed})</td>
                      <td className="py-2 px-3 text-slate-800">{o.menuName}</td>
                      <td className="py-2 px-3 font-semibold">{o.leftoverAssessment?.consumptionCategory}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800">
                        {o.leftoverAssessment?.consumptionPercentage}%
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-[150px]">
                        {o.leftoverAssessment?.reasons.join(', ') || '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{o.leftoverAssessment?.assessedByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Kepatuhan Mutu SOP */}
        {activeReportTab === 'SOP_QUALITY' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Kepatuhan TTD Serah Terima:</span>
                <p className="text-lg font-bold text-teal-800 font-mono mt-1">
                  {Math.round((ordersWithBothSignatures / (filteredOrders.length || 1)) * 100)}%
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Kelengkapan Foto Sajian:</span>
                <p className="text-lg font-bold text-teal-800 font-mono mt-1">
                  {Math.round((ordersWithPhoto / (filteredOrders.length || 1)) * 100)}%
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Kepatuhan TTD Pasien/Keluarga:</span>
                <p className="text-lg font-bold text-teal-800 font-mono mt-1">
                  {Math.round((ordersWithPatientSignature / (filteredOrders.length || 1)) * 100)}%
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Penilaian Sisa Comstock:</span>
                <p className="text-lg font-bold text-emerald-800 font-mono mt-1">
                  {Math.round((leftoversOrders.length / (filteredOrders.length || 1)) * 100)}%
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2 px-3">No. Order</th>
                    <th className="py-2 px-3">Pasien</th>
                    <th className="py-2 px-3 text-center">QC Mutu Makanan</th>
                    <th className="py-2 px-3 text-center">TTD Serah Terima</th>
                    <th className="py-2 px-3 text-center">Foto Sajian Aktual</th>
                    <th className="py-2 px-3 text-center">TTD Penerima</th>
                    <th className="py-2 px-3 text-center">Form Comstock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-teal-800">{o.orderNumber}</td>
                      <td className="py-2 px-3 text-slate-900 font-medium">{o.patientName}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.checklistPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {o.checklistPassed ? 'Lolos' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.handoverWaiterSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {o.handoverWaiterSignature ? 'Lengkap' : 'Belum'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.servedMealPhotoUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {o.servedMealPhotoUrl ? 'Ada' : 'Nihil'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.recipientSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {o.recipientSignature ? 'Lengkap' : 'Belum'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.leftoverAssessment ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {o.leftoverAssessment ? 'Dinilai' : 'Belum'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Printable Signature Footer */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs text-black">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala Puskesmas Kec. Kepulauan Seribu Selatan</p>
            <div className="h-16"></div>
            <p className="font-bold underline">drg. Hendra Setiawan</p>
            <p className="text-[11px]">NIP. 198205142008011003</p>
          </div>
          <div>
            <p>Kepulauan Seribu, {formatJakartaDate(new Date())}</p>
            <p className="font-semibold">Penanggung Jawab Instalasi Gizi</p>
            <div className="h-16"></div>
            <p className="font-bold underline">Siti Rahmawati, S.Tr.Gz, RD</p>
            <p className="text-[11px]">NIP. 199109232015032002</p>
          </div>
        </div>
      </div>
    </div>
  );
}
