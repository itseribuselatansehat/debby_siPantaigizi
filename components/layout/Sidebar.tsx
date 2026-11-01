'use client';

import React from 'react';
import { UserRole } from '@/types/nutrition';
import {
  LayoutDashboard,
  Users,
  Utensils,
  CheckCircle,
  Truck,
  ClipboardCheck,
  Share2,
  PieChart,
  BookOpen,
  Receipt,
  FileText,
  History,
  Settings,
  X,
  ChefHat,
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  counts: {
    pendingNutrition: number;
    pendingProvider: number;
    pendingReceiving: number;
    pendingDistribution: number;
    pendingLeftovers: number;
  };
}

export function Sidebar({
  activeModule,
  setActiveModule,
  isOpen,
  onClose,
  userRole,
  counts,
}: SidebarProps) {
  // If role is DOKTER_PERAWAT, DOKTER, or PERAWAT, display 3 menus:
  // (dashboard, pasien rawat inap, order makanan pasien)
  if (userRole === 'DOKTER_PERAWAT' || userRole === 'DOKTER' || userRole === 'PERAWAT') {
    const doctorMenus = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'patients', label: 'Pasien Rawat Inap', icon: Users },
      { id: 'orders', label: 'Order Makanan Pasien', icon: Utensils },
    ];

    return (
      <>
        {isOpen && (
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                PG
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">SI PANTAI GIZI</p>
                <p className="text-[10px] text-teal-700 font-medium">Portal Dokter & Perawat</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-3 space-y-1">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Menu Utama Pelayanan
            </p>
            {doctorMenus.map((item) => {
              const isActive = activeModule === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveModule(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-teal-700 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-800">Puskesmas Kepulauan Seribu</p>
            <p className="text-[10px] text-slate-400">Order terhubung langsung via WhatsApp ke Gizi</p>
          </div>
        </aside>
      </>
    );
  }

  // Simplified and streamlined menus for other roles
  const menuGroups = [
    {
      title: 'Pelayanan & Alur SOP',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'AHLI_GIZI', 'PENYEDIA', 'PJLP_PRAMUSAJI'] },
        { id: 'patients', label: 'Pasien Rawat Inap', icon: Users, roles: ['ADMIN', 'AHLI_GIZI', 'PJLP_PRAMUSAJI'] },
        { id: 'orders', label: 'Order Pasien', icon: Utensils, roles: ['ADMIN', 'AHLI_GIZI'] },
        { id: 'nutrition_review', label: 'Persetujuan Gizi', icon: CheckCircle, badge: counts.pendingNutrition, roles: ['ADMIN', 'AHLI_GIZI'] },
        { id: 'provider_orders', label: 'Dapur Penyedia', icon: ChefHat, badge: counts.pendingProvider, roles: ['ADMIN', 'AHLI_GIZI', 'PENYEDIA'] },
        { id: 'receiving', label: 'Penerimaan Makanan', icon: ClipboardCheck, badge: counts.pendingReceiving, roles: ['ADMIN', 'PJLP_PRAMUSAJI', 'AHLI_GIZI', 'PENYEDIA'] },
        { id: 'distribution', label: 'Distribusi & Etiket', icon: Share2, badge: counts.pendingDistribution, roles: ['ADMIN', 'PJLP_PRAMUSAJI', 'AHLI_GIZI'] },
        { id: 'leftovers', label: 'Monitoring Sisa', icon: PieChart, badge: counts.pendingLeftovers, roles: ['ADMIN', 'PJLP_PRAMUSAJI', 'AHLI_GIZI'] },
      ],
    },
    {
      title: 'Administrasi & Data',
      items: [
        { id: 'billing', label: 'Rekap Tagihan', icon: Receipt, roles: ['ADMIN', 'AHLI_GIZI', 'PENYEDIA'] },
        { id: 'reports', label: 'Laporan Bulanan', icon: FileText, roles: ['ADMIN', 'AHLI_GIZI', 'PENYEDIA'] },
        { id: 'user_management', label: 'Pengaturan Pengguna', icon: Users, roles: ['ADMIN'] },
        { id: 'master_menu_diet', label: 'Master Data', icon: BookOpen, roles: ['ADMIN', 'AHLI_GIZI'] },
        { id: 'audit_logs', label: 'Audit Log', icon: History, roles: ['ADMIN', 'AHLI_GIZI'] },
        { id: 'settings', label: 'Pengaturan & GAS', icon: Settings, roles: ['ADMIN'] },
      ],
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              PG
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">SI PANTAI GIZI</p>
              <p className="text-[10px] text-teal-700 font-medium">Puskesmas Kep. Seribu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {menuGroups.map((group, gIdx) => {
            const accessibleItems = group.items.filter((item) => item.roles.includes(userRole));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </p>
                {accessibleItems.map((item) => {
                  const isActive = activeModule === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveModule(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-teal-700 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                            isActive ? 'bg-white text-teal-800' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-700">Zona Waktu:</span>
            <span className="font-mono text-teal-800">Asia/Jakarta</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            SOP Gizi Rawat Inap & Dukungan PWA Mobile
          </p>
        </div>
      </aside>
    </>
  );
}
