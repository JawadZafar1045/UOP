const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Course = require('../modules/lms/models/course.model');
const User = require('../modules/auth/models/user.model');

async function checkData() {
  try {
    console.log('URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const courses = await Course.find({});
    for (const c of courses) {
      console.log(`\nCourse: ${c.title} (${c._id})`);
      console.log(`TenantId: ${c.tenantId}`);
      console.log(`Enrolled IDs count: ${c.enrolledStudents.length}`);
      console.log(`Enrolled IDs:`, c.enrolledStudents);
      
      const populated = await Course.findById(c._id).populate('enrolledStudents');
      console.log(`Populated Students:`, populated.enrolledStudents.map(s => s ? {
        _id: s._id,
        name: s.name,
        email: s.email,
        role: s.role,
        tenantId: s.tenantId
      } : null));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
