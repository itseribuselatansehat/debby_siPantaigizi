'use client';

import React, { useState } from 'react';
import { UserProfile, UserRole } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import {
  Stethoscope,
  HeartPulse,
  ChefHat,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Waves,
  Clock,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Compass,
  Anchor,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface LandingPageProps {
  onLoginAsUser: (user: UserProfile) => void;
}

export function LandingPage({ onLoginAsUser }: LandingPageProps) {
  const db = DbStore.getInstance();
  const allUsers = db.getUsers();
  const settings = db.getSettings();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [manualError, setManualError] = useState('');

  const roleMeta: Record<
    UserRole,
    {
      title: string;
      color: string;
      bgBadge: string;
      icon: any;
      description: string;
      responsibilities: string[];
    }
  > = {
    DOKTER_PERAWAT: {
      title: 'Dokter / Perawat',
      color: 'border-sky-500 text-sky-700',
      bgBadge: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: Stethoscope,
      description: 'Preskripsi diet medis pasien rawat inap dan IGD dengan notifikasi WhatsApp langsung ke Ahli Gizi.',
      responsibilities: [
        'Form order ringkas & simpel (tanpa jadwal & menu rumit)',
        'Diagnosis klinis, tekstur makanan & pantangan alergi',
        'Kirim rincian order via WhatsApp langsung ke Nutrisionis',
      ],
    },
    AHLI_GIZI: {
      title: 'Ahli Gizi (Nutrisionis)',
      color: 'border-teal-500 text-teal-800',
      bgBadge: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: HeartPulse,
      description: 'Verifikasi klinis diet, penetapan jadwal makan & tarif, serta koordinasi ke penyedia katering.',
      responsibilities: [
        'Checkbox pemilihan jadwal: Sarapan (25k), Siang (45k), Malam (45k)',
        'Penyusunan menu katering & instruksi diet klinis',
        'Forward rincian pesanan ke WhatsApp katering rekanan',
      ],
    },
    PENYEDIA: {
      title: 'Penyedia Makanan (Katering)',
      color: 'border-amber-500 text-amber-800',
      bgBadge: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: ChefHat,
      description: 'Pengolahan makanan higienis standar rumah sakit dan ekspedisi bertahap per jadwal makan.',
      responsibilities: [
        'Pemesanan langsung dikerjakan di dapur produksi',
        'Tombol kirim bertahap: Kirim Sarapan, Kirim Siang, Kirim Malam',
        'Checklist suhu dan mutu makanan sebelum keberangkatan kurir',
      ],
    },
    PJLP_PRAMUSAJI: {
      title: 'PJLP / Pramusaji Bangsal',
      color: 'border-emerald-500 text-emerald-800',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: Truck,
      description: 'Penerimaan per kategori jadwal, cetak etiket wadah makanan, dokumentasi foto & TTD pasien.',
      responsibilities: [
        'Penerimaan terpisah per kategori (Pagi, Siang, Malam)',
        'Cetak etiket stiker makanan untuk wadah/lunch box pasien',
        'Foto makanan aktual, tanda tangan digital penerima & sisa Comstock',
      ],
    },
    ADMIN: {
      title: 'Administrator Sistem',
      color: 'border-indigo-500 text-indigo-800',
      bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: ShieldCheck,
      description: 'Tata kelola master data, konfigurasi integrasi Google Sheets global, dan rekapitulasi audit.',
      responsibilities: [
        'Integrasi Google Apps Script & Sheets tersimpan global di semua browser',
        'Manajemen pengguna, ruang rawat, tarif kontrak & harga diet',
        'Rekap tagihan bulanan dan ekspor data audit resmi',
      ],
    },
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    const user = allUsers.find(
      (u) => u.email.toLowerCase() === manualEmail.trim().toLowerCase()
    );
    if (!user) {
      setManualError('Email tidak terdaftar pada sistem demo.');
      return;
    }
    onLoginAsUser(user);
  };

  const filteredUsers =
    selectedRoleFilter === 'ALL'
      ? allUsers
      : allUsers.filter((u) => u.role === selectedRoleFilter);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <Waves className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  SI PANTAI GIZI
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  Puskesmas Kepulauan Seribu Selatan
                </span>
              </div>
              <p className="text-[11px] text-teal-800 font-medium hidden sm:block">
                Sistem Pemantauan Asupan Nutrisi, Tagihan, dan Distribusi Gizi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#filosofi"
              className="text-xs font-semibold text-slate-600 hover:text-teal-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
            >
              Filosofi Aplikasi
            </a>
            <a
              href="#login-users"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-sm transition-all"
            >
              <span>Login Petugas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-950 via-teal-900 to-teal-800 text-white pt-14 pb-20 sm:pt-20 sm:pb-28">
        {/* Coastal / Island Decorative Elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-800/80 border border-teal-600/40 text-teal-100 text-xs font-semibold shadow-inner">
            <Anchor className="w-3.5 h-3.5 text-teal-300" />
            <span>Portal SOP Gizi Rawat Inap Puskesmas Kepulauan Seribu Selatan</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            Monitoring Distribusi Nutrisi & Tagihan Gizi{' '}
            <span className="text-teal-300 underline decoration-teal-400/50 decoration-wavy">
              Wilayah Pesisir
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-teal-100 max-w-3xl mx-auto font-normal leading-relaxed">
            Menghubungkan dokter, nutrisionis, penyedia katering rekanan, pramusaji bangsal, dan
            pasien dalam ekosistem digital 360° yang akuntabel, higienis, dan terintegrasi Google Sheets.
          </p>

          {/* Quick CTA Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#login-users"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-teal-900 text-sm font-bold shadow-lg hover:bg-teal-50 transition-all hover:scale-105 active:scale-95"
            >
              <span>Pilih Akun Petugas (Tinggal Login)</span>
              <ArrowRight className="w-4 h-4 text-teal-800" />
            </a>
            <a
              href="#filosofi"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-800/80 hover:bg-teal-700/80 text-white text-sm font-semibold border border-teal-600/50 transition-all"
            >
              <Compass className="w-4 h-4 text-teal-300" />
              <span>Filosofi & SOP Pelayanan</span>
            </a>
          </div>

          {/* Key Stat Badges */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl">
              <span className="text-[11px] text-teal-200 font-medium block">Tarif Terstandar</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">Sarapan 25k · Siang 45k · Malam 45k</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl">
              <span className="text-[11px] text-teal-200 font-medium block">Integrasi Instan</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">Notifikasi WhatsApp & Google Sheets</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl">
              <span className="text-[11px] text-teal-200 font-medium block">Distribusi Beretiket</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">Cetak Stiker Wadah Pasien</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl">
              <span className="text-[11px] text-teal-200 font-medium block">Evaluasi Mutu</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">Skala Comstock & Foto Sajian</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="filosofi" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              Kearifan Lokal Bahari & Standar Akreditasi
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Filosofi Aplikasi SI PANTAI GIZI
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mewujudkan kesetaraan layanan gizi rawat inap paripurna bagi masyarakat Kepulauan Seribu
              melalui ketepatan preskripsi diet, kepatuhan temperatur antar-pulau, dan transparansi tagihan.
            </p>
          </div>

          {/* Philosophy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-teal-50/60 to-white border border-teal-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
                <Waves className="w-5 h-5 text-teal-200" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                1. Makna Bahari & Ketahanan Pesisir
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Di wilayah kepulauan, <strong>PANTAI</strong> adalah dermaga awal dan akhir tempat pertolongan
                berlabuh. <strong>SI PANTAI GIZI</strong> menjadi pelindung ketahanan nutrisi pasien rawat inap
                di Pulau Tidung, Pulau Harapan, Pulau Pari, dan sekitarnya, memastikan makanan bergizi seimbang
                tiba dalam kondisi prima tanpa terdegradasi suhu dan kebersihan.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5 text-emerald-200" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                2. Presisi Klinis & Keamanan Pasien (Patient Safety)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap penyakit memiliki kebutuhan diet yang unik. Dokter merumuskan diagnosis klinis dan
                alergi, sedangkan Nutrisionis memvalidasi gramasi serta tekstur (Biasa, Lunak, Saring, Cair).
                Dengan etiket makanan tercetak, tidak ada lagi kesalahan penyerahan nampan makanan di kamar perawatan.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-50/60 to-white border border-sky-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-800 text-white flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5 text-sky-200" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                3. Akuntabilitas & Transparansi Biaya Terbuka
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap porsi yang diproduksi penyedia katering rekanan diverifikasi melalui foto aktual dan
                tanda tangan digital ganda (pramusaji dan pasien/keluarga). Perhitungan tagihan bulanan
                otomatis terhubung dengan Google Spreadsheet global yang dapat diaudit secara real-time.
              </p>
            </div>
          </div>

          {/* Acronym Breakdown */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-teal-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Nilai Utama &amp; Komitmen Pelayanan &ldquo;PANTAI GIZI&rdquo;</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-lg font-black text-teal-400">P</span>
                <p className="font-bold text-white">Pemantauan Real-time</p>
                <p className="text-slate-300 text-[11px]">Monitoring asupan makan langsung dari ranjang rawat inap.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-lg font-black text-teal-400">A</span>
                <p className="font-bold text-white">Akuntabilitas Bukti</p>
                <p className="text-slate-300 text-[11px]">Foto sajian & tanda tangan digital di setiap penyerahan.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-lg font-black text-teal-400">N</span>
                <p className="font-bold text-white">Nutrisi Tepat Diet</p>
                <p className="text-slate-300 text-[11px]">Sesuai diagnosis dokter & standar dietetik Kemenkes.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-lg font-black text-teal-400">T</span>
                <p className="font-bold text-white">Transparansi Tagihan</p>
                <p className="text-slate-300 text-[11px]">Perhitungan otomatis kontrak sarapan, siang, dan malam.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-lg font-black text-teal-400">I</span>
                <p className="font-bold text-white">Integritas Higiene</p>
                <p className="text-slate-300 text-[11px]">Suhu sajian hangat terjaga dan bebas kontaminasi bahari.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Login Section */}
      <section id="login-users" className="py-16 sm:py-24 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              One-Click Instant Access
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Pilih Akun Petugas untuk Masuk
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Sistem telah menyiapkan masing-masing profil pengguna. Anda cukup menekan tombol login
              pada kartu yang sesuai dengan peran Anda untuk langsung menguji alur kerja SOP rawat inap.
            </p>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedRoleFilter === 'ALL'
                  ? 'bg-teal-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Akun ({allUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('DOKTER_PERAWAT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedRoleFilter === 'DOKTER_PERAWAT'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dokter / Perawat
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('AHLI_GIZI')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedRoleFilter === 'AHLI_GIZI'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ahli Gizi
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('PENYEDIA')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedRoleFilter === 'PENYEDIA'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Penyedia Katering
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('PJLP_PRAMUSAJI')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedRoleFilter === 'PJLP_PRAMUSAJI'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              PJLP / Pramusaji
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('ADMIN')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedRoleFilter === 'ADMIN'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Administrator
            </button>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((user) => {
              const meta = roleMeta[user.role];
              const IconComp = meta?.icon || Activity;

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                          <IconComp className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-teal-800 transition">
                            {user.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-mono">
                            NIP/NIK: {user.nipOrNik}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta?.bgBadge}`}>
                        {meta?.title}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                      <p className="font-semibold text-slate-700 text-[11px]">
                        Unit: <span className="font-normal text-slate-600">{user.unitOrWard}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {meta?.description}
                      </p>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wide">
                        Fitur Utama Peran:
                      </p>
                      {meta?.responsibilities.map((resp, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onLoginAsUser(user)}
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>Masuk sebagai {user.name.split(',')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Login Accordion Fallback */}
          <div className="max-w-md mx-auto text-center pt-4">
            <button
              type="button"
              onClick={() => setShowManualLogin(!showManualLogin)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1.5 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Ingin login dengan email & kata sandi manual?</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showManualLogin ? 'rotate-180' : ''}`} />
            </button>

            {showManualLogin && (
              <form
                onSubmit={handleManualLogin}
                className="mt-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-left text-xs space-y-3 animate-in fade-in-50"
              >
                <h4 className="font-bold text-slate-900 text-sm">Login Kredensial Manual</h4>
                {manualError && (
                  <p className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px]">
                    {manualError}
                  </p>
                )}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Petugas</label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="misal: farhan.dokter@puskesmas.id"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kata Sandi</label>
                  <input
                    type="password"
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Untuk demo, kata sandi opsional.</p>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg transition"
                >
                  Masuk Sekarang
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-800">
          SI PANTAI GIZI — Puskesmas Kepulauan Seribu Selatan
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Sistem Pemantauan Asupan Nutrisi, Tagihan, dan Distribusi Gizi SOP Rawat Inap Terpadu · Waktu Server: Asia/Jakarta
        </p>
      </footer>
    </div>
  );
}
