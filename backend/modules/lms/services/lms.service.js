const { v4: uuidv4 } = require('uuid');
const Course = require('../models/course.model');
const Attendance = require('../models/attendance.model');
const Assignment = require('../models/assignment.model');
const Session = require('../models/session.model');
const LmsDocument = require('../models/lmsDocument.model');
const Quiz = require('../models/quiz.model');
const QuizQuestion = require('../models/quizQuestion.model');
const QuizAttempt = require('../models/quizAttempt.model');
const Certificate = require('../models/certificate.model');
const certificateGenerator = require('../utils/certificateGenerator');
const { uploadFile, deleteFile } = require('../../shared/services/fileService');
const { sendNotification } = require('../../shared/services/notification.service');
const { logActivity } = require('../../shared/services/activityLogger.service');

// ── Helper ─────────────────────────────────────────────────────────────────────
const err = (msg, code = 400) => Object.assign(new Error(msg), { statusCode: code });

// ══════════════════════════════════════════════════════════════════════════════
// COURSES (existing, preserved)
// ══════════════════════════════════════════════════════════════════════════════
const getCourses = async ({ tenantId, userId, role, page = 1, limit = 20 }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const filter = { tenantId };
  if (role === 'student') {
    // Students see courses they are enrolled in (any status) 
    // OR active courses in their tenant.
    filter.$or = [
      { enrolledStudents: userId },
      { tenantId: tenantId, status: 'active' }
    ];
    delete filter.tenantId;
  } else if (role === 'teacher') {
    // Teachers only see courses they are assigned to as instructor
    filter.instructor = userId;
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('instructor', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip).limit(parseInt(limit)),
    Course.countDocuments(filter),
  ]);
  return { courses, total, page: parseInt(page), pages: Math.ceil(total / limit) };
};

const getCourseById = async (tenantId, courseId, userId, role) => {
  const filter = { _id: courseId };
  if (role !== 'student') {
    filter.tenantId = tenantId;
  }

  const course = await Course.findOne(filter)
    .populate('instructor', 'name email avatar')
    .populate('enrolledStudents', 'name email avatar');
    
  if (!course) throw err('Course not found.', 404);

  if (role === 'student') {
    const isEnrolled = course.enrolledStudents.some(s => String(s._id) === String(userId));
    if (!isEnrolled && course.status !== 'active') throw err('This course is not currently active or you are not enrolled.', 403);
  }

  const [sessionCount, assignmentCount, quizCount] = await Promise.all([
    Session.countDocuments({ courseId }),
    Assignment.countDocuments({ courseId }),
    Quiz.countDocuments({ courseId, status: 'published' })
  ]);

  const courseObj = course.toObject();
  courseObj.stats = {
    sessions: sessionCount,
    assignments: assignmentCount,
    quizzes: quizCount
  };

  return courseObj;
};

const createCourse = async (tenantId, data, userId) => {
  const course = await Course.create({ instructor: userId, ...data, tenantId });
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
const enrollStudent = async (tenantId, courseId, studentIdentifier, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const User = require('../../auth/models/user.model');
  const identifier = String(studentIdentifier).trim();
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

  let student = await User.findOne({
    tenantId,
    $or: [
      { email: identifier.toLowerCase() },
      ...(isValidObjectId ? [{ _id: identifier }] : [])
    ]
  });

  if (!student) {
    const globalStudent = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        ...(isValidObjectId ? [{ _id: identifier }] : [])
      ]
    });
    if (globalStudent) student = globalStudent;
  }

  if (!student) throw err('Student not found. Please ensure the email is correct and the student is registered.', 404);

  if (course.enrolledStudents.map(String).includes(String(student._id)))
    throw err('Student already enrolled.', 409);

  course.enrolledStudents.push(student._id);
  await course.save();
  await logActivity({ userId, tenantId, action: 'ENROLL_STUDENT', entityType: 'Course', entityId: courseId, meta: { studentId: student._id } });
  return course;
};

