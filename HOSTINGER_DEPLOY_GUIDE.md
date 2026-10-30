# Panduan Solusi 403 Forbidden & Deploy Hostinger
## SI PANTAI GIZI — Puskesmas Kepulauan Seribu Selatan
**Domain**: `sipantaigizi.puskesmasseribuselatan.com`

---

### Mengapa Muncul Layar "403 Forbidden: Access to this resource on the server is denied!"?
Layar 403 Forbidden di Hostinger terjadi karena **salah satu dari 3 hal berikut**:
1. **Node.js Belum Dijalankan (Stopped / Belum Dibuat)**: Repository Git sudah di-clone ke Hostinger (`public_html`), namun fitur **Node.js** di hPanel Hostinger belum diaktifkan/dijalankan. Web server LiteSpeed/Apache mencoba mencari file `index.html` statis yang tidak ada, sehingga memblokir akses folder dengan error 403.
2. **Kondisi Direktori di `.htaccess`**: File `.htaccess` sebelumnya melewatkan rute direktori (`-d`), sehingga rute root `/` tidak diteruskan ke port Node.js. (Ini **sudah diperbaiki** di repository).
3. **Build Belum Dijalankan**: Perintah `npm install` dan `npm run build` belum dijalankan di server Hostinger setelah sinkronisasi Git.

---

### Langkah Praktis Mengatasi 403 di Hostinger hPanel (3 Menit Selesai)

#### Opsi A: Menggunakan Menu Node.js di Hostinger hPanel (Shared / Cloud Hosting)
1. **Buka hPanel Hostinger**:
   - Login ke akun Hostinger Anda -> Masuk ke menu **Websites**.
   - Pilih domain/subdomain: `sipantaigizi.puskesmasseribuselatan.com`.
2. **Buka Menu Node.js**:
   - Di bilah menu kiri, cari bagian **Advanced** -> klik **Node.js**.
3. **Konfigurasi Node.js Application**:
   - **Node.js Version**: Pilih **20.x** (atau 18.x).
   - **Application Mode**: Pilih **Production**.
   - **Application Root**: Arahkan ke folder tempat repository berada (biasanya `public_html` atau `domains/sipantaigizi.puskesmasseribuselatan.com/public_html`).
   - **Application Startup File**: Ketik `server.js`.
   - **Application URL**: `sipantaigizi.puskesmasseribuselatan.com`.
   - Klik tombol **Create** / **Save**.
4. **Instalasi Paket & Build**:
   - Pada kartu Node.js, klik tombol **Run NPM Install**. Tunggu hingga muncul notifikasi sukses.
   - Buka tab **Execute Command** di halaman yang sama, lalu ketik:
     ```bash
     npm run build
     ```
     dan klik **Run**.
5. **Jalankan Aplikasi**:
   - Klik tombol **Start Application** (atau **Restart**).
   - Pastikan status berubah menjadi **Running** (indikator hijau).
6. **Buka Kembali Domain**:
   - Buka `https://sipantaigizi.puskesmasseribuselatan.com` di browser Anda (atau tekan Ctrl+F5).
   - Aplikasi **SI PANTAI GIZI** akan langsung tampil sempurna tanpa error 403!

---

#### Opsi B: Menggunakan SSH / Hostinger VPS (Jika Menggunakan Terminal)
Jika Anda menggunakan akses SSH / Terminal di Hostinger:
```bash
# 1. Masuk ke direktori web
cd /home/uXXXXXXX/domains/sipantaigizi.puskesmasseribuselatan.com/public_html

# 2. Tarik update terbaru dari Git
git pull origin main

# 3. Install dependency & build aplikasi Next.js
npm install
npm run build

# 4. Jalankan server dengan PM2
pm2 start server.js --name "sipantaigizi"
pm2 save

# 5. Cek status aplikasi
pm2 status
```

---

### Verifikasi File Penting di Server:
- `server.js`: Sudah disesuaikan untuk mengenali port dan Unix Socket Passenger Hostinger secara otomatis.
- `.htaccess`: Sudah dioptimalkan agar semua rute web dan API otomatis diteruskan ke aplikasi Next.js tanpa memicu 403 Forbidden.
