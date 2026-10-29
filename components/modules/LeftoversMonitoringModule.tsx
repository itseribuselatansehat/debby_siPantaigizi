'use client';

import React, { useState } from 'react';
import { MealOrder } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import { formatJakartaDate, formatJakartaDateTime } from '@/lib/date-utils';
import {
  PieChart,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  FileCheck,
  Filter,
} from 'lucide-react';

interface LeftoversMonitoringModuleProps {
  orders: MealOrder[];
  onOrderUpdated: () => void;
}

const CONSUMPTION_CATEGORIES = [
  { id: 'HABIS_100', label: 'Habis (100% Dikonsumsi)', consumed: 100, leftover: 0, color: 'bg-emerald-500' },
  { id: 'SISA_SEPEREMPAT', label: 'Sisa 1/4 (75% Dikonsumsi)', consumed: 75, leftover: 25, color: 'bg-teal-500' },
  { id: 'SISA_SETENGAH', label: 'Sisa 1/2 (50% Dikonsumsi)', consumed: 50, leftover: 50, color: 'bg-amber-500' },
  { id: 'SISA_TIGAPEREMPAT', label: 'Sisa 3/4 (25% Dikonsumsi)', consumed: 25, leftover: 75, color: 'bg-orange-500' },
  { id: 'TIDAK_DIMAKAN_0', label: 'Tidak Dimakan (0% Dikonsumsi)', consumed: 0, leftover: 100, color: 'bg-rose-500' },
  { id: 'TIDAK_DAPAT_DINILAI', label: 'Tidak Dapat Dinilai (Pemeriksaan/Tirah Baring Luar)', consumed: 0, leftover: 0, color: 'bg-slate-400' },
];

const LEFTOVER_REASONS = [
  'Nafsu makan menurun / anoreksia',
  'Mual atau muntah',
  'Tidak menyukai rasa / bumbu menu',
  'Gangguan mengunyah / menelan (disfagia)',
  'Pasien tidur / istirahat saat piring diambil',
  'Pasien mulai puasa persiapan tindakan medis',
  'Makanan tiba terlambat / sudah dingin',
  'Porsi terlalu banyak / kenyang',
  'Makanan dari luar keluarga',
  'Alasan klinis / operasional lainnya',
];

