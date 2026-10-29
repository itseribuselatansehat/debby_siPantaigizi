# SOLUSI MENGATASI 403 FORBIDDEN & PANDUAN DEPLOY HOSTINGER
## SI PANTAI GIZI — Puskesmas Kepulauan Seribu Selatan
### Subdomain: `sipantaigizi.puskesmasseribuselatan.com`

---

## 🚨 PENYEBAB MUNCULNYA "403 Forbidden: Access to this resource on the server is denied!"

Error **403 Forbidden** pada LiteSpeed Web Server Hostinger terjadi karena 3 hal berikut:
1. **Belum adanya file startup `server.js`** di root folder aplikasi: Hostinger Node.js Application Manager mewajibkan file startup untuk mengeksekusi server.
2. **Belum adanya konfigurasi `.htaccess` Reverse Proxy**: LiteSpeed secara default mencari file statis `index.html`/`index.php`. Karena Next.js berjalan di background pada port Node.js (3000), LiteSpeed menolak akses direktori (*Directory Listing Disabled*) sehingga mengeluarkan layar 403 Forbidden.
3. **Aplikasi Node.js belum di-Build & di-Start di hPanel**: File `.next` belum dibuat (`npm run build`) dan status aplikasi di hPanel masih *Stopped*.

**Semua konfigurasi file (`server.js`, `.htaccess`, `package.json`) kini TELAH KAMI SEDIAKAN dan siap digunakan!**

---

## 🛠️ LANGKAH CEPAT 3 MENIT MENYELESAIKAN 403 FORBIDDEN DI HOSTINGER

### LANGKAH 1: PUSH FILE TERBARU KE GITHUB & PULL DI HOSTINGER
1. Di komputer lokal Anda, commit dan push pembaruan file ini ke GitHub:
   ```bash
   git add .
   git commit -m "fix: tambahkan server.js dan .htaccess untuk fix 403 Hostinger"
   git push origin main
   ```
2. Buka **Hostinger hPanel**:
   - Masuk ke menu **Tingkat Lanjut (Advanced)** &rarr; **Git**.
   - Pada repositori `sipantai-gizi`, klik tombol **Pull** (atau **Deploy Deployment**) agar file `server.js` dan `.htaccess` terbaru masuk ke server Hostinger Anda.

---

### LANGKAH 2: ATUR MENU NODE.JS DI hPANEL HOSTINGER
1. Di hPanel Hostinger, buka menu **Tingkat Lanjut (Advanced)** &rarr; **Node.js**.
2. Jika belum membuat aplikasi, klik **Buat Aplikasi (Create Application)**. Jika sudah ada, klik **Kelola / Edit**.
3. Pastikan kolom diisi sebagai berikut:
   - **Versi Node.js (Node.js version)**: `20.x` (LTS) atau `18.x`.
   - **Mode Aplikasi (Application mode)**: `Production`.
   - **Akar Aplikasi (Application root)**: Arahkan ke folder tempat git ditarik, misalnya:
     - Jika subdomain: `/home/uXXXXX/domains/puskesmasseribuselatan.com/public_html/sipantaigizi`
     - Atau path folder subdomain Anda yang sesuai di File Manager.
   - **File Mulai Aplikasi (Application startup file)**: Masukkan **`server.js`** *(Wajib diisi `server.js`)*.
   - **URI Aplikasi (Application URL)**: Pilih `sipantaigizi.puskesmasseribuselatan.com`.
4. Klik **Simpan (Save)**.

---

### LANGKAH 3: JALANKAN BUILD VIA SSH / TERMINAL hPANEL
1. Buka menu **Tingkat Lanjut** &rarr; **SSH / Terminal** di Hostinger (atau klik tombol **NPM Install & Run script** di panel Node.js):
2. Masuk ke folder aplikasi Anda:
   ```bash
   cd domains/puskesmasseribuselatan.com/public_html/sipantaigizi
   ```
3. Pasang library dan jalankan build Next.js:
   ```bash
   npm install
   npm run build
   ```
4. Di menu **Node.js** hPanel, klik tombol hijau **Mulai Aplikasi (Start Application)** atau **Restart**.
5. Buka kembali browser Anda di:
   👉 **`https://sipantaigizi.puskesmasseribuselatan.com`**
   *Aplikasi SI PANTAI GIZI akan langsung terbuka dan aktif tanpa ada lagi pesan 403 Forbidden!*

---

## ⚡ ALTERNATIF: MENGGUNAKAN PM2 (JIKA MENGGUNAKAN VPS HOSTINGER)
Jika Anda menggunakan paket **VPS Hostinger**:
```bash
cd /var/www/sipantaigizi
npm install
npm run build
pm2 start server.js --name "sipantai-gizi"
pm2 save
pm2 startup
```

---

## 📋 CHECKLIST FITUR SETELAH WEBSITE AKTIF
1. **Login Cepat**:
   - Telah tersedia tombol login instan 1-klik untuk setiap role (Administrator, Ahli Gizi, Dokter/Perawat, Penyedia Makanan, PJLP/Pramusaji).
2. **Setup Database Google Sheets**:
   - Masuk sebagai **Administrator** atau **Ahli Gizi** &rarr; buka menu **Pengaturan & Integrasi GAS**.
   - Masukkan Web App URL dari Apps Script &rarr; klik **⚡ Setup Database Otomatis di Google Sheets** (8 Sheet otomatis terbuat).
   - Klik **Simpan Konfigurasi** (otomatis tersimpan secara global di server untuk seluruh perangkat & browser).
3. **Cetak Dokumen PDF**:
   - Menu **Penerimaan Makanan**: Cetak Berita Acara Serah Terima (BAST PDF) lengkap tanda tangan digital Penyedia & PJLP.
   - Menu **Distribusi Makanan**: Cetak Bukti Penyerahan ke Pasien (BPM PDF) lengkap foto makanan & tanda tangan pasien.
4. **Pasien Pulang**:
   - Di menu **Master Pasien**, klik **Tandai Pasien Pulang** untuk menyelesaikan rawat inap dan membatalkan sisa order belum tersaji secara otomatis.
