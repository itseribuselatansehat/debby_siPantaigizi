const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';

// Hostinger / Passenger compatibility:
// Passenger often provides a Unix domain socket path in PORT (e.g. /passenger/socket...)
// Do not use parseInt unconditionally, as parseInt(socketPath) yields NaN!
const rawPort = process.env.PORT || '3000';
const isSocket = isNaN(Number(rawPort));
const listenTarget = isSocket ? rawPort : Number(rawPort);

const app = next({ 
  dev, 
  hostname: isSocket ? undefined : hostname, 
  port: isSocket ? undefined : listenTarget 
});
const handle = app.getRequestHandler();

console.log(`> Menyiapkan SI PANTAI GIZI (Production Mode: ${!dev})...`);

const serverInfoPath = path.join(__dirname, '.server-info.json');

function writeServerInfo() {
  try {
    const info = {
      status: 'online',
      port: isSocket ? null : listenTarget,
      socket: isSocket ? listenTarget : null,
      pid: process.pid,
      startTime: new Date().toISOString(),
    };
    fs.writeFileSync(serverInfoPath, JSON.stringify(info, null, 2), 'utf-8');
  } catch (e) {
    // ignore write errors
  }
}

function cleanupServerInfo() {
  try {
    if (fs.existsSync(serverInfoPath)) {
      fs.unlinkSync(serverInfoPath);
    }
  } catch (e) {
    // ignore
  }
}

process.on('SIGINT', () => {
  cleanupServerInfo();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanupServerInfo();
  process.exit(0);
});

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error saat melayani request:', req.url, err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Internal Server Error - SI PANTAI GIZI');
      }
    });

    if (isSocket) {
      server.listen(listenTarget, () => {
        writeServerInfo();
        console.log(`> SI PANTAI GIZI aktif pada Unix Socket: ${listenTarget}`);
      });
    } else {
      server.listen(listenTarget, hostname, () => {
        writeServerInfo();
        console.log(`> SI PANTAI GIZI aktif dan melayani request di http://${hostname}:${listenTarget}`);
      });
    }
  })
  .catch((err) => {
    cleanupServerInfo();
    console.error('Gagal menginisialisasi server Next.js:', err);
    process.exit(1);
  });
