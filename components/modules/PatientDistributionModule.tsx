'use client';

import React, { useState } from 'react';
import { DigitalSignature, MealOrder } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import { formatJakartaDate, formatJakartaDateTime } from '@/lib/date-utils';
import { PhotoCapture } from '@/components/common/PhotoCapture';
import { SignatureCanvas } from '@/components/common/SignatureCanvas';
import {
  Share2,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Pen,
  UserCheck,
  Bed,
  Clock,
  ShieldCheck,
  Eye,
  Printer,
  Tag,
  Check,
} from 'lucide-react';

interface PatientDistributionModuleProps {
  orders: MealOrder[];
  onOrderUpdated: () => void;
}

export function PatientDistributionModule({ orders, onOrderUpdated }: PatientDistributionModuleProps) {
  const db = DbStore.getInstance();
  const currentUser = db.getCurrentUser();
  const settings = db.getSettings();

  const [selectedOrder, setSelectedOrder] = useState<MealOrder | null>(null);
  const [orderForEtiket, setOrderForEtiket] = useState<MealOrder | null>(null);

  // 2-Identifier Verification checklist state
  const [verifyName, setVerifyName] = useState(false);
  const [verifyMrn, setVerifyMrn] = useState(false);
  const [verifyDiet, setVerifyDiet] = useState(false);

  // Distribution form
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [recipientSignature, setRecipientSignature] = useState<DigitalSignature | null>(null);
  const [distributionNotes, setDistributionNotes] = useState('');

  // Filter orders needing distribution to patient bed
  const pendingDistributions = orders.filter((o) =>
    ['RECEIVED_BY_WAITER', 'DISTRIBUTION_IN_PROGRESS'].includes(o.status)
  );

  const completedDistributions = orders.filter((o) =>
    ['DELIVERED_TO_PATIENT', 'CONSUMPTION_RECORDED', 'COMPLETED'].includes(o.status)
  );

  const handleStartDistribute = (order: MealOrder) => {
    setSelectedOrder(order);
    setVerifyName(false);
    setVerifyMrn(false);
    setVerifyDiet(false);
    setPhotoUrl(order.servedMealPhotoUrl || '');
    setRecipientSignature(null);
    setDistributionNotes('');
  };

  const handleOpenEtiket = (order: MealOrder) => {
    setOrderForEtiket(order);
    db.markEtiketPrinted(order.id);
  };

  const handlePrintEtiket = () => {
    window.print();
  };

  const handleSaveDistribution = () => {
    if (!selectedOrder) return;

    if (!verifyName || !verifyMrn || !verifyDiet) {
      alert('SOP Keselamatan Pasien mewajibkan verifikasi minimal 2 identitas (Nama Pasien & Nomor RM) dan kesesuaian diet sebelum menyajikan makanan.');
      return;
    }

    if (!photoUrl) {
      alert('Foto makanan aktual saat disajikan wajib diunggah/diambil.');
      return;
    }

    if (!recipientSignature) {
      alert('Tanda tangan pasien / keluarga atau form pengecualian SOP wajib dilengkapi.');
      return;
    }

    const res = db.distributeToPatient({
      orderId: selectedOrder.id,
      servedMealPhotoUrl: photoUrl,
      recipientSignature,
      distributionNotes,
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-700" />
            <span>Distribusi Makanan & Cetak Etiket Pasien</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cetak stiker etiket makanan pasien, verifikasi 2 identitas, unggah foto sajian, dan tanda tangan digital
          </p>
        </div>
        <div className="text-xs bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-lg font-semibold">
          {pendingDistributions.length} Makanan Siap Diantar ke Bed Pasien
        </div>
      </div>

      {/* Pending Distribution Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800">
          Daftar Antrean Distribusi Ruang Perawatan
        </div>

        {pendingDistributions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            Semua makanan yang telah lolos QC penerimaan sudah didistribusikan ke pasien.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingDistributions.map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800">{order.orderNumber}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-900">{order.patientName}</span>
                    <span className="text-slate-500 font-mono">({order.patientMrn})</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold text-purple-900">{order.room} ({order.bed})</span>
                  </div>
                  <p className="text-slate-600">
                    Menu: <strong>{order.menuName}</strong> ({order.texture}) · Jadwal: <strong>{order.schedule}</strong>
                  </p>
                  <p className="text-rose-700 font-medium text-[11px]">
                    Pantangan / Alergen: {order.allergies.length > 0 ? order.allergies.join(', ') : 'Nihil Alergi'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEtiket(order)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5 text-teal-700" />
                    <span>Cetak Etiket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartDistribute(order)}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Sajikan & Minta TTD</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Bedside Distribution & Evidence Upload */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-6 animate-in fade-in-50 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-purple-800">{selectedOrder.orderNumber}</span>
                <h3 className="text-base font-bold text-slate-900">
                  Formulir Penyerahan Makanan ke Pasien (Bedside Delivery)
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

            {/* Target Patient Card */}
            <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-purple-950">{selectedOrder.patientName}</span>
                <span className="px-2.5 py-0.5 rounded font-mono font-bold bg-purple-200 text-purple-900">
                  {selectedOrder.room} — {selectedOrder.bed}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                <p>No. RM: <strong className="font-mono text-slate-900">{selectedOrder.patientMrn}</strong></p>
                <p>Usia: <strong>{selectedOrder.patientAgeYears} thn {selectedOrder.patientAgeMonths} bln</strong></p>
                <p>Jadwal: <strong>{selectedOrder.schedule}</strong></p>
                <p className="col-span-2">Menu: <strong>{selectedOrder.menuName}</strong> ({selectedOrder.texture})</p>
                <p className="col-span-2 text-rose-700 font-semibold">
                  Alergi: {selectedOrder.allergies.join(', ') || 'Tidak ada'}
                </p>
              </div>
            </div>

            {/* Step 1: 2-Identifier Verification Protocol */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>1. Verifikasi Keselamatan Pasien (2 Identitas Wajib)</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={verifyName}
                    onChange={(e) => setVerifyName(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Mencocokkan nama pasien secara verbal & gelang identitas pasien</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={verifyMrn}
                    onChange={(e) => setVerifyMrn(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Mencocokkan Nomor Rekam Medis (<strong className="font-mono">{selectedOrder.patientMrn}</strong>) pada label etiket makanan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={verifyDiet}
                    onChange={(e) => setVerifyDiet(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Memastikan makanan sesuai jenis diet, tekstur, dan bebas alergen</span>
                </label>
              </div>
            </div>

            {/* Step 2: Upload / Capture Actual Served Meal Photo */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">2. Foto Dokumentasi Makanan Aktual Saat Disajikan</h4>
              <PhotoCapture
                label="Foto Makanan Saat Tiba di Pasien"
                sublabel="Ambil foto piring/wadah makanan yang disajikan ke hadapan pasien"
                currentPhotoUrl={photoUrl}
                onPhotoSelected={(url) => setPhotoUrl(url)}
                required
              />
            </div>

            {/* Step 3: Patient / Family Digital Signature Canvas */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">3. Tanda Tangan Penerima Makanan</h4>
              {recipientSignature ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-emerald-900">
                      Tanda Tangan Penerima ({recipientSignature.signerRelation || 'Pasien'}) Tersimpan
                    </p>
                    <p className="text-[11px] text-emerald-700">Nama: {recipientSignature.signerName}</p>
                    {recipientSignature.isException && (
                      <p className="text-[11px] text-amber-700 italic">
                        Pengecualian: {recipientSignature.exceptionReason}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecipientSignature(null)}
                    className="text-xs text-rose-600 underline font-medium"
                  >
                    Ubah
                  </button>
                </div>
              ) : (
                <SignatureCanvas
                  title="Layar Tanda Tangan Pasien / Keluarga Berwenang"
                  subtitle="Tanda tangan pada perangkat smartphone / tablet pramusaji saat makanan diterima"
                  defaultSignerName={selectedOrder.patientName}
                  defaultRole="Pasien Rawat Inap"
                  allowRelation={true}
                  allowException={true}
                  onSave={(sig) => setRecipientSignature(sig)}
                />
              )}
            </div>

            {/* Distribution Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan Khusus Pramusaji (Opsional)</label>
              <input
                type="text"
                value={distributionNotes}
                onChange={(e) => setDistributionNotes(e.target.value)}
                placeholder="Contoh: Pasien didampingi anak, posisi duduk tegak, makanan diterima dalam kondisi hangat..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Pramusaji: {currentUser.name}
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
                  onClick={handleSaveDistribution}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold shadow-sm transition-colors"
                >
                  Selesaikan Penyajian ke Pasien
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Etiket Makanan Pasien (Sticker Label Format ~ 7cm x 5cm) */}
      {orderForEtiket && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 no-print">
              <div className="flex items-center gap-2 text-teal-800 font-bold">
                <Tag className="w-4 h-4" />
                <span>Etiket Stiker Makanan Pasien Rawat Inap</span>
              </div>
              <button
                type="button"
                onClick={() => setOrderForEtiket(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* The Printable Sticker */}
            <div className="p-4 border-2 border-dashed border-slate-400 rounded-xl bg-white space-y-2 text-black shadow-inner">
              <div className="text-center border-b border-black pb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  PUSKESMAS KEPULAUAN SERIBU SELATAN
                </p>
                <p className="text-[9px] font-semibold text-slate-700">
                  INSTALASI GIZI & PELAYANAN RAWAT INAP
                </p>
              </div>

              <div className="space-y-1 text-[11px] leading-tight">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase">Nama Pasien:</span>
                    <p className="font-extrabold text-xs text-black">{orderForEtiket.patientName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 uppercase">No. RM:</span>
                    <p className="font-mono font-bold text-xs">{orderForEtiket.patientMrn}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-0.5 border-y border-slate-200">
                  <span>Ruang / Kamar: <strong>{orderForEtiket.room} ({orderForEtiket.bed})</strong></span>
                  <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 bg-black text-white rounded">
                    {orderForEtiket.schedule}
                  </span>
                </div>

                <div className="pt-0.5">
                  <span className="text-[9px] text-slate-500 uppercase">Jenis Diet & Tekstur:</span>
                  <p className="font-bold text-black">{orderForEtiket.dietTypeName} ({orderForEtiket.texture})</p>
                </div>

                <div>
                  <span className="text-[9px] text-slate-500 uppercase">Menu Makanan:</span>
                  <p className="font-medium text-black">{orderForEtiket.menuName}</p>
                </div>

                {orderForEtiket.allergies && orderForEtiket.allergies.length > 0 && (
                  <div className="p-1 bg-red-100 border border-red-300 rounded text-[10px] font-bold text-red-900">
                    PERINGATAN ALERGI: {orderForEtiket.allergies.join(', ').toUpperCase()}
                  </div>
                )}

                <div className="flex justify-between items-end pt-1.5 border-t border-slate-200 text-[9px] text-slate-600">
                  <div>
                    <p>Waktu Saji: {formatJakartaDate(orderForEtiket.serviceDate)}</p>
                    <p>Petugas: {currentUser.name}</p>
                  </div>
                  <div className="text-right font-mono text-[9px]">
                    <span className="tracking-widest">||| | |||| | |||||</span>
                    <p>{orderForEtiket.orderNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 no-print">
              <span className="text-[11px] text-slate-500">Ukuran: Standar Wadah Makanan Pasien</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderForEtiket(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handlePrintEtiket}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-sm inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Etiket Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
