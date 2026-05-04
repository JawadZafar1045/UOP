const { v4: uuidv4 } = require('uuid');
const Course        = require('../models/course.model');
const Attendance    = require('../models/attendance.model');
const Assignment    = require('../models/assignment.model');
const Session       = require('../models/session.model');
const LmsDocument   = require('../models/lmsDocument.model');
const Quiz          = require('../models/quiz.model');
const QuizQuestion  = require('../models/quizQuestion.model');
const QuizAttempt   = require('../models/quizAttempt.model');
const Certificate   = require('../models/certificate.model');
const certificateGenerator = require('../utils/certificateGenerator');
const { uploadFile, deleteFile }      = require('../../shared/services/fileService');
const { sendNotification }            = require('../../shared/services/notification.service');
const { logActivity }                 = require('../../shared/services/activityLogger.service');

// ── Helper ─────────────────────────────────────────────────────────────────────
const err = (msg, code = 400) => Object.assign(new Error(msg), { statusCode: code });

// ══════════════════════════════════════════════════════════════════════════════
// COURSES (existing, preserved)
// ══════════════════════════════════════════════════════════════════════════════
const getCourses = async ({ tenantId, page = 1, limit = 20 }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [courses, total] = await Promise.all([
    Course.find({ tenantId })
      .populate('instructor', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip).limit(parseInt(limit)),
    Course.countDocuments({ tenantId }),
  ]);
  return { courses, total, page: parseInt(page), pages: Math.ceil(total / limit) };
};

const getCourseById = async (tenantId, courseId) => {
  const course = await Course.findOne({ _id: courseId, tenantId })
    .populate('instructor', 'name email avatar')
    .populate('enrolledStudents', 'name email avatar');
  if (!course) throw err('Course not found.', 404);
  return course;
};

const createCourse = async (tenantId, data, userId) => {
  const course = await Course.create({ ...data, tenantId });
  await logActivity({ userId, tenantId, action: 'CREATE_COURSE', entityType: 'Course', entityId: course._id });
  return course;
};

const updateCourse = async (tenantId, courseId, data, userId) => {
  const course = await Course.findOneAndUpdate({ _id: courseId, tenantId }, data, { new: true, runValidators: true });
  if (!course) throw err('Course not found.', 404);
  await logActivity({ userId, tenantId, action: 'UPDATE_COURSE', entityType: 'Course', entityId: courseId });
  return course;
};