export function LeftoversMonitoringModule({ orders, onOrderUpdated }: LeftoversMonitoringModuleProps) {
  const db = DbStore.getInstance();
  const currentUser = db.getCurrentUser();

  const [selectedOrder, setSelectedOrder] = useState<MealOrder | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    'HABIS_100' | 'SISA_SEPEREMPAT' | 'SISA_SETENGAH' | 'SISA_TIGAPEREMPAT' | 'TIDAK_DIMAKAN_0' | 'TIDAK_DAPAT_DINILAI'
  >('HABIS_100');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [clinicalFollowup, setClinicalFollowup] = useState('');

  // Orders eligible for leftovers assessment (already served to patient)
  const pendingAssessmentOrders = orders.filter((o) => o.status === 'DELIVERED_TO_PATIENT');
  const assessedOrders = orders.filter(
    (o) => o.leftoverAssessment !== undefined || ['CONSUMPTION_RECORDED', 'COMPLETED'].includes(o.status)
  );

  const handleOpenAssessment = (order: MealOrder) => {
    setSelectedOrder(order);
    setSelectedCategory('HABIS_100');
    setSelectedReasons([]);
    setOtherReason('');
    setClinicalFollowup('Toleransi asupan baik.');
  };

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (selectedCategory !== 'HABIS_100' && selectedCategory !== 'TIDAK_DAPAT_DINILAI' && selectedReasons.length === 0 && !otherReason.trim()) {
      alert('Mohon pilih minimal satu alasan mengapa makanan bersisa.');
      return;
    }

    const res = db.recordLeftoverAssessment({
      orderId: selectedOrder.id,
      consumptionCategory: selectedCategory,
      reasons: selectedReasons,
      otherReasonNotes: otherReason.trim(),
      clinicalFollowupRecommendation: clinicalFollowup.trim(),
    });

    if (!res.success) {
      alert(res.message);
      return;
    }

    setSelectedOrder(null);
    onOrderUpdated();
  };

  // Calculate statistics
  const validAssessed = assessedOrders.filter(
    (o) => o.leftoverAssessment && o.leftoverAssessment.consumptionCategory !== 'TIDAK_DAPAT_DINILAI'
  );

  const averageConsumption =
    validAssessed.length > 0
      ? Math.round(
          validAssessed.reduce((acc, o) => acc + (o.leftoverAssessment?.consumptionPercentage || 0), 0) /
            validAssessed.length
        )
      : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-teal-700" />
            <span>Monitoring & Evaluasi Sisa Makanan (Skala Comstock)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan estimasi sisa makanan paska makan pasien rawat inap untuk evaluasi mutu dietetika Puskesmas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Rata-rata Konsumsi:</span>
            <span className="font-mono font-extrabold text-teal-800 text-base">{averageConsumption}%</span>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold">
            {pendingAssessmentOrders.length} Menunggu Penilaian
          </span>
        </div>
      </div>

      {/* Orders Ready for Leftover Assessment */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800">
          Antrean Makanan yang Telah Disajikan & Siap Dinilai Piringnya
        </div>

        {pendingAssessmentOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Tidak ada piring makanan yang menunggu penilaian sisa saat ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingAssessmentOrders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800">{order.orderNumber}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-900">{order.patientName}</span>
                    <span className="text-slate-500 font-mono">({order.patientMrn})</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700">{order.room} ({order.bed})</span>
                  </div>
                  <p className="text-slate-600">
                    Menu: <strong>{order.menuName}</strong> · Jadwal: <strong>{order.schedule}</strong> ({order.texture})
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Disajikan pada: {formatJakartaDateTime(order.deliveredToPatientAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAssessment(order)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
                >
                  <PieChart className="w-4 h-4" />
                  <span>Nilai Sisa Makanan Pasien</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assessed Orders Recap Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
          <span>Riwayat Penilaian Sisa Makanan Rawat Inap</span>
          <span className="text-[11px] text-slate-500">{assessedOrders.length} Penilaian Selesai</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium bg-slate-50/50">
                <th className="py-2.5 px-3">No. Order & Pasien</th>
                <th className="py-2.5 px-3">Ruangan</th>
                <th className="py-2.5 px-3">Menu & Jadwal</th>
                <th className="py-2.5 px-3">Kategori Comstock</th>
                <th className="py-2.5 px-3">% Konsumsi / Sisa</th>
                <th className="py-2.5 px-3">Alasan Sisa</th>
                <th className="py-2.5 px-3">Petugas Penilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada riwayat penilaian sisa makanan.
                  </td>
                </tr>
              ) : (
                assessedOrders.map((order) => {
                  const assess = order.leftoverAssessment;
                  if (!assess) return null;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <strong className="text-slate-900 block">{order.patientName}</strong>
                        <span className="font-mono text-[11px] text-teal-800">{order.orderNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {order.room} ({order.bed})
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-800 block truncate max-w-[140px]">{order.menuName}</span>
                        <span className="text-[10px] text-slate-500">{order.schedule}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                          {assess.consumptionCategory}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        <span className="text-emerald-700">{assess.consumptionPercentage}% Makan</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-rose-600">{assess.leftoverPercentage}% Sisa</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[150px] truncate" title={assess.reasons.join(', ')}>
                        {assess.reasons.join(', ') || assess.otherReasonNotes || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {assess.assessedByName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Comstock Plate Assessment Form */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-6 animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-teal-800 font-bold">{selectedOrder.orderNumber}</span>
                <h3 className="text-base font-bold text-slate-900">
                  Formulir Penilaian Sisa Makanan Pasien
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Patient Header */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-700">
              <p>Pasien: <strong>{selectedOrder.patientName}</strong> ({selectedOrder.patientMrn})</p>
              <p>Ruang: <strong>{selectedOrder.room} {selectedOrder.bed}</strong> · Jadwal: <strong>{selectedOrder.schedule}</strong></p>
              <p>Menu: <strong>{selectedOrder.menuName}</strong> ({selectedOrder.portionCount} porsi {selectedOrder.texture})</p>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4">
              {/* Comstock Visual Categories */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  1. Pilih Kategori Estimasi Sisa Piring (Skala Visual Comstock):
                </label>
                <div className="space-y-1.5">
                  {CONSUMPTION_CATEGORIES.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedCategory === cat.id
                          ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-bold shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="comstock"
                          value={cat.id}
                          checked={selectedCategory === cat.id}
                          onChange={() => setSelectedCategory(cat.id as any)}
                        />
                        <span>{cat.label}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {cat.consumed}% Asupan
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reasons if leftover exists */}
              {selectedCategory !== 'HABIS_100' && selectedCategory !== 'TIDAK_DAPAT_DINILAI' && (
                <div className="space-y-2 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <label className="block font-bold text-amber-900">
                    2. Alasan Makanan Tidak Habis (Pilih semua yang berlaku) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {LEFTOVER_REASONS.map((reason) => (
                      <label key={reason} className="flex items-center gap-2 text-slate-800 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedReasons.includes(reason)}
                          onChange={() => handleToggleReason(reason)}
                          className="rounded text-amber-600"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Alasan spesifik lainnya..."
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded text-xs mt-2"
                  />
                </div>
              )}

              {/* Follow-up / Clinical Recommendation */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Evaluasi / Rekomendasi Diet Lanjutan
                </label>
                <textarea
                  rows={2}
                  value={clinicalFollowup}
                  onChange={(e) => setClinicalFollowup(e.target.value)}
                  placeholder="Contoh: Perlu modifikasi variasi bumbu, pertimbangkan porsi kecil sering (selingan ditambah)..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">Penilai: {currentUser.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-sm transition-colors"
                  >
                    Simpan Penilaian Sisa Makanan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
