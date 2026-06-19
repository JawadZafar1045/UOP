/**
 * One-time script: Fix HTML-encoded text in MongoDB
 *
 * Run ONCE after deploying the encoding fix:
 *   node backend/scripts/fixEncoding.js
 *
 * This decodes any &amp; &lt; &gt; etc. that were saved by the old
 * xssSanitize middleware and .escape() validators.
 * Safe to re-run (idempotent — only touches corrupted records).
 */

const mongoose = require('mongoose');
const Course   = require('../modules/lms/models/course.model');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const decodeEntities = (str) => {
  if (!str || typeof str !== 'string') return str;
  // Apply repeatedly until stable (handles double-encoded values like &amp;amp;)
  let prev;
  let result = str;
  do {
    prev = result;
    result = result
      .replace(/&amp;/g,  '&')
      .replace(/&lt;/g,   '<')
      .replace(/&gt;/g,   '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x2F;/g, '/')
      .replace(/&#x27;/g, "'")
      .replace(/&#039;/g, "'");
  } while (result !== prev);
  return result;
};

const fix = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI or MONGODB_URI env variable is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const courses = await Course.find({});
  console.log(`Found ${courses.length} courses to inspect.`);

  let fixed = 0;

  for (const course of courses) {
    const newTitle = decodeEntities(course.title);
    const newDesc  = decodeEntities(course.description);

    const titleChanged = newTitle !== course.title;
    const descChanged  = newDesc  !== course.description;

    if (titleChanged || descChanged) {
      course.title       = newTitle;
      course.description = newDesc;
      await course.save();
      fixed++;
      console.log(`  [FIXED] "${newTitle}"`);
      if (titleChanged) console.log(`    title: was encoded, now clean`);
      if (descChanged)  console.log(`    description: was encoded, now clean`);
    }
  }

  console.log(`\nDone. Fixed ${fixed} of ${courses.length} courses.`);
  mongoose.connection.close();
};

fix().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
