// Utility helpers for Indonesian date/time (Asia/Jakarta) & Currency

export function getNowJakarta(): Date {
  // Returns current date adjusted to Asia/Jakarta
  return new Date();
}

export function formatJakartaDate(dateStrOrObj: string | Date | undefined): string {
  if (!dateStrOrObj) return '-';
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return '-';

  // UTC+7 for Asia/Jakarta (WIB)
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const j = new Date(utc + 7 * 3600000);

  const day = String(j.getDate()).padStart(2, '0');
  const month = String(j.getMonth() + 1).padStart(2, '0');
  const year = j.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatJakartaDateTime(dateStrOrObj: string | Date | undefined): string {
  if (!dateStrOrObj) return '-';
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return '-';

  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const j = new Date(utc + 7 * 3600000);

  const day = String(j.getDate()).padStart(2, '0');
  const month = String(j.getMonth() + 1).padStart(2, '0');
  const year = j.getFullYear();
  const hours = String(j.getHours()).padStart(2, '0');
  const minutes = String(j.getMinutes()).padStart(2, '0');
  const seconds = String(j.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} WIB`;
}

export function formatJakartaTimeOnly(dateStrOrObj: string | Date | undefined): string {
  if (!dateStrOrObj) return '-';
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return '-';

  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const j = new Date(utc + 7 * 3600000);

  const hours = String(j.getHours()).padStart(2, '0');
  const minutes = String(j.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes} WIB`;
}

export function getTodayISODateJakarta(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // YYYY-MM-DD
}

export function calculateAgeAtDate(birthDateStr: string, atDateStr: string): { years: number; months: number; displayText: string } {
  if (!birthDateStr) return { years: 0, months: 0, displayText: '-' };

  const birth = new Date(birthDateStr);
  const target = new Date(atDateStr || getTodayISODateJakarta());

  if (isNaN(birth.getTime()) || isNaN(target.getTime())) {
    return { years: 0, months: 0, displayText: '-' };
  }

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  const days = target.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);

  const displayText = years > 0 ? `${years} thn ${months} bln` : `${months} bulan`;
  return { years, months, displayText };
}

export function formatRupiah(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  const val = Math.round(amount);
  return 'Rp ' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Normalisasi nomor WhatsApp ke standar internasional Indonesia (62xxx)
 * Contoh: 0812-3456-7890 -> 6281234567890
 */
export function cleanAndFormatWaPhone(phone?: string, fallback: string = ''): string {
  if (!phone || typeof phone !== 'string') return fallback;
  // Hapus semua karakter non-angka
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return fallback;

  // Jika diawali 08..., ubah menjadi 628...
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Hitung hari rawat berjalan (Hari ke-1, Hari ke-2, dst.)
 * Berdasarkan admissionDate sampai tanggal pelayanan / tanggal hari ini
 */
export function calculateInpatientStayDay(admissionDateStr?: string, targetDateStr?: string): number {
  if (!admissionDateStr) return 1;
  const adm = new Date(admissionDateStr.slice(0, 10));
  const target = new Date((targetDateStr || getTodayISODateJakarta()).slice(0, 10));
  if (isNaN(adm.getTime()) || isNaN(target.getTime())) return 1;
  const diffTime = target.getTime() - adm.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Dapatkan URL publik aplikasi untuk disematkan dalam tautan pesan WhatsApp
 * agar penerima dapat langsung mengklik dan membuka aplikasi SI PANTAI GIZI
 */
export function getAppPublicUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://sipantaigizi.puskesmasseribuselatan.com';
}

