'use client';

import React, { useSyncExternalStore, useState } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Download, Smartphone, X } from 'lucide-react';

function subscribeMounted() {
  return () => {};
}
function getMountedSnapshot() {
  return true;
}
function getServerMountedSnapshot() {
  return false;
}

export function PWAInstallButton() {
  const isMounted = useSyncExternalStore(subscribeMounted, getMountedSnapshot, getServerMountedSnapshot);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!isMounted || isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
        title="Pasang Aplikasi di Layar Utama HP / Tablet"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-medium transition-all whitespace-nowrap"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-xs space-y-3 animate-in fade-in-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  <span>Pasang di iPhone / iPad</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-slate-600 leading-relaxed">
                <p>Untuk memasang <strong>SI PANTAI GIZI</strong> di layar depan iOS:</p>
                <ol className="list-decimal list-inside space-y-1.5 font-medium text-slate-800">
                  <li>
                    Tekan tombol <strong>Share</strong> (ikon kotak berpanah ke atas) di bilah bawah browser Safari.
                  </li>
                  <li>
                    Gulir ke bawah dan pilih menu <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                  </li>
                  <li>
                    Tekan <strong>Tambah (Add)</strong> di pojok kanan atas.
                  </li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-3 rounded-lg bg-teal-700 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
