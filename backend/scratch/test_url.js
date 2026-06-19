const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cloudinary = require('../config/cloudinary');

const Document = require('../modules/documents/models/document.model');

async function testUrl() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) {
      console.log('No documents found');
      process.exit(0);
    }

    console.log(`Document: ${doc.title}`);
    console.log(`PublicId: ${doc.publicId}`);

    const url = cloudinary.utils.url(doc.publicId, {
      resource_type: 'raw',
      sign_url: true,
      secure: true
    });

    console.log(`Generated Signed URL: ${url}`);

    const https = require('https');
    https.get(url, (res) => {
      console.log(`Cloudinary Status: ${res.statusCode}`);
      console.log('Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        if (data.length < 100) data += chunk.toString('hex');
      });
      res.on('end', () => {
        console.log(`Body snippet (hex): ${data.substring(0, 40)}...`);
        console.log(`Total bytes received: ${res.socket.bytesRead}`);
        process.exit(0);
      });
    }).on('error', (e) => {
      console.error('Fetch error:', e);
      process.exit(1);
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testUrl();