// ── Legacy attendance ──────────────────────────────────────────────────────────
const markAttendance = async (tenantId, attendanceData, userId) => {
  const record = await Attendance.create({ tenantId, ...attendanceData });
  await logActivity({ userId, tenantId, action: 'MARK_ATTENDANCE', entityType: 'Attendance', entityId: record._id });
  return record;
};
const getCourseAttendance = async (tenantId, courseId) =>
  Attendance.find({ tenantId, courseId }).populate('studentId', 'name email').sort({ createdAt: -1 });

// ── Assignments ────────────────────────────────────────────────────────────────
const createAssignment = async (tenantId, data, files, userId) => {
  const materials = [];
  if (files && files.length > 0) {
    const { uploadFile } = require('../../shared/services/fileService');
    for (const file of files) {
      const uploaded = await uploadFile(file, 'lms_assignments');
      materials.push({ name: file.originalname, url: uploaded.url, publicId: uploaded.publicId });
    }
  }
  const assignment = await Assignment.create({ tenantId, materials, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_ASSIGNMENT', entityType: 'Assignment', entityId: assignment._id });
  return assignment;
};

const getCourseAssignments = async (tenantId, courseId) => Assignment.find({ courseId }).sort({ createdAt: -1 });

const submitAssignment = async (tenantId, assignmentId, studentId, submissionData, file) => {
  const assignment = await Assignment.findOne({ _id: assignmentId });
  if (!assignment) throw err('Assignment not found.', 404);

  const submission = { 
    studentId, 
    text: submissionData.text,
    submittedAt: new Date()
  };

  if (file) {
    const { uploadFile } = require('../../shared/services/fileService');
    const uploaded = await uploadFile(file, 'lms_submissions');
    submission.fileUrl = uploaded.url;
    submission.publicId = uploaded.publicId;
  }

  assignment.submissions.push(submission);
  await assignment.save();
  return assignment;
};

// ── Sessions ───────────────────────────────────────────────────────────────────
const createSession = async (tenantId, courseId, data, files, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  const materials = [];
  if (files && files.length > 0) {
    const { uploadFile } = require('../../shared/services/fileService');
    for (const file of files) {
      const uploaded = await uploadFile(file, 'lms_sessions');
      materials.push({ name: file.originalname, url: uploaded.url, publicId: uploaded.publicId });
    }
  } else if (data.materialUrl) {
    materials.push({ name: 'Material', url: data.materialUrl, publicId: null });
  }
  const session = await Session.create({ tenantId, courseId, createdBy: userId, materials, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_SESSION', entityType: 'Session', entityId: session._id });
  return session;
};

const toggleSession = async (tenantId, sessionId, userId) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);
  session.isOpen = !session.isOpen;
  if (session.isOpen) {
    session.attendanceCloseAt = null;
  } else {
    session.attendanceCloseAt = new Date();
  }
  await session.save();
  await logActivity({ userId, tenantId, action: session.isOpen ? 'OPEN_SESSION' : 'CLOSE_SESSION', entityType: 'Session', entityId: sessionId });
  return session;
};

const getCourseSessions = async (tenantId, courseId) => Session.find({ courseId }).sort({ date: -1 });

const getSessionAttendance = async (tenantId, sessionId) =>
  Attendance.find({ tenantId, sessionId }).populate('studentId', 'name email');

// ── Attendance Self-Mark ──────────────────────────────────────────────────────
const markSelfAttendance = async (tenantId, sessionId, studentId, ipAddress) => {
  const session = await Session.findById(sessionId);
  if (!session) throw err('Session not found.', 404);
  if (!session.isOpen) throw err('Attendance window is not open for this session.', 403);

  if (session.attendanceCloseAt && new Date() > session.attendanceCloseAt) {
    session.attendanceCloseAt = null;
    await session.save();
  }

  const course = await Course.findById(session.courseId);
  if (!course) throw err('Course not found.', 404);
  if (!course.enrolledStudents.map(String).includes(String(studentId)))
    throw err('You are not enrolled in this course.', 403);

  const existing = await Attendance.findOne({ sessionId, studentId });
  if (existing) throw err('Attendance already marked for this session.', 409);

  return Attendance.create({ 
    tenantId: session.tenantId, 
    sessionId, 
    courseId: session.courseId, 
    studentId, 
    status: 'present', 
    markedAt: new Date(), 
    ipAddress 
  });
};

const getMyAttendanceSummary = async (tenantId, courseId, studentId) => {
  const course = await Course.findById(courseId);
  if (!course) return { total: 0, present: 0, percentage: 0 };
  const [total, present] = await Promise.all([
    Session.countDocuments({ courseId, tenantId: course.tenantId }),
    Attendance.countDocuments({ courseId, studentId, status: 'present', tenantId: course.tenantId }),
  ]);
  return { total, present, percentage: total === 0 ? 0 : Math.round((present / total) * 100) };
};

const overrideAttendance = async (tenantId, sessionId, studentId, status, reason, teacherId) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);
  return Attendance.findOneAndUpdate(
    { tenantId, sessionId, studentId },
    { status, overriddenBy: teacherId, overrideReason: reason, courseId: session.courseId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

// ── LMS Documents ──────────────────────────────────────────────────────────────
const uploadCourseDocument = async (tenantId, courseId, file, data, userId) => {
  const { url, publicId, resourceType } = await uploadFile(file, 'lms_documents');
  return LmsDocument.create({
    tenantId, courseId, uploadedBy: userId,
    fileUrl: url, publicId, resourceType,
    fileSize: file.size,
    ...data,
  });
};

const getCourseDocuments = async (tenantId, courseId, userRole) => {
  const filter = { courseId };
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

const getLmsDocumentById = async (tenantId, documentId) => {
  return LmsDocument.findOne({ _id: documentId, tenantId });
};

const getCourseDocumentAccess = async (tenantId, documentId) => {
  const doc = await getLmsDocumentById(tenantId, documentId);
  if (!doc) throw err('Document not found.', 404);
  
  const cloudinary = require('../../../config/cloudinary');
  const isRaw = doc.fileUrl.includes('/raw/');

  if (!isRaw) {
    return { url: doc.fileUrl };
  }

  const url = cloudinary.utils.url(doc.publicId, {
    resource_type: 'raw',
    sign_url: true,
    secure: true
  });

  return { url, fileName: doc.fileName || doc.title || 'document' };
};

// ── Assignment Grading ─────────────────────────────────────────────────────────
const gradeSubmission = async (tenantId, assignmentId, studentId, score, feedback, teacherId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);
  const sub = assignment.submissions.find(s => String(s.studentId) === String(studentId));
  if (!sub) throw err('Submission not found.', 404);
  sub.marks = score; sub.feedback = feedback; sub.status = 'graded';
  await assignment.save();
  await sendNotification({ userId: studentId, tenantId, title: 'Assignment Graded', message: `Your submission for "${assignment.title}" has been graded. Score: ${score}/${assignment.maxMarks}.`, type: 'success' });
  return assignment;
};

const getAssignmentSubmissions = async (tenantId, assignmentId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId }).populate('submissions.studentId', 'name email');
  if (!assignment) throw err('Assignment not found.', 404);
  return assignment;
};

const getMySubmission = async (tenantId, assignmentId, studentId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId });
  if (!assignment) throw err('Assignment not found.', 404);
  return assignment.submissions.find(s => String(s.studentId) === String(studentId)) || null;
};

