require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const lmsService = require('../modules/lms/services/lms.service');
const Course = require('../modules/lms/models/course.model');

async function testEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const course = await Course.findOne({});
    if (!course) {
      console.log('No courses in DB');
      process.exit(0);
    }

    console.log('Testing with slug:', course.slug);
    const data = await lmsService.getCourseLearningData('cszone', course.slug, '6a8831840e0bcc9ee81ec06f', 'admin');
    console.log('✅ Successfully fetched course learning data:');
    console.log({
      _id: data._id,
      title: data.title,
      slug: data.slug,
      totalLectures: data.totalLectures,
      modulesCount: data.modules?.length
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error testing endpoint:', e);
    process.exit(1);
  }
}

testEndpoint();
