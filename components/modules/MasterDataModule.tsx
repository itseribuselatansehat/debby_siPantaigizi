'use client';

import React, { useState } from 'react';
import { DbStore } from '@/lib/db-store';
import { formatRupiah } from '@/lib/date-utils';
import {
  BookOpen,
  DollarSign,
  Bed,
  Truck,
  ListChecks,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface MasterDataModuleProps {
  initialTab?: 'MENUS' | 'DIETS' | 'ROOMS' | 'PROVIDERS' | 'CHECKLIST';
}

export function MasterDataModule({ initialTab = 'MENUS' }: MasterDataModuleProps) {
  const db = DbStore.getInstance();
  const [activeTab, setActiveTab] = useState<'MENUS' | 'DIETS' | 'ROOMS' | 'PROVIDERS' | 'CHECKLIST'>(initialTab);

  const menus = db.getMenus();
  const dietTypes = db.getDietTypes();
  const rooms = db.getRooms();
  const providers = db.getProviders();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <span>Master Data Pelayanan Gizi & Fasilitas Rawat Inap</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen master menu, jenis diet klinis, tarif harga kontrak, ruangan rawat, dan penyedia makanan
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('MENUS')}
          className={`px-3.5 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'MENUS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Menu Makanan & Tarif</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DIETS')}
          className={`px-3.5 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'DIETS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Master Jenis Diet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROOMS')}
          className={`px-3.5 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'ROOMS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Ruang & Tempat Tidur</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROVIDERS')}
          className={`px-3.5 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'PROVIDERS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Penyedia & Kontrak SPK</span>
        </button>
      </div>

      {/* Tab 1: Menus & Pricing */}
      {activeTab === 'MENUS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">Daftar Menu Makanan & Harga Per Porsi Kontrak</span>
            <span className="text-xs text-slate-500">{menus.length} Menu Aktif</span>
          </div>

          <div className="divide-y divide-slate-100">
            {menus.map((menu) => (
              <div key={menu.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800">{menu.code}</span>
                    <span className="text-slate-400">·</span>
                    <strong className="text-slate-900 text-sm">{menu.name}</strong>
                  </div>
                  <p className="text-slate-600">
                    Kategori: <strong>{menu.dietCategoryName}</strong> · Tekstur: <strong className="text-teal-900">{menu.texture}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Komponen: {menu.components.join(', ')}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Dasar Kontrak: {menu.contractReference}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">Tarif per Porsi:</span>
                  <span className="text-base font-extrabold font-mono text-slate-900">
                    {formatRupiah(menu.pricePerPortion)}
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-semibold mt-0.5">● Berlaku 2026</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Diet Types */}
      {activeTab === 'DIETS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {dietTypes.map((diet) => (
            <div key={diet.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-800">{diet.code}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-medium text-slate-700">
                  Tekstur: {diet.allowedTextures.join(', ')}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{diet.name}</h3>
              <p className="text-slate-600 text-[11px] leading-relaxed">{diet.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Rooms & Beds */}
      {activeTab === 'ROOMS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-xs">
          <div className="p-4 border-b border-slate-200 font-bold text-slate-900">
            Kapasitas Tempat Tidur Rawat Inap Puskesmas
          </div>
          <div className="divide-y divide-slate-100">
            {rooms.map((r) => (
              <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <strong className="text-slate-900 block">{r.room} — {r.bed}</strong>
                  <span className="text-[11px] text-slate-500">{r.type}</span>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Siap Layanan
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Providers */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-4 text-xs">
          {providers.map((prov) => (
            <div key={prov.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-teal-800 font-bold text-[11px]">{prov.code}</span>
                  <h3 className="text-base font-bold text-slate-900">{prov.name}</h3>
                  <p className="text-slate-500 text-[11px]">Kontak: {prov.contactPerson} ({prov.phone})</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px] self-start sm:self-auto">
                  STATUS: {prov.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Alamat Dapur Rekanan:</span>
                  <p className="font-medium">{prov.address}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nomor Surat Perjanjian Kerja (SPK):</span>
                  <p className="font-mono font-semibold text-slate-900">{prov.contractNumber}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Periode: {prov.contractStart} s/d {prov.contractEnd}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
