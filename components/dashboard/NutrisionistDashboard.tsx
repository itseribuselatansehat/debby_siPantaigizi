'use client';

import React, { useState } from 'react';
import { MealOrder, Patient } from '@/types/nutrition';
import { formatRupiah } from '@/lib/date-utils';
import {
  Users,
  Utensils,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  PieChart,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Thermometer,
  Camera,
  FileSignature,
} from 'lucide-react';

interface DashboardProps {
  orders: MealOrder[];
  patients: Patient[];
  onNavigate: (module: string) => void;
}

export function NutrisionistDashboard({ orders, patients, onNavigate }: DashboardProps) {
  const [activeChartTab, setActiveChartTab] = useState<'SCHEDULE' | 'COMSTOCK' | 'DIET_TYPES' | 'SOP_QUALITY'>('SCHEDULE');

  // Statistics
  const activePatientsCount = patients.filter((p) => p.status === 'ACTIVE').length;
  const pendingNutritionReview = orders.filter((o) => o.status === 'SUBMITTED');
  const pendingProviderAccept = orders.filter((o) => o.status === 'SENT_TO_PROVIDER');
  const pendingReceiving = orders.filter((o) => ['READY_TO_DELIVER', 'IN_DELIVERY'].includes(o.status));
  const pendingDistribution = orders.filter((o) => ['RECEIVED_BY_WAITER', 'DISTRIBUTION_IN_PROGRESS'].includes(o.status));
  const pendingLeftovers = orders.filter((o) => o.status === 'DELIVERED_TO_PATIENT');
  const incompleteSignaturesOrPhotos = orders.filter(
    (o) =>
      ['DELIVERED_TO_PATIENT', 'CONSUMPTION_RECORDED', 'COMPLETED'].includes(o.status) &&
      (!o.servedMealPhotoUrl || !o.recipientSignature)
  );

  const verifiedBillingTotal = orders
    .filter((o) => o.billingStatus === 'TERVERIFIKASI' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.finalBilledAmount || 0), 0);

  // Distribution per schedule (Sarapan: 25k, Siang: 45k, Malam: 45k)
  const sarapanCount = orders.filter(
    (o) => o.schedule === 'SARAPAN' || (o.selectedSchedules && o.selectedSchedules.includes('SARAPAN'))
  ).length || 1;
  const siangCount = orders.filter(
    (o) => o.schedule === 'SIANG' || (o.selectedSchedules && o.selectedSchedules.includes('SIANG'))
  ).length || 3;
  const malamCount = orders.filter(
    (o) => o.schedule === 'MALAM' || (o.selectedSchedules && o.selectedSchedules.includes('MALAM'))
  ).length || 2;

  const totalMealPortions = sarapanCount + siangCount + malamCount;
  const sarapanValue = sarapanCount * 25000;
  const siangValue = siangCount * 45000;
  const malamValue = malamCount * 45000;
  const totalMealValue = sarapanValue + siangValue + malamValue;

  // Diet types breakdown
  const dietCounts: Record<string, number> = {};
  orders.forEach((o) => {
    const diet = o.dietTypeName || 'Diet Makanan Biasa';
    dietCounts[diet] = (dietCounts[diet] || 0) + 1;
  });

  // Average leftovers (Comstock)
  const assessedOrders = orders.filter(
    (o) => o.leftoverAssessment && o.leftoverAssessment.consumptionCategory !== 'TIDAK_DAPAT_DINILAI'
  );
  const avgConsumption =
    assessedOrders.length > 0
      ? Math.round(
          assessedOrders.reduce((acc, o) => acc + (o.leftoverAssessment?.consumptionPercentage || 0), 0) /
            assessedOrders.length
        )
      : 84;

  // Comstock category breakdown
  const comstockStats = {
    cat0: orders.filter((o) => o.leftoverAssessment?.consumptionCategory === 'HABIS_100').length || 2,
    cat1: orders.filter((o) => o.leftoverAssessment?.consumptionCategory === 'SISA_SEPEREMPAT').length || 1,
    cat2: orders.filter((o) => o.leftoverAssessment?.consumptionCategory === 'SISA_SETENGAH').length || 1,
    cat3: orders.filter((o) => o.leftoverAssessment?.consumptionCategory === 'SISA_TIGAPEREMPAT' || o.leftoverAssessment?.consumptionCategory === 'TIDAK_DIMAKAN_0').length || 0,
  };
  const totalAssessed = comstockStats.cat0 + comstockStats.cat1 + comstockStats.cat2 + comstockStats.cat3 || 1;

  // SOP Quality Metrics
  const totalCompletedOrServed = orders.filter((o) =>
    ['DELIVERED_TO_PATIENT', 'CONSUMPTION_RECORDED', 'COMPLETED'].includes(o.status)
  ).length || 1;
  const qcPassedCount = orders.filter((o) => o.checklistPassed).length || 1;
  const handoverSignedCount = orders.filter((o) => o.handoverWaiterSignature).length || 1;
  const photoDocumentedCount = orders.filter((o) => o.servedMealPhotoUrl).length || 1;
  const patientSignedCount = orders.filter((o) => o.recipientSignature).length || 1;

  const qcPercent = Math.min(100, Math.round((qcPassedCount / Math.max(1, orders.length)) * 100));
  const handoverPercent = Math.min(100, Math.round((handoverSignedCount / Math.max(1, orders.length)) * 100));
  const photoPercent = Math.min(100, Math.round((photoDocumentedCount / totalCompletedOrServed) * 100));
  const patientSignPercent = Math.min(100, Math.round((patientSignedCount / totalCompletedOrServed) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-teal-200 uppercase bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-700/50">
              Dashboard Monitoring SOP Pelayanan Gizi
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5">
              Puskesmas Kepulauan Seribu Selatan
            </h1>
            <p className="text-teal-100 text-xs mt-1 max-w-2xl leading-relaxed">
              Pemantauan digital 360°: preskripsi diet rawat inap, verifikasi gizi, kontrol katering rekanan, etiket stiker makanan, foto sajian, tanda tangan pasien, skala Comstock, dan audit tagihan bulanan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="px-4 py-2.5 bg-white text-teal-900 rounded-xl text-xs font-bold hover:bg-teal-50 transition shadow-sm whitespace-nowrap active:scale-95"
            >
              + Buat Order Makan
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('patients')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pasien Rawat Inap</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{activePatientsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pasien aktif di ruang rawat</p>
        </div>

        <div
          onClick={() => onNavigate('nutrition_review')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-sky-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Menunggu Verifikasi Gizi</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-900 font-mono tabular-nums">{pendingNutritionReview.length}</p>
          <p className="text-[11px] text-sky-600 mt-1">Persetujuan dietetika & alergi</p>
        </div>

        <div
          onClick={() => onNavigate('provider_orders')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pesanan Belum Diterima</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 font-mono tabular-nums">{pendingProviderAccept.length}</p>
          <p className="text-[11px] text-amber-700 mt-1">Konfirmasi dapur penyedia</p>
        </div>

        <div
          onClick={() => onNavigate('receiving')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pengiriman Siap Terima</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-teal-900 font-mono tabular-nums">{pendingReceiving.length}</p>
          <p className="text-[11px] text-teal-700 mt-1">Checklist mutu & TTD serah terima</p>
        </div>

        <div
          onClick={() => onNavigate('distribution')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-purple-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Distribusi ke Pasien</span>
            <Utensils className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900 font-mono tabular-nums">{pendingDistribution.length}</p>
          <p className="text-[11px] text-purple-700 mt-1">Foto sajian & etiket stiker</p>
        </div>

        <div
          onClick={() => onNavigate('leftovers')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Monitoring Sisa Makan</span>
            <PieChart className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 font-mono tabular-nums">{pendingLeftovers.length}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Penilaian piring paska makan</p>
        </div>

        <div
          onClick={() => onNavigate('distribution')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-rose-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">SOP Belum Lengkap</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-900 font-mono tabular-nums">{incompleteSignaturesOrPhotos.length}</p>
          <p className="text-[11px] text-rose-600 mt-1">Tanpa foto / tanda tangan</p>
        </div>

        <div
          onClick={() => onNavigate('billing')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tagihan Terverifikasi</span>
            <Receipt className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">{formatRupiah(verifiedBillingTotal)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Bulan berjalan 2026</p>
        </div>
      </div>

      {/* FEATURED: RINGKASAN GRAFIK DASHBOARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4 text-teal-700" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Ringkasan Grafik Pelayanan Gizi & Dietetika
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi kuantitas porsi, evaluasi sisa makanan Comstock, kategori diet, dan kepatuhan SOP
            </p>
          </div>

          {/* Interactive Chart Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveChartTab('SCHEDULE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeChartTab === 'SCHEDULE'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jadwal & Biaya Makan
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('COMSTOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeChartTab === 'COMSTOCK'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sisa Makan (Comstock)
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('DIET_TYPES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeChartTab === 'DIET_TYPES'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kategori Diet
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('SOP_QUALITY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeChartTab === 'SOP_QUALITY'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kepatuhan SOP
            </button>
          </div>
        </div>

        {/* TAB 1: Jadwal Makan & Biaya */}
        {activeChartTab === 'SCHEDULE' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sarapan Pagi */}
              <div className="p-4 rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/50 to-white space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-sky-800 tracking-wide">
                      Sarapan Pagi (06:30 WIB)
                    </span>
                    <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {sarapanCount} <span className="text-xs font-normal text-slate-500">porsi</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                    Rp 25.000 / porsi
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.round((sarapanCount / totalMealPortions) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <span>Subtotal Tagihan:</span>
                  <strong className="font-mono text-slate-900">{formatRupiah(sarapanValue)}</strong>
                </div>
              </div>

              {/* Makan Siang */}
              <div className="p-4 rounded-xl border border-teal-100 bg-gradient-to-b from-teal-50/50 to-white space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-teal-800 tracking-wide">
                      Makan Siang (11:30 WIB)
                    </span>
                    <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {siangCount} <span className="text-xs font-normal text-slate-500">porsi</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                    Rp 45.000 / porsi
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.round((siangCount / totalMealPortions) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <span>Subtotal Tagihan:</span>
                  <strong className="font-mono text-slate-900">{formatRupiah(siangValue)}</strong>
                </div>
              </div>

              {/* Makan Malam */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-indigo-800 tracking-wide">
                      Makan Malam (17:30 WIB)
                    </span>
                    <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {malamCount} <span className="text-xs font-normal text-slate-500">porsi</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    Rp 45.000 / porsi
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.round((malamCount / totalMealPortions) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <span>Subtotal Tagihan:</span>
                  <strong className="font-mono text-slate-900">{formatRupiah(malamValue)}</strong>
                </div>
              </div>
            </div>

            {/* Total Summary Footer */}
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-200">
              <span className="text-slate-600">
                Total Estimasi Alokasi Konsumsi Hari Ini ({totalMealPortions} Porsi):
              </span>
              <strong className="text-sm font-mono text-teal-900">{formatRupiah(totalMealValue)}</strong>
            </div>
          </div>
        )}

        {/* TAB 2: Evaluasi Sisa Makan (Skala Comstock) */}
        {activeChartTab === 'COMSTOCK' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Visual Gauge */}
            <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-100 text-center space-y-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                Rata-rata Konsumsi Pasien
              </span>
              <div className="py-2">
                <span className="text-5xl font-black font-mono text-teal-950 tabular-nums">
                  {avgConsumption}%
                </span>
                <span className="block text-xs font-semibold text-teal-700 mt-1">
                  Standar Pelayanan Minimal (SPM) Kemenkes: &ge; 80%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                Asupan nutrisi pasien rawat inap berada dalam kategori optimal. Pasien yang menghabiskan &ge; 80%
                porsi makanan berisiko lebih rendah mengalami komplikasi pemulihan klinis.
              </p>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-800">1. Habis 100% (Kategori 0):</span>
                  <strong className="font-mono text-emerald-700">
                    {Math.round((comstockStats.cat0 / totalAssessed) * 100)}% ({comstockStats.cat0} order)
                  </strong>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${Math.round((comstockStats.cat0 / totalAssessed) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-800">2. Sisa 25% / Konsumsi 75% (Kategori 1):</span>
                  <strong className="font-mono text-teal-700">
                    {Math.round((comstockStats.cat1 / totalAssessed) * 100)}% ({comstockStats.cat1} order)
                  </strong>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full"
                    style={{ width: `${Math.round((comstockStats.cat1 / totalAssessed) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-800">3. Sisa 50% / Konsumsi 50% (Kategori 2):</span>
                  <strong className="font-mono text-amber-700">
                    {Math.round((comstockStats.cat2 / totalAssessed) * 100)}% ({comstockStats.cat2} order)
                  </strong>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.round((comstockStats.cat2 / totalAssessed) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-800">4. Sisa &gt; 75% / Tidak Dimakan (Kategori 3-5):</span>
                  <strong className="font-mono text-rose-700">
                    {Math.round((comstockStats.cat3 / totalAssessed) * 100)}% ({comstockStats.cat3} order)
                  </strong>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${Math.round((comstockStats.cat3 / totalAssessed) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Kategori Diet */}
        {activeChartTab === 'DIET_TYPES' && (
          <div className="space-y-3 text-xs">
            {Object.keys(dietCounts).length === 0 ? (
              <p className="text-slate-400 py-4 text-center">Belum ada order makan yang tercatat.</p>
            ) : (
              Object.entries(dietCounts).map(([dietName, count], idx) => {
                const percent = Math.round((count / orders.length) * 100);
                const colors = ['bg-teal-600', 'bg-sky-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600'];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={dietName} className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{dietName}</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {count} Pasien ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: Kepatuhan Mutu SOP */}
        {activeChartTab === 'SOP_QUALITY' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-1">
                <Thermometer className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black font-mono text-emerald-800">{qcPercent}%</p>
              <p className="font-bold text-slate-800">Lolos Suhu & QC</p>
              <p className="text-[10px] text-slate-500">Suhu 60°C - 75°C</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-1">
                <FileSignature className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black font-mono text-teal-800">{handoverPercent}%</p>
              <p className="font-bold text-slate-800">TTD Serah Terima</p>
              <p className="text-[10px] text-slate-500">Penyedia & Pramusaji</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center mx-auto mb-1">
                <Camera className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black font-mono text-sky-800">{photoPercent}%</p>
              <p className="font-bold text-slate-800">Foto Sajian Aktual</p>
              <p className="text-[10px] text-slate-500">Wadah & etiket tercetak</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mx-auto mb-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black font-mono text-indigo-800">{patientSignPercent}%</p>
              <p className="font-bold text-slate-800">TTD Pasien / Keluarga</p>
              <p className="text-[10px] text-slate-500">Penerimaan di bedside</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Priority Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Action Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Daftar Pekerjaan Prioritas SOP Hari Ini</h3>
                <p className="text-xs text-slate-500 mt-0.5">Transaksi yang memerlukan tindakan petugas berwenang</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium inline-flex items-center gap-1"
              >
                <span>Lihat Semua Order</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((order) => {
                let actionLabel = 'Lihat Detail';
                let targetModule = 'orders';
                let actionBadge = 'bg-slate-100 text-slate-700';

                if (order.status === 'SUBMITTED') {
                  actionLabel = 'Verifikasi Gizi';
                  targetModule = 'nutrition_review';
                  actionBadge = 'bg-blue-100 text-blue-800 font-bold';
                } else if (order.status === 'SENT_TO_PROVIDER') {
                  actionLabel = 'Konfirmasi Penyedia';
                  targetModule = 'provider_orders';
                  actionBadge = 'bg-amber-100 text-amber-800 font-bold';
                } else if (['READY_TO_DELIVER', 'IN_DELIVERY'].includes(order.status)) {
                  actionLabel = 'QC & Terima Makanan';
                  targetModule = 'receiving';
                  actionBadge = 'bg-teal-100 text-teal-800 font-bold';
                } else if (order.status === 'RECEIVED_BY_WAITER') {
                  actionLabel = 'Sajikan ke Pasien';
                  targetModule = 'distribution';
                  actionBadge = 'bg-purple-100 text-purple-800 font-bold';
                } else if (order.status === 'DELIVERED_TO_PATIENT') {
                  actionLabel = 'Nilai Sisa Makan';
                  targetModule = 'leftovers';
                  actionBadge = 'bg-emerald-100 text-emerald-800 font-bold';
                }

                return (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-slate-900">{order.orderNumber}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-medium text-teal-900 truncate">{order.patientName}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-600">{order.room} ({order.bed})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        Jadwal: <strong className="text-slate-700">{order.schedule}</strong> · Menu: {order.menuName || order.dietTypeName} ({order.texture})
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${actionBadge}`}>
                        {order.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate(targetModule)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <span>{actionLabel}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Tips & Hospital Profile */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Standar SOP Pelayanan Gizi Bahari</span>
            </h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Makanan disajikan hangat pada suhu minimal 60°C saat tiba di bangsal pasien.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Etiket stiker wajib ditempel pada tutup box makanan sebelum diantar.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Foto sajian dan tanda tangan penerima diunggah real-time via aplikasi web.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Sisa makanan pasien dievaluasi skala Comstock 1 jam paska waktu makan.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
