'use client';

import React, { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribeOnline, getSnapshot, getServerSnapshot);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>Mode Offline — Data tersimpan di penyimpanan lokal dan akan sinkron saat online.</span>
    </div>
  );
}
