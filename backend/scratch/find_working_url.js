const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cloudinary = require('../config/cloudinary');
const https = require('https');

const Document = require('../modules/documents/models/document.model');

async function findWorkingUrl() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) process.exit(0);

    const test = async (name, opts) => {
      const url = cloudinary.utils.url(doc.publicId, {
        resource_type: 'raw',
        secure: true,
        ...opts
      });
      return new Promise((resolve) => {
        https.get(url, (res) => {
          console.log(`[${name}] Status: ${res.statusCode} | URL: ${url.substring(0, 80)}...`);
          resolve(res.statusCode === 200);
        }).on('error', () => resolve(false));
      });
    };

    console.log(`PublicId: ${doc.publicId}`);
    
    await test('No signing', {});
    await test('Basic signing', { sign_url: true });
    await test('Signing + Version', { sign_url: true, version: doc.fileUrl.match(/\/v(\d+)\//)?.[1] });
    await test('Signing + Type upload', { sign_url: true, type: 'upload' });
    
    // Try without extension in publicId if it exists
    if (doc.publicId.endsWith('.pdf')) {
      const noExt = doc.publicId.replace('.pdf', '');
      await test('No Ext + Format pdf', { public_id: noExt, format: 'pdf', sign_url: true });
      await test('No Ext + Sign', { public_id: noExt, sign_url: true });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findWorkingUrl();
