const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const next = require('next');
const { generateSSL } = require('./scripts/generate-ssl');

const hasBuild = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'));
const dev = process.env.NODE_ENV === 'development' || !hasBuild;
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;
const httpPort = parseInt(process.env.HTTP_PORT, 10) || 3001;

async function startServer() {
  const certDir = path.join(__dirname, 'certificates');
  const certPath = path.join(certDir, 'localhost.pem');
  const keyPath = path.join(certDir, 'localhost-key.pem');

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('SSL certificates not found. Generating new ones...');
    await generateSSL();
  }

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  // Primary Secure HTTPS Server
  const httpsServer = https.createServer(httpsOptions, (req, res) => {
    handle(req, res);
  });

  httpsServer.listen(port, () => {
    console.log('\n======================================================');
    console.log('🔒 CIVION SECURE HTTPS SERVER RUNNING');
    console.log('======================================================');
    console.log(`> Local:    https://${hostname}:${port}`);
    console.log(`> Network:  https://127.0.0.1:${port}`);
    console.log(`> NextAuth: ${process.env.NEXTAUTH_URL || `https://${hostname}:${port}`}`);
    console.log(`> Mode:     ${dev ? 'Development' : 'Production'}`);
    console.log('======================================================\n');
  });

  // Secondary HTTP to HTTPS Redirector
  if (httpPort && httpPort !== port) {
    const httpServer = http.createServer((req, res) => {
      const host = req.headers.host ? req.headers.host.split(':')[0] : hostname;
      const redirectUrl = `https://${host}:${port}${req.url}`;
      res.writeHead(301, { Location: redirectUrl });
      res.end();
    });

    httpServer.listen(httpPort, () => {
      console.log(`> HTTP Redirector active on http://${hostname}:${httpPort} -> redirects to https://${hostname}:${port}`);
    });
  }
}

startServer().catch((err) => {
  console.error('Fatal error starting Civion HTTPS server:', err);
  process.exit(1);
});