// ── Quizzes ────────────────────────────────────────────────────────────────────
const createQuiz = async (tenantId, courseId, data, userId) => {
  const quiz = await Quiz.create({ tenantId, courseId, createdBy: userId, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_QUIZ', entityType: 'Quiz', entityId: quiz._id });
  return quiz;
};

const getCourseQuizzes = async (tenantId, courseId, userRole, userId) => {
  const filter = { courseId };
  if (userRole === 'student') filter.status = 'published';
  const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
  return Promise.all(quizzes.map(async (quiz) => {
    const count = await QuizQuestion.countDocuments({ quizId: quiz._id });
    const quizObj = { ...quiz.toObject(), questionCount: count };

    if (userRole === 'student' && userId) {
      const attempts = await QuizAttempt.countDocuments({ quizId: quiz._id, studentId: userId });
      const bestAttempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: userId }).sort({ percentScore: -1 });
      quizObj.myAttempts = attempts;
      quizObj.bestScore = bestAttempt ? bestAttempt.percentScore : null;
    }

    return quizObj;
  }));
};

const addQuizQuestion = async (tenantId, quizId, questionData) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);
  if (!Array.isArray(questionData.options) || questionData.options.length !== 4) throw err('options must be an array of exactly 4 items.', 400);
  return QuizQuestion.create({ tenantId, quizId, ...questionData });
};

