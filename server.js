const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Path to Next.js standalone build if present
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!dev && fs.existsSync(standaloneServerPath)) {
  // Use Next.js standalone server if available
  process.env.PORT = String(port);
  process.env.HOSTNAME = hostname;
  try {
    require(standaloneServerPath);
  } catch (err) {
    console.warn('Failed to load standalone server, falling back to standard next server:', err);
    startStandardServer();
  }
} else {
  startStandardServer();
}

function startStandardServer() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> SI PANTAI GIZI Server running on http://${hostname}:${port}`);
    });
  }).catch((err) => {
    console.error('Error initializing Next.js app:', err);
    process.exit(1);
  });
}
