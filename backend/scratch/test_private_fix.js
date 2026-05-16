const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cloudinary = require('../config/cloudinary');
const https = require('https');

const Document = require('../modules/documents/models/document.model');

async function testPrivateFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) process.exit(0);

    // No format argument for raw resources!
    const url = cloudinary.utils.private_download_url(doc.publicId, '', {
      resource_type: 'raw',
      attachment: true
    });

    console.log(`Generated Private URL (no format): ${url}`);

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

testPrivateFix();
