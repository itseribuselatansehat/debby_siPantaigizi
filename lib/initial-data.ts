import {
  AppSettings,
  AuditLogEntry,
  DietType,
  MealOrder,
  MenuItem,
  Patient,
  Provider,
  QualityCheckItem,
  UserProfile,
} from '@/types/nutrition';

export const INITIAL_APP_SETTINGS: AppSettings = {
  puskesmasName: 'Puskesmas Kepulauan Seribu Selatan',
  puskesmasRegion: 'Wilayah Pesisir & Kepulauan Seribu, DKI Jakarta',
  headOfPuskesmasName: 'dr. Ignatius Dendy Purnama',
  headOfPuskesmasNip: '198607192014031004',
  address: 'Jl. Dermaga Pelabuhan Utama No. 4, Pulau Tidung, Kepulauan Seribu',
  phone: '(021) 645-8901',
  nutritionistPhone: '6281287654321',
  providerPhone: '6281809123456',
  dkiLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Coat_of_arms_of_Jakarta.svg/480px-Coat_of_arms_of_Jakarta.svg.png',
  kemenkesLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Kementerian_Kesehatan_Republik_Indonesia.svg/512px-Kementerian_Kesehatan_Republik_Indonesia.svg.png',
  gasWebAppUrl: '',
  spreadsheetId: '',
  googleDriveFolderId: '1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk',
  autoSyncGas: false,
  minFoodTempServeCelsius: 60,
  maxFoodTempServeCelsius: 75,
  defaultSchedules: [
    { id: 'SARAPAN', label: 'Sarapan Pagi (06:30 - 07:30 WIB)', price: 25000, deliveryTime: '06:30' },
    { id: 'SIANG', label: 'Makan Siang (11:30 - 12:30 WIB)', price: 47000, deliveryTime: '11:30' },
    { id: 'MALAM', label: 'Makan Malam (17:30 - 18:30 WIB)', price: 47000, deliveryTime: '17:30' },
  ],
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'drg. Hendra Setiawan',
    nipOrNik: '198205142008011003',
    role: 'ADMIN',
    email: 'admin.gizi@puskesmas.id',
    username: 'admin',
    password: 'password123',
    status: 'ACTIVE',
    phoneNumber: '081234567890',
    unitOrWard: 'Subbag Tata Usaha & IT',
  },
  {
    id: 'USR-DOC-01',
    name: 'dr. Farhan Pratama',
    nipOrNik: '198904122014021001',
    role: 'DOKTER',
    email: 'dokter@puskesmas.id',
    username: 'dokter',
    password: 'password123',
    status: 'ACTIVE',
    phoneNumber: '081398765432',
    unitOrWard: 'Pelayanan Rawat Inap & IGD',
  },
  {
    id: 'USR-NURSE-01',
    name: 'Ns. Ratna Wulandari, S.Kep',
    nipOrNik: '199307182019032004',
    role: 'PERAWAT',
    email: 'perawat@puskesmas.id',
    username: 'perawat',
    password: 'password123',
    status: 'ACTIVE',
    phoneNumber: '081512345678',
    unitOrWard: 'Ruang Rawat Inap',
  },
  {
    id: 'USR-NUTR-01',
    name: 'Siti Rahmawati, S.Tr.Gz, RD',
    nipOrNik: '199109232015032002',
    role: 'AHLI_GIZI',
    email: 'ahligizi@puskesmas.id',
    username: 'ahligizi',
    password: 'password123',
    status: 'ACTIVE',
    phoneNumber: '081287654321',
    unitOrWard: 'Instalasi Gizi & Dietetika',
  },
  {
    id: 'USR-PROV-01',
    name: 'Mulyadi (CV Berkah Bahari)',
    nipOrNik: '3171052408800002',
    role: 'PENYEDIA',
    email: 'penyedia@puskesmas.id',
    username: 'penyedia',
    password: 'password123',
    status: 'ACTIVE',
    phoneNumber: '081809123456',
    providerId: 'PROV-01',
    unitOrWard: 'Katering Rekanan Gizi',
  },
  {
    id: 'USR-WAITER-01',
    name: 'Ahmad Zaki (PJLP Pramusaji)',
    nipOrNik: '3171051509960001',
    role: 'PJLP_PRAMUSAJI',
    email: 'pramusaji@puskesmas.id',
    username: 'pramusaji',
    password: 'password123',
    status: 'ACTIVE',
    phoneNumber: '081912348765',
    unitOrWard: 'Distribusi Makanan Pasien',
  },
];

