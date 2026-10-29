'use client';

import React, { useState } from 'react';
import { MealOrder, Patient, MenuItem } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import {
  calculateAgeAtDate,
  formatJakartaDate,
  formatJakartaDateTime,
  formatRupiah,
  getTodayISODateJakarta,
} from '@/lib/date-utils';
import { SopProgressBar } from '@/components/common/SopProgressBar';
import {
  Utensils,
  Plus,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  Bed,
  Share2,
  Send,
  ExternalLink,
} from 'lucide-react';

interface OrderMealModuleProps {
  orders: MealOrder[];
  patients: Patient[];
  menus: MenuItem[];
  onOrderUpdated: () => void;
}

export function OrderMealModule({
  orders,
  patients,
  menus,
  onOrderUpdated,
}: OrderMealModuleProps) {
  const db = DbStore.getInstance();
  const currentUser = db.getCurrentUser();
  const settings = db.getSettings();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MealOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form State for Doctor/Nurse (NO schedule dropdown, NO menu selector)
  const [serviceDate, setServiceDate] = useState<string>(getTodayISODateJakarta());
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [portionCount, setPortionCount] = useState<number>(1);
  const [dietaryInstruction, setDietaryInstruction] = useState<string>('Diet Makanan Lunak');
  const [specialClinicalNotes, setSpecialClinicalNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // WhatsApp Success Notification modal
  const [createdOrderForWa, setCreatedOrderForWa] = useState<MealOrder | null>(null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const calculatedAge = selectedPatient
    ? calculateAgeAtDate(selectedPatient.birthDate, serviceDate)
    : { years: 0, months: 0, displayText: '-' };

  const generateWhatsAppMessage = (order: MealOrder) => {
    return (
      `*ORDER MAKAN RAWAT INAP PUSKESMAS KEPULAUAN SERIBU*\n\n` +
      `No. Order: *${order.orderNumber}*\n` +
      `Pasien: *${order.patientName}* (RM: ${order.patientMrn})\n` +
      `Ruang/Bed: *${order.room} (${order.bed})*\n` +
      `Diagnosis: ${order.medicalDiagnosis}\n` +
      `Alergi/Pantangan: ${order.allergies.length > 0 ? order.allergies.join(', ') : 'Nihil Alergi'}\n` +
      `Instruksi Diet: *${order.dietTypeName}*\n` +
      `Jumlah Porsi: ${order.portionCount} porsi\n` +
      `Catatan Klinis: ${order.specialClinicalNotes || '-'}\n` +
      `Pemesan: ${order.orderedByName} (${order.orderedByRole})\n` +
      `Waktu Order: ${formatJakartaDateTime(order.createdAt)}\n\n` +
      `Mohon diverifikasi di aplikasi SI PANTAI GIZI. Terima kasih!`
    );
  };

  const handleSendViaWhatsApp = (order: MealOrder) => {
    const phone = settings.nutritionistPhone || '6281287654321';
    const message = generateWhatsAppMessage(order);
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedPatientId) {
      setFormError('Silakan pilih pasien rawat inap.');
      return;
    }
    if (portionCount < 1) {
      setFormError('Jumlah porsi minimal 1.');
      return;
    }

    const res = db.createOrder({
      serviceDate,
      patientId: selectedPatientId,
      portionCount,
      dietaryNotes: dietaryInstruction.trim(),
      specialClinicalNotes: specialClinicalNotes.trim(),
    });

    if (!res.success || !res.order) {
      setFormError(res.message || 'Gagal membuat order.');
      return;
    }

    const newOrder = res.order;
    setShowCreateModal(false);
    setSpecialClinicalNotes('');
    onOrderUpdated();

    // Trigger WhatsApp notification prompt
    setCreatedOrderForWa(newOrder);
  };

  const handleCancelOrder = () => {
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      alert('Alasan pembatalan wajib diisi.');
      return;
    }

    const res = db.cancelOrder(selectedOrder.id, cancelReason.trim());
    if (!res.success) {
      alert(res.message);
      return;
    }

    setShowCancelModal(false);
    setCancelReason('');
    setSelectedOrder(null);
    onOrderUpdated();
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patientMrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.room.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-teal-700" />
            <span>Order Makan Pasien Rawat Inap</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Form ringkas dokter & perawat: pilih pasien, input instruksi diet & catatan klinis, kirim via WhatsApp ke petugas gizi
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError('');
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Order Makan Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Order, No. RM, Nama Pasien, atau Ruangan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white w-full sm:w-auto"
        >
          <option value="ALL">Semua Status Order</option>
          <option value="SUBMITTED">Diajukan (Review Gizi)</option>
          <option value="SENT_TO_PROVIDER">Diteruskan ke Penyedia</option>
          <option value="FOOD_PREPARATION">Sedang Diolah Dapur</option>
          <option value="IN_DELIVERY">Sedang Dikirim</option>
          <option value="RECEIVED_BY_WAITER">Diterima Puskesmas</option>
          <option value="DELIVERED_TO_PATIENT">Tersaji ke Pasien</option>
          <option value="COMPLETED">Selesai</option>
          <option value="RETURNED_FOR_REVISION">Perlu Revisi</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">No. Order</th>
                <th className="py-2.5 px-3">Pasien & Rekam Medis</th>
                <th className="py-2.5 px-3">Ruang / Bed</th>
                <th className="py-2.5 px-3">Instruksi Diet / Klinis</th>
                <th className="py-2.5 px-3">Porsi</th>
                <th className="py-2.5 px-3">Pemesan</th>
                <th className="py-2.5 px-3">Status SOP</th>
                <th className="py-2.5 px-3 text-right">Aksi & WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada order makan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono">
                      <span className="font-bold text-slate-900 block">{order.orderNumber}</span>
                      <span className="text-[10px] text-slate-400">{formatJakartaDate(order.serviceDate)}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900 block">{order.patientName}</span>
                      <span className="text-[11px] text-teal-800 font-mono font-medium">{order.patientMrn}</span>
                      <span className="text-[10px] text-slate-500 block">Usia: {order.patientAgeYears} thn</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-800 block">{order.room}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{order.bed}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-800 block truncate max-w-[170px]" title={order.dietTypeName}>
                        {order.dietTypeName}
                      </span>
                      {order.allergies && order.allergies.length > 0 && (
                        <span className="text-[10px] text-rose-600 font-medium block">
                          Alergi: {order.allergies.join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {order.portionCount} porsi
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-800 block truncate max-w-[120px]">{order.orderedByName}</span>
                      <span className="text-[10px] text-slate-400">{order.orderedByRole}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 inline-block">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendViaWhatsApp(order)}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors inline-flex items-center gap-1"
                          title="Kirim detail order ke WhatsApp Petugas Gizi"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>WA Gizi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-2 py-1 text-[11px] font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded border border-teal-200 transition-colors"
                        >
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Meal Order Form (Simple Dokter & Perawat) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Form Order Makan Rawat Inap (Dokter / Perawat)</h3>
                <p className="text-[11px] text-slate-500">Pilih pasien dan isi catatan klinis/diet; menu dan tarif akan ditentukan oleh ahli gizi</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Tanggal Pelayanan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pelayanan Makan *</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-mono text-xs"
                  required
                />
              </div>

              {/* Patient Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Pasien Rawat Inap *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) — {p.room} {p.bed} | Dx: {p.clinicalDiagnosis}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Detail Summary Box */}
              {selectedPatient && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-900">{selectedPatient.name}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-600 font-mono">{selectedPatient.mrn}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-600">Usia: {calculatedAge.displayText}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-medium text-[11px]">
                      {selectedPatient.room} ({selectedPatient.bed})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400">Diagnosis Medis:</span>
                      <p className="font-medium text-slate-800">{selectedPatient.clinicalDiagnosis}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Alergi & Pantangan:</span>
                      <p className="font-semibold text-rose-700">
                        {selectedPatient.foodAllergies.length > 0 ? selectedPatient.foodAllergies.join(', ') : 'Tidak ada alergi'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instruksi Diet & Porsi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Instruksi Diet Pasien (Permintaan Dokter / Perawat) *
                  </label>
                  <input
                    type="text"
                    value={dietaryInstruction}
                    onChange={(e) => setDietaryInstruction(e.target.value)}
                    placeholder="Contoh: Diet Makanan Lunak, Rendah Garam, DM 1700 kkal..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Porsi *</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={portionCount}
                    onChange={(e) => setPortionCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    required
                  />
                </div>
              </div>

              {/* Special Clinical Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Klinis Dokter / Perawat (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={specialClinicalNotes}
                  onChange={(e) => setSpecialClinicalNotes(e.target.value)}
                  placeholder="Contoh: Pasien mual muntah berkurang, sajikan hangat, hindari makanan bergas..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Pemesan Info */}
              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-center justify-between">
                <span>Pemesan: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
                <span>Waktu Server: <strong>WIB (Asia/Jakarta)</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Order ke Petugas Gizi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Success Prompt */}
      {createdOrderForWa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in-50 text-xs">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Order Makan Berhasil Dibuat!</h3>
              <p className="text-slate-500 text-xs">
                No. Order: <strong className="font-mono text-teal-800">{createdOrderForWa.orderNumber}</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-700">
              <p>Pasien: <strong>{createdOrderForWa.patientName}</strong></p>
              <p>Ruangan: <strong>{createdOrderForWa.room} ({createdOrderForWa.bed})</strong></p>
              <p>Instruksi Diet: <strong>{createdOrderForWa.dietTypeName}</strong></p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleSendViaWhatsApp(createdOrderForWa);
                  setCreatedOrderForWa(null);
                }}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Notifikasi via WhatsApp ke Petugas Gizi</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedOrderForWa(null)}
                className="w-full py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Tutup / Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail SOP Modal for Selected Order */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-teal-800">{selectedOrder.orderNumber}</span>
                <h3 className="text-base font-bold text-slate-900">
                  Detail Transaksi SOP Pemberian Makanan Pasien
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* SOP Progress Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <SopProgressBar status={selectedOrder.status} />
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-900 border-b border-slate-200 pb-1">Identitas Pasien</p>
                <p>Nama Pasien: <strong>{selectedOrder.patientName}</strong></p>
                <p>Nomor Rekam Medis: <strong className="font-mono">{selectedOrder.patientMrn}</strong></p>
                <p>Ruangan: <strong>{selectedOrder.room} ({selectedOrder.bed})</strong></p>
                <p>Diagnosis: <strong className="text-slate-800">{selectedOrder.medicalDiagnosis}</strong></p>
                <p className="text-rose-700">
                  Alergi / Pantangan: <strong>{selectedOrder.allergies.join(', ') || 'Tidak ada'}</strong>
                </p>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-900 border-b border-slate-200 pb-1">Spesifikasi Makanan</p>
                <p>Jadwal Pelayanan: <strong>{selectedOrder.selectedSchedules?.join(', ') || selectedOrder.schedule}</strong></p>
                <p>Jenis Diet: <strong>{selectedOrder.dietTypeName}</strong></p>
                <p>Menu Disetujui: <strong>{selectedOrder.menuName || 'Menunggu verifikasi gizi'}</strong></p>
                <p>Jumlah Porsi: <strong className="font-mono">{selectedOrder.portionCount} porsi</strong></p>
                <p>Nilai Tagihan: <strong className="font-mono text-teal-800">{formatRupiah(selectedOrder.totalEstimatedPrice)}</strong></p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSendViaWhatsApp(selectedOrder)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim via WhatsApp ke Petugas Gizi</span>
              </button>

              <div className="flex items-center gap-2">
                {['DRAFT', 'SUBMITTED', 'NUTRITION_REVIEW', 'RETURNED_FOR_REVISION'].includes(selectedOrder.status) && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded"
                  >
                    Batalkan Order
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Konfirmasi Pembatalan Order</span>
            </h3>
            <p className="text-slate-600">
              Batalkan order <strong>{selectedOrder.orderNumber}</strong> untuk {selectedOrder.patientName}?
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alasan Pembatalan *</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Pasien dipulangkan / puasa persiapan operasi..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="px-4 py-1.5 text-white bg-rose-600 hover:bg-rose-700 font-semibold rounded-lg"
              >
                Konfirmasi Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
