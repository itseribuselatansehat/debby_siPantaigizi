'use client';

import React, { useState } from 'react';
import { MealOrder, MealSchedule } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import { formatJakartaDate, formatRupiah } from '@/lib/date-utils';
import {
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Send,
  AlertTriangle,
  Flame,
  ChefHat,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';

interface ProviderModuleProps {
  orders: MealOrder[];
  onOrderUpdated: () => void;
}

export function ProviderModule({ orders, onOrderUpdated }: ProviderModuleProps) {
  const db = DbStore.getInstance();
  const [selectedOrder, setSelectedOrder] = useState<MealOrder | null>(null);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Shipping modal with category selection (Sarapan, Siang, Malam)
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipCategory, setShipCategory] = useState<MealSchedule>('SIANG');
  const [shippedPortions, setShippedPortions] = useState(1);
  const [courierName, setCourierName] = useState('Supriyanto (Kurir Katering)');
  const [shippingNotes, setShippingNotes] = useState('Makanan dikemas dalam wadah termal food grade hangat');

  // Filter provider orders
  const providerOrders = orders.filter((o) =>
    [
      'SENT_TO_PROVIDER',
      'PROVIDER_ACCEPTED',
      'FOOD_PREPARATION',
      'READY_TO_DELIVER',
      'IN_DELIVERY',
      'RECEIVED_BY_WAITER',
    ].includes(o.status)
  );

  const handleAcceptOrder = (orderId: string) => {
    db.providerRespondOrder(orderId, true);
    // Directly start preparation for instant kitchen workflow
    db.providerStartPreparation(orderId);
    onOrderUpdated();
  };

  const handleOpenShipModal = (order: MealOrder, category?: MealSchedule) => {
    setSelectedOrder(order);
    setShipCategory(category || (order.schedule as MealSchedule) || 'SIANG');
    setShippedPortions(order.portionCount || 1);
    setShowShipModal(true);
  };

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!courierName.trim()) {
      alert('Nama petugas kurir pengantar wajib diisi.');
      return;
    }

    const res = db.providerShipFood({
      orderId: selectedOrder.id,
      shippedPortionCount: shippedPortions,
      courierName: courierName.trim(),
      notes: `[Pengiriman ${shipCategory}] ${shippingNotes}`,
    });

    if (!res.success) {
      alert(res.message);
      return;
    }

    setShowShipModal(false);
    setSelectedOrder(null);
    onOrderUpdated();
  };

  const handleConfirmReject = () => {
    if (!selectedOrder) return;
    if (!rejectReason.trim()) {
      alert('Alasan penolakan pesanan wajib diisi!');
      return;
    }

    db.providerRespondOrder(selectedOrder.id, false, rejectReason.trim());
    setShowRejectModal(false);
    setSelectedOrder(null);
    setRejectReason('');
    onOrderUpdated();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-teal-700" />
            <span>Penyedia Katering: Dapur & Pengiriman Makanan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pesanan masuk langsung dikerjakan; kirim bertahap: Kirim Sarapan Pagi, Kirim Makan Siang, dan Kirim Makan Malam
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
          Privasi Medis: Diagnosis pasien disembunyikan
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
          <span>Daftar Pesanan Pasien yang Siap / Sedang Diproses Dapur</span>
          <span className="font-mono text-slate-500">{providerOrders.length} Pesanan Aktif</span>
        </div>

        {providerOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada pesanan aktif untuk penyedia makanan saat ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {providerOrders.map((order) => {
              const isNew = order.status === 'SENT_TO_PROVIDER';
              const isInPreparation = ['PROVIDER_ACCEPTED', 'FOOD_PREPARATION', 'READY_TO_DELIVER'].includes(order.status);
              const isInDelivery = order.status === 'IN_DELIVERY';
              const isReceived = order.status === 'RECEIVED_BY_WAITER';
              const patient = db.getPatientById(order.patientId);
              const isPatientDischarged = patient?.status === 'DISCHARGED' || order.status === 'CANCELLED';

              return (
                <div key={order.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-800">{order.orderNumber}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-900">{order.patientName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{order.room} ({order.bed})</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                      {order.status}
                    </span>
                  </div>

                  {/* Order Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Jadwal & Menu:</span>
                      <strong className="text-slate-800">{order.menuName || 'Menu Sesuai Diet'}</strong>
                      <p className="text-[11px] text-teal-800 font-medium">
                        Jadwal: {order.selectedSchedules?.join(', ') || order.schedule} ({order.texture})
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Pantangan Alergi Bahan:</span>
                      <p className="font-bold text-rose-700">
                        {order.allergies.length > 0 ? order.allergies.join(', ') : 'Nihil Alergi'}
                      </p>
                      {order.reviewNotes && (
                        <p className="text-[11px] text-teal-800 mt-0.5 italic">Catatan Gizi: {order.reviewNotes}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Porsi & Nilai Kontrak:</span>
                      <p className="font-bold text-slate-900 font-mono">
                        {order.portionCount} porsi
                      </p>
                      <p className="text-teal-800 font-semibold font-mono text-[11px]">
                        Subtotal: {formatRupiah(order.totalEstimatedPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons with 3 meal categories */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Pelayanan: {formatJakartaDate(order.serviceDate)} (Asia/Jakarta)
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {isNew && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowRejectModal(true);
                            }}
                            className="px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded font-medium transition-colors"
                          >
                            Tolak Pesanan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAcceptOrder(order.id)}
                            className="px-4 py-1.5 text-xs text-white bg-teal-700 hover:bg-teal-800 rounded font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Terima & Langsung Kerjakan Dapur</span>
                          </button>
                        </>
                      )}

                      {isInPreparation && (
                        isPatientDischarged ? (
                          <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Pasien Sudah Pulang: Pengiriman makanan dihentikan oleh Ahli Gizi.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Option to send Sarapan */}
                            <button
                              type="button"
                              onClick={() => handleOpenShipModal(order, 'SARAPAN')}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm"
                            >
                              <Sun className="w-3 h-3" />
                              <span>Kirim Sarapan Pagi</span>
                            </button>

                            {/* Option to send Siang */}
                            <button
                              type="button"
                              onClick={() => handleOpenShipModal(order, 'SIANG')}
                              className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm"
                            >
                              <Sunset className="w-3 h-3" />
                              <span>Kirim Makan Siang</span>
                            </button>

                            {/* Option to send Malam */}
                            <button
                              type="button"
                              onClick={() => handleOpenShipModal(order, 'MALAM')}
                              className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm"
                            >
                              <Moon className="w-3 h-3" />
                              <span>Kirim Makan Malam</span>
                            </button>
                          </div>
                        )
                      )}

                      {isInDelivery && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-sky-800 bg-sky-50 px-3 py-1 rounded border border-sky-200 font-medium flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Kurir Di Jalan: {order.courierName}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenShipModal(order)}
                            className="px-2.5 py-1 text-xs border border-sky-300 text-sky-700 hover:bg-sky-50 rounded"
                          >
                            + Tambah Pengiriman
                          </button>
                        </div>
                      )}

                      {isReceived && (
                        <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 font-medium flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Telah Diterima Pramusaji Puskesmas</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shipping Modal with Sarapan / Siang / Malam Category */}
      {showShipModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-700" />
                <span>Pengiriman Makanan ke Puskesmas</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowShipModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <p>No. Order: <strong className="font-mono">{selectedOrder.orderNumber}</strong></p>
              <p>Penerima: <strong>{selectedOrder.patientName}</strong> ({selectedOrder.room} {selectedOrder.bed})</p>
            </div>

            <form onSubmit={handleSubmitShipping} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Jadwal yang Dikirim *</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer text-center ${
                    shipCategory === 'SARAPAN' ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="shipCat"
                      value="SARAPAN"
                      checked={shipCategory === 'SARAPAN'}
                      onChange={() => setShipCategory('SARAPAN')}
                      className="hidden"
                    />
                    <span>Sarapan</span>
                  </label>

                  <label className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer text-center ${
                    shipCategory === 'SIANG' ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="shipCat"
                      value="SIANG"
                      checked={shipCategory === 'SIANG'}
                      onChange={() => setShipCategory('SIANG')}
                      className="hidden"
                    />
                    <span>Siang</span>
                  </label>

                  <label className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer text-center ${
                    shipCategory === 'MALAM' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="shipCat"
                      value="MALAM"
                      checked={shipCategory === 'MALAM'}
                      onChange={() => setShipCategory('MALAM')}
                      className="hidden"
                    />
                    <span>Malam</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Porsi Dikirim *</label>
                <input
                  type="number"
                  min={1}
                  max={selectedOrder.portionCount}
                  value={shippedPortions}
                  onChange={(e) => setShippedPortions(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Petugas Pengantar (Kurir) *</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="Nama kurir pengantar"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pengiriman</label>
                <textarea
                  rows={2}
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowShipModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  Kirim {shipCategory} Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl text-xs">
            <h3 className="font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Tolak Pesanan Makanan</span>
            </h3>
            <p className="text-slate-600">
              Apakah katering menolak pesanan <strong>{selectedOrder.orderNumber}</strong>?
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alasan Penolakan *</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan teknis penolakan..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
              >
                Tolak Pesanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
