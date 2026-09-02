const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const lmsService = require('../modules/lms/services/lms.service');
const User = require('../modules/auth/models/user.model');
const Course = require('../modules/lms/models/course.model');
const Program = require('../modules/lms/models/program.model');
const Major = require('../modules/lms/models/major.model');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const tenantId = 'iub';

    // 1. Get or create a test student
    let testStudent = await User.findOne({ email: 'isolated_student@test.com', tenantId });
    if (!testStudent) {
      testStudent = await User.create({
        tenantId,
        name: 'Isolated Student',
        email: 'isolated_student@test.com',
        password: 'Password@123',
        role: 'student',
        isActive: true,
        isApproved: true,
        isVerified: true,
      });
    }

    // Make sure student is unenrolled from all courses initially
    await Course.updateMany(
      { tenantId },
      { $pull: { enrolledStudents: testStudent._id } }
    );

    console.log('\n--- TEST 1: Unenrolled Student ---');
    const courses0 = await lmsService.getCourses(tenantId, testStudent._id.toString(), 'student');
    console.log(`Courses returned for unenrolled student: ${courses0.length} (Expected: 0)`);

    const tree0 = await lmsService.getAcademicHierarchyTree(tenantId, testStudent._id.toString(), 'student');
    console.log(`Academic tree programs returned for unenrolled student: ${tree0.length} (Expected: 0)`);

    const programs0 = await lmsService.getPrograms(tenantId, testStudent._id.toString(), 'student');
    console.log(`Programs returned for unenrolled student: ${programs0.length} (Expected: 0)`);

    // Pick one course to enroll in
    const sampleCourse = await Course.findOne({ tenantId, status: 'active' });
    if (!sampleCourse) {
      console.log('No active course found in tenant iub.');
      return;
    }

    console.log(`\nSample course to enroll: "${sampleCourse.title}" (${sampleCourse._id})`);

    // Verify non-enrolled direct access throws 403
    try {
      await lmsService.getCourseById(tenantId, sampleCourse._id.toString(), testStudent._id.toString(), 'student');
      console.error('FAILED: Unenrolled student was able to access getCourseById');
    } catch (e) {
      console.log(`PASSED: getCourseById threw error as expected: "${e.message}" (Status: ${e.statusCode})`);
    }

    try {
      await lmsService.getCourseVideoLectures(tenantId, sampleCourse._id.toString(), testStudent._id.toString(), 'student');
      console.error('FAILED: Unenrolled student was able to access getCourseVideoLectures');
    } catch (e) {
      console.log(`PASSED: getCourseVideoLectures threw error as expected: "${e.message}" (Status: ${e.statusCode})`);
    }

    try {
      await lmsService.getCourseQuizzes(tenantId, sampleCourse._id.toString(), 'student', testStudent._id.toString());
      console.error('FAILED: Unenrolled student was able to access getCourseQuizzes');
    } catch (e) {
      console.log(`PASSED: getCourseQuizzes threw error as expected: "${e.message}" (Status: ${e.statusCode})`);
    }

    // Now enroll student in ONLY this one course
    await lmsService.enrollStudent(tenantId, sampleCourse._id.toString(), testStudent._id.toString(), testStudent._id.toString());
    console.log('\n--- TEST 2: Student Enrolled in 1 Course ---');

    const courses1 = await lmsService.getCourses(tenantId, testStudent._id.toString(), 'student');
    console.log(`Courses returned for enrolled student: ${courses1.length} (Expected: 1)`);
    console.log(`Course title: "${courses1[0]?.title}"`);

    const tree1 = await lmsService.getAcademicHierarchyTree(tenantId, testStudent._id.toString(), 'student');
    console.log(`Academic tree programs for enrolled student: ${tree1.length} (Expected >= 1)`);
    if (tree1[0]) {
      console.log(`Program: ${tree1[0].name}, Majors: ${tree1[0].majors.length}`);
      tree1[0].majors.forEach(m => {
        console.log(`  Major: ${m.name}, Subjects: ${m.subjects.map(s => s.title).join(', ')}`);
      });
    }

    const courseData = await lmsService.getCourseById(tenantId, sampleCourse._id.toString(), testStudent._id.toString(), 'student');
    console.log(`PASSED: Enrolled student accessed course successfully: "${courseData.title}"`);

    // Clean up test student
    await Course.updateMany(
      { tenantId },
      { $pull: { enrolledStudents: testStudent._id } }
    );
    await User.deleteOne({ _id: testStudent._id });
    console.log('\nCleaned up test student.');

    await mongoose.disconnect();
    console.log('All tests completed successfully!');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();
