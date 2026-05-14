const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cloudinary = require('../config/cloudinary');
const https = require('https');

const Document = require('../modules/documents/models/document.model');

async function testFinal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) process.exit(0);

    const versionMatch = doc.fileUrl.match(/\/v(\d+)\//);
    const version = versionMatch ? versionMatch[1] : null;

    const url = cloudinary.utils.url(doc.publicId, {
      resource_type: 'raw',
      sign_url: true,
      secure: true,
      version: version,
      analytics: false
    });

    console.log(`Generated Final URL: ${url}`);

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

testFinal();
