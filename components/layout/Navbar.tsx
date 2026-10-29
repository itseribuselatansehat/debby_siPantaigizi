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
} from 'lucide-react';

import { PWAInstallButton } from '@/components/common/PWAInstallButton';
import { Compass, LogOut } from 'lucide-react';

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
  const db = DbStore.getInstance();
  const allUsers = db.getUsers();
  const settings = db.getSettings();

  const handleSelectRole = (user: UserProfile) => {
    db.setCurrentUser(user);
    setShowRoleDropdown(false);
    // If switching to doctor/perawat and active module is not one of their 3 menus, reset to dashboard
    if (user.role === 'DOKTER_PERAWAT' && !['dashboard', 'patients', 'orders'].includes(activeModule)) {
      setActiveModule('dashboard');
    }
  };

  const roleLabelMap: Record<UserRole, string> = {
    ADMIN: 'Administrator Sistem',
    DOKTER_PERAWAT: 'Dokter / Perawat',
    AHLI_GIZI: 'Ahli Gizi (Nutrisionis)',
    PENYEDIA: 'Penyedia Makanan',
    PJLP_PRAMUSAJI: 'PJLP / Pramusaji',
  };

  const isDoctorNurse = currentUser.role === 'DOKTER_PERAWAT';

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
          {/* Google Sheets / GAS connection button */}
          <button
            type="button"
            onClick={onOpenGasModal}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              settings.gasWebAppUrl
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Integrasi Google Apps Script & Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="whitespace-nowrap">
              {settings.gasWebAppUrl ? 'Terkoneksi Sheets' : 'Koneksikan GAS'}
            </span>
          </button>

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
                    <p className="text-xs font-semibold text-slate-900">Ganti Akun Demo (Uji Role)</p>
                    <p className="text-[11px] text-slate-500">Pilih peran untuk menguji SOP</p>
                  </div>
                </div>
                <div className="py-1 max-h-64 overflow-y-auto space-y-0.5">
                  {allUsers.map((user) => {
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
                <div className="pt-2 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenLanding();
                    }}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 flex items-center justify-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Kembali ke Beranda & Login Utama</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
