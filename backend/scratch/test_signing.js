require('dotenv').config();
const https = require('https');
const cloudinary = require('../config/cloudinary');

const fileUrl = 'https://res.cloudinary.com/dtyz5vwpf/raw/upload/v1778878182/certificates/vts4fg6fg4by0uogfyng.pdf';

const parts = fileUrl.split('/upload/');
if (parts.length >= 2) {
  const versionMatch = parts[1].match(/^v([0-9]+)\//);
  const version = versionMatch ? versionMatch[1] : null;
  
  let p = parts[1];
  if (version) {
    p = p.substring(p.indexOf('/') + 1);
  }

  // Keep the extension in the public ID
  const publicId = p;

  const expiresAt = Math.floor(Date.now() / 1000) + 3600;

  const testType = (resType) => {
    // Note: Since the publicId already has '.pdf', we pass empty format or the extension
    const downloadUrl = cloudinary.utils.private_download_url(publicId, '', {
      resource_type: resType,
      type: 'upload',
      expires_at: expiresAt
    });

    console.log(`\nTesting with resource_type: '${resType}'`);
    console.log('URL:', downloadUrl);

    https.get(downloadUrl, (res) => {
      console.log('HTTP Status Code:', res.statusCode);
      console.log('Content-Type:', res.headers['content-type']);
      
      let data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        console.log('Total bytes received:', buffer.length);
        if (res.statusCode !== 200) {
          console.log('Error payload:', buffer.toString('utf8'));
        }
      });
    }).on('error', (e) => {
      console.error('Error fetching:', e);
    });
  };

  testType('raw');
  testType('image');
} else {
  console.log('Invalid URL format');
}
