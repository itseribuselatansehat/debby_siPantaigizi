'use client';

import React, { useState } from 'react';
import { Camera, Upload, Trash2, Eye } from 'lucide-react';
import { formatJakartaDateTime } from '@/lib/date-utils';

interface PhotoCaptureProps {
  label: string;
  sublabel?: string;
  currentPhotoUrl?: string;
  onPhotoSelected: (url: string) => void;
  required?: boolean;
}

const PRESET_MEAL_PHOTOS = [
  {
    name: 'Nasi Tim & Ikan Laut Segar (Hangat)',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Nasi Beras Merah & Sayur Bening (Diet DM)',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bubur Saring Halus & Sup Kaldu Gurih',
    url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
  },
];

export function PhotoCapture({
  label,
  sublabel,
  currentPhotoUrl,
  onPhotoSelected,
  required = false,
}: PhotoCaptureProps) {
  const [photoUrl, setPhotoUrl] = useState<string>(currentPhotoUrl || '');
  const [capturedAt, setCapturedAt] = useState<string>(currentPhotoUrl ? new Date().toISOString() : '');
  const [showPresets, setShowPresets] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoUrl(result);
      const now = new Date().toISOString();
      setCapturedAt(now);
      onPhotoSelected(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setPhotoUrl(url);
    const now = new Date().toISOString();
    setCapturedAt(now);
    onPhotoSelected(url);
    setShowPresets(false);
  };

  const handleRemove = () => {
    setPhotoUrl('');
    setCapturedAt('');
    onPhotoSelected('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-slate-900">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {sublabel && <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs text-teal-700 hover:text-teal-800 underline font-medium"
        >
          {showPresets ? 'Tutup Preset' : 'Gunakan Foto Demo'}
        </button>
      </div>

      {showPresets && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <p className="text-[11px] font-medium text-slate-600">Pilih sampel foto makanan rawat inap untuk pengujian cepat:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_MEAL_PHOTOS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset.url)}
                className="text-left p-1.5 border border-slate-200 rounded-md hover:border-teal-500 hover:bg-teal-50/50 transition-colors"
              >
                <div className="relative h-16 w-full rounded overflow-hidden bg-slate-200 mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-slate-700 font-medium truncate">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {photoUrl ? (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-56 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Foto Bukti Sajian" className="w-full h-48 object-cover" />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 bg-rose-600 text-white rounded-md shadow hover:bg-rose-700 transition-colors"
                title="Hapus Foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Waktu Dokumentasi:</span>
            <span className="font-mono text-slate-700">{formatJakartaDateTime(capturedAt)}</span>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-700 mb-1">Ambil Foto dengan Kamera atau Unggah Berkas</p>
          <p className="text-[11px] text-slate-400 mb-3">Format JPG, PNG (Maksimal 8 MB)</p>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg cursor-pointer shadow-sm transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Pilih Berkas / Buka Kamera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
