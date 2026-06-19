const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cloudinary = require('../config/cloudinary');

const Document = require('../modules/documents/models/document.model');

async function checkResource() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await Document.findOne().sort({ createdAt: -1 });
    if (!doc) process.exit(0);

    console.log(`Checking resource: ${doc.publicId}`);
    
    const result = await cloudinary.api.resource(doc.publicId, {
      resource_type: 'raw'
    });

    console.log('Resource Info:', JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (err) {
    console.error('Error fetching resource info:', err);
    process.exit(1);
  }
}

checkResource();
