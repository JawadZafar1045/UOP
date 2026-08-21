const Session = require('../models/session.model');
const Attendance = require('../models/attendance.model');
const QuizAttempt = require('../models/quizAttempt.model');
const Certificate = require('../models/certificate.model');
const Course = require('../models/course.model');
const CourseRegistration = require('../models/courseRegistration.model');
const LectureProgress = require('../models/lectureProgress.model');

const ensureIndexes = async () => {
  try {
    console.log('[LMS] Ensuring MongoDB indexes...');
    
    await Session.collection.createIndex({ tenantId: 1, courseId: 1, date: -1 });
    await Attendance.collection.createIndex({ tenantId: 1, sessionId: 1, studentId: 1 }, { unique: true });
    await QuizAttempt.collection.createIndex({ tenantId: 1, quizId: 1, studentId: 1 });
    await Certificate.collection.createIndex({ tenantId: 1, courseId: 1, studentId: 1 }, { unique: true });
    await Certificate.collection.createIndex({ verificationCode: 1 }, { unique: true });

    // Course indexes
    await Course.collection.createIndex({ tenantId: 1, isPublished: 1, status: 1 });
    await Course.collection.createIndex({ slug: 1 });
    await Course.collection.createIndex({ tenantId: 1, type: 1, isFeatured: 1 });

    // CourseRegistration indexes
    await CourseRegistration.collection.createIndex({ tenantId: 1, courseId: 1, userId: 1 });
    await CourseRegistration.collection.createIndex({ tenantId: 1, status: 1, createdAt: -1 });

    // LectureProgress indexes
    await LectureProgress.collection.createIndex({ tenantId: 1, userId: 1, courseId: 1, lectureId: 1 }, { unique: true });
    await LectureProgress.collection.createIndex({ userId: 1, courseId: 1, completed: 1 });

    console.log('[LMS] Indexes ensured successfully.');
  } catch (error) {
    console.error('[LMS] Error ensuring indexes:', error);
  }
};

module.exports = { ensureIndexes };
