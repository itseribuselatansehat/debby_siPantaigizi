'use client';

import React, { useState } from 'react';
import { UserProfile, UserRole } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import {
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Bell,
  Menu,
  FileSpreadsheet,
  Compass,
  LogOut,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from 'lucide-react';
import { PWAInstallButton } from '@/components/common/PWAInstallButton';

interface NavbarProps {
  currentUser: UserProfile;
  pendingCount: number;
  onToggleSidebar: () => void;
  onOpenGasModal: () => void;
  onOpenLanding: () => void;
  activeModule: string;
  setActiveModule: (m: string) => void;
}

export function Navbar({
  currentUser,
  pendingCount,
  onToggleSidebar,
  onOpenGasModal,
  onOpenLanding,
  activeModule,
  setActiveModule,
}: NavbarProps) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTargetUser, setSelectedTargetUser] = useState<UserProfile | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const db = DbStore.getInstance();
  const allUsers = db.getUsers();
  const settings = db.getSettings();

  // Hanya pengguna pelaksana (Dokter, Perawat, Penyedia, Pramusaji) yang tampil di switcher cepat
  const quickUsers = allUsers.filter((u) => u.role !== 'ADMIN' && u.role !== 'AHLI_GIZI');
  const privilegedUsers = allUsers.filter((u) => u.role === 'ADMIN' || u.role === 'AHLI_GIZI');

  const handleSelectRole = (user: UserProfile) => {
    db.setCurrentUser(user);
    setShowRoleDropdown(false);
    // If switching to doctor/perawat and active module is not one of their 3 menus, reset to dashboard
    if ((user.role === 'DOKTER_PERAWAT' || user.role === 'DOKTER' || user.role === 'PERAWAT') && !['dashboard', 'patients', 'orders'].includes(activeModule)) {
      setActiveModule('dashboard');
    }
  };

  const handleVerifyAndSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!selectedTargetUser) {
      setAuthError('Silakan pilih akun petugas.');
      return;
    }
    const expected = selectedTargetUser.password || 'password123';
    if (authPassword !== expected) {
      setAuthError('Kata sandi yang Anda masukkan tidak sesuai.');
      return;
    }
    handleSelectRole(selectedTargetUser);
    setShowAuthModal(false);
    setAuthPassword('');
    setSelectedTargetUser(null);
  };

  const roleLabelMap: Record<UserRole, string> = {
    ADMIN: 'Administrator Sistem',
    DOKTER: 'Dokter DPJP',
    PERAWAT: 'Perawat Bangsal',
    DOKTER_PERAWAT: 'Dokter / Perawat',
    AHLI_GIZI: 'Ahli Gizi (Nutrisionis)',
    PENYEDIA: 'Penyedia Makanan',
    PJLP_PRAMUSAJI: 'PJLP / Pramusaji',
  };

  const isDoctorNurse = currentUser.role === 'DOKTER_PERAWAT' || currentUser.role === 'DOKTER' || currentUser.role === 'PERAWAT';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand & Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            onClick={() => setActiveModule('dashboard')}
            className="cursor-pointer flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              PG
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                SI PANTAI GIZI
              </span>
              <span className="text-[10px] text-teal-800 font-medium block">
                Puskesmas Kepulauan Seribu Selatan
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Restricted for DOKTER_PERAWAT as requested) */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-600">
          {isDoctorNurse ? (
            <>
              <button
                type="button"
                onClick={() => setActiveModule('dashboard')}
                className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                  activeModule === 'dashboard' ? 'text-teal-900 font-bold' : ''
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('patients')}
                className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                  activeModule === 'patients' ? 'text-teal-900 font-bold' : ''
                }`}
              >
                Pasien Rawat Inap
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('orders')}
                className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                  activeModule === 'orders' ? 'text-teal-900 font-bold' : ''
                }`}
              >
                Order Makanan Pasien
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveModule('dashboard')}
                className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                  activeModule === 'dashboard' ? 'text-teal-900 font-bold' : ''
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('orders')}
                className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                  activeModule === 'orders' ? 'text-teal-900 font-bold' : ''
                }`}
              >
                Order Pasien
              </button>
              {currentUser.role === 'AHLI_GIZI' && (
                <button
                  type="button"
                  onClick={() => setActiveModule('nutrition_review')}
                  className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                    activeModule === 'nutrition_review' ? 'text-teal-900 font-bold' : ''
                  }`}
                >
                  Verifikasi Gizi
                </button>
              )}
              {currentUser.role === 'PENYEDIA' && (
                <button
                  type="button"
                  onClick={() => setActiveModule('provider_orders')}
                  className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                    activeModule === 'provider_orders' ? 'text-teal-900 font-bold' : ''
                  }`}
                >
                  Dapur & Pengiriman
                </button>
              )}
              {currentUser.role === 'PJLP_PRAMUSAJI' && (
                <button
                  type="button"
                  onClick={() => setActiveModule('receiving')}
                  className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                    activeModule === 'receiving' ? 'text-teal-900 font-bold' : ''
                  }`}
                >
                  Penerimaan
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveModule('distribution')}
                className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                  activeModule === 'distribution' ? 'text-teal-900 font-bold' : ''
                }`}
              >
                Distribusi & Etiket
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('leftovers')}
                className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                  activeModule === 'leftovers' ? 'text-teal-900 font-bold' : ''
                }`}
              >
                Monitoring Sisa
              </button>
              {(currentUser.role === 'AHLI_GIZI' || currentUser.role === 'ADMIN' || currentUser.role === 'PENYEDIA') && (
                <button
                  type="button"
                  onClick={() => setActiveModule('billing')}
                  className={`whitespace-nowrap transition-colors hover:text-teal-800 ${
                    activeModule === 'billing' ? 'text-teal-900 font-bold' : ''
                  }`}
                >
                  Rekap Tagihan
                </button>
              )}
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action Zone with PWA Install, Role Switcher & Spreadsheet Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Beranda & Filosofi Button */}
          <button
            type="button"
            onClick={onOpenLanding}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition"
            title="Kembali ke Landing Page, Filosofi & Ganti Akun"
          >
            <Compass className="w-3.5 h-3.5 text-teal-700" />
            <span className="whitespace-nowrap">Beranda & Filosofi</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
          {/* Google Sheets / GAS connection button - HANYA TAMPIL UNTUK ADMIN SESUAI PERMINTAAN */}
          {currentUser.role === 'ADMIN' && (
            <button
              type="button"
              onClick={onOpenGasModal}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                settings.gasWebAppUrl
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Integrasi Google Apps Script & Google Sheets (Khusus Administrator)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="whitespace-nowrap">
                {settings.gasWebAppUrl ? 'Terkoneksi Sheets' : 'Koneksikan GAS'}
              </span>
            </button>
          )}

          {/* Pending notification bell */}
          <button
            type="button"
            onClick={() => setActiveModule('nutrition_review')}
            className="relative p-2 text-slate-600 hover:text-teal-900 hover:bg-teal-50/50 rounded-lg transition-colors"
            title="Antrean Tugas SOP"
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-rose-600 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Switch Role Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-600 bg-white shadow-sm text-left transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-teal-700 font-medium">
                  {roleLabelMap[currentUser.role]}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Pilih Petugas Pelaksana</p>
                    <p className="text-[10px] text-slate-500">Akses cepat operasional (1-klik)</p>
                  </div>
                </div>
                <div className="py-1 max-h-60 overflow-y-auto space-y-0.5">
                  {quickUsers.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectRole(user)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-start gap-2.5 transition-colors ${
                          isSelected
                            ? 'bg-teal-50 text-teal-900 font-medium'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <ShieldCheck
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isSelected ? 'text-teal-700' : 'text-slate-400'
                          }`}
                        />
                        <div className="overflow-hidden">
                          <p className="font-semibold truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-500">{roleLabelMap[user.role]}</p>
                          <p className="text-[9px] text-slate-400 truncate">{user.unitOrWard}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Akses Khusus Admin & Ahli Gizi dengan Password */}
                <div className="pt-2 mt-1 border-t border-slate-100 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setSelectedTargetUser(privilegedUsers[0] || null);
                      setAuthPassword('');
                      setAuthError('');
                      setShowAuthModal(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Login Admin &amp; Ahli Gizi</span>
                    </span>
                    <span className="text-[9px] text-indigo-700 bg-white px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                      Kata Sandi
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenLanding();
                    }}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Kembali ke Beranda &amp; Login Utama</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Verifikasi Kredensial Khusus Admin & Ahli Gizi */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-amber-300 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Verifikasi Sandi Petugas</h3>
                  <p className="text-[11px] text-indigo-200">Khusus Administrator &amp; Ahli Gizi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyAndSwitch} className="p-5 space-y-4">
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Pilih Akun yang Dituju
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {privilegedUsers.map((pUser) => {
                    const isTarget = selectedTargetUser?.id === pUser.id;
                    return (
                      <button
                        key={pUser.id}
                        type="button"
                        onClick={() => setSelectedTargetUser(pUser)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                          isTarget
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-medium'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <ShieldCheck
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isTarget ? 'text-indigo-700' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <p className="text-xs font-bold">{pUser.name}</p>
                          <p className="text-[10px] text-slate-500">{roleLabelMap[pUser.role]}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Kata Sandi Petugas
                  </label>
                  <span className="text-[10px] text-slate-400">Default: password123</span>
                </div>
                <div className="relative">
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full px-3 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verifikasi &amp; Masuk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
