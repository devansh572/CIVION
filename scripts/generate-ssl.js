const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

async function generateSSL() {
  const certDir = path.join(__dirname, '..', 'certificates');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  console.log('Generating self-signed SSL certificates for localhost...');

  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'IN' },
    { name: 'organizationName', value: 'Civion Civic Technologies' },
    { shortName: 'OU', value: 'Local HTTPS Security' }
  ];

  const pems = await selfsigned.generate(attrs, {
    days: 365,
    keySize: 2048,
    extensions: [{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 2, value: 'civion.local' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: '::1' }
      ]
    }]
  });

  const certPath = path.join(certDir, 'localhost.pem');
  const keyPath = path.join(certDir, 'localhost-key.pem');

  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);

  console.log('✓ SSL Certificates generated:');
  console.log('  Certificate:', certPath);
  console.log('  Private Key:', keyPath);
}

if (require.main === module) {
  generateSSL().catch((err) => {
    console.error('Failed to generate SSL certificates:', err);
    process.exit(1);
  });
}

module.exports = { generateSSL };
