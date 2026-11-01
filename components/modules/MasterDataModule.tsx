'use client';

import React, { useState } from 'react';
import { DbStore } from '@/lib/db-store';
import { formatRupiah } from '@/lib/date-utils';
import {
  DietType,
  MenuItem,
  Provider,
  UserProfile,
  UserRole,
} from '@/types/nutrition';
import {
  BookOpen,
  DollarSign,
  Bed,
  Truck,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
  Search,
  UserPlus,
} from 'lucide-react';

interface MasterDataModuleProps {
  initialTab?: 'USERS' | 'MENUS' | 'DIETS' | 'ROOMS' | 'PROVIDERS';
}

function generateRandomGiziPassword(): string {
  return `Gizi${Math.floor(1000 + Math.random() * 9000)}!`;
}

function generateFallbackMenuCode(total: number): string {
  return `MN-0${total + 1}`;
}

export function MasterDataModule({ initialTab = 'USERS' }: MasterDataModuleProps) {
  const db = DbStore.getInstance();
  const [activeTab, setActiveTab] = useState<'USERS' | 'MENUS' | 'DIETS' | 'ROOMS' | 'PROVIDERS'>(initialTab);
  const [, setTick] = useState(0);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal States
  // 1. User Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  // User Form
  const [userFormData, setUserFormData] = useState({
    name: '',
    nipOrNik: '',
    role: 'PERAWAT' as UserRole,
    email: '',
    username: '',
    password: '',
    phoneNumber: '',
    unitOrWard: '',
    providerId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // 2. Room Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<{ id: string; room: string; bed: string; type: string } | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    room: 'Ruang Rawat Inap Lt. 1',
    bed: '',
    type: 'Rawat Inap Terpadu',
  });

  // 3. Diet Modals
  const [showAddDietModal, setShowAddDietModal] = useState(false);
  const [editingDiet, setEditingDiet] = useState<DietType | null>(null);
  const [dietFormData, setDietFormData] = useState({
    code: '',
    name: '',
    description: '',
    allowedTextures: ['Biasa', 'Lunak'],
  });

  // 4. Menu Modals
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuFormData, setMenuFormData] = useState({
    code: '',
    name: '',
    dietCategoryId: 'DIET-01',
    dietCategoryName: 'Menu Standar Rawat Inap',
    texture: 'Lunak / Biasa',
    componentsText: '',
    pricePerPortion: 47000,
    contractReference: '027/SPK-GIZI/PKM-KSS/2026',
    activeFrom: '2026-01-01',
  });

  // 5. Provider Modals
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [providerFormData, setProviderFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    contractNumber: '',
    contractStart: '2026-01-01',
    contractEnd: '2026-12-31',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Feedback Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const refresh = () => setTick((t) => t + 1);

  const users = db.getUsers();
  const menus = db.getMenus();
  const dietTypes = db.getDietTypes();
  const rooms = db.getRooms();
  const providers = db.getProviders();
  const currentUser = db.getCurrentUser();

  // Role Metadata
  const roleDisplayInfo: Record<UserRole, { label: string; badgeClass: string }> = {
    ADMIN: { label: 'Administrator', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
    DOKTER: { label: 'Dokter DPJP', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
    PERAWAT: { label: 'Perawat Bangsal', badgeClass: 'bg-sky-100 text-sky-800 border-sky-200' },
    DOKTER_PERAWAT: { label: 'Dokter / Perawat', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    AHLI_GIZI: { label: 'Ahli Gizi (Nutrisionis)', badgeClass: 'bg-teal-100 text-teal-800 border-teal-200' },
    PENYEDIA: { label: 'Penyedia Makanan', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
    PJLP_PRAMUSAJI: { label: 'PJLP Pramusaji', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  };

  // --- Handlers: User Management ---
  const handleOpenAddUser = () => {
    setUserFormData({
      name: '',
      nipOrNik: '',
      role: 'PERAWAT',
      email: '',
      username: '',
      password: 'password123',
      phoneNumber: '',
      unitOrWard: 'Ruang Rawat Inap',
      providerId: '',
      status: 'ACTIVE',
    });
    setShowAddUserModal(true);
  };

  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      nipOrNik: user.nipOrNik,
      role: user.role,
      email: user.email,
      username: user.username || user.email.split('@')[0],
      password: user.password || '',
      phoneNumber: user.phoneNumber || '',
      unitOrWard: user.unitOrWard || '',
      providerId: user.providerId || '',
      status: user.status || 'ACTIVE',
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      showNotification('Nama dan Email pengguna wajib diisi', 'error');
      return;
    }

    if (editingUser) {
      const res = db.updateUser(editingUser.id, {
        name: userFormData.name,
        nipOrNik: userFormData.nipOrNik,
        role: userFormData.role,
        email: userFormData.email,
        username: userFormData.username || userFormData.email.split('@')[0],
        phoneNumber: userFormData.phoneNumber,
        unitOrWard: userFormData.unitOrWard,
        providerId: userFormData.role === 'PENYEDIA' ? userFormData.providerId : undefined,
        status: userFormData.status,
      });
      if (res.success) {
        showNotification(res.message);
        setEditingUser(null);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    } else {
      const res = db.addUser({
        name: userFormData.name,
        nipOrNik: userFormData.nipOrNik,
        role: userFormData.role,
        email: userFormData.email,
        username: userFormData.username || userFormData.email.split('@')[0],
        password: userFormData.password || 'password123',
        phoneNumber: userFormData.phoneNumber,
        unitOrWard: userFormData.unitOrWard,
        providerId: userFormData.role === 'PENYEDIA' ? userFormData.providerId : undefined,
        status: userFormData.status,
      });
      if (res.success) {
        showNotification(res.message);
        setShowAddUserModal(false);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  const handleDeleteUser = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      showNotification('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif login.', 'error');
      return;
    }
    if (confirm(`Yakin ingin menghapus pengguna "${user.name}" (${user.role})? Tindakan ini tidak dapat dibatalkan.`)) {
      const res = db.deleteUser(user.id);
      if (res.success) {
        showNotification(res.message);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  const handleOpenResetPassword = (user: UserProfile) => {
    setResettingUser(user);
    const randomPass = generateRandomGiziPassword();
    setNewGeneratedPassword(randomPass);
    setPasswordCopied(false);
  };

  const handleConfirmResetPassword = () => {
    if (!resettingUser) return;
    const res = db.resetUserPassword(resettingUser.id, newGeneratedPassword);
    if (res.success) {
      showNotification(`Password untuk ${resettingUser.name} berhasil diubah menjadi: ${res.password}`);
      setResettingUser(null);
      refresh();
    } else {
      showNotification(res.message, 'error');
    }
  };

  // --- Handlers: Rooms & Beds ---
  const handleOpenAddRoom = () => {
    setRoomFormData({
      room: 'Ruang Rawat Inap Lt. 1',
      bed: `Bed 0${rooms.length + 1}`,
      type: 'Rawat Inap Terpadu',
    });
    setShowAddRoomModal(true);
  };

  const handleOpenEditRoom = (r: { id: string; room: string; bed: string; type: string }) => {
    setEditingRoom(r);
    setRoomFormData({
      room: r.room,
      bed: r.bed,
      type: r.type,
    });
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.room.trim() || !roomFormData.bed.trim()) {
      showNotification('Nama Ruang dan Nomor Bed wajib diisi', 'error');
      return;
    }
    if (editingRoom) {
      const res = db.updateRoom(editingRoom.id, roomFormData);
      if (res.success) {
        showNotification(res.message);
        setEditingRoom(null);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    } else {
      const res = db.addRoom(roomFormData);
      if (res.success) {
        showNotification(res.message);
        setShowAddRoomModal(false);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  const handleDeleteRoom = (r: { id: string; room: string; bed: string }) => {
    if (confirm(`Hapus kamar/bed "${r.room} - ${r.bed}"?`)) {
      const res = db.deleteRoom(r.id);
      if (res.success) {
        showNotification(res.message);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  // --- Handlers: Diet Types ---
  const handleOpenAddDiet = () => {
    setDietFormData({
      code: '',
      name: '',
      description: '',
      allowedTextures: ['Biasa', 'Lunak'],
    });
    setShowAddDietModal(true);
  };

  const handleOpenEditDiet = (diet: DietType) => {
    setEditingDiet(diet);
    setDietFormData({
      code: diet.code,
      name: diet.name,
      description: diet.description,
      allowedTextures: [...diet.allowedTextures],
    });
  };

  const handleSaveDiet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietFormData.code.trim() || !dietFormData.name.trim()) {
      showNotification('Kode dan Nama Jenis Diet wajib diisi', 'error');
      return;
    }
    if (editingDiet) {
      const res = db.updateDietType(editingDiet.id, dietFormData);
      if (res.success) {
        showNotification(res.message);
        setEditingDiet(null);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    } else {
      const res = db.addDietType(dietFormData);
      if (res.success) {
        showNotification(res.message);
        setShowAddDietModal(false);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  const handleDeleteDiet = (diet: DietType) => {
    if (confirm(`Hapus jenis diet klinis "${diet.name}" (${diet.code})?`)) {
      const res = db.deleteDietType(diet.id);
      if (res.success) {
        showNotification(res.message);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  // --- Handlers: Menus & Pricing ---
  const handleOpenAddMenu = () => {
    setMenuFormData({
      code: '',
      name: '',
      dietCategoryId: 'DIET-01',
      dietCategoryName: 'Menu Standar Rawat Inap',
      texture: 'Lunak / Biasa',
      componentsText: 'Nasi, Lauk Hewani Segar, Lauk Nabati, Sayur Bening, Buah Musim',
      pricePerPortion: 47000,
      contractReference: '027/SPK-GIZI/PKM-KSS/2026',
      activeFrom: '2026-01-01',
    });
    setShowAddMenuModal(true);
  };

  const handleOpenEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu);
    setMenuFormData({
      code: menu.code,
      name: menu.name,
      dietCategoryId: menu.dietCategoryId,
      dietCategoryName: menu.dietCategoryName,
      texture: menu.texture,
      componentsText: menu.components.join(', '),
      pricePerPortion: menu.pricePerPortion,
      contractReference: menu.contractReference,
      activeFrom: menu.activeFrom,
    });
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormData.name.trim() || menuFormData.pricePerPortion <= 0) {
      showNotification('Nama Menu dan Tarif Per Porsi wajib valid', 'error');
      return;
    }
    const components = menuFormData.componentsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const menuPayload = {
      code: menuFormData.code.trim() || generateFallbackMenuCode(menus.length),
      name: menuFormData.name.trim(),
      dietCategoryId: menuFormData.dietCategoryId,
      dietCategoryName: menuFormData.dietCategoryName,
      texture: menuFormData.texture,
      components: components.length > 0 ? components : ['Menu Lengkap Gizi Seimbang'],
      providerId: providers[0]?.id || 'PROV-01',
      pricePerPortion: Number(menuFormData.pricePerPortion),
      contractReference: menuFormData.contractReference,
      activeFrom: menuFormData.activeFrom,
    };

    if (editingMenu) {
      const res = db.updateMenu(editingMenu.id, menuPayload);
      if (res.success) {
        showNotification(res.message);
        setEditingMenu(null);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    } else {
      const res = db.addMenu(menuPayload);
      if (res.success) {
        showNotification(res.message);
        setShowAddMenuModal(false);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  const handleDeleteMenu = (menu: MenuItem) => {
    if (confirm(`Hapus menu makanan "${menu.name}" (${menu.code})?`)) {
      const res = db.deleteMenu(menu.id);
      if (res.success) {
        showNotification(res.message);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  // --- Handlers: Providers ---
  const handleOpenAddProvider = () => {
    setProviderFormData({
      code: `PROV-0${providers.length + 1}`,
      name: '',
      contactPerson: '',
      phone: '',
      address: '',
      contractNumber: '027/SPK-GIZI/PKM-KSS/2026',
      contractStart: '2026-01-01',
      contractEnd: '2026-12-31',
      status: 'ACTIVE',
    });
    setShowAddProviderModal(true);
  };

  const handleOpenEditProvider = (prov: Provider) => {
    setEditingProvider(prov);
    setProviderFormData({
      code: prov.code,
      name: prov.name,
      contactPerson: prov.contactPerson,
      phone: prov.phone,
      address: prov.address,
      contractNumber: prov.contractNumber,
      contractStart: prov.contractStart,
      contractEnd: prov.contractEnd,
      status: prov.status || 'ACTIVE',
    });
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerFormData.name.trim() || !providerFormData.contactPerson.trim()) {
      showNotification('Nama Rekanan dan Kontak Person wajib diisi', 'error');
      return;
    }
    if (editingProvider) {
      const res = db.updateProvider(editingProvider.id, providerFormData);
      if (res.success) {
        showNotification(res.message);
        setEditingProvider(null);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    } else {
      const res = db.addProvider(providerFormData);
      if (res.success) {
        showNotification(res.message);
        setShowAddProviderModal(false);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  const handleDeleteProvider = (prov: Provider) => {
    if (confirm(`Hapus rekanan penyedia "${prov.name}"?`)) {
      const res = db.deleteProvider(prov.id);
      if (res.success) {
        showNotification(res.message);
        refresh();
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nipOrNik.includes(searchQuery) ||
      (u.unitOrWard && u.unitOrWard.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRole && matchQuery;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner / Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in-50 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-700" />
            <span>Master Data & Pengaturan Pengguna</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pengguna hak akses role, menu makan & tarif kontrak, jenis diet medis, kapasitas tempat tidur, dan rekanan katering Puskesmas Kepulauan Seribu Selatan
          </p>
        </div>

        {/* Action Button depending on Active Tab */}
        <div>
          {activeTab === 'USERS' && (
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          )}
          {activeTab === 'MENUS' && (
            <button
              type="button"
              onClick={handleOpenAddMenu}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu & Tarif</span>
            </button>
          )}
          {activeTab === 'DIETS' && (
            <button
              type="button"
              onClick={handleOpenAddDiet}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jenis Diet</span>
            </button>
          )}
          {activeTab === 'ROOMS' && (
            <button
              type="button"
              onClick={handleOpenAddRoom}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kamar & Bed</span>
            </button>
          )}
          {activeTab === 'PROVIDERS' && (
            <button
              type="button"
              onClick={handleOpenAddProvider}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rekanan</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Submenu Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2.5 font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'USERS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>Pengguna & Hak Akses ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MENUS')}
          className={`px-4 py-2.5 font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'MENUS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-teal-700" />
          <span>Menu Makanan & Tarif ({menus.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DIETS')}
          className={`px-4 py-2.5 font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'DIETS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-700" />
          <span>Master Jenis Diet ({dietTypes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROOMS')}
          className={`px-4 py-2.5 font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'ROOMS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <Bed className="w-4 h-4 text-teal-700" />
          <span>Ruang & Tempat Tidur ({rooms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROVIDERS')}
          className={`px-4 py-2.5 font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'PROVIDERS'
              ? 'border-teal-700 text-teal-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <Truck className="w-4 h-4 text-teal-700" />
          <span>Penyedia & Kontrak SPK ({providers.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: USERS & ROLES ================= */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, NIP/NIK, email, atau unit..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-500 whitespace-nowrap">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
              >
                <option value="ALL">Semua Role Pengguna</option>
                <option value="ADMIN">ADMIN</option>
                <option value="DOKTER">DOKTER</option>
                <option value="PERAWAT">PERAWAT</option>
                <option value="AHLI_GIZI">AHLI GIZI</option>
                <option value="PENYEDIA">PENYEDIA</option>
                <option value="PJLP_PRAMUSAJI">PJLP PRAMUSAJI</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-3 px-4">Nama Lengkap & NIP/NIK</th>
                    <th className="py-3 px-4">Hak Akses Role</th>
                    <th className="py-3 px-4">Kontak (Email / WA)</th>
                    <th className="py-3 px-4">Unit Kerja / Ruang</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada pengguna yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const meta = roleDisplayInfo[user.role] || {
                        label: user.role,
                        badgeClass: 'bg-slate-100 text-slate-700',
                      };
                      const isMe = user.id === currentUser.id;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <strong className="text-slate-900 block font-semibold text-xs">
                                  {user.name} {isMe && <span className="text-[10px] text-teal-700 font-bold">(Anda)</span>}
                                </strong>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  NIP/NIK: {user.nipOrNik || '-'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border inline-block ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{user.email}</div>
                            {user.phoneNumber && (
                              <div className="text-[11px] text-slate-400 font-mono">{user.phoneNumber}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {user.unitOrWard || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                user.status === 'INACTIVE'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {user.status === 'INACTIVE' ? 'Non-Aktif' : 'Aktif'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenResetPassword(user)}
                                className="px-2 py-1 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded text-xs flex items-center gap-1 transition"
                                title="Reset Password Pengguna"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                <span>Reset</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(user)}
                                className="px-2 py-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded text-xs flex items-center gap-1 transition"
                                title="Edit Data Pengguna"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                disabled={isMe}
                                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition ${
                                  isMe
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                                }`}
                                title={isMe ? 'Tidak bisa menghapus akun sendiri' : 'Hapus Pengguna'}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MENUS & PRICING ================= */}
      {activeTab === 'MENUS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">
              Daftar Paket Menu Makanan & Harga Per Porsi Standar Puskesmas
            </span>
            <span className="text-xs text-slate-500">{menus.length} Menu Aktif</span>
          </div>

          <div className="divide-y divide-slate-100">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {menu.code}
                    </span>
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

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 block">Tarif per Porsi:</span>
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {formatRupiah(menu.pricePerPortion)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditMenu(menu)}
                      className="px-2.5 py-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded text-xs flex items-center gap-1 border border-slate-200"
                    >
                      <Edit2 className="w-3 h-3 text-teal-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMenu(menu)}
                      className="px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded text-xs flex items-center gap-1 border border-slate-200"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: DIET TYPES ================= */}
      {activeTab === 'DIETS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {dietTypes.map((diet) => (
            <div
              key={diet.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {diet.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-medium text-slate-700">
                    Tekstur: {diet.allowedTextures.join(', ')}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{diet.name}</h3>
                <p className="text-slate-600 text-[11px] leading-relaxed">{diet.description}</p>
              </div>

              <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEditDiet(diet)}
                  className="px-2.5 py-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded text-xs flex items-center gap-1 border border-slate-200"
                >
                  <Edit2 className="w-3 h-3 text-teal-600" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDiet(diet)}
                  className="px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded text-xs flex items-center gap-1 border border-slate-200"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 4: ROOMS & BEDS ================= */}
      {activeTab === 'ROOMS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900">
              Kapasitas Kamar &amp; Tempat Tidur Rawat Inap Puskesmas
            </span>
            <span className="text-slate-500">{rooms.length} Tempat Tidur Aktif</span>
          </div>
          <div className="divide-y divide-slate-100">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div>
                  <strong className="text-slate-900 block font-semibold">
                    {r.room} — <span className="text-teal-800 font-bold">{r.bed}</span>
                  </strong>
                  <span className="text-[11px] text-slate-500">{r.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Siap Layanan
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditRoom(r)}
                    className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded"
                    title="Edit Ruangan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(r)}
                    className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                    title="Hapus Ruangan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: PROVIDERS ================= */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-4 text-xs">
          {providers.map((prov) => (
            <div
              key={prov.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-teal-800 font-bold text-[11px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {prov.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{prov.name}</h3>
                  <p className="text-slate-500 text-[11px]">
                    Kontak PIC: <strong>{prov.contactPerson}</strong> ({prov.phone})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                    STATUS: {prov.status || 'ACTIVE'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditProvider(prov)}
                    className="px-2.5 py-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded text-xs flex items-center gap-1 border border-slate-200"
                  >
                    <Edit2 className="w-3 h-3 text-teal-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProvider(prov)}
                    className="px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded text-xs flex items-center gap-1 border border-slate-200"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Hapus</span>
                  </button>
                </div>
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

      {/* ================= MODAL: TAMBAH / EDIT PENGGUNA ================= */}
      {(showAddUserModal || editingUser) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-700" />
                <span>{editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddUserModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="Contoh: dr. Farhan Pratama, Sp.A atau Ns. Ratna Wulandari, S.Kep"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP / NIK *
                  </label>
                  <input
                    type="text"
                    value={userFormData.nipOrNik}
                    onChange={(e) => setUserFormData({ ...userFormData, nipOrNik: e.target.value })}
                    placeholder="Contoh: 198904122014021001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hak Akses Role *
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-teal-900"
                    required
                  >
                    <option value="ADMIN">ADMIN (Administrator IT / Subbag TU)</option>
                    <option value="DOKTER">DOKTER (Dokter DPJP Rawat Inap)</option>
                    <option value="PERAWAT">PERAWAT (Perawat Bangsal Rawat Inap)</option>
                    <option value="AHLI_GIZI">AHLI GIZI (Nutrisionis / Dietisien)</option>
                    <option value="PENYEDIA">PENYEDIA (Katering Rekanan Gizi)</option>
                    <option value="PJLP_PRAMUSAJI">PJLP PRAMUSAJI (Petugas Saji Makanan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Resmi *
                  </label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="email@puskesmas.id"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phoneNumber}
                    onChange={(e) => setUserFormData({ ...userFormData, phoneNumber: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit Kerja / Ruangan
                  </label>
                  <input
                    type="text"
                    value={userFormData.unitOrWard}
                    onChange={(e) => setUserFormData({ ...userFormData, unitOrWard: e.target.value })}
                    placeholder="Contoh: Ruang Rawat Inap Lt. 2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={userFormData.status}
                    onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="ACTIVE">Aktif (Bisa Login)</option>
                    <option value="INACTIVE">Non-Aktif (Ditangguhkan)</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password Awal Pengguna
                  </label>
                  <input
                    type="text"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder="password123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Default: password123 (Pengguna dapat mereset kapan saja)
                  </p>
                </div>
              )}

              {userFormData.role === 'PENYEDIA' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rekanan Penyedia Makanan Terhubung
                  </label>
                  <select
                    value={userFormData.providerId}
                    onChange={(e) => setUserFormData({ ...userFormData, providerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">Pilih Rekanan Katering</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setEditingUser(null);
                  }}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambahkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET PASSWORD ================= */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Reset Password Pengguna</span>
              </h3>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
              <p>Pengguna: <strong>{resettingUser.name}</strong></p>
              <p>Email: <strong className="font-mono">{resettingUser.email}</strong></p>
              <p>Role: <strong>{resettingUser.role}</strong></p>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">
                Password Baru yang Ditetapkan:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGeneratedPassword}
                  onChange={(e) => setNewGeneratedPassword(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm font-bold text-teal-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newGeneratedPassword);
                    setPasswordCopied(true);
                    setTimeout(() => setPasswordCopied(false), 2500);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 font-semibold"
                  title="Salin Password"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{passwordCopied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Berikan password baru ini kepada petugas terkait untuk login ke sistem SI PANTAI GIZI.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs transition"
              >
                Konfirmasi &amp; Simpan Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT ROOM ================= */}
      {(showAddRoomModal || editingRoom) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Bed className="w-4 h-4 text-teal-700" />
                <span>{editingRoom ? 'Edit Kamar / Tempat Tidur' : 'Tambah Kamar / Tempat Tidur'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddRoomModal(false);
                  setEditingRoom(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Ruang Rawat *
                </label>
                <select
                  value={roomFormData.room}
                  onChange={(e) => setRoomFormData({ ...roomFormData, room: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  required
                >
                  <option value="Ruang Rawat Inap Lt. 1">Ruang Rawat Inap Lt. 1</option>
                  <option value="Ruang Rawat Inap Lt. 2 Laki-laki">Ruang Rawat Inap Lt. 2 Laki-laki</option>
                  <option value="Ruang Rawat Inap Lt. 2 Perempuan">Ruang Rawat Inap Lt. 2 Perempuan</option>
                  <option value="Ruang Rawat Inap Lt. 2 Anak-anak">Ruang Rawat Inap Lt. 2 Anak-anak</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor / Label Bed *
                </label>
                <input
                  type="text"
                  value={roomFormData.bed}
                  onChange={(e) => setRoomFormData({ ...roomFormData, bed: e.target.value })}
                  placeholder="Contoh: Bed 01, Bed 02..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tipe Bangsal / Keterangan
                </label>
                <input
                  type="text"
                  value={roomFormData.type}
                  onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                  placeholder="Contoh: Rawat Inap Terpadu Lt. 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  {editingRoom ? 'Simpan Perubahan' : 'Tambahkan Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT DIET ================= */}
      {(showAddDietModal || editingDiet) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-700" />
                <span>{editingDiet ? 'Edit Jenis Diet Klinis' : 'Tambah Jenis Diet Klinis'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddDietModal(false);
                  setEditingDiet(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDiet} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Diet *
                  </label>
                  <input
                    type="text"
                    value={dietFormData.code}
                    onChange={(e) => setDietFormData({ ...dietFormData, code: e.target.value })}
                    placeholder="MB-TKTP / RG-II"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tekstur Tersedia
                  </label>
                  <input
                    type="text"
                    value={dietFormData.allowedTextures.join(', ')}
                    onChange={(e) =>
                      setDietFormData({
                        ...dietFormData,
                        allowedTextures: e.target.value.split(',').map((t) => t.trim()),
                      })
                    }
                    placeholder="Biasa, Lunak, Saring"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Jenis Diet Medis *
                </label>
                <input
                  type="text"
                  value={dietFormData.name}
                  onChange={(e) => setDietFormData({ ...dietFormData, name: e.target.value })}
                  placeholder="Contoh: Diet Rendah Garam II (RG II)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Indikasi &amp; Pembatasan Nutrisi
                </label>
                <textarea
                  rows={3}
                  value={dietFormData.description}
                  onChange={(e) => setDietFormData({ ...dietFormData, description: e.target.value })}
                  placeholder="Penjelasan kebutuhan kalori, pantangan natrium, kadar gula, dsb..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDietModal(false);
                    setEditingDiet(null);
                  }}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  {editingDiet ? 'Simpan Perubahan' : 'Tambahkan Diet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT MENU ================= */}
      {(showAddMenuModal || editingMenu) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-700" />
                <span>{editingMenu ? 'Edit Menu & Tarif Kontrak' : 'Tambah Menu & Tarif Kontrak'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddMenuModal(false);
                  setEditingMenu(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Menu *
                  </label>
                  <input
                    type="text"
                    value={menuFormData.name}
                    onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                    placeholder="Sarapan / Makan Siang / Makan Malam"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tarif per Porsi (Rp) *
                  </label>
                  <input
                    type="number"
                    value={menuFormData.pricePerPortion}
                    onChange={(e) => setMenuFormData({ ...menuFormData, pricePerPortion: Number(e.target.value) })}
                    placeholder="25000 / 47000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-extrabold text-teal-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Menu
                  </label>
                  <input
                    type="text"
                    value={menuFormData.code}
                    onChange={(e) => setMenuFormData({ ...menuFormData, code: e.target.value })}
                    placeholder="SARAPAN-25K / SIANG-47K"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tekstur
                  </label>
                  <input
                    type="text"
                    value={menuFormData.texture}
                    onChange={(e) => setMenuFormData({ ...menuFormData, texture: e.target.value })}
                    placeholder="Lunak / Biasa"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Komponen Sajian (Pisahkan dengan koma)
                </label>
                <textarea
                  rows={2}
                  value={menuFormData.componentsText}
                  onChange={(e) => setMenuFormData({ ...menuFormData, componentsText: e.target.value })}
                  placeholder="Nasi Tim, Ikan Segar, Sayur Bening, Buah..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Referensi SPK Kontrak
                </label>
                <input
                  type="text"
                  value={menuFormData.contractReference}
                  onChange={(e) => setMenuFormData({ ...menuFormData, contractReference: e.target.value })}
                  placeholder="027/SPK-GIZI/PKM-KSS/2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMenuModal(false);
                    setEditingMenu(null);
                  }}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  {editingMenu ? 'Simpan Perubahan' : 'Tambahkan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT PROVIDER ================= */}
      {(showAddProviderModal || editingProvider) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-700" />
                <span>{editingProvider ? 'Edit Data Rekanan Penyedia' : 'Tambah Rekanan Penyedia'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddProviderModal(false);
                  setEditingProvider(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Badan Usaha / Katering *
                  </label>
                  <input
                    type="text"
                    value={providerFormData.name}
                    onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })}
                    placeholder="CV Berkah Bahari Boga Mandiri"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Rekanan
                  </label>
                  <input
                    type="text"
                    value={providerFormData.code}
                    onChange={(e) => setProviderFormData({ ...providerFormData, code: e.target.value })}
                    placeholder="PROV-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kontak Person (PIC) *
                  </label>
                  <input
                    type="text"
                    value={providerFormData.contactPerson}
                    onChange={(e) => setProviderFormData({ ...providerFormData, contactPerson: e.target.value })}
                    placeholder="Bpk. Mulyadi / Ibu Ratmi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / Telepon
                  </label>
                  <input
                    type="tel"
                    value={providerFormData.phone}
                    onChange={(e) => setProviderFormData({ ...providerFormData, phone: e.target.value })}
                    placeholder="0818-0912-3456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Dapur Rekanan
                </label>
                <textarea
                  rows={2}
                  value={providerFormData.address}
                  onChange={(e) => setProviderFormData({ ...providerFormData, address: e.target.value })}
                  placeholder="Jl. Dermaga Pelabuhan, Pulau Tidung..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor SPK Kontrak
                </label>
                <input
                  type="text"
                  value={providerFormData.contractNumber}
                  onChange={(e) => setProviderFormData({ ...providerFormData, contractNumber: e.target.value })}
                  placeholder="027/SPK-GIZI/PKM-KSS/2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mulai Kontrak
                  </label>
                  <input
                    type="date"
                    value={providerFormData.contractStart}
                    onChange={(e) => setProviderFormData({ ...providerFormData, contractStart: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Akhir Kontrak
                  </label>
                  <input
                    type="date"
                    value={providerFormData.contractEnd}
                    onChange={(e) => setProviderFormData({ ...providerFormData, contractEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProviderModal(false);
                    setEditingProvider(null);
                  }}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  {editingProvider ? 'Simpan Perubahan' : 'Tambahkan Rekanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
