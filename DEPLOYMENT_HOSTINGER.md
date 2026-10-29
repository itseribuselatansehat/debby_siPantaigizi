# PANDUAN DEPLOYMENT HOSTINGER VIA GIT & GITHUB
## Sistem Informasi SOP Pemberian Makan Pasien Rawat Inap (SI PANTAI GIZI)
### Puskesmas Kepulauan Seribu Selatan

Aplikasi ini dibangun menggunakan **Next.js 15 (App Router)**, **TypeScript**, dan **Tailwind CSS**. Aplikasi sudah dikonfigurasi dengan mode produksi `output: 'standalone'` sehingga dapat langsung di-deploy di layanan **Hostinger Cloud Hosting / VPS / cPanel Node.js Application Manager** melalui sinkronisasi Git/GitHub secara seamless.

---

### TAHAP 1: PUSH KODE KE GITHUB REPOSITORY

1. Di komputer lokal Anda (atau melalui Git terminal), inisialisasi repositori Git jika belum:
   ```bash
   git init
   git add .
   git commit -m "feat: SI PANTAI GIZI siap deploy Hostinger"
   ```
2. Buat repository baru di akun GitHub Anda (misalnya: `sipantai-gizi`).
3. Hubungkan remote repository dan push kode ke branch `main`:
   ```bash
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/sipantai-gizi.git
   git push -u origin main
   ```

---

### TAHAP 2: KONFIGURASI NODE.JS DI HOSTINGER (hPanel)

1. **Masuk ke Hostinger hPanel**:
   - Pilih paket hosting Anda (Cloud Hosting / Business Hosting / VPS).
   - Masuk ke menu domain tempat aplikasi akan di-deploy (contoh: `gizi.puskesmas-seribuselatan.id` atau domain utama Anda).
2. **Buka Menu "Node.js"**:
   - Di sidebar hPanel, cari menu **Tingkat Lanjut (Advanced)** &gt; **Node.js**.
   - Klik tombol **Buat Aplikasi (Create Application)**.
3. **Isi Pengaturan Aplikasi Node.js**:
   - **Versi Node.js**: Pilih `Node.js 20.x` (LTS) atau `Node.js 18.x`.
   - **Mode Aplikasi**: `Production`.
   - **Akar Aplikasi (Application Root)**: Masukkan direktori proyek (contoh: `/home/u123456789/domains/domainanda.com/public_html` atau subfolder aplikasi).
   - **File Mulai Aplikasi (Application Startup File)**:
     - Jika menggunakan npm script: Biarkan default atau isi `node_modules/next/dist/bin/next` dengan argumen `start`.
     - Atau isi file launcher `server.js` jika menggunakan output standalone.
   - **URI Aplikasi (Application URL)**: Pilih domain / subdomain yang aktif.
4. Klik **Simpan (Save)**.

---

### TAHAP 3: SINKRONISASI GIT DI HOSTINGER (Git Deployment)

1. Di hPanel Hostinger, buka menu **Tingkat Lanjut (Advanced)** &gt; **Git**.
2. Masukkan URL repository GitHub Anda:
   - `Repository URL`: `https://github.com/USERNAME_ANDA/sipantai-gizi.git`
   - `Branch`: `main`
   - `Install Path`: Direktori aplikasi yang sama dengan Application Root di atas.
3. Klik **Deploy / Buat**. Hostinger akan melakukan `git clone` otomatis ke server Anda.
4. **Auto-Deployment via Webhook (Opsional tapi Sangat Direkomendasikan)**:
   - Salin **Webhook URL** yang disediakan oleh Hostinger.
   - Buka repository Anda di GitHub &gt; **Settings** &gt; **Webhooks** &gt; **Add webhook**.
   - Tempel Webhook URL tersebut.
   - Sekarang, setiap kali Anda melakukan `git push` ke GitHub, Hostinger akan otomatis menarik update terbaru!

---

### TAHAP 4: BUILD DAN JALANKAN APLIKASI DI HOSTINGER

1. Masuk ke terminal SSH Hostinger (atau melalui hPanel Terminal / Node.js command runner):
   ```bash
   cd /path/ke/aplikasi/anda
   ```
2. Pasang dependencies:
   ```bash
   npm install --production=false
   ```
3. Lakukan build aplikasi Next.js untuk produksi:
   ```bash
   npm run build
   ```
4. Jalankan aplikasi:
   - Di hPanel Node.js, klik tombol **Mulai Aplikasi (Start Application)** atau **Restart**.
   - Atau melalui npm:
     ```bash
     npm run start
     ```
5. Buka domain Anda di browser: Aplikasi **SI PANTAI GIZI** langsung aktif dan dapat diakses!

---

### TAHAP 5: SETUP DATABASE GOOGLE SHEETS & GLOBAL PERSISTENCE

1. Buka aplikasi web di browser Anda, lalu login sebagai **Administrator** atau **Ahli Gizi**.
2. Masuk ke menu **Pengaturan & Integrasi GAS**.
3. Ikuti langkah cepat:
   - Buka Google Spreadsheet baru di Google Drive Anda.
   - Buka menu **Ekstensi** &gt; **Apps Script**, salin dan tempel kode **Code.gs** yang tersedia di panel kanan.
   - Klik **Terapkan (Deploy)** &gt; **Penerapan Baru (New deployment)** &gt; Pilih **Aplikasi Web (Web App)**.
   - Akses: **Siapa saja (Anyone)** &gt; Klik **Deploy**.
   - Salin URL Web App dan tempelkan ke kolom URL di aplikasi web.
4. Klik tombol hijau:
   **⚡ Setup Database Otomatis di Google Sheets**
   Sistem akan secara instan membuat 8 sheet tabel data dan header SOP (MealOrders, Patients, Users, Menus, DietTypes, Providers, AuditLogs, AppSettings) secara otomatis tanpa kesalahan.
5. Klik **Simpan Konfigurasi**. Pengaturan ini otomatis tersimpan secara **global di server** (`global-settings.json`), sehingga seluruh browser dan perangkat petugas yang membuka web tidak perlu memasukkan URL lagi!

---

### TAHAP 6: DOKUMEN BAST & BUKTI PENYERAHAN PASIEN (PDF)

- **Berita Acara Serah Terima (Penyedia &rarr; PJLP)**:
  Buka menu **Penerimaan Makanan**, klik **Cetak Berita Acara (BAST PDF)** pada riwayat serah terima. Dokumen resmi lengkap dengan kop Puskesmas, data QC suhu, dan tanda tangan digital penyedia & PJLP siap dicetak atau disimpan sebagai PDF.
- **Bukti Penyerahan ke Pasien (PJLP &rarr; Pasien)**:
  Buka menu **Distribusi Makanan**, klik **Cetak Bukti Penyerahan (BPM PDF)**. Dokumen resmi lengkap dengan foto sajian makanan aktual dan tanda tangan digital pasien/keluarga siap dicetak atau disimpan sebagai PDF.
- **Status Pasien Pulang**:
  Petugas Ahli Gizi / Dokter dapat memulangkan pasien melalui menu **Master Pasien Rawat Inap** dengan tombol **Tandai Pasien Pulang**. Seluruh order makanan tersisa yang belum disajikan otomatis dibatalkan sesuai SOP Gizi Puskesmas.
