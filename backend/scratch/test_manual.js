const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const crypto = require('crypto');
const https = require('https');

const Document = require('../modules/documents/models/document.model');

async function testManualSign() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) process.exit(0);

    const versionMatch = doc.fileUrl.match(/\/v(\d+)\//);
    const version = versionMatch ? versionMatch[1] : '1';
    
    // Path to sign: version/publicId
    const pathToSign = `v${version}/${doc.publicId}`;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    const hash = crypto.createHash('sha1').update(pathToSign + apiSecret).digest('hex');
    const signature = `s--${hash.substring(0, 8)}--`;
    
    const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${signature}/v${version}/${doc.publicId}`;

    console.log(`Manual Signed URL: ${url}`);

    https.get(url, (res) => {
      console.log(`Status: ${res.statusCode}`);
      if (res.statusCode !== 200) {
        console.log('Error Header:', res.headers['x-cld-error']);
      }
      process.exit(0);
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testManualSign();
