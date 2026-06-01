require('dotenv').config();
const https = require('https');

const fileUrl = 'https://res.cloudinary.com/dtyz5vwpf/raw/upload/v1778878182/certificates/vts4fg6fg4by0uogfyng.pdf';

const auth = Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64');

console.log('Testing Cloudinary direct fetch with Basic Auth...');
console.log('URL:', fileUrl);

const options = {
  headers: {
    'Authorization': `Basic ${auth}`
  }
};

https.get(fileUrl, options, (res) => {
  console.log('HTTP Status Code:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
  
  let dataLength = 0;
  res.on('data', (chunk) => {
    dataLength += chunk.length;
  });
  
  res.on('end', () => {
    console.log('Total bytes received:', dataLength);
  });
}).on('error', (e) => {
  console.error('Error fetching:', e);
});
