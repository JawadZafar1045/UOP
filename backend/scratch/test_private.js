const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cloudinary = require('../config/cloudinary');

const Document = require('../modules/documents/models/document.model');

async function testPrivateDownload() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) process.exit(0);

    const url = cloudinary.utils.private_download_url(doc.publicId, 'pdf', {
      resource_type: 'raw',
      attachment: true
    });

    console.log(`Generated Private Download URL: ${url}`);

    const https = require('https');
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

testPrivateDownload();
