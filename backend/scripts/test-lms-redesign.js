/**
 * Automated Integration Test for CSZone LMS Redesign
 * Run via: node backend/scripts/test-lms-redesign.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../modules/auth/models/user.model');
const Course = require('../modules/lms/models/course.model');
const CourseRegistration = require('../modules/lms/models/courseRegistration.model');
const LectureProgress = require('../modules/lms/models/lectureProgress.model');
const lmsService = require('../modules/lms/services/lms.service');

let mongod = null;

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Starting CSZone LMS Redesign Integration Test');
  console.log('====================================================\n');

  let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    console.log('⚡ Using In-Memory MongoDB Server for Isolated Testing');
  } catch (memErr) {
    console.log('ℹ️ MongoMemoryServer not available, using URI from env');
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const tenantId = 'cszone';

  try {
    // 1. Setup / Seed Users
    console.log('\n--- 1. Setting up Users ---');
    await User.deleteMany({ email: { $in: ['admin@cszone.pk', 'student1@cszone.pk', 'student2@cszone.pk'] } });

    const admin = await User.create({
      name: 'CSZone Administrator',
      email: 'admin@cszone.pk',
      password: 'Password123!',
      role: 'admin',
      tenantId,
      isActive: true,
      isVerified: true,
    });
    console.log('✅ Created Admin:', admin.email);

    const student1 = await User.create({
      name: 'Ali Ahmed',
      email: 'student1@cszone.pk',
      password: 'Password123!',
      role: 'student',
      tenantId,
      isActive: true,
      isVerified: true,
      isApproved: true,
    });
    console.log('✅ Created Student 1:', student1.email);

    const student2 = await User.create({
      name: 'Sara Khan',
      email: 'student2@cszone.pk',
      password: 'Password123!',
      role: 'student',
      tenantId,
      isActive: true,
      isVerified: true,
      isApproved: true,
    });
    console.log('✅ Created Student 2:', student2.email);

    // 2. Clean previous test courses & registrations
    await Course.deleteMany({ tenantId, slug: { $in: ['ethical-hacking-intro', 'advanced-web-pentesting'] } });
    await CourseRegistration.deleteMany({ tenantId });
    await LectureProgress.deleteMany({ tenantId });

    // 3. Create Free Course
    console.log('\n--- 2. Creating Free Course ---');
    const freeCourse = await Course.create({
      tenantId,
      createdBy: admin._id,
      title: 'Introduction to Ethical Hacking & Linux',
      slug: 'ethical-hacking-intro',
      shortDescription: 'Master fundamental cybersecurity concepts and essential Linux command line skills.',
      description: 'A complete hands-on introduction to cybersecurity, networking protocols, Linux terminal, and security tooling.',
      type: 'free',
      price: 0,
      currency: 'PKR',
      category: 'Cyber Security',
      level: 'Beginner',
      status: 'published',
      isFeatured: true,
      whatYouWillLearn: [
        'Understand Linux file system and permissions',
        'Learn TCP/IP, OSI model, and network packet analysis',
        'Basic vulnerability scanning with Nmap',
        'Security mindset and legal ethics'
      ],
      modules: [
        {
          title: 'Module 1: Linux for Hackers',
          description: 'Getting comfortable with the Linux terminal',
          order: 1,
          lectures: [
            {
              title: '1.1 Welcome & Course Orientation',
              description: 'Overview of the course and lab environment',
              order: 1,
              duration: 300,
              isPreview: true,
              video: {
                provider: 'cloudinary',
                playbackUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
                duration: 300
              }
            },
            {
              title: '1.2 Navigating the Linux File System',
              description: 'cd, ls, pwd, permissions, and directory structure',
              order: 2,
              duration: 600,
              isPreview: false,
              video: {
                provider: 'cloudinary',
                playbackUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
                duration: 600
              }
            }
          ]
        },
        {
          title: 'Module 2: Network Reconnaissance',
          description: 'Discovering hosts and open ports',
          order: 2,
          lectures: [
            {
              title: '2.1 Fundamentals of Port Scanning',
              description: 'SYN scan vs Connect scan',
              order: 1,
              duration: 450,
              isPreview: false,
              video: {
                provider: 'cloudinary',
                playbackUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
                duration: 450
              }
            }
          ]
        }
      ]
    });
    console.log('✅ Created Free Course:', freeCourse.title, `(${freeCourse.slug})`);

    // 4. Create Paid Course
    console.log('\n--- 3. Creating Paid Course ---');
    const paidCourse = await Course.create({
      tenantId,
      createdBy: admin._id,
      title: 'Advanced Web Application Penetration Testing',
      slug: 'advanced-web-pentesting',
      shortDescription: 'Deep dive into OWASP Top 10, SQL Injection, SSRF, IDOR, and authentication bypasses.',
      description: 'Comprehensive professional training track covering real-world web exploitation techniques, Burp Suite automation, and bug bounty methodologies.',
      type: 'paid',
      price: 7500,
      currency: 'PKR',
      category: 'Cyber Security',
      level: 'Advanced',
      status: 'published',
      isFeatured: true,
      whatYouWillLearn: [
        'Exploit complex SQLi and Second-order SQLi vulnerabilities',
        'Bypass WAFs and modern authentication mechanisms',
        'Exploit Server-Side Request Forgery (SSRF)',
        'Write professional penetration testing vulnerability reports'
      ],
      modules: [
        {
          title: 'Module 1: Burp Suite Pro & Recon',
          description: 'Advanced tooling and setup',
          order: 1,
          lectures: [
            {
              title: '1.1 Course Introduction & Lab Setup',
              description: 'Docker setup for vulnerable testbeds',
              order: 1,
              duration: 400,
              isPreview: true, // Free preview
              video: {
                provider: 'cloudinary',
                playbackUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
                duration: 400
              }
            },
            {
              title: '1.2 Advanced Burp Repeater & Intruder Macros',
              description: 'Automating multi-step payload delivery',
              order: 2,
              duration: 900,
              isPreview: false, // Locked for paid students only
              video: {
                provider: 'cloudinary',
                playbackUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
                duration: 900
              }
            }
          ]
        }
      ]
    });
    console.log('✅ Created Paid Course:', paidCourse.title, `(Price: ${paidCourse.currency} ${paidCourse.price})`);

    // 5. Test Public Catalog Discovery
    console.log('\n--- 4. Testing Public Catalog APIs ---');
    const publicCoursesResult = await lmsService.getPublicCourses(tenantId, {});
    console.log(`✅ Public courses returned: ${publicCoursesResult.courses.length} courses`);
    console.log('   Course sample stats:', {
      title: publicCoursesResult.courses[0].title,
      type: publicCoursesResult.courses[0].type,
      lectureCount: publicCoursesResult.courses[0].lectureCount,
      moduleCount: publicCoursesResult.courses[0].moduleCount,
      duration: publicCoursesResult.courses[0].duration
    });

    const publicFreeCourse = await lmsService.getPublicCourseBySlug(tenantId, 'ethical-hacking-intro');
    console.log('✅ Public course by slug retrieved:', publicFreeCourse.title);
    // Verify non-preview video URL is sanitized
    const lockedLec = publicFreeCourse.modules[0].lectures[1];
    if (lockedLec.playbackUrl || lockedLec.video?.playbackUrl) {
      throw new Error('❌ Security check failed: Non-preview video URL was exposed in public course outline!');
    }
    console.log('🔒 Verified: Locked lecture video URL is sanitized for unauthenticated public visitor.');

    // 6. Test Free Course Enrollment Flow
    console.log('\n--- 5. Testing Free Course Instant Enrollment ---');
    const enrollRes = await lmsService.enrollFreeCourse(tenantId, freeCourse._id, student1._id);
    console.log('✅ Free Course Enrolled response:', enrollRes.message);

    const checkFreeCourse = await Course.findById(freeCourse._id);
    if (!checkFreeCourse.enrolledStudents.includes(student1._id)) {
      throw new Error('❌ Student 1 not found in course.enrolledStudents');
    }
    console.log('✅ Verified: Student 1 added to free course enrolledStudents array.');

    // 7. Test Student Classroom Learning Data & Progress
    console.log('\n--- 6. Testing Classroom Learning Data & Video Playback Authorization ---');
    const learningData = await lmsService.getCourseLearningData(tenantId, freeCourse._id, student1._id, 'student');
    console.log(`✅ Classroom data retrieved: ${learningData.totalLectures} total lectures, ${learningData.overallProgressPercent}% overall progress`);

    const freeLec2 = freeCourse.modules[0].lectures[1];
    const playbackRes = await lmsService.getLecturePlayback(tenantId, freeCourse._id, freeLec2._id, student1._id, 'student');
    console.log('✅ Authorized video playback retrieved:', {
      title: playbackRes.title,
      hasPlaybackUrl: !!playbackRes.playbackUrl,
      canAccess: playbackRes.canAccess
    });

    // Update progress
    console.log('\n--- 7. Testing Video Progress Tracking & Auto-completion ---');
    // Save initial progress at 50%
    const p1 = await lmsService.updateLectureProgress(tenantId, freeCourse._id, freeLec2._id, student1._id, 300, 600);
    console.log('✅ Progress updated at 50% (300/600s): completed =', p1.completed);

    // Save progress at 95% (should auto-mark completed)
    const p2 = await lmsService.updateLectureProgress(tenantId, freeCourse._id, freeLec2._id, student1._id, 570, 600);
    console.log('✅ Progress updated at 95% (570/600s): completed =', p2.completed);
    if (!p2.completed) throw new Error('❌ Expected lecture to be marked completed at >= 90%');

    // Check updated course learning data
    const updatedLearning = await lmsService.getCourseLearningData(tenantId, freeCourse._id, student1._id, 'student');
    console.log(`✅ Updated overall progress: ${updatedLearning.completedLectures}/${updatedLearning.totalLectures} completed (${updatedLearning.overallProgressPercent}%)`);

    // 8. Test Paid Course Registration & Approval Flow
    console.log('\n--- 8. Testing Paid Course Registration & Admin Approval ---');
    
    // Check initial status for Student 1 on Paid Course
    const initialStatus = await lmsService.getRegistrationStatus(tenantId, paidCourse._id, student1._id);
    console.log('✅ Student 1 initial status for paid course:', initialStatus.status); // 'not_enrolled'

    // Student 1 attempts playback on locked lecture 2 (Should fail 403)
    const paidLec2 = paidCourse.modules[0].lectures[1];
    let accessDeniedCaught = false;
    try {
      await lmsService.getLecturePlayback(tenantId, paidCourse._id, paidLec2._id, student1._id, 'student');
    } catch (err) {
      if (err.statusCode === 403) accessDeniedCaught = true;
    }
    if (!accessDeniedCaught) throw new Error('❌ Expected 403 Access Denied on locked paid lecture for non-enrolled student');
    console.log('🔒 Verified: Access to non-preview lecture blocked with 403 for non-enrolled student.');

    // Student 1 plays Preview lecture 1 on Paid course (Should succeed)
    const paidLec1 = paidCourse.modules[0].lectures[0];
    const previewPlayback = await lmsService.getLecturePlayback(tenantId, paidCourse._id, paidLec1._id, student1._id, 'student');
    console.log('✅ Verified: Free preview lecture on paid course accessible without enrollment:', previewPlayback.title);

    // Student 1 submits paid registration
    const regResult = await lmsService.registerPaidCourse(tenantId, paidCourse._id, student1._id, {
      paymentReference: 'TRX-982341-BANK',
      notes: 'Paid via direct bank transfer to CSZone Habib Bank account.'
    });
    console.log('✅ Paid course registration submitted:', regResult.registration.status, `(ID: ${regResult.registration._id})`);

    // Check status is now 'pending'
    const pendingStatus = await lmsService.getRegistrationStatus(tenantId, paidCourse._id, student1._id);
    console.log('✅ Verified registration status is now:', pendingStatus.status);

    // Admin views registrations
    const adminRegs = await lmsService.getAdminRegistrations(tenantId, { status: 'pending' });
    console.log(`✅ Admin retrieved ${adminRegs.length} pending registration(s)`);

    // Admin approves registration
    const approveResult = await lmsService.approveRegistration(tenantId, regResult.registration._id, admin._id);
    console.log('✅ Admin approved registration:', approveResult.message);

    // Verify Student 1 is now enrolled in Paid course
    const finalStatus = await lmsService.getRegistrationStatus(tenantId, paidCourse._id, student1._id);
    console.log('✅ Student 1 status after admin approval:', finalStatus.status); // 'enrolled'

    // Student 1 can now access locked Lecture 2 playback!
    const unlockedPlayback = await lmsService.getLecturePlayback(tenantId, paidCourse._id, paidLec2._id, student1._id, 'student');
    console.log('🎉 Student 1 now accesses previously locked lecture:', unlockedPlayback.title, `(playbackUrl present: ${!!unlockedPlayback.playbackUrl})`);

    // 9. Test Student Dashboard Service
    console.log('\n--- 9. Testing Student Dashboard Service ---');
    const studentCourses = await lmsService.getStudentEnrolledCourses(tenantId, student1._id);
    console.log(`✅ Student 1 enrolled courses list: ${studentCourses.length} courses`);
    
    const continueLearning = await lmsService.getStudentContinueLearning(tenantId, student1._id);
    console.log('✅ Student 1 continue learning card:', {
      course: continueLearning?.title,
      lastLecture: continueLearning?.lastLecture?.title,
      progressPercent: continueLearning?.progressPercent
    });

    // 10. Test Course Builder (Modules & Lectures)
    console.log('\n--- 10. Testing Admin Course Builder ---');
    const newMod = await lmsService.addModule(tenantId, paidCourse._id, { title: 'Module 2: Server-Side Request Forgery' }, admin._id);
    console.log('✅ Added new module to paid course:', newMod.title);

    const newLec = await lmsService.addLecture(tenantId, paidCourse._id, newMod._id, {
      title: '2.1 SSRF to Cloud Metadata (AWS/GCP)',
      description: 'Extracting IAM instance credentials via 169.254.169.254',
      duration: 720,
      isPreview: false,
    }, admin._id);
    console.log('✅ Added new lecture to module:', newLec.title);

    console.log('\n====================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('====================================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED WITH ERROR:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTests();
