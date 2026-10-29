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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISCHARGED'>('ACTIVE');
  const [showAddModal, setShowAddModal] = useState(false);

  // Discharge Patient State
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);
  const [dischargeDate, setDischargeDate] = useState(getTodayISODateJakarta());
  const [dischargeNotes, setDischargeNotes] = useState('');

  // Readmit Patient State
  const [patientToReadmit, setPatientToReadmit] = useState<Patient | null>(null);
  const [readmitRoomBed, setReadmitRoomBed] = useState(rooms[0]?.id || '');
  const [readmitDiagnosis, setReadmitDiagnosis] = useState('');

  // Form state for new patient
  const [mrn, setMrn] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [birthDate, setBirthDate] = useState('1970-01-01');
  const [selectedRoomBed, setSelectedRoomBed] = useState(rooms[0]?.id || '');
  const [admissionDate, setAdmissionDate] = useState(getTodayISODateJakarta());
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  const currentUser = db.getCurrentUser();

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clinicalDiagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRoom = filterRoom === 'ALL' || p.room === filterRoom;
    const matchesStatus =
      statusFilter === 'ALL' ? true : p.status === statusFilter;

    return matchesSearch && matchesRoom && matchesStatus;
  });

  const activeCount = patients.filter((p) => p.status === 'ACTIVE').length;
  const dischargedCount = patients.filter((p) => p.status === 'DISCHARGED').length;

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
    setMrn('');
    setName('');
    setClinicalDiagnosis('');
    setAllergiesInput('');
    setDietaryRestrictions('');
    onPatientUpdated();
  };

  const handleConfirmDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientToDischarge) return;

    const res = db.dischargePatient({
      patientId: patientToDischarge.id,
      dischargedBy: currentUser.name,
      dischargeDate,
      dischargeNotes: dischargeNotes.trim(),
    });

    alert(res.message);
    setPatientToDischarge(null);
    setDischargeNotes('');
    onPatientUpdated();
  };

  const handleConfirmReadmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientToReadmit) return;

    const roomObj = rooms.find((r) => r.id === readmitRoomBed) || rooms[0];
    const res = db.readmitPatient({
      patientId: patientToReadmit.id,
      room: roomObj.room,
      bed: roomObj.bed,
      readmittedBy: currentUser.name,
      clinicalDiagnosis: readmitDiagnosis.trim() || patientToReadmit.clinicalDiagnosis,
    });

    alert(res.message);
    setPatientToReadmit(null);
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
            Manajemen pasien rawat inap, status kepulangan, riwayat diagnosis medis, dan pantangan diet gizi
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
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs w-full md:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-teal-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rawat Inap Aktif ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DISCHARGED')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              statusFilter === 'DISCHARGED'
                ? 'bg-white text-slate-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sudah Pulang ({dischargedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({patients.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto flex-1 md:max-w-md">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama, No RM, atau Diagnosis..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white w-full sm:w-auto"
          >
            <option value="ALL">Semua Ruangan</option>
            <option value="Ruang Flamboyan">Ruang Flamboyan</option>
            <option value="Ruang Teratai">Ruang Teratai</option>
            <option value="Ruang Dahlia">Ruang Dahlia</option>
            <option value="Ruang Bougenville">Ruang Bougenville</option>
          </select>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => {
          const age = calculateAgeAtDate(patient.birthDate, getTodayISODateJakarta());
          const isDischarged = patient.status === 'DISCHARGED';

          return (
            <div
              key={patient.id}
              className={`bg-white rounded-xl border p-4 shadow-sm transition-all space-y-3 ${
                isDischarged
                  ? 'border-slate-200 bg-slate-50/50 opacity-90'
                  : 'border-slate-200 hover:border-teal-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-teal-800">{patient.mrn}</span>
                    {isDischarged ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        SUDAH PULANG
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        AKTIF RAWAT INAP
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">{patient.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} · Usia: {age.displayText} ({formatJakartaDate(patient.birthDate)})
                  </p>
                </div>

                <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                  isDischarged
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {patient.room} · {patient.bed}
                </span>
              </div>

              <div className="space-y-1.5 text-xs bg-white p-2.5 rounded-lg border border-slate-100">
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
                {isDischarged && patient.dischargeNotes && (
                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-semibold text-purple-900">
                      Catatan Kepulangan (Ahli Gizi/Dokter):
                    </span>
                    <p className="text-slate-700 text-[11px] italic bg-purple-50/50 p-1.5 rounded border border-purple-100 mt-0.5">
                      &ldquo;{patient.dischargeNotes}&rdquo;
                    </p>
                    {patient.dischargedBy && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Dipulangkan oleh: <strong>{patient.dischargedBy}</strong>
                        {patient.dischargeDate && ` · Tgl: ${formatJakartaDate(patient.dischargeDate)}`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Tgl Masuk: {formatJakartaDate(patient.admissionDate)}</span>

                <div className="flex items-center gap-1.5">
                  {!isDischarged ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPatientToDischarge(patient);
                        setDischargeDate(getTodayISODateJakarta());
                        setDischargeNotes('');
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Tandai Pasien Pulang</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPatientToReadmit(patient);
                        setReadmitDiagnosis(patient.clinicalDiagnosis);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-[11px] font-semibold transition-colors"
                    >
                      <span>Rawat Kembali</span>
                    </button>
                  )}
                </div>
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

      {/* Modal: Discharge Patient (Tandai Pasien Pulang) */}
      {patientToDischarge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-teal-800 font-bold">{patientToDischarge.mrn}</span>
                <h3 className="text-base font-bold text-slate-900">
                  Formulir Kepulangan Pasien Rawat Inap
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPatientToDischarge(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Patient Snapshot */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
              <div className="flex items-center justify-between font-semibold text-amber-900">
                <span>{patientToDischarge.name}</span>
                <span>{patientToDischarge.room} · {patientToDischarge.bed}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Diagnosis: {patientToDischarge.clinicalDiagnosis}
              </p>
              <p className="text-[11px] text-slate-500">
                Tgl Masuk Rawat: {formatJakartaDate(patientToDischarge.admissionDate)}
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] leading-relaxed">
              <strong>Peringatan SOP Gizi:</strong> Menandai pasien pulang akan otomatis membatalkan seluruh pesanan makan rawat inap yang belum tersaji, serta menghentikan pembebanan biaya catering berikutnya.
            </div>

            <form onSubmit={handleConfirmDischarge} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pasien Keluar / Pulang *</label>
                <input
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Petugas yang Memulangkan</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.name} (${currentUser.role})`}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-slate-100 rounded-lg text-xs text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Ringkasan Kepulangan & Instruksi Diet Rumah *
                </label>
                <textarea
                  rows={3}
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                  placeholder="Contoh: Kondisi klinis membaik. Diberikan edukasi diet rendah garam dan leaflet gizi hipertensi. Kontrol ulang poli rawat jalan..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPatientToDischarge(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Konfirmasi Pasien Pulang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Readmit Patient */}
      {patientToReadmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-teal-800 font-bold">{patientToReadmit.mrn}</span>
                <h3 className="text-base font-bold text-slate-900">
                  Rawat Kembali Pasien (Readmit)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPatientToReadmit(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Aktifkan kembali status rawat inap untuk pasien <strong>{patientToReadmit.name}</strong>.
            </p>

            <form onSubmit={handleConfirmReadmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Ruang & Bed Rawat Inap Baru *</label>
                <select
                  value={readmitRoomBed}
                  onChange={(e) => setReadmitRoomBed(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room} - {r.bed} ({r.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diagnosis Masuk Terbaru</label>
                <input
                  type="text"
                  value={readmitDiagnosis}
                  onChange={(e) => setReadmitDiagnosis(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPatientToReadmit(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-sm"
                >
                  Aktifkan Rawat Inap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
