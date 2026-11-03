'use client';

import React, { useState } from 'react';
import { Camera, Upload, Trash2, ExternalLink, HardDrive, CheckCircle2, Loader2 } from 'lucide-react';
import { formatJakartaDateTime } from '@/lib/date-utils';
import {
  uploadPhotoToDrive,
  TARGET_GOOGLE_DRIVE_FOLDER_ID,
  TARGET_GOOGLE_DRIVE_FOLDER_URL,
} from '@/lib/drive-upload';

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
  const [isUploading, setIsUploading] = useState(false);
  const [driveUploadStatus, setDriveUploadStatus] = useState<{
    success: boolean;
    fileUrl?: string;
    message?: string;
  } | null>(
    currentPhotoUrl?.includes('drive.google.com')
      ? { success: true, fileUrl: currentPhotoUrl, message: 'Foto tersimpan di Google Drive' }
      : null
  );

// Helper: Bubuhkan watermark timestamp resmi Puskesmas pada kanvas foto sebelum disimpan
async function applyTimestampWatermark(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Gambar foto asli
        ctx.drawImage(img, 0, 0);

        // Skala proporsional ukuran watermark terhadap lebar foto
        const scale = Math.max(1, canvas.width / 950);
        const bannerHeight = Math.round(92 * scale);
        const padding = Math.round(16 * scale);

        // Banner transparan gelap di bagian bawah
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

        // Garis batas atas aksen tosca/teal
        ctx.fillStyle = '#0d9488';
        ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, Math.round(3.5 * scale));

        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        const timeStr = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        // Baris 1: Header Instansi
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(20 * scale)}px 'Plus Jakarta Sans', Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(
          'PUSKESMAS KEPULAUAN SERIBU SELATAN · INSTALASI GIZI',
          padding,
          canvas.height - bannerHeight + Math.round(28 * scale)
        );

        // Baris 2: Subtitle SOP
        ctx.fillStyle = '#99f6e4';
        ctx.font = `600 ${Math.round(15 * scale)}px 'Plus Jakarta Sans', Arial, sans-serif`;
        ctx.fillText(
          'DOKUMENTASI SAJIAN MAKANAN PASIEN RAWAT INAP',
          padding,
          canvas.height - bannerHeight + Math.round(52 * scale)
        );

        // Baris 3: Timestamp & Lokasi Real-Time
        ctx.fillStyle = '#fde047';
        ctx.font = `bold ${Math.round(16 * scale)}px 'JetBrains Mono', monospace`;
        ctx.fillText(
          `TIMESTAMP: ${dateStr} ${timeStr} WIB · PKM KEP. SERIBU SELATAN`,
          padding,
          canvas.height - bannerHeight + Math.round(76 * scale)
        );

        // Label verifikasi di kanan bawah
        ctx.fillStyle = '#cbd5e1';
        ctx.font = `bold ${Math.round(14 * scale)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(
          'SI PANTAI GIZI [TERVALIDASI]',
          canvas.width - padding,
          canvas.height - bannerHeight + Math.round(52 * scale)
        );

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (e) {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawResult = event.target?.result as string;
      setIsUploading(true);
      setDriveUploadStatus(null);

      // Bubuhkan timestamp watermark otomatis
      const watermarkedResult = await applyTimestampWatermark(rawResult);
      setPhotoUrl(watermarkedResult);
      const now = new Date().toISOString();
      setCapturedAt(now);

      // Otomatis kirim dan simpan ke Google Drive Folder: 1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk
      try {
        const driveRes = await uploadPhotoToDrive({
          base64Data: watermarkedResult,
          fileName: file.name ? `watermarked_${file.name}` : `foto_sajian_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          folderId: TARGET_GOOGLE_DRIVE_FOLDER_ID,
        });

        if (driveRes.success && driveRes.fileUrl) {
          setDriveUploadStatus({
            success: true,
            fileUrl: driveRes.fileUrl,
            message: `Foto bertanda waktu (timestamp) berhasil disimpan ke Google Drive (Folder: ${TARGET_GOOGLE_DRIVE_FOLDER_ID})`,
          });
          onPhotoSelected(driveRes.fileUrl);
        } else {
          setDriveUploadStatus({
            success: false,
            message: driveRes.message || 'Foto bertanda waktu tersimpan lokal (konfigurasi GAS di akun Admin untuk sinkronisasi Google Drive).',
          });
          onPhotoSelected(watermarkedResult);
        }
      } catch (err: any) {
        setDriveUploadStatus({
          success: false,
          message: err?.message || 'Gagal terhubung ke Google Drive API. Foto tersimpan lokal.',
        });
        onPhotoSelected(watermarkedResult);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setPhotoUrl(url);
    const now = new Date().toISOString();
    setCapturedAt(now);
    setDriveUploadStatus({
      success: true,
      fileUrl: url,
      message: 'Foto sampel demo digunakan',
    });
    onPhotoSelected(url);
    setShowPresets(false);
  };

  const handleRemove = () => {
    setPhotoUrl('');
    setCapturedAt('');
    setDriveUploadStatus(null);
    onPhotoSelected('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
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

      {/* Google Drive Target Folder Badge */}
      <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 rounded-lg px-2.5 py-1.5 text-[11px] text-blue-900">
        <div className="flex items-center gap-1.5 truncate">
          <HardDrive className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span className="truncate">
            Target Drive Folder: <strong className="font-mono">{TARGET_GOOGLE_DRIVE_FOLDER_ID}</strong>
          </span>
        </div>
        <a
          href={TARGET_GOOGLE_DRIVE_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 hover:underline shrink-0 ml-2"
        >
          <span>Buka Drive</span>
          <ExternalLink className="w-3 h-3" />
        </a>
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

      {/* Uploading Progress */}
      {isUploading && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 text-teal-800 text-xs font-semibold animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-teal-700 shrink-0" />
          <span>Mengunggah dan menyimpan foto ke Google Drive (Folder: {TARGET_GOOGLE_DRIVE_FOLDER_ID})...</span>
        </div>
      )}

      {/* Drive Upload Status Notice */}
      {driveUploadStatus && !isUploading && (
        <div
          className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
            driveUploadStatus.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {driveUploadStatus.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span>{driveUploadStatus.message}</span>
          </div>
          {driveUploadStatus.fileUrl && driveUploadStatus.fileUrl.startsWith('http') && (
            <a
              href={driveUploadStatus.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-teal-800 hover:underline shrink-0 inline-flex items-center gap-0.5"
            >
              <span>Lihat Foto</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
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
            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Watermark Timestamp &amp; Identitas Instansi Tersemat
            </span>
            <span className="font-mono text-slate-700">{formatJakartaDateTime(capturedAt)}</span>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 mb-0.5">Dokumentasi Foto Makanan Aktual Tersaji</p>
          <p className="text-[11px] text-slate-500 mb-3 max-w-sm mx-auto">
            Sistem otomatis membubuhkan watermark timestamp tanggal, jam WIB, dan identitas Puskesmas pada foto sebelum diunggah ke Google Drive
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {/* Opsi 1: Kamera Langsung */}
            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-colors">
              <Camera className="w-4 h-4" />
              <span>📷 Buka Kamera Langsung</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Opsi 2: Upload Galeri / Berkas File */}
            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-colors">
              <Upload className="w-4 h-4" />
              <span>📁 Upload Foto (Galeri / Berkas)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
