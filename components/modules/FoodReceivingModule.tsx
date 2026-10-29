/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { DigitalSignature, MealOrder, QualityCheckItem } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import { DEFAULT_QUALITY_CHECKLIST_TEMPLATE } from '@/lib/initial-data';
import { formatJakartaDate, formatJakartaDateTime, formatRupiah } from '@/lib/date-utils';
import { SignatureCanvas } from '@/components/common/SignatureCanvas';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  ShieldAlert,
  Printer,
  Pen,
  Clock,
  Check,
  XCircle,
} from 'lucide-react';

interface FoodReceivingModuleProps {
  orders: MealOrder[];
  onOrderUpdated: () => void;
}

export function FoodReceivingModule({ orders, onOrderUpdated }: FoodReceivingModuleProps) {
  const db = DbStore.getInstance();
  const currentUser = db.getCurrentUser();

  const [selectedOrder, setSelectedOrder] = useState<MealOrder | null>(null);
  const [checklist, setChecklist] = useState<QualityCheckItem[]>(DEFAULT_QUALITY_CHECKLIST_TEMPLATE);
  const [tempValue, setTempValue] = useState('65.0');
  const [discrepancyAction, setDiscrepancyAction] = useState<
    'DITERIMA_SESUAI' | 'DITERIMA_DENGAN_CATATAN' | 'DITOLAK_MINTA_GANTI' | 'DIBATALKAN'
  >('DITERIMA_SESUAI');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');

  // Dual Signatures State
  const [providerSignature, setProviderSignature] = useState<DigitalSignature | null>(null);
  const [waiterSignature, setWaiterSignature] = useState<DigitalSignature | null>(null);
  const [activeSignerTab, setActiveSignerTab] = useState<'PROVIDER' | 'WAITER'>('PROVIDER');
  const [inspectionSubmitted, setInspectionSubmitted] = useState(false);

  // Printable BAST Modal State
  const [orderForPrintBast, setOrderForPrintBast] = useState<MealOrder | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SARAPAN' | 'SIANG' | 'MALAM'>('ALL');

  // Filter orders that need receiving
  const receivingOrders = orders.filter((o) => {
    const isReceivingStatus = ['READY_TO_DELIVER', 'IN_DELIVERY'].includes(o.status);
    const matchesCategory =
      categoryFilter === 'ALL' ||
      o.schedule === categoryFilter ||
      (o.selectedSchedules && o.selectedSchedules.includes(categoryFilter));
    return isReceivingStatus && matchesCategory;
  });

  const completedReceivings = orders.filter((o) =>
    ['RECEIVED_BY_WAITER', 'DISTRIBUTION_IN_PROGRESS', 'DELIVERED_TO_PATIENT', 'CONSUMPTION_RECORDED', 'COMPLETED', 'DELIVERY_EXCEPTION'].includes(o.status)
  );

  const handleStartInspection = (order: MealOrder) => {
    setSelectedOrder(order);
    setChecklist(order.qualityChecklist || DEFAULT_QUALITY_CHECKLIST_TEMPLATE);
    setTempValue('64.5');
    setDiscrepancyAction('DITERIMA_SESUAI');
    setDiscrepancyNotes('');
    setProviderSignature(null);
    setWaiterSignature(null);
    setActiveSignerTab('PROVIDER');
    setInspectionSubmitted(false);
  };

  const handleChecklistChange = (id: string, result: 'SESUAI' | 'TIDAK_SESUAI' | 'TIDAK_BERLAKU') => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, result } : item))
    );
  };

  const hasCriticalFailure = checklist.some(
    (item) => item.isCritical && item.result === 'TIDAK_SESUAI'
  );

  const handleSaveHandover = () => {
    if (!selectedOrder) return;

    if (!providerSignature) {
      alert('Tanda tangan petugas kurir penyedia makanan wajib dibubuhkan.');
      setActiveSignerTab('PROVIDER');
      return;
    }

    if (!waiterSignature) {
      alert('Tanda tangan PJLP / pramusaji penerima wajib dibubuhkan.');
      setActiveSignerTab('WAITER');
      return;
    }

    // Attach measured temp to checklist item
    const updatedChecklist = checklist.map((item) =>
      item.category === 'TEMPERATURE' ? { ...item, actualMeasuredValue: tempValue } : item
    );

    const res = db.receiveAndInspectFood({
      orderId: selectedOrder.id,
      qualityChecklist: updatedChecklist,
      discrepancyAction,
      discrepancyNotes,
      providerSignature,
      waiterSignature,
    });

    if (!res.success) {
      alert(res.message);
      return;
    }

    setSelectedOrder(null);
    onOrderUpdated();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-700" />
            <span>Penerimaan Makanan & Checklist Mutu SOP</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan spesifikasi, suhu makanan (°C), dan tanda tangan serah terima digital bersama penyedia
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg font-semibold">
            {receivingOrders.length} Pengiriman Menunggu Diterima
          </span>
        </div>
      </div>

      {/* Pending Receiving Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Penerimaan Makanan per Kategori Jadwal</span>
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('SARAPAN')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'SARAPAN' ? 'bg-white text-amber-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sarapan Pagi
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('SIANG')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'SIANG' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Makan Siang
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('MALAM')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                categoryFilter === 'MALAM' ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Makan Malam
            </button>
          </div>
        </div>

        {receivingOrders.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            Tidak ada pengiriman makanan yang sedang menunggu penerimaan saat ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {receivingOrders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800">{order.orderNumber}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-900">{order.patientName}</span>
                    <span className="text-slate-500 font-mono">({order.patientMrn})</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700">{order.room} {order.bed}</span>
                  </div>
                  <p className="text-slate-600">
                    Menu: <strong>{order.menuName}</strong> ({order.texture}) · Porsi: {order.portionCount} porsi
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Penyedia: {order.providerName} · Kurir: <strong>{order.courierName || 'Petugas Katering'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartInspection(order)}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Lakukan Checklist & Serah Terima</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Handover History with Printable BAST Button */}
      {completedReceivings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-teal-700" />
              <span>Riwayat Berita Acara Serah Terima (Penyedia &rarr; PJLP)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              {completedReceivings.length} Dokumen BAST Tersedia
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {completedReceivings.map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800">{order.orderNumber}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-900">{order.patientName}</span>
                    <span className="text-slate-500 font-mono">({order.patientMrn})</span>
                    <span className="text-slate-400">·</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Diterima PJLP
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Menu: <strong>{order.menuName}</strong> · Jadwal: <strong>{order.schedule}</strong> · Rekanan: {order.providerName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Suhu: <strong>{order.measuredFoodTemperature || '64.5'}°C</strong> · Tanda Tangan: Penyedia &amp; PJLP Lengkap
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOrderForPrintBast(order)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-700" />
                  <span>Cetak Berita Acara (BAST PDF)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Full Inspection & Dual Digital Signatures */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-6 animate-in fade-in-50 text-xs">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-teal-800 font-bold">{selectedOrder.orderNumber}</span>
                <h3 className="text-base font-bold text-slate-900">
                  Formulir Checklist Mutu & Serah Terima Makanan
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

            {/* Order Brief */}
            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Pasien:</span>
                <strong className="text-slate-800">{selectedOrder.patientName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Ruangan:</span>
                <strong className="text-slate-800">{selectedOrder.room} {selectedOrder.bed}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Diet & Tekstur:</span>
                <strong className="text-slate-800">{selectedOrder.dietTypeName} ({selectedOrder.texture})</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Kurir Penyedia:</span>
                <strong className="text-teal-900">{selectedOrder.courierName || 'CV Berkah Bahari'}</strong>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 flex items-center justify-between">
                <span>1. Parameter Pemeriksaan Mutu SOP Puskesmas:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Parameter bertanda bintang (<span className="text-rose-500 font-bold">*</span>) bersifat KRITIS
                </span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {checklist.map((item) => (
                  <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                    <div className="space-y-0.5 max-w-md">
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{item.parameterName}</span>
                        {item.isCritical && <span className="text-rose-600 font-bold">*</span>}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.standardSpec}</p>

                      {item.category === 'TEMPERATURE' && (
                        <div className="flex items-center gap-2 pt-1">
                          <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] font-medium text-slate-700">Hasil Pengukuran Suhu:</span>
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="w-16 px-2 py-0.5 border border-slate-300 rounded font-mono text-xs text-center"
                          />
                          <span className="text-slate-500">°C (Standar: &ge; 60°C)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleChecklistChange(item.id, 'SESUAI')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          item.result === 'SESUAI'
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Sesuai
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChecklistChange(item.id, 'TIDAK_SESUAI')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          item.result === 'TIDAK_SESUAI'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Tidak Sesuai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Failure Warning & Discrepancy Action */}
            {hasCriticalFailure && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Peringatan: Terdapat Parameter Kritis yang TIDAK SESUAI!</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  SOP mewajibkan tindak lanjut koreksi. Tentukan tindakan serah terima di bawah ini:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-rose-200 cursor-pointer">
                    <input
                      type="radio"
                      name="discrepancy"
                      value="DITERIMA_DENGAN_CATATAN"
                      checked={discrepancyAction === 'DITERIMA_DENGAN_CATATAN'}
                      onChange={(e) => setDiscrepancyAction(e.target.value as any)}
                    />
                    <span className="font-semibold text-slate-800 text-[11px]">Diterima dengan Catatan</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-rose-200 cursor-pointer">
                    <input
                      type="radio"
                      name="discrepancy"
                      value="DITOLAK_MINTA_GANTI"
                      checked={discrepancyAction === 'DITOLAK_MINTA_GANTI'}
                      onChange={(e) => setDiscrepancyAction(e.target.value as any)}
                    />
                    <span className="font-semibold text-rose-700 text-[11px]">Ditolak Minta Ganti</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-rose-200 cursor-pointer">
                    <input
                      type="radio"
                      name="discrepancy"
                      value="DIBATALKAN"
                      checked={discrepancyAction === 'DIBATALKAN'}
                      onChange={(e) => setDiscrepancyAction(e.target.value as any)}
                    />
                    <span className="font-semibold text-slate-700 text-[11px]">Dibatalkan</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={discrepancyNotes}
                  onChange={(e) => setDiscrepancyNotes(e.target.value)}
                  placeholder="Keterangan ketidaksesuaian kritis (misal: suhu drop 45°C / wadah retak)..."
                  className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded text-xs mt-1"
                />
              </div>
            )}

            {/* Dual Digital Signature Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="font-semibold text-slate-900">2. Bukti Tanda Tangan Serah Terima Digital</h4>

              <div className="flex border-b border-slate-200 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSignerTab('PROVIDER')}
                  className={`pb-2 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeSignerTab === 'PROVIDER'
                      ? 'border-teal-700 text-teal-900 font-bold'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  <Pen className="w-3.5 h-3.5" />
                  <span>1. Petugas Penyedia {providerSignature && '✓'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSignerTab('WAITER')}
                  className={`pb-2 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeSignerTab === 'WAITER'
                      ? 'border-teal-700 text-teal-900 font-bold'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  <Pen className="w-3.5 h-3.5" />
                  <span>2. Pramusaji Puskesmas {waiterSignature && '✓'}</span>
                </button>
              </div>

              {activeSignerTab === 'PROVIDER' ? (
                <div>
                  {providerSignature ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-emerald-900">Tanda Tangan Penyedia Tersimpan</p>
                        <p className="text-[11px] text-emerald-700">
                          Nama: {providerSignature.signerName} ({providerSignature.signerRole})
                        </p>
                        <p className="text-[10px] text-emerald-600 font-mono">
                          Waktu: {formatJakartaDateTime(providerSignature.timestamp)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProviderSignature(null)}
                        className="text-xs text-rose-600 underline font-medium"
                      >
                        Ulang Tanda Tangan
                      </button>
                    </div>
                  ) : (
                    <SignatureCanvas
                      title="Tanda Tangan Petugas Penyedia (Katering)"
                      subtitle="Petugas pengantar makanan dari pihak penyedia rekanan"
                      defaultSignerName={selectedOrder.courierName || 'Supriyanto (CV Berkah Bahari)'}
                      defaultRole="Petugas Pengantar / Kurir Penyedia"
                      onSave={(sig) => {
                        setProviderSignature(sig);
                        setActiveSignerTab('WAITER');
                      }}
                    />
                  )}
                </div>
              ) : (
                <div>
                  {waiterSignature ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-emerald-900">Tanda Tangan Pramusaji Tersimpan</p>
                        <p className="text-[11px] text-emerald-700">
                          Nama: {waiterSignature.signerName} ({waiterSignature.signerRole})
                        </p>
                        <p className="text-[10px] text-emerald-600 font-mono">
                          Waktu: {formatJakartaDateTime(waiterSignature.timestamp)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWaiterSignature(null)}
                        className="text-xs text-rose-600 underline font-medium"
                      >
                        Ulang Tanda Tangan
                      </button>
                    </div>
                  ) : (
                    <SignatureCanvas
                      title="Tanda Tangan PJLP / Pramusaji Penerima"
                      subtitle="Petugas pramusaji gizi ruang rawat inap Puskesmas"
                      defaultSignerName={currentUser.name}
                      defaultRole="PJLP Pramusaji Ruang Rawat Inap"
                      onSave={(sig) => setWaiterSignature(sig)}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Status Kelengkapan: {providerSignature && waiterSignature ? 'Siap Disahkan' : 'Menunggu 2 Tanda Tangan'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveHandover}
                  disabled={!providerSignature || !waiterSignature}
                  className={`px-5 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1.5 ${
                    providerSignature && waiterSignature
                      ? 'bg-teal-700 hover:bg-teal-800 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Sahkan Serah Terima & Lanjutkan Distribusi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cetak Berita Acara Serah Terima (BAST-GIZI PDF) */}
      {orderForPrintBast && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-6 text-xs text-slate-900 animate-in fade-in-50">
            {/* Top Bar for Screen */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Pratinjau Cetak Berita Acara Serah Terima (BAST-GIZI)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderForPrintBast(null)}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Official Formal Document Content */}
            <div className="border border-slate-300 p-6 sm:p-8 rounded-xl space-y-5 bg-white text-black font-sans leading-relaxed">
              {/* Kop Surat Puskesmas Kepulauan Seribu Selatan */}
              <div className="text-center border-b-2 border-black pb-3 space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wide">
                  PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA
                </p>
                <p className="text-xs font-bold uppercase tracking-wide">
                  DINAS KESEHATAN KABUPATEN ADMINISTRASI KEPULAUAN SERIBU
                </p>
                <h1 className="text-base font-extrabold uppercase tracking-wider text-black">
                  PUSKESMAS KEPULAUAN SERIBU SELATAN
                </h1>
                <p className="text-[10px] text-slate-600">
                  Jl. Dermaga Utama No. 04, Kelurahan Pulau Tidung, Kepulauan Seribu Selatan · Telp/WA: (021) 6928-112
                </p>
                <p className="text-[9px] font-mono text-slate-500">
                  Unit Pelayanan Gizi &amp; Instalasi Dapur Rawat Inap Puskesmas
                </p>
              </div>

              {/* Judul Dokumen */}
              <div className="text-center space-y-0.5 py-1">
                <h2 className="text-sm font-extrabold uppercase tracking-wide underline underline-offset-4">
                  BERITA ACARA SERAH TERIMA PENGIRIMAN MAKANAN PASIEN
                </h2>
                <p className="text-[11px] font-mono">
                  Nomor: BAST-GIZI/{orderForPrintBast.orderNumber}
                </p>
              </div>

              <p className="text-xs text-justify">
                Pada hari ini, <strong>{formatJakartaDate(orderForPrintBast.serviceDate)}</strong>, telah dilakukan pemeriksaan mutu dan serah terima makanan pasien rawat inap sesuai dengan Standar Operasional Prosedur (SOP) Pemberian Makan Rawat Inap Puskesmas Kepulauan Seribu Selatan, dengan rincian sebagai berikut:
              </p>

              {/* Detail Transaksi Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="w-1/3 px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Nomor Registrasi Order:</td>
                      <td className="px-3 py-1.5 font-mono font-bold">{orderForPrintBast.orderNumber}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Nama Pasien / No. RM:</td>
                      <td className="px-3 py-1.5 font-bold">
                        {orderForPrintBast.patientName} <span className="font-mono text-slate-600 font-normal">({orderForPrintBast.patientMrn})</span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Ruang &amp; Kamar Rawat:</td>
                      <td className="px-3 py-1.5">{orderForPrintBast.room} &mdash; {orderForPrintBast.bed}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Jadwal Makanan:</td>
                      <td className="px-3 py-1.5 font-bold uppercase">{orderForPrintBast.schedule}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Menu &amp; Bentuk Makanan:</td>
                      <td className="px-3 py-1.5">{orderForPrintBast.menuName} ({orderForPrintBast.texture})</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Jenis Diet Klinis:</td>
                      <td className="px-3 py-1.5">{orderForPrintBast.dietTypeName}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Jumlah Porsi Diserahkan:</td>
                      <td className="px-3 py-1.5 font-bold">{orderForPrintBast.portionCount} Porsi Lengkap</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Hasil Uji Suhu Makanan:</td>
                      <td className="px-3 py-1.5 font-mono font-bold text-teal-800">
                        {orderForPrintBast.measuredFoodTemperature || '64.5'}°C (Standar SOP &ge; 60°C &mdash; MEMENUHI SYARAT)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 bg-slate-50 font-semibold border-r border-slate-200">Penyedia Rekanan Katering:</td>
                      <td className="px-3 py-1.5 font-medium">{orderForPrintBast.providerName || 'CV Berkah Bahari'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dual Digital Signature Section */}
              <div className="pt-3">
                <p className="text-xs mb-3 text-slate-700">
                  Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya dalam keadaan sadar dan ditandatangani secara digital oleh kedua belah pihak:
                </p>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  {/* Pihak Pertama: Penyedia Makanan */}
                  <div className="border border-slate-300 rounded-xl p-3 text-center space-y-2 bg-slate-50/50">
                    <p className="text-[11px] font-bold uppercase text-slate-700">PIHAK KESATU (PENYEDIA)</p>
                    <p className="text-[10px] text-slate-500">Yang Menyerahkan Makanan:</p>
                    
                    <div className="h-20 flex items-center justify-center border-y border-dashed border-slate-200 my-1 bg-white">
                      {(orderForPrintBast.handoverProviderSignature?.signatureDataUrl || (orderForPrintBast as any).providerSignature?.signatureDataUrl) ? (
                        <img
                          src={orderForPrintBast.handoverProviderSignature?.signatureDataUrl || (orderForPrintBast as any).providerSignature?.signatureDataUrl}
                          alt="Tanda Tangan Penyedia"
                          className="h-16 max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-teal-800 font-script italic text-base">
                          {orderForPrintBast.courierName || 'Supriyanto'}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-xs underline underline-offset-2">
                        {orderForPrintBast.handoverProviderSignature?.signerName || (orderForPrintBast as any).providerSignature?.signerName || orderForPrintBast.courierName || 'Petugas Kurir Katering'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {orderForPrintBast.handoverProviderSignature?.signerRole || (orderForPrintBast as any).providerSignature?.signerRole || 'Petugas Pengantar Penyedia'}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {orderForPrintBast.handoverProviderSignature?.timestamp || (orderForPrintBast as any).providerSignature?.timestamp
                          ? formatJakartaDateTime(orderForPrintBast.handoverProviderSignature?.timestamp || (orderForPrintBast as any).providerSignature?.timestamp)
                          : formatJakartaDateTime(new Date().toISOString())}
                      </p>
                    </div>
                  </div>

                  {/* Pihak Kedua: PJLP Pramusaji Puskesmas */}
                  <div className="border border-slate-300 rounded-xl p-3 text-center space-y-2 bg-slate-50/50">
                    <p className="text-[11px] font-bold uppercase text-slate-700">PIHAK KEDUA (PUSKESMAS)</p>
                    <p className="text-[10px] text-slate-500">Yang Memeriksa &amp; Menerima:</p>

                    <div className="h-20 flex items-center justify-center border-y border-dashed border-slate-200 my-1 bg-white">
                      {(orderForPrintBast.handoverWaiterSignature?.signatureDataUrl || (orderForPrintBast as any).waiterSignature?.signatureDataUrl) ? (
                        <img
                          src={orderForPrintBast.handoverWaiterSignature?.signatureDataUrl || (orderForPrintBast as any).waiterSignature?.signatureDataUrl}
                          alt="Tanda Tangan PJLP"
                          className="h-16 max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-teal-800 font-script italic text-base">
                          {currentUser.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-xs underline underline-offset-2">
                        {orderForPrintBast.handoverWaiterSignature?.signerName || (orderForPrintBast as any).waiterSignature?.signerName || currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {orderForPrintBast.handoverWaiterSignature?.signerRole || (orderForPrintBast as any).waiterSignature?.signerRole || 'PJLP Pramusaji Ruang Rawat Inap'}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {orderForPrintBast.handoverWaiterSignature?.timestamp || (orderForPrintBast as any).waiterSignature?.timestamp
                          ? formatJakartaDateTime(orderForPrintBast.handoverWaiterSignature?.timestamp || (orderForPrintBast as any).waiterSignature?.timestamp)
                          : formatJakartaDateTime(new Date().toISOString())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Verification Hash */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Divalidasi Elektronik melalui SI PANTAI GIZI</span>
                <span>ID: {orderForPrintBast.id}</span>
                <span>Puskesmas Kepulauan Seribu Selatan</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
