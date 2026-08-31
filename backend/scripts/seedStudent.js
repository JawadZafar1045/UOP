require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/auth/models/user.model');
const Course = require('../modules/lms/models/course.model');
const Program = require('../modules/lms/models/program.model');
const Major = require('../modules/lms/models/major.model');

const seedStudent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Default college code / tenantId to iub (or pass as argument e.g. node seedStudent.js cszone)
    const tenantId = (process.argv[2] || 'iub').toLowerCase();

    const testEmail = 'student@test.com';
    const testPassword = 'Password@123';
    const testName = 'Ali Khan (Student)';

    // Find or pick program & major
    const program = await Program.findOne({ tenantId });
    const major = program ? await Major.findOne({ tenantId, programId: program._id }) : null;

    // Check if user already exists
    let student = await User.findOne({ email: testEmail, tenantId });

    if (student) {
      student.name = testName;
      student.role = 'student';
      student.password = testPassword; // will be hashed in pre-save hook
      student.isActive = true;
      student.isApproved = true;
      student.isVerified = true;
      if (program) student.programId = program._id;
      if (major) student.majorId = major._id;
      student.rollNumber = 'AGRI-2024-001';
      await student.save();
      console.log(`Updated student credentials: ${testEmail}`);
    } else {
      student = await User.create({
        tenantId,
        name: testName,
        email: testEmail,
        password: testPassword,
        role: 'student',
        isActive: true,
        isApproved: true,
        isVerified: true,
        programId: program?._id || null,
        majorId: major?._id || null,
        rollNumber: 'AGRI-2024-001',
      });
      console.log(`Created new student: ${testEmail}`);
    }

    // Auto-enroll in all courses of this tenant using $addToSet (bypasses status enum mismatch)
    const updateResult = await Course.updateMany(
      { tenantId },
      { $addToSet: { enrolledStudents: student._id } }
    );
    const courseCount = await Course.countDocuments({ tenantId });
    console.log(`Enrolled student in ${courseCount} courses (${updateResult.modifiedCount} updated)`);

    console.log('\n=============================================');
    console.log('🎓 STUDENT TEST LOGIN CREDENTIALS:');
    console.log('=============================================');
    console.log(`📧 Email:    ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    console.log(`👤 Role:     student`);
    console.log(`🏫 Tenant:   ${tenantId}`);
    console.log(`📚 Enrolled in ${courseCount} courses`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding student:', error);
    process.exit(1);
  }
};

seedStudent();
