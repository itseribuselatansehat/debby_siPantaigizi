<?php
/**
 * ====================================================================
 * SI PANTAI GIZI — PUSKESMAS KEPULAUAN SERIBU SELATAN
 * Domain: sipantaigizi.puskesmasseribuselatan.com
 * Hostinger LiteSpeed High-Speed Reverse Proxy & Auto-Launcher
 * ====================================================================
 * 
 * Skrip ini memastikan:
 * 1. Menghilangkan 100% error "403 Forbidden: Access to this resource on the server is denied!"
 * 2. Meneruskan semua request (GET, POST, PUT, DELETE, API) ke server Next.js (port 3000 / custom port).
 * 3. Jika server Node.js belum aktif, secara otomatis mencoba menjalankannya atau menampilkan
 *    panel pemantauan status dan panduan aktivasi 1-klik di Hostinger hPanel.
 */

// 1. Matikan pembatasan waktu eksekusi untuk proxy streaming
@set_time_limit(120);

// 2. Deteksi Port Node.js
$targetPort = 3000;
$serverInfoFile = __DIR__ . '/.server-info.json';

if (file_exists($serverInfoFile)) {
    $infoData = @json_decode(file_get_contents($serverInfoFile), true);
    if (!empty($infoData['port']) && is_numeric($infoData['port'])) {
        $targetPort = (int)$infoData['port'];
    }
} elseif (!empty($_ENV['PORT']) && is_numeric($_ENV['PORT'])) {
    $targetPort = (int)$_ENV['PORT'];
} elseif (!empty(getenv('PORT')) && is_numeric(getenv('PORT'))) {
    $targetPort = (int)getenv('PORT');
}

// 3. Fungsi Uji Koneksi Port Node.js
function isNodeServerOnline($host, $port, $timeout = 0.4) {
    $fp = @fsockopen($host, $port, $errno, $errstr, $timeout);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

// 4. Periksa apakah port aktif
$isOnline = isNodeServerOnline('127.0.0.1', $targetPort);

// Jika belum online di port utama, coba port alternatif 3001 atau 3002
if (!$isOnline) {
    foreach ([3001, 3002, 3003, 8080] as $altPort) {
        if (isNodeServerOnline('127.0.0.1', $altPort)) {
            $targetPort = $altPort;
            $isOnline = true;
            break;
        }
    }
}

// 5. Jika ada aksi trigger restart dari admin / URL
if (isset($_GET['action']) && $_GET['action'] === 'start_node') {
    if (function_exists('shell_exec') || function_exists('exec')) {
        $cmd = "cd " . escapeshellarg(__DIR__) . " && (PORT=" . $targetPort . " NODE_ENV=production node server.js > server.log 2>&1 &)";
        if (function_exists('exec')) {
            @exec($cmd);
        } else {
            @shell_exec($cmd);
        }
        sleep(2);
    }
    header("Location: /");
    exit;
}

// 6. Jika Node.js AKTIF: Lakukan Reverse Proxy Penuh
if ($isOnline) {
    $requestUri = $_SERVER['REQUEST_URI'];
    $targetUrl = "http://127.0.0.1:" . $targetPort . $requestUri;

    $method = $_SERVER['REQUEST_METHOD'];
    $requestHeaders = [];
    
    // Ambil header request
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            // Hindari duplikasi Host header yang salah
            if (strtolower($key) !== 'host' && strtolower($key) !== 'content-length') {
                $requestHeaders[] = "$key: $value";
            }
        }
    } else {
        foreach ($_SERVER as $key => $value) {
            if (substr($key, 0, 5) === 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                if (strtolower($headerName) !== 'host' && strtolower($headerName) !== 'content-length') {
                    $requestHeaders[] = "$headerName: $value";
                }
            }
        }
    }

    // Tambahkan header proxy forwarding
    $clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $requestHeaders[] = "X-Forwarded-For: " . $clientIp;
    $requestHeaders[] = "X-Forwarded-Proto: " . ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http');
    $requestHeaders[] = "X-Real-IP: " . $clientIp;
    $requestHeaders[] = "Host: " . ($_SERVER['HTTP_HOST'] ?? 'sipantaigizi.puskesmasseribuselatan.com');

    // Baca request body
    $inputBody = file_get_contents('php://input');

    // Inisialisasi cURL untuk proxying
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $inputBody);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);

    $response = curl_exec($ch);

    if ($response === false) {
        $curlError = curl_error($ch);
        curl_close($ch);
        // Jika gagal kontak port, tampilkan status page
        goto fallback_display;
    }

    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $rawHeaders = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);

    // Kirim response status code
    http_response_code($httpCode);

    // Teruskan response header
    $headerLines = explode("\r\n", $rawHeaders);
    foreach ($headerLines as $line) {
        if (!empty($line) && stripos($line, 'Transfer-Encoding:') === false && stripos($line, 'HTTP/') !== 0) {
            header($line, false);
        }
    }

    // Output konten
    echo $body;
    exit;
}

fallback_display:

// 7. Periksa File Fisik di Direktori /public jika diminta
$reqPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$publicFile = __DIR__ . '/public' . $reqPath;
if (!empty($reqPath) && $reqPath !== '/' && file_exists($publicFile) && !is_dir($publicFile)) {
    $ext = pathinfo($publicFile, PATHINFO_EXTENSION);
    $mimes = [
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'json' => 'application/json',
        'css' => 'text/css',
        'js' => 'application/javascript',
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
    }
    readfile($publicFile);
    exit;
}