const deleteCourse = async (tenantId, courseId, userId) => {
  const course = await Course.findOneAndDelete({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  await logActivity({ userId, tenantId, action: 'DELETE_COURSE', entityType: 'Course', entityId: courseId });
};

// ── Enrollment ─────────────────────────────────────────────────────────────────
const enrollStudent = async (tenantId, courseId, studentId, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (course.enrolledStudents.map(String).includes(String(studentId)))
    throw err('Student already enrolled.', 409);
  course.enrolledStudents.push(studentId);
  await course.save();
  await logActivity({ userId, tenantId, action: 'ENROLL_STUDENT', entityType: 'Course', entityId: courseId, meta: { studentId } });
  return course;
};

// ── Old attendance (preserved for backward compat) ─────────────────────────────
const markAttendance = async (tenantId, attendanceData, userId) => {
  const record = await Attendance.create({ tenantId, ...attendanceData });
  await logActivity({ userId, tenantId, action: 'MARK_ATTENDANCE', entityType: 'Attendance', entityId: record._id });
  return record;
};
const getCourseAttendance = async (tenantId, courseId) =>
  Attendance.find({ tenantId, courseId }).populate('studentId', 'name email').sort({ createdAt: -1 });

// ── Assignments (preserved) ────────────────────────────────────────────────────
const createAssignment = async (tenantId, data, userId) => {
  const assignment = await Assignment.create({ tenantId, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_ASSIGNMENT', entityType: 'Assignment', entityId: assignment._id });
  return assignment;
};
const submitAssignment = async (tenantId, assignmentId, studentId, submissionData) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);
  assignment.submissions.push({ studentId, ...submissionData });
  await assignment.save();
  return assignment;
};

// ══════════════════════════════════════════════════════════════════════════════
// SESSIONS
// ══════════════════════════════════════════════════════════════════════════════
const createSession = async (tenantId, courseId, data, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  const session = await Session.create({ tenantId, courseId, createdBy: userId, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_SESSION', entityType: 'Session', entityId: session._id });
  return session;
};

const toggleSession = async (tenantId, sessionId, userId) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);
  session.isOpen = !session.isOpen;
  if (!session.isOpen) session.attendanceCloseAt = new Date();
  await session.save();
  await logActivity({ userId, tenantId, action: session.isOpen ? 'OPEN_SESSION' : 'CLOSE_SESSION', entityType: 'Session', entityId: sessionId });
  return session;
};

const getCourseSessions = async (tenantId, courseId) =>
  Session.find({ tenantId, courseId }).sort({ date: -1 });

const getSessionAttendance = async (tenantId, sessionId) =>
  Attendance.find({ tenantId, sessionId }).populate('studentId', 'name email');

// ══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE — SELF-MARK
// ══════════════════════════════════════════════════════════════════════════════
const markSelfAttendance = async (tenantId, sessionId, studentId, ipAddress) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);
  if (!session.isOpen) throw err('Attendance window is not open for this session.', 403);

  if (session.attendanceCloseAt && new Date() > session.attendanceCloseAt)
    throw err('Attendance window has closed.', 403);

  const course = await Course.findOne({ _id: session.courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (!course.enrolledStudents.map(String).includes(String(studentId)))
    throw err('You are not enrolled in this course.', 403);

  const existing = await Attendance.findOne({ tenantId, sessionId, studentId });
  if (existing) throw err('Attendance already marked for this session.', 409);

  return Attendance.create({ tenantId, sessionId, courseId: session.courseId, studentId, status: 'present', markedAt: new Date(), ipAddress });
};

const getMyAttendanceSummary = async (tenantId, courseId, studentId) => {
  const [total, present] = await Promise.all([
    Session.countDocuments({ tenantId, courseId }),
    Attendance.countDocuments({ tenantId, courseId, studentId, status: 'present' }),
  ]);
  return { total, present, percentage: total === 0 ? 0 : Math.round((present / total) * 100) };
};

const overrideAttendance = async (tenantId, sessionId, studentId, status, reason, teacherId) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);
  const record = await Attendance.findOneAndUpdate(
    { tenantId, sessionId, studentId },
    { status, overriddenBy: teacherId, overrideReason: reason, courseId: session.courseId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return record;
};

// ══════════════════════════════════════════════════════════════════════════════
// LMS DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════
const uploadCourseDocument = async (tenantId, courseId, file, data, userId) => {
  const { url, publicId } = await uploadFile(file, 'lms_documents');
  const doc = await LmsDocument.create({
    tenantId, courseId, uploadedBy: userId,
    fileUrl: url, publicId,
    fileSize: file.size,
    ...data,
  });
  return doc;
};

const getCourseDocuments = async (tenantId, courseId, userRole) => {
  const filter = { tenantId, courseId };
  if (userRole === 'student') filter.visibleToStudents = true;
  return LmsDocument.find(filter).sort({ createdAt: -1 });
};

const deleteCourseDocument = async (tenantId, documentId, userId) => {
  const doc = await LmsDocument.findOne({ _id: documentId, tenantId });
  if (!doc) throw err('Document not found.', 404);
  await deleteFile(doc.publicId);
  await doc.deleteOne();
  await logActivity({ userId, tenantId, action: 'DELETE_LMS_DOCUMENT', entityType: 'LmsDocument', entityId: documentId });
};

// ══════════════════════════════════════════════════════════════════════════════
// ASSIGNMENT GRADING
// ══════════════════════════════════════════════════════════════════════════════
const gradeSubmission = async (tenantId, assignmentId, studentId, score, feedback, teacherId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);
  const sub = assignment.submissions.find(s => String(s.studentId) === String(studentId));
  if (!sub) throw err('Submission not found.', 404);
  sub.marks    = score;
  sub.feedback = feedback;
  sub.status   = 'graded';
  await assignment.save();
  await sendNotification({
    userId: studentId, tenantId,
    title: 'Assignment Graded',
    message: `Your submission for "${assignment.title}" has been graded. Score: ${score}/${assignment.maxMarks}.`,
    type: 'success',
  });
  return assignment;
};

const getAssignmentSubmissions = async (tenantId, assignmentId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId })
    .populate('submissions.studentId', 'name email');
  if (!assignment) throw err('Assignment not found.', 404);
  return assignment;
};