export const INITIAL_ROOMS = [
  // 1. Ruang Rawat Inap Lt. 1
  { id: 'RM-LT1-BED1', room: 'Ruang Rawat Inap Lt. 1', bed: 'Bed 01', type: 'Rawat Inap Terpadu Lt. 1' },
  { id: 'RM-LT1-BED2', room: 'Ruang Rawat Inap Lt. 1', bed: 'Bed 02', type: 'Rawat Inap Terpadu Lt. 1' },
  { id: 'RM-LT1-BED3', room: 'Ruang Rawat Inap Lt. 1', bed: 'Bed 03', type: 'Rawat Inap Terpadu Lt. 1' },
  { id: 'RM-LT1-BED4', room: 'Ruang Rawat Inap Lt. 1', bed: 'Bed 04', type: 'Rawat Inap Terpadu Lt. 1' },

  // 2. Ruang Rawat Inap Lt. 2 Laki-laki
  { id: 'RM-LT2-L-BED1', room: 'Ruang Rawat Inap Lt. 2 Laki-laki', bed: 'Bed 01', type: 'Rawat Inap Pria Lt. 2' },
  { id: 'RM-LT2-L-BED2', room: 'Ruang Rawat Inap Lt. 2 Laki-laki', bed: 'Bed 02', type: 'Rawat Inap Pria Lt. 2' },
  { id: 'RM-LT2-L-BED3', room: 'Ruang Rawat Inap Lt. 2 Laki-laki', bed: 'Bed 03', type: 'Rawat Inap Pria Lt. 2' },

  // 3. Ruang Rawat Inap Lt. 2 Perempuan
  { id: 'RM-LT2-P-BED1', room: 'Ruang Rawat Inap Lt. 2 Perempuan', bed: 'Bed 01', type: 'Rawat Inap Wanita Lt. 2' },
  { id: 'RM-LT2-P-BED2', room: 'Ruang Rawat Inap Lt. 2 Perempuan', bed: 'Bed 02', type: 'Rawat Inap Wanita Lt. 2' },
  { id: 'RM-LT2-P-BED3', room: 'Ruang Rawat Inap Lt. 2 Perempuan', bed: 'Bed 03', type: 'Rawat Inap Wanita Lt. 2' },

  // 4. Ruang Rawat Inap Lt. 2 Anak-anak
  { id: 'RM-LT2-A-BED1', room: 'Ruang Rawat Inap Lt. 2 Anak-anak', bed: 'Bed 01', type: 'Rawat Inap Pediatrik Lt. 2' },
  { id: 'RM-LT2-A-BED2', room: 'Ruang Rawat Inap Lt. 2 Anak-anak', bed: 'Bed 02', type: 'Rawat Inap Pediatrik Lt. 2' },
  { id: 'RM-LT2-A-BED3', room: 'Ruang Rawat Inap Lt. 2 Anak-anak', bed: 'Bed 03', type: 'Rawat Inap Pediatrik Lt. 2' },
];

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_DIET_TYPES: DietType[] = [
  {
    id: 'DIET-01',
    code: 'MB-TKTP',
    name: 'Diet Makanan Biasa / TKTP',
    description: 'Makanan lengkap padat gizi seimbang untuk pasien tanpa gangguan cerna berat.',
    allowedTextures: ['Biasa', 'Lunak'],
  },
  {
    id: 'DIET-02',
    code: 'RG-II',
    name: 'Diet Rendah Garam II (RG II)',
    description: 'Pengurangan natrium 600-800 mg (1/2 sdt garam dapur) untuk hipertensi dan edema.',
    allowedTextures: ['Biasa', 'Lunak'],
  },
  {
    id: 'DIET-03',
    code: 'DM-1700',
    name: 'Diet Diabetes Mellitus 1700 kkal',
    description: 'Karbohidrat kompleks berindeks glikemik rendah, jadwal dan porsi teratur.',
    allowedTextures: ['Biasa', 'Lunak'],
  },
  {
    id: 'DIET-04',
    code: 'ML-DISPEPSIA',
    name: 'Diet Makanan Lunak Lambung',
    description: 'Tekstur lembut mudah dicerna, tidak bergas, tidak asam, tidak merangsang dinding lambung.',
    allowedTextures: ['Lunak', 'Saring'],
  },
  {
    id: 'DIET-05',
    code: 'MC-CAIR',
    name: 'Diet Makanan Cair / Formula Khusus',
    description: 'Bentuk cair suspensi homogen untuk pasien dengan gangguan menelan (disfagia).',
    allowedTextures: ['Cair', 'Saring'],
  },
];

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: 'PROV-01',
    name: 'CV Berkah Bahari Boga Mandiri',
    code: 'BBB-01',
    contactPerson: 'Bpk. Mulyadi / Ibu Ratmi',
    phone: '0818-0912-3456',
    address: 'Jl. Bahari No. 12, Dermaga Barat Pulau Tidung, Kepulauan Seribu',
    contractNumber: '027/SPK-GIZI/PKM-KSS/2026',
    contractStart: '2026-01-01',
    contractEnd: '2026-12-31',
    status: 'ACTIVE',
  },
];