const publishQuiz = async (tenantId, quizId, userId) => {
  const quiz = await Quiz.findOneAndUpdate({ _id: quizId, tenantId }, { status: 'published' }, { new: true });
  if (!quiz) throw err('Quiz not found.', 404);
  await logActivity({ userId, tenantId, action: 'PUBLISH_QUIZ', entityType: 'Quiz', entityId: quizId });
  return quiz;
};

const startQuizAttempt = async (tenantId, quizId, studentId) => {
  const quiz = await Quiz.findOne({ _id: quizId });
  if (!quiz || quiz.status !== 'published') throw err('Quiz not available.', 403);
  const attemptCount = await QuizAttempt.countDocuments({ tenantId, quizId, studentId });
  if (attemptCount >= quiz.maxAttempts) throw err('No attempts remaining.', 403);
  const attempt = await QuizAttempt.create({ tenantId, quizId, courseId: quiz.courseId, studentId, startedAt: new Date(), attemptNumber: attemptCount + 1 });
  let questions = await QuizQuestion.find({ tenantId, quizId }).lean();
  if (quiz.shuffleQuestions) questions = questions.sort(() => Math.random() - 0.5);
  const safeQuestions = questions.map(({ correctIndex, explanation, ...q }) => q);
  return { attempt, questions: safeQuestions };
};

const submitQuizAttempt = async (tenantId, quizId, studentId, answers) => {
  const attempt = await QuizAttempt.findOne({ tenantId, quizId, studentId, submittedAt: null });
  if (!attempt) throw err('No active attempt found.', 404);
  const quiz = await Quiz.findOne({ _id: quizId });
  const questions = await QuizQuestion.find({ tenantId, quizId }).lean();
  const qMap = Object.fromEntries(questions.map(q => [String(q._id), q]));
  let totalMarks = 0, maxMarks = 0;
  const breakdown = [];
  const gradedAnswers = (answers || []).map(a => {
    const q = qMap[String(a.questionId)];
    if (!q) return { ...a, isCorrect: false, marksAwarded: 0 };
    const isCorrect = a.selectedIndex === q.correctIndex;
    const awarded = isCorrect ? (q.marks || 1) : 0;
    totalMarks += awarded; maxMarks += q.marks || 1;
    breakdown.push({ questionId: q._id, question: q.question, selectedIndex: a.selectedIndex, correctAnswer: q.correctIndex, explanation: q.explanation, isCorrect, marksAwarded: awarded });
    return { questionId: a.questionId, selectedIndex: a.selectedIndex, isCorrect, marksAwarded: awarded };
  });
  const percentScore = maxMarks === 0 ? 0 : Math.round((totalMarks / maxMarks) * 100);
  const passed = percentScore >= quiz.passMark;
  Object.assign(attempt, { answers: gradedAnswers, totalMarks, maxMarks, percentScore, passed, submittedAt: new Date(), timeTakenSeconds: attempt.startedAt ? Math.round((Date.now() - attempt.startedAt.getTime()) / 1000) : null });
  await attempt.save();
  const result = { score: percentScore, passed, totalMarks, maxMarks };
  if (quiz.showResultImmediately) result.breakdown = breakdown;
  return result;
};

const getQuizResults = async (tenantId, quizId) => QuizAttempt.find({ tenantId, quizId }).populate('studentId', 'name email');
const getMyQuizAttempts = async (tenantId, quizId, studentId) => QuizAttempt.find({ tenantId, quizId, studentId });