const getMySubmission = async (tenantId, assignmentId, studentId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);
  const sub = assignment.submissions.find(s => String(s.studentId) === String(studentId));
  return sub || null;
};

// ══════════════════════════════════════════════════════════════════════════════
// QUIZZES
// ══════════════════════════════════════════════════════════════════════════════
const createQuiz = async (tenantId, courseId, data, userId) => {
  const quiz = await Quiz.create({ tenantId, courseId, createdBy: userId, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_QUIZ', entityType: 'Quiz', entityId: quiz._id });
  return quiz;
};

const addQuizQuestion = async (tenantId, quizId, questionData) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);
  if (!Array.isArray(questionData.options) || questionData.options.length !== 4)
    throw err('options must be an array of exactly 4 items.', 400);
  return QuizQuestion.create({ tenantId, quizId, ...questionData });
};

const publishQuiz = async (tenantId, quizId, userId) => {
  const quiz = await Quiz.findOneAndUpdate(
    { _id: quizId, tenantId },
    { status: 'published' },
    { new: true }
  );
  if (!quiz) throw err('Quiz not found.', 404);
  await logActivity({ userId, tenantId, action: 'PUBLISH_QUIZ', entityType: 'Quiz', entityId: quizId });
  return quiz;
};

const startQuizAttempt = async (tenantId, quizId, studentId) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);
  if (quiz.status !== 'published') throw err('This quiz is not available.', 403);

  const attemptCount = await QuizAttempt.countDocuments({ tenantId, quizId, studentId });
  if (attemptCount >= quiz.maxAttempts) throw err('No attempts remaining.', 403);

  const attempt = await QuizAttempt.create({
    tenantId, quizId, courseId: quiz.courseId, studentId,
    startedAt: new Date(),
    attemptNumber: attemptCount + 1,
  });

  let questions = await QuizQuestion.find({ tenantId, quizId }).lean();
  if (quiz.shuffleQuestions) questions = questions.sort(() => Math.random() - 0.5);

  // Strip correct answer before sending to student
  const safeQuestions = questions.map(({ correctIndex, explanation, ...q }) => q);
  return { attempt, questions: safeQuestions };
};

const submitQuizAttempt = async (tenantId, quizId, studentId, answers) => {
  const attempt = await QuizAttempt.findOne({ tenantId, quizId, studentId, submittedAt: null });
  if (!attempt) throw err('No active attempt found.', 404);

  const quiz      = await Quiz.findOne({ _id: quizId, tenantId });
  const questions = await QuizQuestion.find({ tenantId, quizId }).lean();
  const qMap      = Object.fromEntries(questions.map(q => [String(q._id), q]));

  let totalMarks = 0;
  let maxMarks   = 0;
  const breakdown = [];

  const gradedAnswers = (answers || []).map(a => {
    const q          = qMap[String(a.questionId)];
    if (!q) return { ...a, isCorrect: false, marksAwarded: 0 };
    const isCorrect  = a.selectedIndex === q.correctIndex;
    const awarded    = isCorrect ? (q.marks || 1) : 0;
    totalMarks      += awarded;
    maxMarks        += q.marks || 1;
    breakdown.push({
      questionId:    q._id,
      question:      q.question,
      selectedIndex: a.selectedIndex,
      correctAnswer: q.correctIndex,
      explanation:   q.explanation,
      isCorrect,
      marksAwarded:  awarded,
    });
    return { questionId: a.questionId, selectedIndex: a.selectedIndex, isCorrect, marksAwarded: awarded };
  });

  const percentScore = maxMarks === 0 ? 0 : Math.round((totalMarks / maxMarks) * 100);
  const passed       = percentScore >= quiz.passMark;

  attempt.answers      = gradedAnswers;
  attempt.totalMarks   = totalMarks;
  attempt.maxMarks     = maxMarks;
  attempt.percentScore = percentScore;
  attempt.passed       = passed;
  attempt.submittedAt  = new Date();
  attempt.timeTakenSeconds = attempt.startedAt
    ? Math.round((Date.now() - attempt.startedAt.getTime()) / 1000)
    : null;
  await attempt.save();

  const result = { score: percentScore, passed, totalMarks, maxMarks };
  if (quiz.showResultImmediately) result.breakdown = breakdown;
  return result;
};

