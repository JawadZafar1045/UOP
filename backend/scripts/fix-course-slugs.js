require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const slugify = require('slugify');
const Course = require('../modules/lms/models/course.model');

async function fixCourseSlugs() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses in database.`);

    for (const course of courses) {
      let needsSave = false;
      const originalSlug = course.slug;

      // If slug is a URL or invalid or missing
      if (!course.slug || course.slug.startsWith('http') || course.slug.includes('/') || course.slug.includes('?') || course.slug.includes('&')) {
        const cleanTitle = course.title || 'course';
        const baseSlug = slugify(cleanTitle, { lower: true, strict: true }) || 'course';
        course.slug = `${baseSlug}-${course._id.toString().slice(-4)}`;
        needsSave = true;
        console.log(`🔧 Fixed slug for "${course.title}": "${originalSlug}" -> "${course.slug}"`);
      }

      if (needsSave) {
        await course.save();
      }
    }

    console.log('✅ All course slugs sanitized.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing slugs:', err);
    process.exit(1);
  }
}

fixCourseSlugs();