// 8. Tampilan Panduan & Status Hostinger Interaktif (Menggantikan 403 Forbidden dengan Solusi Nyata)
$hasBuild = is_dir(__DIR__ . '/.next');
$hasModules = is_dir(__DIR__ . '/node_modules');
$nodeVersion = @shell_exec('node -v');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SI PANTAI GIZI — Puskesmas Kepulauan Seribu Selatan (Hostinger Launcher)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
    <!-- Navbar -->
    <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-emerald-500/20">
                    SG
                </div>
                <div>
                    <h1 class="text-base font-bold text-white tracking-tight leading-none">SI PANTAI GIZI</h1>
                    <p class="text-xs text-emerald-400 font-medium mt-1">Puskesmas Kepulauan Seribu Selatan</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Menunggu Start Node.js
                </span>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
        <!-- Banner Sukses Mengatasi 403 -->
        <div class="mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-800/80 to-slate-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl flex-shrink-0">
                    ✓
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">Web Server LiteSpeed & PHP Hostinger Berhasil Dikonfigurasi!</h2>
                    <p class="text-slate-300 text-sm mt-1 leading-relaxed">
                        Pesan error <strong class="text-rose-400">403 Forbidden</strong> telah berhasil diatasi. LiteSpeed Web Server telah aktif melayani domain <code class="text-emerald-300 bg-slate-800/90 px-2 py-0.5 rounded font-mono text-xs">sipantaigizi.puskesmasseribuselatan.com</code>.
                    </p>
                </div>
            </div>
        </div>

        <!-- Diagnostic Card -->
        <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8 backdrop-blur shadow-xl">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Diagnostik Sistem Hostinger:
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p class="text-xs text-slate-400">Status Web Server</p>
                    <p class="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                        LiteSpeed / PHP <?php echo phpversion(); ?> Aktif
                    </p>
                </div>
                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p class="text-xs text-slate-400">Build Next.js (.next)</p>
                    <p class="text-sm font-bold <?php echo $hasBuild ? 'text-emerald-400' : 'text-amber-400'; ?> mt-1 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full <?php echo $hasBuild ? 'bg-emerald-400' : 'bg-amber-400'; ?>"></span>
                        <?php echo $hasBuild ? 'Tersedia & Siap' : 'Perlu npm run build'; ?>
                    </p>
                </div>
                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p class="text-xs text-slate-400">Port Target Node.js</p>
                    <p class="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full <?php echo $isOnline ? 'bg-emerald-400' : 'bg-rose-400'; ?>"></span>
                        Port <?php echo $targetPort; ?> (<?php echo $isOnline ? 'Online' : 'Offline'; ?>)
                    </p>
                </div>
            </div>
        </div>

        <!-- 3-Langkah Aktivasi di Hostinger hPanel -->
        <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
            <h3 class="text-base font-bold text-white mb-2">
                Langkah Cepat Mengaktifkan Aplikasi di Hostinger hPanel:
            </h3>
            <p class="text-sm text-slate-300 mb-6">
                Ikuti langkah berikut di panel Hostinger Anda (hanya butuh 1-2 menit):
            </p>

            <div class="space-y-4">
                <div class="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 items-start">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        1
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-white">Buka Menu Node.js di Hostinger hPanel</h4>
                        <p class="text-xs text-slate-400 mt-1">
                            Masuk ke <strong>hPanel Hostinger</strong> &rarr; pilih website <strong>sipantaigizi.puskesmasseribuselatan.com</strong> &rarr; klik menu <strong>Tingkat Lanjut (Advanced)</strong> &rarr; <strong>Node.js</strong>.
                        </p>
                    </div>
                </div>

                <div class="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 items-start">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        2
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-white">Pastikan Konfigurasi Node.js Sesuai</h4>
                        <ul class="text-xs text-slate-300 mt-1 space-y-1 list-disc list-inside">
                            <li><strong>Application startup file</strong>: Masukkan <code class="text-emerald-300 font-mono">server.js</code></li>
                            <li><strong>Node.js version</strong>: Pilih <strong>20.x</strong> atau <strong>18.x</strong></li>
                            <li><strong>Application mode</strong>: <strong>Production</strong></li>
                        </ul>
                    </div>
                </div>

                <div class="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 items-start">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        3
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-white">Klik Tombol "Start Application" / "Restart"</h4>
                        <p class="text-xs text-slate-400 mt-1">
                            Setelah status berubah menjadi hijau (<strong>Running</strong>), klik tombol di bawah untuk membuka SI PANTAI GIZI.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Tombol Aksi Cepat -->
            <div class="mt-6 pt-6 border-t border-slate-700/60 flex flex-wrap gap-3">
                <a href="?action=start_node" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Jalankan Server Otomatis
                </a>
                <a href="/" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh Halaman
                </a>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>SI PANTAI GIZI &copy; 2026 — Puskesmas Kepulauan Seribu Selatan</p>
        <p class="mt-1">Kepala Puskesmas: dr. Ignatius Dendy Purnama (NIP. 198607192014031004)</p>
    </footer>
</body>
</html>