const getQuizResults = async (tenantId, quizId) =>
  QuizAttempt.find({ tenantId, quizId }).populate('studentId', 'name email');

const getMyQuizAttempts = async (tenantId, quizId, studentId) =>
  QuizAttempt.find({ tenantId, quizId, studentId });

// ══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE + CERTIFICATES
// ══════════════════════════════════════════════════════════════════════════════
const checkEligibility = async (tenantId, courseId, studentId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  const { minAttendancePercent = 75, minAssignmentScore = 60, minQuizScore = 60 } = course.completionCriteria || {};

  // Attendance
  const totalSessions  = await Session.countDocuments({ tenantId, courseId });
  const presentCount   = await Attendance.countDocuments({ tenantId, courseId, studentId, status: 'present' });
  const attendancePct  = totalSessions === 0 ? 100 : Math.round((presentCount / totalSessions) * 100);

  // Assignment avg
  const assignments    = await Assignment.find({ tenantId, courseId });
  let assignmentScore  = 100;
  if (assignments.length > 0) {
    const scores = assignments.map(a => {
      const sub = a.submissions.find(s => String(s.studentId) === String(studentId));
      return (sub && sub.marks != null) ? (sub.marks / (a.maxMarks || 100)) * 100 : null;
    }).filter(s => s !== null);
    assignmentScore = scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Quiz avg (best attempt per quiz)
  const quizzes     = await Quiz.find({ tenantId, courseId, status: 'published' });
  let quizScore     = 100;
  if (quizzes.length > 0) {
    const scores = await Promise.all(quizzes.map(async q => {
      const best = await QuizAttempt.findOne({ tenantId, quizId: q._id, studentId })
        .sort({ percentScore: -1 });
      return best ? best.percentScore : null;
    }));
    const valid  = scores.filter(s => s !== null);
    quizScore    = valid.length === 0 ? 0 : Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }

  const reasons   = [];
  if (attendancePct  < minAttendancePercent) reasons.push(`Attendance ${attendancePct}% < required ${minAttendancePercent}%`);
  if (assignmentScore < minAssignmentScore)  reasons.push(`Assignment avg ${assignmentScore}% < required ${minAssignmentScore}%`);
  if (quizScore       < minQuizScore)        reasons.push(`Quiz avg ${quizScore}% < required ${minQuizScore}%`);

  return {
    eligible: reasons.length === 0,
    reason:   reasons.join('; ') || null,
    attendancePercent: attendancePct,
    assignmentScore,
    quizScore,
  };
};

const getMyPerformance = async (tenantId, courseId, studentId) =>
  checkEligibility(tenantId, courseId, studentId);

const getCoursePerformance = async (tenantId, courseId) => {
  const course = await Course.findOne({ _id: courseId, tenantId }).populate('enrolledStudents', 'name email');
  if (!course) throw err('Course not found.', 404);
  const results = await Promise.all(
    course.enrolledStudents.map(async student => {
      const perf = await checkEligibility(tenantId, courseId, student._id);
      return { student: { _id: student._id, name: student.name, email: student.email }, ...perf };
    })
  );
  return results.sort((a, b) => a.student.name.localeCompare(b.student.name));
};

const generateCertificate = async (tenantId, courseId, studentId, issuedBy) => {
  const eligibility = await checkEligibility(tenantId, courseId, studentId);
  if (!eligibility.eligible) throw err(`Student is not eligible: ${eligibility.reason}`, 400);

  const existing = await Certificate.findOne({ tenantId, courseId, studentId });
  if (existing) throw err('Certificate already issued for this student.', 409);

  const year    = new Date().getFullYear();
  const count   = await Certificate.countDocuments({ tenantId }) + 1;
  const certNum = `UOP-${year}-${String(count).padStart(5, '0')}`;
  const verCode = uuidv4();

  const course = await Course.findOne({ _id: courseId, tenantId });
  const instructor = await require('../../shared/models/user.model').findById(course.instructor);
  const student = await require('../../shared/models/user.model').findById(studentId);

  // Generate the actual PDF
  const { fileUrl, publicId } = await certificateGenerator.generate({
    studentName: student.name,
    courseName: course.title,
    teacherName: instructor ? instructor.name : 'Instructor',
    issuedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    certificateNumber: certNum,
    verificationCode: verCode,
    attendancePercent: eligibility.attendancePercent,
    averageScore: Math.round((eligibility.assignmentScore + eligibility.quizScore) / 2)
  });

  const certificate = await Certificate.create({
    tenantId, courseId, studentId,
    certificateNumber: certNum,
    verificationCode:  verCode,
    attendancePercent: eligibility.attendancePercent,
    averageAssignmentScore: eligibility.assignmentScore,
    averageQuizScore:  eligibility.quizScore,
    fileUrl, publicId,
    issuedAt: new Date(),
  });

  await sendNotification({
    userId: studentId, tenantId,
    title: 'Certificate Issued!',
    message: `Congratulations! Your certificate for "${course.title}" has been issued. Certificate No: ${certNum}.`,
    type: 'success',
  });
  await logActivity({ userId: issuedBy, tenantId, action: 'ISSUE_CERTIFICATE', entityType: 'Certificate', entityId: certificate._id, meta: { studentId, courseId } });
  return certificate;
};

const generateAllCertificates = async (tenantId, courseId, issuedBy) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const generated = [], skipped = [], errors = [];

  await Promise.all(course.enrolledStudents.map(async studentId => {
    const sid = String(studentId);
    try {
      const already = await Certificate.findOne({ tenantId, courseId, studentId });
      if (already) { skipped.push({ studentId: sid, reason: 'Certificate already exists' }); return; }
      const elig = await checkEligibility(tenantId, courseId, studentId);
      if (!elig.eligible) { skipped.push({ studentId: sid, reason: elig.reason }); return; }
      const cert = await generateCertificate(tenantId, courseId, studentId, issuedBy);
      generated.push({ studentId: sid, certificateNumber: cert.certificateNumber });
    } catch (e) {
      errors.push({ studentId: sid, error: e.message });
    }
  }));

  return { generated, skipped, errors };
};

