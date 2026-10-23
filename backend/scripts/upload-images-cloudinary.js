require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const images = [
  { slug: 'isc2-certified-in-cybersecurity-cc', file: 'isc2-certified-in-cybersecurity-cc.jpeg' },
  { slug: 'practical-soc-analyst-level-1', file: 'practical-soc-analyst-level-1.jpeg' },
  { slug: 'comptia-secai-plus-cy0-001', file: 'comptia-secai-plus-cy0-001.jpeg' },
  { slug: 'tryhackme-ai1-security-training', file: 'tryhackme-ai1-security-training.jpeg' },
  { slug: 'ai-security-professional-bundle', file: 'ai-security-professional-bundle.jpeg' },
];

async function run() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  const CourseColl = mongoose.connection.collection('courses');
  const baseImgDir = path.resolve(__dirname, '../../frontend/public/course-images');

  for (const item of images) {
    const fullPath = path.join(baseImgDir, item.file);
    console.log(`📤 Uploading: ${item.file}...`);
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: 'uop_course_thumbnails',
      public_id: `${item.slug}_${Date.now()}`,
      resource_type: 'image',
    });
    console.log(`✅ Uploaded: ${result.secure_url}`);

    await CourseColl.updateOne(
      { slug: item.slug },
      { $set: { thumbnail: result.secure_url } }
    );
    console.log(`💾 Updated MongoDB thumbnail for "${item.slug}"\n`);
  }

  console.log('🎉 All 5 course thumbnails successfully uploaded and synced to MongoDB!');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});

