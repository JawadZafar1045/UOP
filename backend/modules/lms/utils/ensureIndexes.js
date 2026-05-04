const Session = require('../models/session.model');
const Attendance = require('../models/attendance.model');
const QuizAttempt = require('../models/quizAttempt.model');
const Certificate = require('../models/certificate.model');

const ensureIndexes = async () => {
  try {
    console.log('[LMS] Ensuring MongoDB indexes...');
    
    await Session.collection.createIndex({ tenantId: 1, courseId: 1, date: -1 });
    await Attendance.collection.createIndex({ tenantId: 1, sessionId: 1, studentId: 1 }, { unique: true });
    await QuizAttempt.collection.createIndex({ tenantId: 1, quizId: 1, studentId: 1 });
    await Certificate.collection.createIndex({ tenantId: 1, courseId: 1, studentId: 1 }, { unique: true });
    await Certificate.collection.createIndex({ verificationCode: 1 }, { unique: true });

    console.log('[LMS] Indexes ensured successfully.');
  } catch (error) {
    console.error('[LMS] Error ensuring indexes:', error);
  }
};

module.exports = { ensureIndexes };
