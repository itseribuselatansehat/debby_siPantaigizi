'use client';

import React, { useState } from 'react';
import { MealOrder, MealSchedule, MenuItem } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import { formatJakartaDate, formatJakartaDateTime, formatRupiah } from '@/lib/date-utils';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Send,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

interface NutritionReviewModuleProps {
  orders: MealOrder[];
  onOrderUpdated: () => void;
}

export function NutritionReviewModule({ orders, onOrderUpdated }: NutritionReviewModuleProps) {
  const db = DbStore.getInstance();
  const menus = db.getMenus();
  const dietTypes = db.getDietTypes();
  const settings = db.getSettings();

  const [selectedOrder, setSelectedOrder] = useState<MealOrder | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE');
  const [notes, setNotes] = useState('');
  const [adjustedPortion, setAdjustedPortion] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Checkbox schedules state with fixed price points
  // Sarapan : 25.000, Makan Siang : 45.000, Makan Malam : 45.000
  const [scheduleChecks, setScheduleChecks] = useState<Record<MealSchedule, boolean>>({
    SARAPAN: false,
    SIANG: true,
    MALAM: true,
    SORE: false,
  });

  const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id || '');
  const [selectedDiet, setSelectedDiet] = useState<string>('Diet Rendah Garam (RG)');
  const [selectedTexture, setSelectedTexture] = useState<string>('Lunak');

  // WhatsApp Prompt State
  const [orderToShareWa, setOrderToShareWa] = useState<MealOrder | null>(null);

  const pendingOrders = orders.filter((o) => o.status === 'SUBMITTED' || o.status === 'NUTRITION_REVIEW');
  const approvedOrders = orders.filter((o) =>
    ['NUTRITION_APPROVED', 'SENT_TO_PROVIDER', 'PROVIDER_ACCEPTED', 'FOOD_PREPARATION', 'IN_DELIVERY', 'RECEIVED_BY_WAITER', 'DELIVERED_TO_PATIENT', 'COMPLETED'].includes(o.status)
  );

  const calculateCheckedTotal = () => {
    let sum = 0;
    if (scheduleChecks.SARAPAN) sum += 25000;
    if (scheduleChecks.SIANG) sum += 45000;
    if (scheduleChecks.MALAM) sum += 45000;
    return sum * adjustedPortion;
  };

  const handleOpenReview = (order: MealOrder, action: 'APPROVE' | 'REJECT' | 'RETURN') => {
    setSelectedOrder(order);
    setReviewAction(action);
    setNotes('');
    setAdjustedPortion(order.portionCount || 1);
    setScheduleChecks({
      SARAPAN: true,
      SIANG: true,
      MALAM: true,
      SORE: false,
    });
    setSelectedMenuId(menus[0]?.id || '');
    setSelectedDiet(order.dietTypeName || 'Diet Makanan Lunak');
    setSelectedTexture(order.texture || 'Lunak');
    setShowReviewModal(true);
  };

  const generateWhatsAppMessageForProvider = (order: MealOrder) => {
    const schedules = order.selectedSchedules && order.selectedSchedules.length > 0
      ? order.selectedSchedules.map((s) => (s === 'SARAPAN' ? 'Sarapan (25k)' : s === 'SIANG' ? 'Siang (45k)' : 'Malam (45k)')).join(', ')
      : order.schedule;

    return (
      `*PESANAN MAKANAN PASIEN RAWAT INAP PUSKESMAS*\n` +
      `Puskesmas Kecamatan Kepulauan Seribu Selatan\n\n` +
      `No. Order: *${order.orderNumber}*\n` +
      `Pasien: *${order.patientName}* (RM: ${order.patientMrn})\n` +
      `Kamar/Bed: *${order.room} (${order.bed})*\n` +
      `Jadwal Layanan: *${schedules}*\n` +
      `Menu Disetujui: *${order.menuName || 'Menu Sesuai Diet'}*\n` +
      `Jenis Diet & Tekstur: ${order.dietTypeName} (${order.texture})\n` +
      `Pantangan Alergi: *${order.allergies.length > 0 ? order.allergies.join(', ') : 'Nihil Alergi'}*\n` +
      `Jumlah: *${order.portionCount} porsi*\n` +
      `Total Nilai SPK: *${formatRupiah(order.totalEstimatedPrice)}*\n` +
      `Catatan Khusus Gizi: ${order.reviewNotes || order.specialClinicalNotes || 'Sajikan hangat dan bersih sesuai SOP'}\n` +
      `Verifikator: *${order.reviewedByName || 'Instalasi Gizi'}*\n\n` +
      `Mohon katering CV Berkah Bahari segera mempersiapkan dan mengirim sesuai jadwal. Terima kasih!`
    );
  };

  const handleSendWhatsAppToProvider = (order: MealOrder) => {
    const phone = settings.providerPhone || '6281809123456';
    const message = generateWhatsAppMessageForProvider(order);
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (reviewAction === 'APPROVE') {
      const selectedSchedulesList: MealSchedule[] = [];
      if (scheduleChecks.SARAPAN) selectedSchedulesList.push('SARAPAN');
      if (scheduleChecks.SIANG) selectedSchedulesList.push('SIANG');
      if (scheduleChecks.MALAM) selectedSchedulesList.push('MALAM');

      if (selectedSchedulesList.length === 0) {
        alert('Pilih minimal satu jadwal makan (Sarapan, Siang, atau Malam)!');
        return;
      }

      const res = db.reviewOrder({
        orderId: selectedOrder.id,
        decision: 'APPROVE',
        selectedSchedules: selectedSchedulesList,
        menuId: selectedMenuId,
        dietTypeName: selectedDiet,
        texture: selectedTexture,
        notes: notes.trim(),
        adjustedPortion,
      });

      if (!res.success) {
        alert(res.message);
        return;
      }

      const updated = db.getOrderById(selectedOrder.id);
      setShowReviewModal(false);
      setSelectedOrder(null);
      onOrderUpdated();

      // Show prompt to send WhatsApp to provider
      if (updated) {
        setOrderToShareWa(updated);
      }
      return;
    }

    if ((reviewAction === 'REJECT' || reviewAction === 'RETURN') && !notes.trim()) {
      alert('Alasan penolakan / pengembalian order wajib diisi!');
      return;
    }

    const res = db.reviewOrder({
      orderId: selectedOrder.id,
      decision: reviewAction,
      notes: notes.trim(),
      revisionReason: reviewAction === 'RETURN' ? notes.trim() : undefined,
    });

    if (!res.success) {
      alert(res.message);
      return;
    }

    setShowReviewModal(false);
    setSelectedOrder(null);
    onOrderUpdated();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-700" />
            <span>Persetujuan Ahli Gizi & Pemilihan Tarif Jadwal</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tentukan jadwal makan (Sarapan Rp 25.000, Siang Rp 45.000, Malam Rp 45.000) dan kirim ke WhatsApp penyedia katering
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-lg text-xs font-semibold">
            {pendingOrders.length} Order Menunggu Verifikasi
          </span>
        </div>
      </div>

      {/* Pending Orders Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex justify-between items-center">
          <span>Antrean Order Masuk dari Dokter / Perawat Ruangan</span>
          <span className="text-[11px] text-slate-500">{pendingOrders.length} antrean</span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada antrean order baru yang menunggu persetujuan saat ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingOrders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-teal-800">{order.orderNumber}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-900">{order.patientName}</span>
                    <span className="text-slate-500 font-mono">({order.patientMrn})</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{order.room} ({order.bed})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Diajukan oleh: {order.orderedByName} ({formatJakartaDate(order.serviceDate)})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Diagnosis Dokter:</span>
                    <strong className="text-slate-800">{order.medicalDiagnosis}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Alergi & Pantangan:</span>
                    <strong className={order.allergies.length > 0 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                      {order.allergies.join(', ') || 'Nihil Alergi'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Permintaan Diet Pemesan:</span>
                    <strong className="text-teal-900 block truncate">{order.dietTypeName}</strong>
                    <span className="text-[11px] text-slate-500">{order.portionCount} porsi</span>
                  </div>
                </div>

                {order.specialClinicalNotes && (
                  <div className="text-[11px] text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    <strong>Catatan Perawat:</strong> {order.specialClinicalNotes}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenReview(order, 'RETURN')}
                    className="px-3 py-1.5 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg border border-amber-300 font-medium transition-colors"
                  >
                    Kembalikan (Revisi)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenReview(order, 'REJECT')}
                    className="px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-lg border border-rose-300 font-medium transition-colors"
                  >
                    Tolak Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenReview(order, 'APPROVE')}
                    className="px-4 py-1.5 text-xs text-white bg-teal-700 hover:bg-teal-800 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Pilih Tarif Jadwal & Setujui</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review & Schedule Checkbox Modal */}
      {showReviewModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in-50 text-xs my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-teal-800 font-bold">{selectedOrder.orderNumber}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {reviewAction === 'APPROVE' && 'Persetujuan Gizi & Penentuan Tarif Jadwal Makan'}
                  {reviewAction === 'RETURN' && 'Kembalikan Order untuk Revisi Dokter/Perawat'}
                  {reviewAction === 'REJECT' && 'Tolak Order Makanan Pasien'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p>Pasien: <strong>{selectedOrder.patientName}</strong> ({selectedOrder.patientMrn}) — {selectedOrder.room} {selectedOrder.bed}</p>
              <p>Diagnosis: <strong className="text-slate-800">{selectedOrder.medicalDiagnosis}</strong></p>
              <p className="text-rose-700">Alergen: <strong>{selectedOrder.allergies.join(', ') || 'Nihil Alergi'}</strong></p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {reviewAction === 'APPROVE' && (
                <>
                  {/* Jadwal Makan Checkboxes: Sarapan (25k), Siang (45k), Malam (45k) */}
                  <div className="space-y-2 p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                    <label className="block font-bold text-teal-950 text-xs">
                      1. Pilih Jadwal Makan & Tarif Kontrak:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        scheduleChecks.SARAPAN ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-xs' : 'border-slate-200 bg-white text-slate-600'
                      }`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={scheduleChecks.SARAPAN}
                            onChange={(e) => setScheduleChecks({ ...scheduleChecks, SARAPAN: e.target.checked })}
                            className="rounded text-teal-600"
                          />
                          <span>Sarapan Pagi</span>
                        </div>
                        <span className="font-mono text-[11px] text-teal-800">Rp 25.000</span>
                      </label>

                      <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        scheduleChecks.SIANG ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-xs' : 'border-slate-200 bg-white text-slate-600'
                      }`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={scheduleChecks.SIANG}
                            onChange={(e) => setScheduleChecks({ ...scheduleChecks, SIANG: e.target.checked })}
                            className="rounded text-teal-600"
                          />
                          <span>Makan Siang</span>
                        </div>
                        <span className="font-mono text-[11px] text-teal-800">Rp 45.000</span>
                      </label>

                      <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        scheduleChecks.MALAM ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-xs' : 'border-slate-200 bg-white text-slate-600'
                      }`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={scheduleChecks.MALAM}
                            onChange={(e) => setScheduleChecks({ ...scheduleChecks, MALAM: e.target.checked })}
                            className="rounded text-teal-600"
                          />
                          <span>Makan Malam</span>
                        </div>
                        <span className="font-mono text-[11px] text-teal-800">Rp 45.000</span>
                      </label>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-teal-200/60 text-xs">
                      <span className="text-teal-900">Total Tarif per Porsi:</span>
                      <span className="font-mono font-extrabold text-teal-900 text-sm">
                        {formatRupiah(calculateCheckedTotal())}
                      </span>
                    </div>
                  </div>

                  {/* Menu & Diet Assignment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pilih Menu Katering Spesifik</label>
                      <select
                        value={selectedMenuId}
                        onChange={(e) => setSelectedMenuId(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        {menus.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.texture})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tekstur Makanan</label>
                      <select
                        value={selectedTexture}
                        onChange={(e) => setSelectedTexture(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="Biasa">Biasa</option>
                        <option value="Lunak">Lunak</option>
                        <option value="Saring">Saring</option>
                        <option value="Cair">Cair</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {reviewAction === 'APPROVE' ? 'Instruksi Khusus untuk Dapur Katering (Opsional)' : 'Alasan Keputusan *'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'APPROVE'
                      ? 'Contoh: Rendah garam, pisahkan sayur bening, sajikan hangat...'
                      : 'Contoh: Menu tidak sesuai pantangan DM, mohon perbaiki diet...'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required={reviewAction !== 'APPROVE'}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-white font-semibold shadow-sm transition-colors ${
                    reviewAction === 'APPROVE'
                      ? 'bg-teal-700 hover:bg-teal-800'
                      : reviewAction === 'RETURN'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {reviewAction === 'APPROVE' && 'Setujui & Teruskan ke Penyedia'}
                  {reviewAction === 'RETURN' && 'Kirim Permintaan Revisi'}
                  {reviewAction === 'REJECT' && 'Tolak Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share to Provider Modal */}
      {orderToShareWa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in-50 text-xs">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Order Berhasil Disetujui!</h3>
              <p className="text-slate-500">
                Order <strong className="font-mono text-teal-800">{orderToShareWa.orderNumber}</strong> telah tercatat dan siap diproses katering.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-700">
              <p>Penyedia Rekanan: <strong>{orderToShareWa.providerName || 'CV Berkah Bahari'}</strong></p>
              <p>Jadwal: <strong>{orderToShareWa.selectedSchedules?.join(', ') || orderToShareWa.schedule}</strong></p>
              <p>Total Nilai Kontrak: <strong className="font-mono text-teal-900">{formatRupiah(orderToShareWa.totalEstimatedPrice)}</strong></p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleSendWhatsAppToProvider(orderToShareWa);
                  setOrderToShareWa(null);
                }}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pesanan via WhatsApp ke Penyedia Katering</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderToShareWa(null)}
                className="w-full py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
