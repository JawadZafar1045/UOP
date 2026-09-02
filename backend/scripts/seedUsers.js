require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/auth/models/user.model');
const Course = require('../modules/lms/models/course.model');
const Program = require('../modules/lms/models/program.model');
const Major = require('../modules/lms/models/major.model');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Tenants to seed for: if passed via CLI argument, use it; otherwise seed for 'iub' and 'cszone'
    const targetTenants = process.argv[2] ? [process.argv[2].toLowerCase()] : ['iub', 'cszone'];

    for (const tenantId of targetTenants) {
      console.log(`\n=============================================`);
      console.log(`🌱 Seeding users for Tenant: [${tenantId}]`);
      console.log(`=============================================`);

      const program = await Program.findOne({ tenantId });
      const major = program ? await Major.findOne({ tenantId, programId: program._id }) : null;

      const usersToSeed = [
        {
          name: 'System Admin',
          email: `admin@${tenantId}.com`,
          password: 'Password@123',
          role: 'admin',
          isActive: true,
          isApproved: true,
          isVerified: true,
          bio: 'Platform Administrator',
        },
        {
          name: 'Lead Instructor (Dr. Ahmad)',
          email: `teacher@${tenantId}.com`,
          password: 'Password@123',
          role: 'teacher',
          isActive: true,
          isApproved: true,
          isVerified: true,
          bio: 'Senior Agricultural Specialist & Lecturer',
        },
        {
          name: 'Ali Khan (Student)',
          email: `student@${tenantId}.com`,
          password: 'Password@123',
          role: 'student',
          isActive: true,
          isApproved: true,
          isVerified: true,
          programId: program?._id || null,
          majorId: major?._id || null,
          rollNumber: 'AGRI-2024-001',
        },
        {
          name: 'Sara Fatima (Student)',
          email: `student2@${tenantId}.com`,
          password: 'Password@123',
          role: 'student',
          isActive: true,
          isApproved: true,
          isVerified: true,
          programId: program?._id || null,
          majorId: major?._id || null,
          rollNumber: 'AGRI-2024-002',
        },
      ];

      for (const u of usersToSeed) {
        let user = await User.findOne({ email: u.email, tenantId });
        if (user) {
          user.name = u.name;
          user.role = u.role;
          user.password = u.password; // bcrypt pre-save hook will hash modified password
          user.isActive = u.isActive;
          user.isApproved = u.isApproved;
          user.isVerified = u.isVerified;
          if (u.bio) user.bio = u.bio;
          if (u.programId) user.programId = u.programId;
          if (u.majorId) user.majorId = u.majorId;
          if (u.rollNumber) user.rollNumber = u.rollNumber;
          await user.save();
          console.log(`✅ Updated existing user: [${u.role.toUpperCase()}] ${u.email}`);
        } else {
          user = await User.create({
            tenantId,
            ...u,
          });
          console.log(`✅ Created new user: [${u.role.toUpperCase()}] ${u.email}`);
        }

        // Auto-enroll student in all courses of this tenant
        if (u.role === 'student') {
          const updateResult = await Course.updateMany(
            { tenantId },
            { $addToSet: { enrolledStudents: user._id } }
          );
          console.log(`   └─ Enrolled in courses (${updateResult.modifiedCount} updated)`);
        }
      }
    }

    console.log('\n=============================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    console.log('🔑 ALL USERS HAVE PASSWORD: Password@123\n');
    console.log('📌 Test Accounts (Tenant: iub):');
    console.log('  🛡️ Admin:    admin@iub.com / Password@123');
    console.log('  👨‍🏫 Teacher:  teacher@iub.com / Password@123');
    console.log('  🎓 Student:  student@iub.com / Password@123');
    console.log('  🎓 Student2: student2@iub.com / Password@123\n');
    console.log('📌 Test Accounts (Tenant: cszone):');
    console.log('  🛡️ Admin:    admin@cszone.com / Password@123');
    console.log('  👨‍🏫 Teacher:  teacher@cszone.com / Password@123');
    console.log('  🎓 Student:  student@cszone.com / Password@123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
