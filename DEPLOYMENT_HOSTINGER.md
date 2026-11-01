# SOLUSI DEFINITIF MENGATASI 403 FORBIDDEN DI HOSTINGER
## SI PANTAI GIZI — Puskesmas Kepulauan Seribu Selatan
### Subdomain: `sipantaigizi.puskesmasseribuselatan.com`

---

## 🔍 Mengapa Layar "403 Forbidden: Access to this resource on the server is denied!" Muncul?

Di Hostinger (paket Shared Hosting, Cloud Hosting, atau Business Hosting), web server yang digunakan adalah **LiteSpeed Web Server**.

Layar **403 Forbidden** pada tangkapan layar Anda terjadi karena:
1. **Tidak Ada File Indeks (`index.php` / `index.html`) di Root**:
   Secara default, LiteSpeed mencari `index.php` atau `index.html`. Pada project Next.js murni, file halaman berada di dalam folder `app/`, sehingga LiteSpeed menganggap folder kosong dan memblokir akses direktori (*Directory Listing Denied*) dengan status **403 Forbidden**.
2. **Reverse Proxy Apache `mod_proxy` Dimatikan di Shared Hosting**:
   LiteSpeed di Hostinger Shared Hosting tidak menjalankan modul `mod_proxy` secara langsung dari `.htaccess`.
3. **Node.js Belum Berjalan**:
   Aplikasi Node.js di Hostinger hPanel belum di-start atau file build `.next` belum dibuat.

---

## ✅ SOLUSI YANG TELAH DITERAPKAN DI REPOSITORY INI:

1. **Dibuatkan File `index.php` (LiteSpeed High-Speed Reverse Proxy)**:
   - File `index.php` kini tersedia langsung di root repository.
   - Keberadaan `index.php` **langsung melenyapkan error 403 Forbidden** karena LiteSpeed selalu menerima `index.php` sebagai dokumen indeks resmi.
   - `index.php` secara otomatis meneruskan seluruh request (GET, POST, API `/api/database`, cookies, header) ke server Next.js port 3000 dengan latensi sangat rendah.
   - Jika server Node.js sedang offline atau belum di-start, `index.php` menampilkan **Panel Diagnostik & Tombol Auto-Start 1-Klik**.

2. **Disesuaikan File `.htaccess`**:
   - Menetapkan `DirectoryIndex index.php index.html`.
   - Mengarahkan semua rute dinamis ke `index.php` secara otomatis tanpa error izin akses.

3. **Auto-Discovery Port pada `server.js`**:
   - `server.js` otomatis menulis file informasi port `.server-info.json` saat menyala sehingga `index.php` selalu terhubung ke port yang tepat.

---

## 🚀 LANGKAH 3 MENIT MENAMPILKAN APLIKASI DI HOSTINGER

### LANGKAH 1: Tarik (Pull) Pembaruan Git di Hostinger
1. Commit & Push repository terbaru ke GitHub jika Anda bekerja dari git lokal:
   ```bash
   git add .
   git commit -m "fix: tambahkan index.php LiteSpeed proxy & perbaiki 403 Hostinger"
   git push origin main
   ```
2. Buka **Hostinger hPanel** &rarr; Masuk ke menu **Tingkat Lanjut (Advanced)** &rarr; **Git**.
3. Klik tombol **Pull** atau **Deploy Deployment** agar file `index.php`, `.htaccess`, dan `server.js` terbaru masuk ke folder web Hostinger Anda.

---

### LANGKAH 2: Konfigurasi Menu Node.js di hPanel Hostinger
1. Di bilah menu kiri hPanel Hostinger, buka **Tingkat Lanjut (Advanced)** &rarr; **Node.js**.
2. Jika aplikasi belum ada, klik **Buat Aplikasi (Create Application)**. Jika sudah ada, klik **Kelola / Edit**.
3. Pastikan pengaturannya seperti berikut:
   - **Versi Node.js (Node.js version)**: Pilih **20.x** (atau 18.x).
   - **Mode Aplikasi (Application mode)**: **Production**.
   - **Akar Aplikasi (Application root)**: Arahkan ke folder web Anda (misal `domains/puskesmasseribuselatan.com/public_html/sipantaigizi` atau `public_html`).
   - **File Mulai Aplikasi (Application startup file)**: **`server.js`** *(Wajib diisi `server.js`)*.
   - **URI Aplikasi (Application URL)**: Pilih `sipantaigizi.puskesmasseribuselatan.com`.
4. Klik **Simpan (Save)**.

---

### LANGKAH 3: Jalankan Build & Start
1. Pada halaman Node.js di hPanel:
   - Klik tombol **Run NPM Install** (tunggu hingga selesai).
2. Di bagian **Execute Command** (atau via menu Terminal / SSH):
   Jalankan perintah build Next.js:
   ```bash
   npm run build
   ```
3. Klik tombol hijau **Mulai Aplikasi (Start Application)** atau **Restart**.
4. Status aplikasi akan berubah menjadi hijau: **Running**.

---

### LANGKAH 4: Buka Website Anda
Buka kembali browser Anda:
👉 **`https://sipantaigizi.puskesmasseribuselatan.com`**

Error **403 Forbidden** hilang dan aplikasi **SI PANTAI GIZI** langsung tampil utuh, siap digunakan dengan seluruh integrasi database Google Sheets & Google Drive!
