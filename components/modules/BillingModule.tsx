/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { MealOrder } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import { formatJakartaDate, formatRupiah } from '@/lib/date-utils';
import {
  Receipt,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Edit3,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  formatDriveOrDirectImageUrl,
  DEFAULT_DKI_LOGO,
  DEFAULT_KEMENKES_LOGO,
} from '@/lib/print-bast-service';

interface BillingModuleProps {
  orders: MealOrder[];
  onOrderUpdated: () => void;
}

export function BillingModule({ orders, onOrderUpdated }: BillingModuleProps) {
  const db = DbStore.getInstance();
  const settings = db.getSettings();
  const dkiLogo = formatDriveOrDirectImageUrl(settings.dkiLogoUrl) || DEFAULT_DKI_LOGO;
  const kemenkesLogo = formatDriveOrDirectImageUrl(settings.kemenkesLogoUrl) || DEFAULT_KEMENKES_LOGO;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('2026-10');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedOrderForAdjust, setSelectedOrderForAdjust] = useState<MealOrder | null>(null);
  const [adjustedPortions, setAdjustedPortions] = useState(1);
  const [adjustNotes, setAdjustNotes] = useState('');

  // Billable orders (orders that reached delivery, consumption, or completed)
  const billableOrders = orders.filter((o) => {
    const isServiceInMonth = o.serviceDate.startsWith(filterMonth);
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.menuName && o.menuName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.dietTypeName && o.dietTypeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.providerName && o.providerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'ALL' || o.billingStatus === filterStatus;
    return isServiceInMonth && matchesSearch && matchesStatus;
  });

  const totalBillableAmount = billableOrders.reduce((sum, o) => sum + (o.finalBilledAmount || 0), 0);
  const totalVerifiedAmount = billableOrders
    .filter((o) => o.billingStatus === 'TERVERIFIKASI' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.finalBilledAmount || 0), 0);
  const totalPendingAmount = billableOrders
    .filter((o) => o.billingStatus === 'MENUNGGU_VERIFIKASI' || o.billingStatus === 'BELUM_DIREKAP')
    .reduce((sum, o) => sum + (o.finalBilledAmount || 0), 0);

  const handleOpenAdjust = (order: MealOrder) => {
    setSelectedOrderForAdjust(order);
    setAdjustedPortions(order.billedPortionCount || order.portionCount);
    setAdjustNotes(order.billingNotes || '');
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAdjust) return;

    if (!adjustNotes.trim()) {
      alert('Alasan penyesuaian porsi/tagihan wajib dicatat untuk audit trail!');
      return;
    }

    db.updateBillingAdjustment(selectedOrderForAdjust.id, adjustedPortions, adjustNotes.trim());
    setSelectedOrderForAdjust(null);
    onOrderUpdated();
  };

  const handleVerifyAllPending = () => {
    const pending = billableOrders.filter((o) => o.billingStatus === 'MENUNGGU_VERIFIKASI');
    if (pending.length === 0) {
      alert('Tidak ada item tagihan berstatus Menunggu Verifikasi.');
      return;
    }

    if (confirm(`Verifikasi sekaligus ${pending.length} item transaksi tagihan yang telah disajikan?`)) {
      pending.forEach((order) => {
        db.finalizeOrder(order.id);
      });
      onOrderUpdated();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'No. Order',
      'Tanggal Pelayanan',
      'Jadwal',
      'Penyedia',
      'Pasien',
      'No. RM',
      'Menu',
      'Diet/Tekstur',
      'Porsi Disetujui',
      'Porsi Tertagih',
      'Harga Satuan (Rp)',
      'Subtotal (Rp)',
      'Status Penagihan',
      'Catatan Koreksi',
    ];

    const rows = billableOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${formatJakartaDate(o.serviceDate)}"`,
      `"${o.schedule}"`,
      `"${o.providerName || '-'}"`,
      `"${o.patientName}"`,
      `"${o.patientMrn}"`,
      `"${o.menuName}"`,
      `"${o.dietTypeName} (${o.texture})"`,
      o.portionCount,
      o.billedPortionCount,
      o.pricePerPortionSnapshot,
      o.finalBilledAmount,
      `"${o.billingStatus}"`,
      `"${o.billingNotes || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Tagihan_Penyedia_${filterMonth}.csv`);
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
            <Receipt className="w-5 h-5 text-teal-700" />
            <span>Rekapitulasi Tagihan Penyedia Makanan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan porsi tersaji terverifikasi dengan snapshot harga kontrak untuk pengesahan SPJ bulanan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Unduh CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>
          <button
            type="button"
            onClick={handleVerifyAllPending}
            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Verifikasi Semua Tertunda</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block">Total Nilai Tagihan Bulan Ini</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1 tabular-nums">
            {formatRupiah(totalBillableAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{billableOrders.length} item transaksi makan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-emerald-700 font-medium block">Tagihan Terverifikasi (Siap Dibayar)</span>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 tabular-nums">
            {formatRupiah(totalVerifiedAmount)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1">Lengkap bukti serah terima & penyajian</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-amber-700 font-medium block">Menunggu Verifikasi Akhir</span>
          <p className="text-2xl font-extrabold text-amber-700 font-mono mt-1 tabular-nums">
            {formatRupiah(totalPendingAmount)}
          </p>
          <p className="text-[11px] text-amber-600 mt-1">Perlu pemeriksaan bukti foto & TTD</p>
        </div>
      </div>

      {/* Filter and Month Selector */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Order, Pasien, Menu, atau Penyedia..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 font-mono"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white"
          >
            <option value="ALL">Semua Status Tagihan</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="TERVERIFIKASI">Terverifikasi</option>
            <option value="BELUM_DIREKAP">Belum Direkap</option>
            <option value="TIDAK_DAPAT_DITAGIHKAN">Tidak Dapat Ditagihkan</option>
          </select>
        </div>
      </div>

      {/* Invoice Details Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Print Header Resmi Dua Logo */}
        <div className="p-4 border-b-2 border-black hidden print:block text-black">
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
              <p className="text-[11px] font-bold uppercase tracking-wide">
                PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wide">
                DINAS KESEHATAN KABUPATEN ADMINISTRASI KEPULAUAN SERIBU
              </p>
              <h1 className="text-sm font-extrabold uppercase tracking-wider">
                PUSKESMAS KEPULAUAN SERIBU SELATAN
              </h1>
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
            <h2 className="text-sm font-bold uppercase tracking-wider">
              REKAPITULASI TAGIHAN PEMBERIAN MAKANAN PASIEN RAWAT INAP
            </h2>
            <p className="text-xs text-slate-700">
              Periode Rekap: {filterMonth} · Dicetak pada: {formatJakartaDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Tgl Pelayanan</th>
                <th className="py-2.5 px-3">No. Order</th>
                <th className="py-2.5 px-3">Pasien / Kamar</th>
                <th className="py-2.5 px-3">Jadwal & Menu</th>
                <th className="py-2.5 px-3 text-right">Porsi</th>
                <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3">Status Tagihan</th>
                <th className="py-2.5 px-3 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billableOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi penagihan pada periode dan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                billableOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-700">
                      {formatJakartaDate(order.serviceDate)}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-teal-800">
                      {order.orderNumber}
                    </td>
                    <td className="py-2 px-3">
                      <strong className="text-slate-900 block">{order.patientName}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{order.room} ({order.bed})</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-800 block truncate max-w-[150px]">
                        {order.menuName || order.dietTypeName || 'Menu Standar'}
                      </span>
                      <span className="text-[10px] text-slate-500">{order.schedule} · {order.texture}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                      {order.billedPortionCount || order.portionCount}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {formatRupiah(order.pricePerPortionSnapshot)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(order.finalBilledAmount || order.totalEstimatedPrice)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          order.billingStatus === 'TERVERIFIKASI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.billingStatus === 'MENUNGGU_VERIFIKASI'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.billingStatus}
                      </span>
                      {order.billingNotes && (
                        <p className="text-[10px] text-slate-500 mt-0.5 italic truncate max-w-[120px]">
                          {order.billingNotes}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right no-print">
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(order)}
                        className="px-2 py-1 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded text-xs inline-flex items-center gap-1 transition-colors"
                        title="Koreksi Porsi / Catatan Penagihan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Koreksi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/70 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <td colSpan={6} className="py-3 px-3 text-right">
                  TOTAL REKAPITULASI TAGIHAN BULANAN:
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-teal-900">
                  {formatRupiah(totalBillableAmount)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Printable Signature Footer */}
        <div className="p-8 hidden print:grid grid-cols-2 text-center text-xs text-black border-t-2 border-black mt-4">
          <div>
            <p>Mengetahui &amp; Menyetujui,</p>
            <p className="font-semibold">Kepala Puskesmas Kepulauan Seribu Selatan</p>
            <div className="h-16"></div>
            <p className="font-bold underline">{settings.headOfPuskesmasName || 'dr. Ignatius Dendy Purnama'}</p>
            <p className="text-[11px]">NIP. {settings.headOfPuskesmasNip || '198607192014031004'}</p>
          </div>
          <div>
            <p>Kepulauan Seribu, {formatJakartaDate(new Date())}</p>
            <p className="font-semibold">Petugas Verifikasi Tagihan / Ahli Gizi</p>
            <div className="h-16"></div>
            <p className="font-bold underline">Siti Rahmawati, S.Tr.Gz, RD</p>
            <p className="text-[11px]">NIP. 199109232015032002</p>
          </div>
        </div>
      </div>

      {/* Modal: Adjust Billing & Portions with Audit Trail */}
      {selectedOrderForAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-700" />
                <span>Koreksi Penagihan Porsi Transaksi</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderForAdjust(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <p>No. Order: <strong className="font-mono">{selectedOrderForAdjust.orderNumber}</strong></p>
              <p>Pasien: <strong>{selectedOrderForAdjust.patientName}</strong></p>
              <p>Harga per Porsi Snapshot: <strong className="font-mono">{formatRupiah(selectedOrderForAdjust.pricePerPortionSnapshot)}</strong></p>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Porsi yang Sah Ditagihkan *</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={adjustedPortions}
                  onChange={(e) => setAdjustedPortions(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  required
                />
                <p className="text-[11px] text-teal-800 font-semibold mt-1">
                  Total Nilai Baru: {formatRupiah(selectedOrderForAdjust.pricePerPortionSnapshot * adjustedPortions)}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Koreksi / Dasar SPJ (Wajib untuk Audit Trail) *
                </label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Koreksi porsi kedua diganti snack sesuai berita acara serah terima..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForAdjust(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  Simpan Koreksi & Catat Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
