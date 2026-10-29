'use client';

import React, { useState } from 'react';
import { Patient } from '@/types/nutrition';
import { DbStore } from '@/lib/db-store';
import { calculateAgeAtDate, formatJakartaDate, getTodayISODateJakarta } from '@/lib/date-utils';
import {
  Users,
  UserPlus,
  Search,
  Bed,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Phone,
  FileText,
} from 'lucide-react';

interface PatientsModuleProps {
  patients: Patient[];
  onPatientUpdated: () => void;
}

export function PatientsModule({ patients, onPatientUpdated }: PatientsModuleProps) {
  const db = DbStore.getInstance();
  const rooms = db.getRooms();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoom, setFilterRoom] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [mrn, setMrn] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [birthDate, setBirthDate] = useState('1970-01-01');
  const [selectedRoomBed, setSelectedRoomBed] = useState(rooms[0]?.id || '');
  const [admissionDate, setAdmissionDate] = useState(getTodayISODateJakarta());
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clinicalDiagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRoom = filterRoom === 'ALL' || p.room === filterRoom;
    return matchesSearch && matchesRoom;
  });

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mrn.trim()) {
      alert('Nama Pasien dan Nomor Rekam Medis (RM) wajib diisi.');
      return;
    }

    const roomObj = rooms.find((r) => r.id === selectedRoomBed) || rooms[0];
    const allergies = allergiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    db.addPatient({
      mrn: mrn.trim().toUpperCase(),
      name: name.trim(),
      gender,
      birthDate,
      room: roomObj.room,
      bed: roomObj.bed,
      admissionDate,
      status: 'ACTIVE',
      clinicalDiagnosis: clinicalDiagnosis.trim(),
      foodAllergies: allergies,
      dietaryRestrictions: dietaryRestrictions.trim(),
    });

    setShowAddModal(false);
    // Reset form
    setMrn('');
    setName('');
    setClinicalDiagnosis('');
    setAllergiesInput('');
    setDietaryRestrictions('');
    onPatientUpdated();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            <span>Master Pasien Rawat Inap Puskesmas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Data rekam medis pasien aktif, ruang rawat inap, riwayat diagnosis medis, dan pantangan alergi
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Daftarkan Pasien Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Pasien, Nomor Rekam Medis (RM), atau Diagnosis..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white w-full sm:w-auto"
        >
          <option value="ALL">Semua Ruang Rawat</option>
          <option value="Ruang Flamboyan">Ruang Flamboyan</option>
          <option value="Ruang Teratai">Ruang Teratai</option>
          <option value="Ruang Dahlia">Ruang Dahlia</option>
          <option value="Ruang Bougenville">Ruang Bougenville</option>
        </select>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => {
          const age = calculateAgeAtDate(patient.birthDate, getTodayISODateJakarta());
          return (
            <div
              key={patient.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-500 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[11px] font-bold text-teal-800">{patient.mrn}</span>
                  <h3 className="font-bold text-slate-900 text-sm">{patient.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} · Usia: {age.displayText} ({formatJakartaDate(patient.birthDate)})
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  {patient.room} · {patient.bed}
                </span>
              </div>

              <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block">Diagnosis Medis:</span>
                  <p className="font-medium text-slate-800">{patient.clinicalDiagnosis}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Alergi & Pantangan Makanan:</span>
                  <p className="font-semibold text-rose-700">
                    {patient.foodAllergies.length > 0 ? patient.foodAllergies.join(', ') : 'Tidak ada riwayat alergi'}
                  </p>
                </div>
                {patient.dietaryRestrictions && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Instruksi Diet:</span>
                    <p className="text-slate-600 text-[11px]">{patient.dietaryRestrictions}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Tgl Masuk: {formatJakartaDate(patient.admissionDate)}</span>
                <span className="text-emerald-700 font-semibold">● Rawat Inap Aktif</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Patient */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Pendaftaran Pasien Rawat Inap Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Rekam Medis (RM) *</label>
                  <input
                    type="text"
                    value={mrn}
                    onChange={(e) => setMrn(e.target.value)}
                    placeholder="Contoh: RM-035210"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Pasien *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama sesuai KTP/BPJS"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir *</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ruangan & Tempat Tidur *</label>
                  <select
                    value={selectedRoomBed}
                    onChange={(e) => setSelectedRoomBed(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.room} — {r.bed} ({r.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Masuk Rawat Inap</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diagnosis Medis Utama *</label>
                <input
                  type="text"
                  value={clinicalDiagnosis}
                  onChange={(e) => setClinicalDiagnosis(e.target.value)}
                  placeholder="Contoh: Hipertensi Urgensi + Dispepsia"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alergi Makanan (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="Contoh: Udang, Tongkol, Telur bebek..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pantangan / Diet Khusus</label>
                <textarea
                  rows={2}
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder="Instruksi khusus dietetika dari dokter penanggung jawab..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  Simpan Data Pasien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
