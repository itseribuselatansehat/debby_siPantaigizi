import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mb-4 shadow-xs">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Halaman Tidak Ditemukan (404)</h1>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        Halaman yang Anda tuju tidak ditemukan pada sistem SI PANTAI GIZI Puskesmas Kepulauan Seribu Selatan.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-800 text-white font-medium text-sm hover:bg-teal-900 transition-colors shadow-sm"
      >
        <Home className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>
    </div>
  );
}
