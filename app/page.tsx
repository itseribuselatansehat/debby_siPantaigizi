'use client';

import React, { useEffect, useState } from 'react';
import { DbStore } from '@/lib/db-store';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LandingPage } from '@/components/landing/LandingPage';
import { NutrisionistDashboard } from '@/components/dashboard/NutrisionistDashboard';
import { PatientsModule } from '@/components/modules/PatientsModule';
import { OrderMealModule } from '@/components/modules/OrderMealModule';
import { NutritionReviewModule } from '@/components/modules/NutritionReviewModule';
import { ProviderModule } from '@/components/modules/ProviderModule';
import { FoodReceivingModule } from '@/components/modules/FoodReceivingModule';
import { PatientDistributionModule } from '@/components/modules/PatientDistributionModule';
import { LeftoversMonitoringModule } from '@/components/modules/LeftoversMonitoringModule';
import { BillingModule } from '@/components/modules/BillingModule';
import { ReportsModule } from '@/components/modules/ReportsModule';
import { MasterDataModule } from '@/components/modules/MasterDataModule';
import { AuditLogModule } from '@/components/modules/AuditLogModule';
import { GasSettingsModule } from '@/components/modules/GasSettingsModule';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';
import { UserProfile } from '@/types/nutrition';

export default function HomePage() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [, setTick] = useState(0);

  const db = DbStore.getInstance();

  useEffect(() => {
    db.hydrateFromLocalStorage();
    const unsubscribe = db.subscribe(() => {
      setTick((t) => t + 1);
    });

    return () => unsubscribe();
  }, [db]);

  const currentUser = db.getCurrentUser();
  const orders = db.getOrders();
  const patients = db.getPatients();
  const menus = db.getMenus();
  const auditLogs = db.getAuditLogs();

  // Pending counts
  const pendingNutrition = orders.filter((o) => o.status === 'SUBMITTED' || o.status === 'NUTRITION_REVIEW').length;
  const pendingProvider = orders.filter((o) => o.status === 'SENT_TO_PROVIDER').length;
  const pendingReceiving = orders.filter((o) => ['READY_TO_DELIVER', 'IN_DELIVERY'].includes(o.status)).length;
  const pendingDistribution = orders.filter((o) => ['RECEIVED_BY_WAITER', 'DISTRIBUTION_IN_PROGRESS'].includes(o.status)).length;
  const pendingLeftovers = orders.filter((o) => o.status === 'DELIVERED_TO_PATIENT').length;

  const totalPending = pendingNutrition + pendingProvider + pendingReceiving + pendingDistribution + pendingLeftovers;

  const refreshData = () => {
    setTick((t) => t + 1);
  };

  const handleLoginAsUser = (user: UserProfile) => {
    db.setCurrentUser(user);
    try {
      localStorage.setItem('SI_PANTAI_GIZI_session_active', 'true');
    } catch {
      // ignore
    }
    setShowLanding(false);
    setActiveModule('dashboard');
  };

  const handleOpenLanding = () => {
    setShowLanding(true);
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <NutrisionistDashboard
            orders={orders}
            patients={patients}
            onNavigate={(mod) => setActiveModule(mod)}
          />
        );
      case 'patients':
        return <PatientsModule patients={patients} onPatientUpdated={refreshData} />;
      case 'orders':
        return (
          <OrderMealModule
            orders={orders}
            patients={patients}
            menus={menus}
            onOrderUpdated={refreshData}
          />
        );
      case 'nutrition_review':
        return <NutritionReviewModule orders={orders} onOrderUpdated={refreshData} />;
      case 'provider_orders':
      case 'preparation_delivery':
        return <ProviderModule orders={orders} onOrderUpdated={refreshData} />;
      case 'receiving':
      case 'quality_checklist':
        return <FoodReceivingModule orders={orders} onOrderUpdated={refreshData} />;
      case 'distribution':
        return <PatientDistributionModule orders={orders} onOrderUpdated={refreshData} />;
      case 'leftovers':
        return <LeftoversMonitoringModule orders={orders} onOrderUpdated={refreshData} />;
      case 'user_management':
        return <MasterDataModule initialTab="USERS" />;
      case 'master_menu_diet':
        return <MasterDataModule initialTab="USERS" />;
      case 'master_pricing':
        return <MasterDataModule initialTab="MENUS" />;
      case 'billing':
        return <BillingModule orders={orders} onOrderUpdated={refreshData} />;
      case 'reports':
        return <ReportsModule orders={orders} patients={patients} />;
      case 'audit_logs':
        return <AuditLogModule logs={auditLogs} />;
      case 'settings':
        if (currentUser.role !== 'ADMIN') {
          return (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold text-lg">
                ✕
              </div>
              <h3 className="font-bold text-slate-900 text-base">Akses Khusus Administrator</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pengaturan integrasi Google Apps Script (GAS) dan Google Sheets hanya dapat diakses oleh akun dengan peran Administrator.
              </p>
              <button
                type="button"
                onClick={() => setActiveModule('dashboard')}
                className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition"
              >
                Kembali ke Dashboard
              </button>
            </div>
          );
        }
        return <GasSettingsModule />;
      default:
        return (
          <NutrisionistDashboard
            orders={orders}
            patients={patients}
            onNavigate={(mod) => setActiveModule(mod)}
          />
        );
    }
  };

  // If user requested Landing Page / not logged in yet, render LandingPage
  if (showLanding) {
    return (
      <>
        <OfflineIndicator />
        <LandingPage onLoginAsUser={handleLoginAsUser} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <OfflineIndicator />
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        pendingCount={totalPending}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenGasModal={() => setActiveModule('settings')}
        onOpenLanding={handleOpenLanding}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={currentUser.role}
          counts={{
            pendingNutrition,
            pendingProvider,
            pendingReceiving,
            pendingDistribution,
            pendingLeftovers,
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 flex flex-col">
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {renderActiveModule()}
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 no-print">
            <p className="font-semibold text-slate-800">
              SI PANTAI GIZI — Puskesmas Kepulauan Seribu Selatan
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sistem Pemantauan Asupan Nutrisi, Tagihan, dan Distribusi Gizi SOP Rawat Inap Terpadu · Waktu Server: Asia/Jakarta
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