// ── Performance + Certificates ────────────────────────────────────────────────
const checkEligibility = async (tenantId, courseId, studentId) => {
  const course = await Course.findById(courseId);
  if (!course) throw err('Course not found.', 404);
  
  // If not student, ensure tenant matches. If student, they must be enrolled.
  // This allows cross-tenant enrollment performance tracking.
  const isEnrolled = course.enrolledStudents.map(String).includes(String(studentId));
  if (course.tenantId !== tenantId && !isEnrolled) {
    throw err('Access denied to this course performance.', 403);
  }
  const { minAttendancePercent = 75, minAssignmentScore = 60, minQuizScore = 60 } = course.completionCriteria || {};

  const totalSessions = await Session.countDocuments({ tenantId, courseId });
  const presentCount = await Attendance.countDocuments({ tenantId, courseId, studentId, status: 'present' });
  const attendancePct = totalSessions === 0 ? 100 : Math.round((presentCount / totalSessions) * 100);

  const assignments = await Assignment.find({ tenantId, courseId });
  let assignmentScore = 100;
  if (assignments.length > 0) {
    const scores = assignments.map(a => {
      const sub = a.submissions.find(s => String(s.studentId) === String(studentId));
      return (sub && sub.marks != null) ? (sub.marks / (a.maxMarks || 100)) * 100 : null;
    }).filter(s => s !== null);
    assignmentScore = scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    if (isNaN(assignmentScore)) assignmentScore = 0;
  }

  const quizzes = await Quiz.find({ tenantId, courseId, status: 'published' });
  let quizScore = 100;
  if (quizzes.length > 0) {
    const scores = await Promise.all(quizzes.map(async q => {
      const best = await QuizAttempt.findOne({ tenantId, quizId: q._id, studentId }).sort({ percentScore: -1 });
      return (best && typeof best.percentScore === 'number' && !isNaN(best.percentScore)) ? best.percentScore : null;
    }));
    const valid = scores.filter(s => s !== null);
    quizScore = valid.length === 0 ? 0 : Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
    if (isNaN(quizScore)) quizScore = 0;
  }

  const reasons = [];
  if (attendancePct < minAttendancePercent) reasons.push(`Attendance ${attendancePct}% < required ${minAttendancePercent}%`);
  if (assignmentScore < minAssignmentScore) reasons.push(`Assignment avg ${assignmentScore}% < required ${minAssignmentScore}%`);
  if (quizScore < minQuizScore) reasons.push(`Quiz avg ${quizScore}% < required ${minQuizScore}%`);

  const certificate = await Certificate.findOne({ courseId, studentId }).select('_id certificateNumber issuedAt');

  return {
    eligible: reasons.length === 0,
    certificate: certificate || null,
    reason: reasons.join('; ') || null,
    attendancePercent: attendancePct,
    assignmentScore,
    quizScore,
    attendanceCount: presentCount,
    totalSessions,
    assignmentsCount: assignments.length,
    quizzesCount: quizzes.length
  };
};

const getMyPerformance = async (tenantId, courseId, studentId) => checkEligibility(tenantId, courseId, studentId);

const getCoursePerformance = async (tenantId, courseId) => {
  const course = await Course.findById(courseId).populate('enrolledStudents', 'name email');
  if (!course) throw err('Course not found.', 404);
  
  if (course.tenantId !== tenantId) throw err('Access denied to this course performance.', 403);
  const results = await Promise.all(course.enrolledStudents.map(async student => {
    const perf = await checkEligibility(tenantId, courseId, student._id);
    return { student: { _id: student._id, name: student.name, email: student.email }, ...perf };
  }));
  return results.sort((a, b) => a.student.name.localeCompare(b.student.name));
};