const getCourseCertificates = async (tenantId, courseId) =>
  Certificate.find({ tenantId, courseId }).populate('studentId', 'name email');

const getMyCertificates = async (tenantId, studentId) =>
  Certificate.find({ tenantId, studentId }).populate('courseId', 'title instructor');

const verifyCertificate = async (verificationCode) => {
  const cert = await Certificate.findOne({ verificationCode })
    .populate('courseId',   'title instructor')
    .populate('studentId',  'name email');
  if (!cert) throw err('Certificate not found or invalid code.', 404);
  return { ...cert.toObject(), isValid: cert.isValid };
};

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════════
module.exports = {
  // Courses
  getCourses, getCourseById, createCourse, updateCourse, deleteCourse, enrollStudent,
  // Legacy attendance
  markAttendance, getCourseAttendance,
  // Assignments
  createAssignment, submitAssignment,
  // Sessions
  createSession, toggleSession, getCourseSessions, getSessionAttendance,
  // Self-mark attendance
  markSelfAttendance, getMyAttendanceSummary, overrideAttendance,
  // LMS Documents
  uploadCourseDocument, getCourseDocuments, deleteCourseDocument,
  // Assignment grading
  gradeSubmission, getAssignmentSubmissions, getMySubmission,
  // Quizzes
  createQuiz, addQuizQuestion, publishQuiz,
  startQuizAttempt, submitQuizAttempt, getQuizResults, getMyQuizAttempts,
  // Performance + Certificates
  getCoursePerformance, getMyPerformance, checkEligibility,
  generateCertificate, generateAllCertificates,
  getCourseCertificates, getMyCertificates, verifyCertificate,
};