export const INITIAL_MENUS: MenuItem[] = [
  {
    id: 'MN-SARAPAN',
    code: 'SARAPAN-25K',
    name: 'Sarapan',
    dietCategoryId: 'DIET-01',
    dietCategoryName: 'Menu Standar Rawat Inap',
    texture: 'Lunak / Biasa',
    components: ['Menu Sarapan Pasien Rawat Inap Puskesmas (Sesuai Preskripsi Diet Medis)'],
    providerId: 'PROV-01',
    pricePerPortion: 25000,
    contractReference: '027/SPK-GIZI/PKM-KSS/2026 Sarapan',
    activeFrom: '2026-01-01',
  },
  {
    id: 'MN-SIANG',
    code: 'SIANG-47K',
    name: 'Makan Siang',
    dietCategoryId: 'DIET-01',
    dietCategoryName: 'Menu Standar Rawat Inap',
    texture: 'Lunak / Biasa',
    components: ['Menu Makan Siang Pasien Rawat Inap Puskesmas (Sesuai Preskripsi Diet Medis)'],
    providerId: 'PROV-01',
    pricePerPortion: 47000,
    contractReference: '027/SPK-GIZI/PKM-KSS/2026 Makan Siang',
    activeFrom: '2026-01-01',
  },
  {
    id: 'MN-MALAM',
    code: 'MALAM-47K',
    name: 'Makan Malam',
    dietCategoryId: 'DIET-01',
    dietCategoryName: 'Menu Standar Rawat Inap',
    texture: 'Lunak / Biasa',
    components: ['Menu Makan Malam Pasien Rawat Inap Puskesmas (Sesuai Preskripsi Diet Medis)'],
    providerId: 'PROV-01',
    pricePerPortion: 47000,
    contractReference: '027/SPK-GIZI/PKM-KSS/2026 Makan Malam',
    activeFrom: '2026-01-01',
  },
];

export const DEFAULT_QUALITY_CHECKLIST_TEMPLATE: QualityCheckItem[] = [
  {
    id: 'QC-1',
    parameterName: 'Kesesuaian Label Identitas, Nomor RM, dan Jadwal Makan',
    category: 'PORTION',
    isCritical: true,
    standardSpec: 'Label nama pasien, nomor RM, ruangan, dan jadwal makan tertera jelas dan sesuai order.',
    result: 'SESUAI',
  },
  {
    id: 'QC-2',
    parameterName: 'Ketepatan Jenis Diet dan Tekstur Makanan',
    category: 'DIET',
    isCritical: true,
    standardSpec: 'Jenis diet dan tekstur (Biasa/Lunak/Saring/Cair) persis sesuai instruksi klinis ahli gizi.',
    result: 'SESUAI',
  },
  {
    id: 'QC-3',
    parameterName: 'Pengecekan Alergi / Pantangan Bahan Khusus',
    category: 'DIET',
    isCritical: true,
    standardSpec: 'Bebas dari bahan alergen yang tercatat pada order (contoh: udang, telur, kacang).',
    result: 'SESUAI',
  },
  {
    id: 'QC-4',
    parameterName: 'Suhu Makanan Saat Tiba di Puskesmas',
    category: 'TEMPERATURE',
    isCritical: true,
    standardSpec: 'Makanan panas minimal 60°C; makanan dingin maksimal 10°C.',
    unit: '°C',
    actualMeasuredValue: '64.5',
    result: 'SESUAI',
  },
  {
    id: 'QC-5',
    parameterName: 'Kondisi Wadah, Kemasan & Higiene Sanitasi',
    category: 'PACKAGING',
    isCritical: true,
    standardSpec: 'Wadah food grade tertutup rapat, bersih, tidak retak, bebas kontaminasi serangga/debu.',
    result: 'SESUAI',
  },
  {
    id: 'QC-6',
    parameterName: 'Uji Organoleptik: Aroma, Warna & Kesegaran',
    category: 'TASTE_AROMA',
    isCritical: false,
    standardSpec: 'Aroma khas sedap masakan segar, warna cerah natural, tidak berlendir/berbau asam.',
    result: 'SESUAI',
  },
  {
    id: 'QC-7',
    parameterName: 'Ketepatan Waktu Pengiriman Sesuai Jadwal SOP',
    category: 'PORTION',
    isCritical: false,
    standardSpec: 'Tiba 30 menit sebelum jadwal pembagian makan pasien.',
    result: 'SESUAI',
  },
];

export const SAMPLE_SIGNATURES = {
  provider: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M20,60 Q50,10 90,45 T170,25" fill="none" stroke="%230f766e" stroke-width="3"/></svg>',
  waiter: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M30,50 Q70,20 120,55 T180,30" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
  patient: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M25,45 Q60,70 100,30 T175,50" fill="none" stroke="%23334155" stroke-width="3"/></svg>',
};

export const INITIAL_MEAL_ORDERS: MealOrder[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
