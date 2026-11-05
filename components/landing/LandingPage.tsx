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
  RefreshCw,
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

      {/* Official Database Login Portal */}
      {/* Official Database Login Portal */}
      <section id="login-users" className="py-16 sm:py-24 bg-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Portal Masuk Resmi SI PANTAI GIZI</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Sistem Pelayanan Gizi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Dokter, Perawat, PJLP Pramusaji, dan Penyedia Katering dapat <strong>langsung masuk tanpa password</strong>. Khusus Admin dan Ahli Gizi wajib verifikasi kata sandi resmi.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 max-w-xl w-full text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveLoginMode('QUICK_OPERATIONAL')}
                className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeLoginMode === 'QUICK_OPERATIONAL'
                    ? 'bg-teal-800 text-white shadow-md'
                    : 'text-slate-700 hover:text-teal-900 hover:bg-white/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Akses Cepat (Tanpa Password)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLoginMode('MANUAL_ADMIN_NUTR')}
                className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeLoginMode === 'MANUAL_ADMIN_NUTR'
                    ? 'bg-teal-800 text-white shadow-md'
                    : 'text-slate-700 hover:text-teal-900 hover:bg-white/50'
                }`}
              >
                <Lock className="w-4 h-4 text-teal-300" />
                <span>Admin &amp; Ahli Gizi (Dengan Sandi)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: QUICK 1-CLICK OPERATIONAL LOGIN (TANPA PASSWORD) */}
          {activeLoginMode === 'QUICK_OPERATIONAL' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Tinggal Login Tanpa Password untuk Petugas Operasional Bangsal &amp; Dapur
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Pilih nama akun petugas di bawah untuk langsung membuka modul sesuai tugas dan wewenang.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLoginMode('MANUAL_ADMIN_NUTR')}
                  className="text-xs text-teal-800 hover:text-teal-950 font-bold underline whitespace-nowrap self-end sm:self-auto"
                >
                  Masuk sebagai Admin / Ahli Gizi →
                </button>
              </div>

              {/* Role Filter Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                    selectedRoleFilter === 'ALL'
                      ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Semua Petugas ({operationalUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('DOKTER')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center gap-1.5 ${
                    selectedRoleFilter === 'DOKTER'
                      ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Dokter DPJP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('PERAWAT')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center gap-1.5 ${
                    selectedRoleFilter === 'PERAWAT'
                      ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                      : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Perawat Bangsal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('PJLP_PRAMUSAJI')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center gap-1.5 ${
                    selectedRoleFilter === 'PJLP_PRAMUSAJI'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>PJLP Pramusaji</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('PENYEDIA')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center gap-1.5 ${
                    selectedRoleFilter === 'PENYEDIA'
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Penyedia Katering</span>
                </button>
              </div>

              {/* Grid of Operational Staff Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredOperationalUsers.map((user) => {
                  const meta = roleMeta[user.role] || roleMeta['PERAWAT'];
                  const IconComponent = meta.icon;

                  return (
                    <div
                      key={user.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <IconComponent className="w-6 h-6 text-teal-700" />
                            </div>
                            <div>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgBadge}`}>
                                {meta.title}
                              </span>
                              <h3 className="text-sm font-extrabold text-slate-900 mt-1 leading-tight">
                                {user.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                NIP/NIK: {user.nipOrNik || '-'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold whitespace-nowrap">
                            Tanpa Sandi
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                          <p className="line-clamp-2">{meta.description}</p>
                          {user.unitOrWard && (
                            <p className="text-[10px] text-teal-800 font-semibold">
                              Unit/Lokasi: {user.unitOrWard}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onLoginAsUser(user)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-700 hover:to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <UserCheck className="w-4 h-4 text-amber-300" />
                        <span>Masuk Langsung ({meta.title})</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* GAS Sync Quick Status */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Database Akun Real: <strong>{operationalUsers.length} Petugas Operasional Terdaftar</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await db.pullLiveDatabaseFromGas();
                    alert(res.message);
                    if (res.success) window.location.reload();
                  }}
                  className="text-teal-800 hover:text-teal-950 font-bold inline-flex items-center gap-1.5 transition text-[11px]"
                  title="Tarik daftar pengguna terbaru langsung dari Google Spreadsheet"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan Akun dari Spreadsheet</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVILEGED LOGIN (ADMIN & AHLI GIZI - DENGAN PASSWORD) */}
          {activeLoginMode === 'MANUAL_ADMIN_NUTR' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-xl mx-auto animate-in fade-in-50">
              <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 p-6 text-white text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-amber-300 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  Login Khusus Admin &amp; Ahli Gizi
                </h3>
                <p className="text-xs text-teal-200 max-w-md mx-auto">
                  Wajib verifikasi Email / Username / NIP dan Kata Sandi resmi demi menjaga keamanan tarif, kontrak, SPK, dan SPJ Puskesmas.
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
                    Email, Username, atau NIP Petugas (Admin / Ahli Gizi) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualIdentifier}
                      onChange={(e) => setManualIdentifier(e.target.value)}
                      placeholder="Contoh: ahligizi atau admin.gizi@puskesmas.id..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Kata Sandi Petugas *
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Default: password123
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun..."
                      className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
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
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-700 hover:to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Verifikasi Sandi &amp; Masuk</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveLoginMode('QUICK_OPERATIONAL')}
                    className="text-xs text-teal-800 hover:text-teal-950 font-bold underline"
                  >
                    ← Kembali ke Akses Cepat Dokter, Perawat, PJLP &amp; Penyedia (Tanpa Sandi)
                  </button>
                </div>
              </form>

              {/* Database & Sync Status Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Database: <strong>{allUsers.length} Petugas Terdaftar</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await db.pullLiveDatabaseFromGas();
                    alert(res.message);
                    if (res.success) window.location.reload();
                  }}
                  className="text-teal-800 hover:text-teal-950 font-semibold inline-flex items-center gap-1.5 transition text-[11px]"
                  title="Tarik daftar pengguna terbaru langsung dari Google Spreadsheet"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan Akun dari GAS</span>
                </button>
              </div>
            </div>
          )}

          {/* Supported Roles Badges */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-3">
              Peran Petugas yang Didukung Sistem:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Dokter DPJP
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Perawat Bangsal
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Ahli Gizi (Nutrisionis)
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Penyedia Makanan (Katering)
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                PJLP Pramusaji Bangsal
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Administrator Sistem
              </span>
            </div>
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
