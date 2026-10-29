'use client';

import React, { useRef, useState, useEffect } from 'react';
import { DigitalSignature } from '@/types/nutrition';
import { Pen, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface SignatureCanvasProps {
  title: string;
  subtitle?: string;
  defaultSignerName?: string;
  defaultRole?: string;
  allowRelation?: boolean;
  allowException?: boolean;
  onSave: (sig: DigitalSignature) => void;
  onCancel?: () => void;
}

export function SignatureCanvas({
  title,
  subtitle,
  defaultSignerName = '',
  defaultRole = 'Penerima',
  allowRelation = false,
  allowException = false,
  onSave,
  onCancel,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerRole, setSignerRole] = useState(defaultRole);
  const [signerRelation, setSignerRelation] = useState(allowRelation ? 'Pasien Sendiri' : '');
  const [isException, setIsException] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 380;
    canvas.height = 160;

    ctx.strokeStyle = '#0f766e'; // Teal color
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isException) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isException) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (isException) {
      if (!exceptionReason.trim()) {
        alert('Mohon isi alasan pengecualian tanda tangan.');
        return;
      }
      onSave({
        signerName: signerName || 'Pengecualian SOP',
        signerRole,
        signerRelation,
        signatureDataUrl: '',
        timestamp: new Date().toISOString(),
        isException: true,
        exceptionReason,
        notes,
      });
      return;
    }

    if (!signerName.trim()) {
      alert('Nama penanda tangan wajib diisi.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert('Mohon bubuhkan tanda tangan pada kolom yang disediakan.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    onSave({
      signerName: signerName.trim(),
      signerRole,
      signerRelation: allowRelation ? signerRelation : undefined,
      signatureDataUrl: dataUrl,
      timestamp: new Date().toISOString(),
      isException: false,
      notes,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Pen className="w-4 h-4 text-teal-700" />
          <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Nama Lengkap Penanda Tangan *</label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Contoh: Bpk. Mulyadi / Ahmad Zaki"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Peran / Jabatan</label>
          <input
            type="text"
            value={signerRole}
            onChange={(e) => setSignerRole(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-700"
          />
        </div>

        {allowRelation && (
          <div className="sm:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">Hubungan dengan Pasien</label>
            <select
              value={signerRelation}
              onChange={(e) => setSignerRelation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
            >
              <option value="Pasien Sendiri">Pasien Sendiri</option>
              <option value="Suami / Istri">Suami / Istri</option>
              <option value="Anak Kandung">Anak Kandung</option>
              <option value="Orang Tua">Orang Tua</option>
              <option value="Saudara Kandung">Saudara Kandung</option>
              <option value="Wali / Penjaga Pasien">Wali / Penjaga Pasien Resmi</option>
            </select>
          </div>
        )}
      </div>

      {allowException && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-2">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-900">
            <input
              type="checkbox"
              checked={isException}
              onChange={(e) => setIsException(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Pasien tidak dapat menandatangani (Pengecualian SOP Pasien Khusus)</span>
          </label>
          {isException && (
            <div>
              <label className="block text-amber-800 font-medium mb-1">Alasan Pengecualian SOP *</label>
              <textarea
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                placeholder="Contoh: Pasien lansia tirah baring/kelemahan motorik, tidak ada keluarga penunggu saat distribusi."
                rows={2}
                className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}
        </div>
      )}

      {!isException && (
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs text-slate-600">
            <span>Bubuhkan tanda tangan di bawah ini (layar sentuh / mouse):</span>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hapus / Ulang</span>
            </button>
          </div>

          <div className="relative border-2 border-dashed border-teal-200 rounded-lg bg-teal-50/20 overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full cursor-crosshair block"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-teal-600/60 font-medium">
                Tanda tangan di sini
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 italic">
            * Bukti persetujuan elektronik operasional pelayanan rawat inap Puskesmas.
          </p>
        </div>
      )}

      <div>
        <label className="block font-medium text-slate-700 text-xs mb-1">Catatan Tambahan (Opsional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan serah terima atau kondisi pasien saat menerima"
          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors"
          >
            Batal
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Simpan & Sahkan Tanda Tangan</span>
        </button>
      </div>
    </div>
  );
}
