const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Document = require('../modules/documents/models/document.model');

async function checkDocs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const docs = await Document.find().limit(5).sort({ createdAt: -1 });
    console.log('Last 5 Documents:');
    docs.forEach(doc => {
      console.log(`- ID: ${doc._id}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  PublicId: ${doc.publicId}`);
      console.log(`  FileUrl: ${doc.fileUrl}`);
      console.log(`  MimeType: ${doc.mimeType}`);
      console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDocs();
