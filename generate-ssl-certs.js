// Simple certificate generator for development
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create ssl directory if it doesn't exist
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
  console.log('Created SSL directory');
}

// Generate self-signed certificates using Node.js
try {
  console.log('Generating self-signed certificates...');
  
  // Check for OpenSSL
  try {
    execSync('openssl version', { stdio: 'ignore' });
    
    // Generate key and certificate
    execSync('openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"', 
      { stdio: 'inherit' });
    
    console.log('SSL certificates generated successfully!');
  } catch (err) {
    // OpenSSL not found, use alternative method with Node.js crypto
    console.log('OpenSSL not found. Using Node.js crypto for certificate generation...');
    
    const crypto = require('crypto');
    const selfsigned = require('selfsigned');
    
    const attributes = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attributes, { days: 365 });
    
    fs.writeFileSync(path.join(sslDir, 'key.pem'), pems.private);
    fs.writeFileSync(path.join(sslDir, 'cert.pem'), pems.cert);
    
    console.log('SSL certificates generated successfully using Node.js crypto!');
  }
} catch (error) {
  console.error('Error generating certificates:', error.message);
  console.log('');
  console.log('You can create certificates manually with these commands:');
  console.log('mkdir -p ssl');
  console.log('openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"');
}

console.log('Note: These certificates are for development only. Use proper certificates in production.');
