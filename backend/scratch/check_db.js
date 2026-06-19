const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Course = require(path.join(__dirname, '../modules/lms/models/course.model'));
const User = require(path.join(__dirname, '../modules/auth/models/user.model'));

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const asad = await User.findOne({ email: 'asad@gmail.com' });
    console.log('Asad:', asad ? { _id: asad._id, tenantId: asad.tenantId } : 'Not found');

    const courses = await Course.find({});
    console.log('Courses:', JSON.stringify(courses.map(c => ({
      _id: c._id,
      title: c.title,
      tenantId: c.tenantId,
      enrolledStudents: c.enrolledStudents,
      status: c.status
    })), null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
