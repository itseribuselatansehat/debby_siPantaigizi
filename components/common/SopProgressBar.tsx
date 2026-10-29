'use client';

import React from 'react';
import { SopStatus } from '@/types/nutrition';
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';

interface SopProgressBarProps {
  status: SopStatus;
  className?: string;
}

const SOP_STAGES: { status: SopStatus; label: string; role: string }[] = [
  { status: 'SUBMITTED', label: 'Order Diajukan', role: 'Dokter / Perawat' },
  { status: 'NUTRITION_APPROVED', label: 'Verifikasi Gizi', role: 'Ahli Gizi' },
  { status: 'PROVIDER_ACCEPTED', label: 'Diterima Penyedia', role: 'Penyedia Makanan' },
  { status: 'FOOD_PREPARATION', label: 'Pengolahan Makanan', role: 'Penyedia Makanan' },
  { status: 'IN_DELIVERY', label: 'Pengiriman', role: 'Kurir Katering' },
  { status: 'RECEIVED_BY_WAITER', label: 'Penerimaan & QC', role: 'Pramusaji' },
  { status: 'DELIVERED_TO_PATIENT', label: 'Saji ke Pasien & TTD', role: 'Pramusaji' },
  { status: 'CONSUMPTION_RECORDED', label: 'Evaluasi Sisa', role: 'Pramusaji' },
  { status: 'COMPLETED', label: 'SOP Selesai & Ditagihkan', role: 'Ahli Gizi' },
];

export function SopProgressBar({ status, className = '' }: SopProgressBarProps) {
  const isSpecialStatus = ['RETURNED_FOR_REVISION', 'REJECTED', 'CANCELLED', 'DELIVERY_EXCEPTION'].includes(status);

  const getStatusBadge = (st: SopStatus) => {
    switch (st) {
      case 'SUBMITTED':
        return { text: 'Menunggu Review Gizi', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'NUTRITION_APPROVED':
      case 'SENT_TO_PROVIDER':
        return { text: 'Diteruskan ke Penyedia', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'PROVIDER_ACCEPTED':
        return { text: 'Disetujui Penyedia', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'FOOD_PREPARATION':
        return { text: 'Sedang Diolah', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'READY_TO_DELIVER':
      case 'IN_DELIVERY':
        return { text: 'Sedang Dikirim', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'RECEIVED_BY_WAITER':
        return { text: 'Diterima Pramusaji (QC)', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'DISTRIBUTION_IN_PROGRESS':
        return { text: 'Menuju Kamar Pasien', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'DELIVERED_TO_PATIENT':
        return { text: 'Tersaji ke Pasien', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'CONSUMPTION_RECORDED':
        return { text: 'Sisa Makanan Dinilai', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'COMPLETED':
        return { text: 'Selesai & Tertagih', bg: 'bg-teal-100 text-teal-900 border-teal-300 font-semibold' };
      case 'RETURNED_FOR_REVISION':
        return { text: 'Perlu Revisi Order', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold' };
      case 'REJECTED':
        return { text: 'Ditolak', bg: 'bg-rose-100 text-rose-900 border-rose-300 font-semibold' };
      case 'CANCELLED':
        return { text: 'Dibatalkan', bg: 'bg-slate-200 text-slate-800 border-slate-300 font-semibold' };
      case 'DELIVERY_EXCEPTION':
        return { text: 'Ketidaksesuaian Mutu / Tolak', bg: 'bg-rose-100 text-rose-900 border-rose-300 font-semibold' };
      default:
        return { text: st, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getStatusBadge(status);

  // Determine active step index
  const getActiveIndex = () => {
    switch (status) {
      case 'DRAFT':
      case 'SUBMITTED':
        return 0;
      case 'NUTRITION_REVIEW':
      case 'NUTRITION_APPROVED':
      case 'SENT_TO_PROVIDER':
        return 1;
      case 'PROVIDER_ACCEPTED':
        return 2;
      case 'FOOD_PREPARATION':
      case 'READY_TO_DELIVER':
        return 3;
      case 'IN_DELIVERY':
        return 4;
      case 'RECEIVED_BY_WAITER':
        return 5;
      case 'DISTRIBUTION_IN_PROGRESS':
      case 'DELIVERED_TO_PATIENT':
        return 6;
      case 'CONSUMPTION_RECORDED':
        return 7;
      case 'COMPLETED':
        return 8;
      default:
        return -1;
    }
  };

  const activeIdx = getActiveIndex();

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Status Alur SOP</span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${badge.bg}`}>
          {badge.text}
        </span>
      </div>

      {isSpecialStatus ? (
        <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/70 flex items-start gap-2.5 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Perhatian Khusus Alur SOP</p>
            <p className="text-rose-700 mt-0.5">
              Status saat ini adalah <strong>{status}</strong>. Periksa riwayat catatan tindakan dan lakukan koordinasi sesuai SOP.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 min-w-[620px]">
            {SOP_STAGES.map((stage, idx) => {
              const isPast = activeIdx > idx;
              const isCurrent = activeIdx === idx;

              return (
                <React.Fragment key={stage.status}>
                  <div className="flex-1 min-w-[70px]">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isPast
                          ? 'bg-teal-600'
                          : isCurrent
                          ? 'bg-amber-500 ring-2 ring-amber-300'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div className="mt-1 text-left">
                      <p
                        className={`text-[10px] font-medium leading-tight truncate ${
                          isCurrent
                            ? 'text-teal-900 font-bold'
                            : isPast
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {stage.label}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">{stage.role}</p>
                    </div>
                  </div>
                  {idx < SOP_STAGES.length - 1 && (
                    <div className="shrink-0 text-slate-300">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
