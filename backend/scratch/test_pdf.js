const https = require('https');

const url = 'https://res.cloudinary.com/dtyz5vwpf/raw/upload/v1778878182/certificates/vts4fg6fg4by0uogfyng.pdf';

https.get(url, (res) => {
  let data = [];
  res.on('data', (chunk) => {
    data.push(chunk);
  });

  res.on('end', () => {
    const buffer = Buffer.concat(data);
    console.log('--- DIAGNOSTIC RESULTS ---');
    console.log('HTTP Status Code:', res.statusCode);
    console.log('Content-Type Header:', res.headers['content-type']);
    console.log('Content-Length Header:', res.headers['content-length']);
    console.log('Total Bytes Received:', buffer.length);
    if (buffer.length > 10) {
      console.log('First 10 Bytes (hex):', buffer.slice(0, 10).toString('hex'));
      console.log('First 10 Bytes (text):', buffer.slice(0, 10).toString('utf8'));
    }
  });
}).on('error', (err) => {
  console.error('Error downloading:', err);
});