const generateCertificate = async (tenantId, courseId, studentId, issuedBy) => {
  const eligibility = await checkEligibility(tenantId, courseId, studentId);
  if (!eligibility.eligible) throw err(`Student is not eligible: ${eligibility.reason}`, 400);
  const existing = await Certificate.findOne({ tenantId, courseId, studentId });
  if (existing) throw err('Certificate already issued.', 409);
  const year = new Date().getFullYear();
  const count = await Certificate.countDocuments({ tenantId }) + 1;
  const certNum = `UOP-${year}-${String(count).padStart(5, '0')}`;
  const verCode = uuidv4();
  const course = await Course.findOne({ _id: courseId, tenantId });
  const User = require('../../auth/models/user.model');
  const instructor = await User.findById(course.instructor);
  const student = await User.findById(studentId);
  const { fileUrl, publicId } = await certificateGenerator.generate({
    studentName: student.name, courseName: course.title, teacherName: instructor ? instructor.name : 'Instructor',
    issuedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    certificateNumber: certNum, verificationCode: verCode, attendancePercent: eligibility.attendancePercent,
    averageScore: Math.round((eligibility.assignmentScore + eligibility.quizScore) / 2)
  });
  const certificate = await Certificate.create({ tenantId, courseId, studentId, certificateNumber: certNum, verificationCode: verCode, attendancePercent: eligibility.attendancePercent, averageAssignmentScore: eligibility.assignmentScore, averageQuizScore: eligibility.quizScore, fileUrl, publicId, issuedAt: new Date() });
  await sendNotification({ userId: studentId, tenantId, title: 'Certificate Issued!', message: `Congratulations! Your certificate for "${course.title}" has been issued.`, type: 'success' });
  await logActivity({ userId: issuedBy, tenantId, action: 'ISSUE_CERTIFICATE', entityType: 'Certificate', entityId: certificate._id });
  return certificate;
};

const generateAllCertificates = async (tenantId, courseId, issuedBy) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  const generated = [], skipped = [], errors = [];
  await Promise.all(course.enrolledStudents.map(async studentId => {
    try {
      const already = await Certificate.findOne({ tenantId, courseId, studentId });
      if (already) { skipped.push({ studentId, reason: 'Already exists' }); return; }
      const elig = await checkEligibility(tenantId, courseId, studentId);
      if (!elig.eligible) { skipped.push({ studentId, reason: elig.reason }); return; }
      await generateCertificate(tenantId, courseId, studentId, issuedBy);
      generated.push(studentId);
    } catch (e) { errors.push({ studentId, error: e.message }); }
  }));
  return { generated, skipped, errors };
};

const getCourseCertificates = async (tenantId, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw err('Course not found.', 404);
  if (course.tenantId !== tenantId) throw err('Access denied.', 403);
  
  return Certificate.find({ courseId }).populate('studentId', 'name email');
};
const getMyCertificates = async (tenantId, studentId) => Certificate.find({ tenantId, studentId }).populate('courseId', 'title instructor');
const verifyCertificate = async (code) => {
  const cert = await Certificate.findOne({ verificationCode: code }).populate('studentId', 'name').populate('courseId', 'title instructor');
  if (!cert) throw err('Invalid certificate code.', 404);
  return cert;
};

const getCertificateById = async (tenantId, id) => {
  const cert = await Certificate.findOne({ _id: id, tenantId });
  if (!cert) throw err('Certificate not found.', 404);
  return cert;
};

module.exports = {
  getCourses, getCourseById, createCourse, updateCourse, deleteCourse, enrollStudent,
  markAttendance, getCourseAttendance,
  createAssignment, submitAssignment, getCourseAssignments,
  createSession, toggleSession, getCourseSessions, getSessionAttendance, overrideAttendance,
  markSelfAttendance, getMyAttendanceSummary,
  uploadCourseDocument, getCourseDocuments, deleteCourseDocument, getLmsDocumentById, getCourseDocumentAccess,
  gradeSubmission, getAssignmentSubmissions, getMySubmission,
  createQuiz, addQuizQuestion, publishQuiz, getCourseQuizzes, startQuizAttempt, submitQuizAttempt, getQuizResults, getMyQuizAttempts,
  getCoursePerformance, getMyPerformance, checkEligibility, generateCertificate, generateAllCertificates, getCourseCertificates, getMyCertificates, verifyCertificate, getCertificateById,
};
