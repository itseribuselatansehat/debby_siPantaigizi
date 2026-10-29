'use client';

import React, { useState } from 'react';
import { AuditLogEntry } from '@/types/nutrition';
import { formatJakartaDateTime } from '@/lib/date-utils';
import { History, Search, Shield, Filter, Calendar } from 'lucide-react';

interface AuditLogModuleProps {
  logs: AuditLogEntry[];
}

export function AuditLogModule({ logs }: AuditLogModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = filterModule === 'ALL' || log.module === filterModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-teal-700" />
            <span>Riwayat & Audit Log Transaksi SOP</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catatan permanen setiap perubahan status alur makan, verifikasi gizi, serah terima, foto, dan tanda tangan
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
          {logs.length} Catatan Audit Trail Tersimpan
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Order, Petugas, Aksi, atau Rincian..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white w-full sm:w-auto"
        >
          <option value="ALL">Semua Modul SOP</option>
          <option value="Order Makan Pasien">Order Makan Pasien</option>
          <option value="Persetujuan Ahli Gizi">Persetujuan Ahli Gizi</option>
          <option value="Penyedia Makanan">Penyedia Makanan</option>
          <option value="Penerimaan Makanan">Penerimaan Makanan</option>
          <option value="Distribusi Pasien">Distribusi Pasien</option>
          <option value="Monitoring Sisa Makanan">Monitoring Sisa Makanan</option>
          <option value="Rekap Tagihan Penyedia">Rekap Tagihan Penyedia</option>
          <option value="Data Pasien Rawat Inap">Data Pasien Rawat Inap</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Waktu (WIB)</th>
                <th className="py-2.5 px-3">Petugas & Peran</th>
                <th className="py-2.5 px-3">Modul SOP</th>
                <th className="py-2.5 px-3">Aksi Sistem</th>
                <th className="py-2.5 px-3">No. Referensi</th>
                <th className="py-2.5 px-3">Rincian Perubahan Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada catatan audit yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {formatJakartaDateTime(log.timestamp)}
                    </td>
                    <td className="py-2 px-3">
                      <strong className="text-slate-900 block">{log.userName}</strong>
                      <span className="text-[10px] text-teal-700 font-medium">{log.userRole}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      {log.module}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-teal-800">
                      {log.referenceId}
                    </td>
                    <td className="py-2 px-3 text-slate-700 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
