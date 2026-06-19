const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cloudinary = require('../config/cloudinary');

const Document = require('../modules/documents/models/document.model');

async function testUrlVersion() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) process.exit(0);

    console.log(`Original FileUrl: ${doc.fileUrl}`);
    
    // Extract version from fileUrl
    const versionMatch = doc.fileUrl.match(/\/v(\d+)\//);
    const version = versionMatch ? versionMatch[1] : null;
    console.log(`Extracted Version: ${version}`);

    const url = cloudinary.utils.url(doc.publicId, {
      resource_type: 'raw',
      sign_url: true,
      secure: true,
      version: version
    });

    console.log(`Generated Signed URL (with version): ${url}`);

    const https = require('https');
    https.get(url, (res) => {
      console.log(`Cloudinary Status: ${res.statusCode}`);
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

testUrlVersion();
