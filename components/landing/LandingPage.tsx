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
  Eye,
  EyeOff,
  UserCheck,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

interface LandingPageProps {
  onLoginAsUser: (user: UserProfile) => void;
}

export function LandingPage({ onLoginAsUser }: LandingPageProps) {
  const db = DbStore.getInstance();
  const allUsers = db.getUsers();
  const settings = db.getSettings();

  const [activeLoginMode, setActiveLoginMode] = useState<'QUICK_OPERATIONAL' | 'MANUAL_ADMIN_NUTR'>('QUICK_OPERATIONAL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    DOKTER: {
      title: 'Dokter DPJP',
      color: 'border-blue-500 text-blue-700',
      bgBadge: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Stethoscope,
      description: 'Preskripsi diet medis klinis pasien rawat inap dan IGD dengan notifikasi terpadu ke Ahli Gizi.',
      responsibilities: [
        'Diagnosis klinis, restriksi gizi, dan alergi makanan pasien',
        'Penginputan kebutuhan makan saat visitasi rawat inap',
        'Notifikasi WhatsApp otomatis ke Nutrisionis Puskesmas',
      ],
    },
    PERAWAT: {
      title: 'Perawat Bangsal',
      color: 'border-sky-500 text-sky-700',
      bgBadge: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: Stethoscope,
      description: 'Pendaftaran rawat inap baru, mutasi bed ruangan, dan monitoring kondisi pasien.',
      responsibilities: [
        'Pendaftaran pasien rawat inap ke sistem & alokasi kamar',
        'Pencatatan perawat penanggung jawab & serah terima jadwal',
        'Koordinasi status kesiapan pasien menerima asupan',
      ],
    },
    DOKTER_PERAWAT: {
      title: 'Dokter / Perawat',
      color: 'border-cyan-500 text-cyan-700',
      bgBadge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
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
        'Checkbox pemilihan jadwal: Sarapan (25k), Siang (47k), Malam (47k)',
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

    const query = manualIdentifier.trim().toLowerCase();
    if (!query) {
      setManualError('Silakan masukkan username atau email petugas.');
      return;
    }

    const user = allUsers.find(
      (u) =>
        u.email.toLowerCase() === query ||
        (u.username && u.username.toLowerCase() === query) ||
        u.nipOrNik === query
    );

    if (!user) {
      setManualError('Akun petugas dengan email atau username tersebut tidak ditemukan.');
      return;
    }

    if (user.status === 'INACTIVE') {
      setManualError('Akun ini sedang dinonaktifkan oleh Administrator.');
      return;
    }

    const expectedPassword = user.password || 'password123';
    if (manualPassword !== expectedPassword) {
      setManualError('Kata sandi yang Anda masukkan tidak sesuai.');
      return;
    }

    onLoginAsUser(user);
  };

  // Hanya peran operasional yang diizinkan untuk 1-klik login cepat:
  // Dokter, Perawat, Penyedia Katering, dan PJLP / Pramusaji.
  // Akun ADMIN dan AHLI_GIZI disembunyikan dan diwajibkan menggunakan login manual kredensial.
  const OPERATIONAL_ROLES: UserRole[] = ['DOKTER', 'PERAWAT', 'DOKTER_PERAWAT', 'PENYEDIA', 'PJLP_PRAMUSAJI'];
  const operationalUsers = allUsers.filter((u) => OPERATIONAL_ROLES.includes(u.role));

  const filteredOperationalUsers =
    selectedRoleFilter === 'ALL'
      ? operationalUsers
      : operationalUsers.filter((u) => {
          if (selectedRoleFilter === 'DOKTER') return u.role === 'DOKTER' || u.role === 'DOKTER_PERAWAT';
          if (selectedRoleFilter === 'PERAWAT') return u.role === 'PERAWAT' || u.role === 'DOKTER_PERAWAT';
          return u.role === selectedRoleFilter;
        });

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
            Monitoring Distribusi Nutrisi &amp; Tagihan Gizi{' '}
            <span className="text-teal-300 underline decoration-teal-400/50 decoration-wavy">
              Puskesmas Kepulauan Seribu Selatan
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
              Portal Akses Petugas
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Pilih Akun Petugas Masuk
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Untuk kelancaran operasional harian, petugas pelaksana (Dokter, Perawat, Penyedia Makanan, dan Pramusaji) dapat masuk langsung dengan 1-klik. Akun <strong>Administrator</strong> dan <strong>Ahli Gizi</strong> disembunyikan dan diwajibkan menggunakan login manual dengan kata sandi.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 p-1.5 bg-slate-200/90 rounded-2xl max-w-xl mx-auto border border-slate-300">
            <button
              type="button"
              onClick={() => setActiveLoginMode('QUICK_OPERATIONAL')}
              className={`w-full sm:w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeLoginMode === 'QUICK_OPERATIONAL'
                  ? 'bg-teal-800 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Akses Cepat Petugas Pelaksana ({operationalUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLoginMode('MANUAL_ADMIN_NUTR')}
              className={`w-full sm:w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeLoginMode === 'MANUAL_ADMIN_NUTR'
                  ? 'bg-indigo-900 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Login Manual (Admin &amp; Ahli Gizi)</span>
            </button>
          </div>

          {activeLoginMode === 'QUICK_OPERATIONAL' ? (
            <div className="space-y-6">
              {/* Role Filter Tabs (Hanya Peran Pelaksana Operasional) */}
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
                  Semua Pelaksana ({operationalUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('DOKTER')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedRoleFilter === 'DOKTER'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Dokter
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('PERAWAT')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedRoleFilter === 'PERAWAT'
                      ? 'bg-sky-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Perawat
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
              </div>

              {/* User Cards Grid (Admin dan Ahli Gizi TIDAK TAMPIL DI SINI) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOperationalUsers.map((user) => {
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

              {/* Informative Security Callout for Admin & Ahli Gizi */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Mencari Akun Administrator atau Ahli Gizi?
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilihan login Administrator dan Ahli Gizi disembunyikan dari akses 1-klik demi keamanan integritas database dan verifikasi gizi klinis.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLoginMode('MANUAL_ADMIN_NUTR')}
                  className="px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold shrink-0 flex items-center gap-2 shadow-sm transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Buka Form Login Manual</span>
                </button>
              </div>
            </div>
          ) : (
            /* Dedicated Manual Login for Administrator & Ahli Gizi */
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-amber-300 flex items-center justify-center mx-auto shadow-inner">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    Login Manual Khusus Admin &amp; Ahli Gizi
                  </h3>
                  <p className="text-xs text-indigo-200 max-w-md mx-auto">
                    Masukkan kredensial resmi (Email / Username dan Kata Sandi) untuk mengakses menu pengaturan sistem, database GAS, verifikasi diet, dan billing gizi.
                  </p>
                </div>

                <form onSubmit={handleManualLogin} className="p-6 sm:p-8 space-y-5">
                  {manualError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{manualError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Email atau Username Petugas
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={manualIdentifier}
                        onChange={(e) => setManualIdentifier(e.target.value)}
                        placeholder="Contoh: admin, ahligizi, atau email petugas"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Kata Sandi Petugas
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Kata sandi bawaan: password123
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                        className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-900 to-teal-800 hover:from-indigo-800 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Verifikasi Kredensial &amp; Masuk</span>
                  </button>
                </form>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setActiveLoginMode('QUICK_OPERATIONAL')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 transition"
                >
                  <span>&larr; Kembali ke Pilihan Petugas Pelaksana (Dokter, Perawat, Penyedia, Pramusaji)</span>
                </button>
              </div>
            </div>
          )}
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
