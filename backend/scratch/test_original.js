const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Document = require('../modules/documents/models/document.model');

async function testOriginalUrl() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) process.exit(0);

    console.log(`Testing Original FileUrl: ${doc.fileUrl}`);
    
    const https = require('https');
    https.get(doc.fileUrl, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Headers:', res.headers);
      process.exit(0);
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testOriginalUrl();
