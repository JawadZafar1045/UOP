const { v4: uuidv4 } = require('uuid');
const pLimit = require('p-limit');
const Course = require('../models/course.model');
const Attendance = require('../models/attendance.model');
const Assignment = require('../models/assignment.model');
const Session = require('../models/session.model');
const LmsDocument = require('../models/lmsDocument.model');
const Quiz = require('../models/quiz.model');
const QuizQuestion = require('../models/quizQuestion.model');
const QuizAttempt = require('../models/quizAttempt.model');
const Certificate = require('../models/certificate.model');
const CertificateTemplate = require('../models/certificateTemplate.model');
const certificateGenerator = require('../utils/certificateGenerator');
const { uploadFile, deleteFile } = require('../../shared/services/fileService');
const { sendNotification } = require('../../shared/services/notification.service');
const { logActivity } = require('../../shared/services/activityLogger.service');

// ── Helper ─────────────────────────────────────────────────────────────────────
const err = (msg, code = 400) => Object.assign(new Error(msg), { statusCode: code });

const checkOwnership = (course, userId, role) => {
  if (role === 'teacher' && course.instructor && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to modify this course.', 403);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// COURSES (existing, preserved)
// ══════════════════════════════════════════════════════════════════════════════
const getCourses = async (tenantId, userId, role) => {
  const filter = { tenantId };

  if (role === 'student') {
    filter.enrolledStudents = userId;    // only enrolled
    filter.status = 'active';    // only active courses
  } else if (role === 'teacher') {
    filter.instructor = userId;     // only own courses
  }
  // admin: no extra filter, sees everything

  return Course.find(filter)
    .populate('instructor', 'name email')
    .select('title description status instructor enrolledStudents startDate endDate completionCriteria category thumbnail')
    .lean()
    .sort({ createdAt: -1 });
};

const getCourseById = async (tenantId, courseId, userId, role) => {
  const filter = { _id: courseId, tenantId };

  const course = await Course.findOne(filter)
    .populate('instructor', 'name email avatar')
    .populate('enrolledStudents', 'name email avatar');
    
  if (!course) throw err('Course not found.', 404);

  if (role === 'student') {
    const isEnrolled = course.enrolledStudents.some(s => String(s._id) === String(userId));
    if (!isEnrolled && course.status !== 'active') throw err('This course is not currently active or you are not enrolled.', 403);
  }

  const [sessionCount, assignmentCount, quizCount] = await Promise.all([
    Session.countDocuments({ courseId, tenantId }),
    Assignment.countDocuments({ courseId, tenantId }),
    Quiz.countDocuments({ courseId, status: 'published', tenantId })
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
  const errors = [];
  if (!data.title || data.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Course title is required (min 3 characters)'
    });
  }
  if (errors.length > 0) {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }

  // Sanitize modules if they exist in the incoming data
  if (data.modules && Array.isArray(data.modules)) {
    data.modules = data.modules
      .map(m => {
        if (typeof m === 'string') {
          return { title: m.trim() };
        } else if (m && typeof m.title === 'string') {
          return { ...m, title: m.title.trim() };
        }
        return m;
      })
      .filter(m => m && m.title);
  }

  const course = await Course.create({ instructor: userId, ...data, tenantId });
  await logActivity({ userId, tenantId, action: 'CREATE_COURSE', entityType: 'Course', entityId: course._id });
  return course;
};

const updateCourse = async (tenantId, courseId, data, userId, userRole) => {
  const filter = { _id: courseId, tenantId };
  if (userRole !== 'admin') filter.instructor = userId;

  const VALID_STATUSES = ['draft', 'active', 'completed'];
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    throw new Error(
      `Invalid status '${data.status}'. ` +
      `Allowed values: ${VALID_STATUSES.join(', ')}`
    );
  }

  const ALLOWED_UPDATE_FIELDS = [
    'title', 'description', 'startDate', 'endDate',
    'status', 'completionCriteria', 'category',
    'level', 'maxStudents', 'thumbnail'
  ];

  const safeUpdate = {};
  ALLOWED_UPDATE_FIELDS.forEach(field => {
    if (data[field] !== undefined) {
      safeUpdate[field] = data[field];
    }
  });

  const updated = await Course.findOneAndUpdate(
    filter,
    { $set: safeUpdate },
    { new: true, runValidators: true }
  );
  if (!updated) throw err('Course not found or you do not have permission to edit it.', 404);
  await logActivity({ userId, tenantId, action: 'UPDATE_COURSE', entityType: 'Course', entityId: courseId });
  return updated;
};

const saveDraft = async (tenantId, courseId, data, userId) => {
  const course = await Course.findOne({
    _id: courseId, tenantId
  });
  if (!course) throw new Error('Course not found');

  checkOwnership(course, userId, 'teacher');

  // Only update provided fields, no validation
  const draftFields = {};
  if (data.title) draftFields.title = data.title.trim();
  if (data.description !== undefined)
    draftFields.description = data.description;
  if (data.startDate) draftFields.startDate = data.startDate;
  if (data.endDate) draftFields.endDate = data.endDate;
  if (data.category) draftFields.category = data.category;
  if (data.completionCriteria)
    draftFields.completionCriteria = data.completionCriteria;

  draftFields.status = 'draft'; // always stays draft

  return Course.findOneAndUpdate(
    { _id: courseId, tenantId },
    { $set: draftFields },
    { new: true }
  );
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

  const student = await User.findOne({
    tenantId,
    $or: [
      { email: identifier.toLowerCase() },
      ...(isValidObjectId ? [{ _id: identifier }] : [])
    ]
  });

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
const createAssignment = async (tenantId, data, files, userId, userRole) => {
  const course = await Course.findOne({ _id: data.courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to create an assignment for this course.', 403);
  }

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

const getCourseAssignments = async (tenantId, courseId, userId, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (role === 'student' && !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }
  return Assignment.find({ courseId, tenantId }).sort({ createdAt: -1 });
};

const submitAssignment = async (tenantId, assignmentId, studentId, submissionData, file) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  const course = await Course.findOne({ _id: assignment.courseId, tenantId });
  if (!course) throw err('Course associated with assignment not found.', 404);
  if (!course.enrolledStudents.map(String).includes(String(studentId))) {
    throw err('You are not enrolled in this course.', 403);
  }

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
const createSession = async (tenantId, courseId, data, files, userId, userRole) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to create sessions for this course.', 403);
  }

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

  // ── Mass-assignment protection ──────────────────────────────────────────────
  // Explicit whitelist: never accept isOpen from the request body.
  // Sessions ALWAYS start closed. Use toggleSession to open/close them.
  const sessionData = {
    tenantId,
    courseId,
    createdBy: userId,
    title:               data.title?.trim(),
    date:                data.date,
    attendanceOpenAt:    data.attendanceOpenAt  || null,
    attendanceCloseAt:   data.attendanceCloseAt || null,
    isOpen:              false, // ALWAYS false on creation — toggleSession controls this
    materials,
  };

  const session = await Session.create(sessionData);
  await logActivity({ userId, tenantId, action: 'CREATE_SESSION', entityType: 'Session', entityId: session._id });
  return session;
};

const updateSession = async (tenantId, sessionId, data, userId, userRole) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  // Check ownership: course must be owned by the instructor
  const course = await Course.findOne({ _id: session.courseId, tenantId });
  if (!course) throw err('Course associated with session not found.', 404);

  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to update this session.', 403);
  }

  // ── Mass-assignment protection ──────────────────────────────────────────────
  // Explicit whitelist: isOpen is intentionally absent.
  // Attendance state is exclusively controlled by toggleSession.
  const allowedUpdates = {};
  if (data.title              !== undefined) allowedUpdates.title              = data.title.trim();
  if (data.date               !== undefined) allowedUpdates.date               = data.date;
  if (data.attendanceOpenAt   !== undefined) allowedUpdates.attendanceOpenAt   = data.attendanceOpenAt;
  if (data.attendanceCloseAt  !== undefined) allowedUpdates.attendanceCloseAt  = data.attendanceCloseAt;
  if (data.materialUrl        !== undefined) allowedUpdates.materialUrl        = data.materialUrl;
  if (data.materials          !== undefined) allowedUpdates.materials          = data.materials;

  const updatedSession = await Session.findOneAndUpdate(
    { _id: sessionId, tenantId },
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  );
  await logActivity({ userId, tenantId, action: 'UPDATE_SESSION', entityType: 'Session', entityId: sessionId });
  return updatedSession;
};

const toggleSession = async (tenantId, sessionId, userId, userRole) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  const course = await Course.findOne({ _id: session.courseId, tenantId });
  if (!course) throw err('Course associated with session not found.', 404);
  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to modify this session.', 403);
  }

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

const getCourseSessions = async (tenantId, courseId, userId = null, userRole = null) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  
  if (userRole === 'student' && !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  const sessions = await Session.find({ courseId, tenantId }).sort({ date: -1 });
  
  if (userRole === 'student' && userId) {
    const attendanceRecords = await Attendance.find({ 
      courseId, 
      studentId: userId, 
      status: 'present',
      tenantId
    });
    const attendedSessionIds = new Set(attendanceRecords.map(r => String(r.sessionId)));
    
    return sessions.map(s => {
      const obj = s.toObject();
      obj.isAttended = attendedSessionIds.has(String(s._id));
      return obj;
    });
  }
  
  return sessions;
};

const getSessionAttendance = async (tenantId, sessionId, userId, role) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  const course = await Course.findOne({ _id: session.courseId, tenantId });
  if (!course) throw err('Course associated with session not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to view attendance for this session.', 403);
  }

  return Attendance.find({ tenantId, sessionId }).populate('studentId', 'name email');
};

// ── Attendance Self-Mark ──────────────────────────────────────────────────────
const markSelfAttendance = async (tenantId, sessionId, studentId, ipAddress) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);
  if (!session.isOpen) throw err('Attendance window is not open for this session.', 403);

  if (session.attendanceCloseAt && new Date() > session.attendanceCloseAt) {
    session.attendanceCloseAt = null;
    await session.save();
  }

  const course = await Course.findOne({ _id: session.courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (!course.enrolledStudents.map(String).includes(String(studentId)))
    throw err('You are not enrolled in this course.', 403);

  const existing = await Attendance.findOne({ sessionId, studentId, tenantId });
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
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) return { total: 0, present: 0, percentage: 0 };
  const [total, present] = await Promise.all([
    Session.countDocuments({ courseId, tenantId: course.tenantId }),
    Attendance.countDocuments({ courseId, studentId, status: 'present', tenantId: course.tenantId }),
  ]);
  return { total, present, percentage: total === 0 ? 0 : Math.round((present / total) * 100) };
};

const overrideAttendance = async (tenantId, sessionId, studentId, status, reason, teacherId, role) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  const course = await Course.findOne({ _id: session.courseId, tenantId });
  if (!course) throw err('Course associated with session not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== teacherId.toString()) {
    throw err('You do not have permission to override attendance for this session.', 403);
  }

  return Attendance.findOneAndUpdate(
    { tenantId, sessionId, studentId },
    { status, overriddenBy: teacherId, overrideReason: reason, courseId: session.courseId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

// ── LMS Documents ──────────────────────────────────────────────────────────────
const uploadCourseDocument = async (tenantId, courseId, file, data, userId, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to upload documents for this course.', 403);
  }

  const { url, publicId, resourceType } = await uploadFile(file, 'lms_documents');
  return LmsDocument.create({
    tenantId, courseId, uploadedBy: userId,
    fileUrl: url, publicId, resourceType,
    fileSize: file.size,
    ...data,
  });
};

const getCourseDocuments = async (tenantId, courseId, userRole, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (userRole === 'student' && !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  const filter = { courseId, tenantId };
  if (userRole === 'student') filter.visibleToStudents = true;
  return LmsDocument.find(filter).sort({ createdAt: -1 });
};

const deleteCourseDocument = async (tenantId, documentId, userId, role) => {
  const doc = await LmsDocument.findOne({ _id: documentId, tenantId });
  if (!doc) throw err('Document not found.', 404);

  const course = await Course.findOne({ _id: doc.courseId, tenantId });
  if (!course) throw err('Course associated with document not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to delete this document.', 403);
  }

  await deleteFile(doc.publicId);
  await doc.deleteOne();
  await logActivity({ userId, tenantId, action: 'DELETE_LMS_DOCUMENT', entityType: 'LmsDocument', entityId: documentId });
};

const updateAssignment = async (tenantId, assignmentId, data, userId, userRole) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  // Check ownership: course must be owned by the instructor
  const course = await Course.findOne({ _id: assignment.courseId, tenantId });
  if (!course) throw err('Course associated with assignment not found.', 404);

  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to update this assignment.', 403);
  }

  const updatedAssignment = await Assignment.findOneAndUpdate({ _id: assignmentId, tenantId }, data, { new: true, runValidators: true });
  await logActivity({ userId, tenantId, action: 'UPDATE_ASSIGNMENT', entityType: 'Assignment', entityId: assignmentId });
  return updatedAssignment;
};

const deleteAssignment = async (tenantId, assignmentId, userId, userRole) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  // Check ownership: course must be owned by the instructor
  const course = await Course.findOne({ _id: assignment.courseId, tenantId });
  if (!course) throw err('Course associated with assignment not found.', 404);

  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to delete this assignment.', 403);
  }

  // Delete attached materials from Cloudinary
  if (assignment.materials && assignment.materials.length > 0) {
    const { deleteFile } = require('../../shared/services/fileService');
    for (const mat of assignment.materials) {
      if (mat.publicId) {
        try {
          await deleteFile(mat.publicId);
        } catch (e) {
          console.error(`Failed to delete assignment material file: ${mat.publicId}`, e);
        }
      }
    }
  }

  // Delete submission files from Cloudinary
  if (assignment.submissions && assignment.submissions.length > 0) {
    const { deleteFile } = require('../../shared/services/fileService');
    for (const sub of assignment.submissions) {
      if (sub.publicId) {
        try {
          await deleteFile(sub.publicId);
        } catch (e) {
          console.error(`Failed to delete assignment submission file: ${sub.publicId}`, e);
        }
      }
    }
  }

  await assignment.deleteOne();
  await logActivity({ userId, tenantId, action: 'DELETE_ASSIGNMENT', entityType: 'Assignment', entityId: assignmentId });
};

const getLmsDocumentById = async (tenantId, documentId) => {
  return LmsDocument.findOne({ _id: documentId, tenantId });
};

const getCourseDocumentAccess = async (tenantId, documentId, userId, role) => {
  const doc = await getLmsDocumentById(tenantId, documentId);
  if (!doc) throw err('Document not found.', 404);
  
  const course = await Course.findOne({ _id: doc.courseId, tenantId });
  if (!course) throw err('Course associated with document not found.', 404);
  if (role === 'student') {
    if (!course.enrolledStudents.map(String).includes(String(userId))) {
      throw err('You are not enrolled in this course.', 403);
    }
    if (!doc.visibleToStudents) {
      throw err('This document is not visible to students.', 403);
    }
  }
  
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
const gradeSubmission = async (tenantId, assignmentId, studentId, score, feedback, teacherId, role) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  const course = await Course.findOne({ _id: assignment.courseId, tenantId });
  if (!course) throw err('Course associated with assignment not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== teacherId.toString()) {
    throw err('You do not have permission to grade submissions for this course.', 403);
  }

  const sub = assignment.submissions.find(s => String(s.studentId) === String(studentId));
  if (!sub) throw err('Submission not found.', 404);
  sub.marks = score; sub.feedback = feedback; sub.status = 'graded';
  await assignment.save();
  await sendNotification({ userId: studentId, tenantId, title: 'Assignment Graded', message: `Your submission for "${assignment.title}" has been graded. Score: ${score}/${assignment.maxMarks}.`, type: 'success' });
  return assignment;
};

const getAssignmentSubmissions = async (tenantId, assignmentId, userId, role) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId }).populate('submissions.studentId', 'name email');
  if (!assignment) throw err('Assignment not found.', 404);

  const course = await Course.findOne({ _id: assignment.courseId, tenantId });
  if (!course) throw err('Course associated with assignment not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to view submissions for this assignment.', 403);
  }

  return assignment;
};

const getMySubmission = async (tenantId, assignmentId, studentId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  const course = await Course.findOne({ _id: assignment.courseId, tenantId });
  if (!course || !course.enrolledStudents.map(String).includes(String(studentId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  return assignment.submissions.find(s => String(s.studentId) === String(studentId)) || null;
};

// ── Quizzes ────────────────────────────────────────────────────────────────────
const createQuiz = async (tenantId, courseId, data, userId, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to create quizzes for this course.', 403);
  }

  const quiz = await Quiz.create({ tenantId, courseId, createdBy: userId, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_QUIZ', entityType: 'Quiz', entityId: quiz._id });
  return quiz;
};

const getCourseQuizzes = async (tenantId, courseId, userRole, userId) => {
  const filter = { courseId, tenantId };
  if (userRole === 'student') filter.status = 'published';
  const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
  return Promise.all(quizzes.map(async (quiz) => {
    const count = await QuizQuestion.countDocuments({ quizId: quiz._id, tenantId });
    const quizObj = { ...quiz.toObject(), questionCount: count };

    if (userRole === 'student' && userId) {
      const attempts = await QuizAttempt.countDocuments({ quizId: quiz._id, studentId: userId, tenantId });
      const bestAttempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: userId, tenantId }).sort({ percentScore: -1 });
      quizObj.myAttempts = attempts;
      quizObj.bestScore = bestAttempt ? bestAttempt.percentScore : null;
    }

    return quizObj;
  }));
};

const addQuizQuestion = async (tenantId, quizId, questionData, userId, role) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course) throw err('Course associated with quiz not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to add questions to this quiz.', 403);
  }

  if (!Array.isArray(questionData.options) || questionData.options.length !== 4) throw err('options must be an array of exactly 4 items.', 400);
  return QuizQuestion.create({ tenantId, quizId, ...questionData });
};

const updateQuiz = async (tenantId, quizId, data, userId, userRole) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course) throw err('Course associated with quiz not found.', 404);

  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to update this quiz.', 403);
  }

  const updatedQuiz = await Quiz.findOneAndUpdate({ _id: quizId, tenantId }, data, { new: true, runValidators: true }).lean();
  if (updatedQuiz) {
    updatedQuiz.questionCount = await QuizQuestion.countDocuments({ quizId, tenantId });
  }
  await logActivity({ userId, tenantId, action: 'UPDATE_QUIZ', entityType: 'Quiz', entityId: quizId });
  return updatedQuiz;
};

const updateQuizQuestion = async (tenantId, questionId, data, userId, userRole) => {
  const question = await QuizQuestion.findOne({ _id: questionId, tenantId });
  if (!question) throw err('Question not found.', 404);

  const quiz = await Quiz.findOne({ _id: question.quizId, tenantId });
  if (!quiz) throw err('Quiz associated with question not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course) throw err('Course associated with quiz not found.', 404);

  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to update this question.', 403);
  }

  const updatedQuestion = await QuizQuestion.findOneAndUpdate({ _id: questionId, tenantId }, data, { new: true, runValidators: true });
  await logActivity({ userId, tenantId, action: 'UPDATE_QUIZ_QUESTION', entityType: 'QuizQuestion', entityId: questionId });
  return updatedQuestion;
};

const publishQuiz = async (tenantId, quizId, userId, role) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course) throw err('Course associated with quiz not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to publish this quiz.', 403);
  }

  quiz.status = 'published';
  await quiz.save();
  await logActivity({ userId, tenantId, action: 'PUBLISH_QUIZ', entityType: 'Quiz', entityId: quizId });
  return quiz;
};

const startQuizAttempt = async (tenantId, quizId, studentId) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz || quiz.status !== 'published') throw err('Quiz not available.', 403);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course || !course.enrolledStudents.map(String).includes(String(studentId))) {
    throw err('You are not enrolled in this course.', 403);
  }

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
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course || !course.enrolledStudents.map(String).includes(String(studentId))) {
    throw err('You are not enrolled in this course.', 403);
  }

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

const getQuizResults = async (tenantId, quizId, userId, role) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course) throw err('Course associated with quiz not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to view results for this quiz.', 403);
  }

  return QuizAttempt.find({ tenantId, quizId }).populate('studentId', 'name email');
};

const getMyQuizAttempts = async (tenantId, quizId, studentId) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course || !course.enrolledStudents.map(String).includes(String(studentId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  return QuizAttempt.find({ tenantId, quizId, studentId });
};

// ── Performance + Certificates ────────────────────────────────────────────────
const checkEligibility = async (tenantId, courseId, studentId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
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

  const certificate = await Certificate.findOne({ courseId, studentId, tenantId }).select('_id certificateNumber issuedAt');

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
  const course = await Course.findOne({ _id: courseId, tenantId }).populate('enrolledStudents', 'name email');
  if (!course) throw err('Course not found.', 404);
  
  if (course.tenantId !== tenantId) throw err('Access denied to this course performance.', 403);
  const results = await Promise.all(course.enrolledStudents.map(async student => {
    const perf = await checkEligibility(tenantId, courseId, student._id);
    return { student: { _id: student._id, name: student.name, email: student.email }, ...perf };
  }));
  return results.sort((a, b) => a.student.name.localeCompare(b.student.name));
};

// ── Certificate Template ───────────────────────────────────────────────────────

const getCertificateTemplate = async (tenantId, courseId, userId, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (role === 'student' && !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  let template = await CertificateTemplate.findOne({ tenantId, courseId });
  if (!template) {
    // Return default design if no template exists
    template = {
      design: {
        backgroundColor: '#FAFAF7',
        accentColor: '#2563EB',
        textColor: '#1B3A5C',
        fontStyle: 'serif',
        borderStyle: 'double',
      }
    };
  }
  return template;
};

const saveCertificateTemplate = async (tenantId, courseId, data, file, userId, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to modify the certificate template for this course.', 403);
  }

  let template = await CertificateTemplate.findOne({ tenantId, courseId });
  let design = template ? { ...template.design.toObject() } : {};
  
  // Update fields from data
  ['backgroundColor', 'accentColor', 'textColor', 'fontStyle', 'signatoryName', 'signatoryTitle', 'instituteName', 'borderStyle'].forEach(field => {
    if (data[field]) design[field] = data[field];
  });

  if (file) {
    const cloudinary = require('cloudinary').v2;
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'certificate_logos' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    design.logoUrl = uploadResult.secure_url;
    design.logoPublicId = uploadResult.public_id;
  }

  if (template) {
    template.design = design;
    template.updatedAt = new Date();
    await template.save();
  } else {
    template = await CertificateTemplate.create({
      tenantId,
      courseId,
      createdBy: userId,
      design
    });
  }
  return template;
};

const generateCertificate = async (tenantId, courseId, studentId, issuedBy, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== issuedBy.toString()) {
    throw err('You do not have permission to generate certificates for this course.', 403);
  }

  const eligibility = await checkEligibility(tenantId, courseId, studentId);
  if (!eligibility.eligible) throw err(`Student is not eligible: ${eligibility.reason}`, 400);
  const existing = await Certificate.findOne({ tenantId, courseId, studentId });
  if (existing) throw err('Certificate already issued.', 409);
  const year = new Date().getFullYear();
  const count = await Certificate.countDocuments({ tenantId }) + 1;
  const certNum = `UOP-${year}-${String(count).padStart(5, '0')}`;
  const verCode = uuidv4();
  const User = require('../../auth/models/user.model');
  const student = await User.findOne({ _id: studentId, tenantId });
  
  const template = await getCertificateTemplate(tenantId, courseId, issuedBy, role);
  
  const { fileUrl, publicId } = await certificateGenerator.generate({
    studentName: student.name, 
    courseName: course.title, 
    issuedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    certificateNumber: certNum, 
    verificationCode: verCode, 
    attendancePercent: eligibility.attendancePercent,
    averageScore: Math.round((eligibility.assignmentScore + eligibility.quizScore) / 2),
    template
  });
  const certificate = await Certificate.create({ tenantId, courseId, studentId, certificateNumber: certNum, verificationCode: verCode, attendancePercent: eligibility.attendancePercent, averageAssignmentScore: eligibility.assignmentScore, averageQuizScore: eligibility.quizScore, fileUrl, publicId, issuedAt: new Date() });
  await sendNotification({ userId: studentId, tenantId, title: 'Certificate Issued!', message: `Congratulations! Your certificate for "${course.title}" has been issued.`, type: 'success' });
  await logActivity({ userId: issuedBy, tenantId, action: 'ISSUE_CERTIFICATE', entityType: 'Certificate', entityId: certificate._id });
  return certificate;
};

const generateAllCertificates = async (tenantId, courseId, issuedBy, role) => {
  // Select both field names to be safe regardless of schema alias
  const course = await Course.findOne({ _id: courseId, tenantId })
    .select('+students +enrolledStudents instructor');
  if (!course) throw err('Course not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== issuedBy.toString()) {
    throw err('You do not have permission to generate certificates for this course.', 403);
  }

  // Critical 2 — alias-safe student list fallback
  const studentList = course.students || course.enrolledStudents || [];
  if (studentList.length === 0) {
    return {
      generated: [],
      skipped: [],
      errors: ['No students enrolled in this course']
    };
  }

  const generated = [], skipped = [], errors = [];

  // Critical 1 — limit to 3 concurrent Puppeteer browsers, prevents OOM crash
  const limit = pLimit(3);

  await Promise.all(
    studentList.map(studentId =>
      limit(async () => {
        try {
          const already = await Certificate.findOne({ tenantId, courseId, studentId });
          if (already) { skipped.push({ studentId, reason: 'Already exists' }); return; }
          const elig = await checkEligibility(tenantId, courseId, studentId);
          if (!elig.eligible) { skipped.push({ studentId, reason: elig.reason }); return; }
          await generateCertificate(tenantId, courseId, studentId, issuedBy, role);
          generated.push(studentId);
        } catch (e) { errors.push({ studentId, error: e.message }); }
      })
    )
  );

  return { generated, skipped, errors };
};

const getCourseCertificates = async (tenantId, courseId, userId, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to view certificates for this course.', 403);
  }
  
  return Certificate.find({ courseId, tenantId }).populate('studentId', 'name email');
};

const getMyCertificates = async (tenantId, studentId) => Certificate.find({ tenantId, studentId }).populate('courseId', 'title instructor');

const verifyCertificate = async (code) => {
  const cert = await Certificate.findOne({ verificationCode: code }).populate('studentId', 'name').populate('courseId', 'title instructor');
  if (!cert) throw err('Invalid certificate code.', 404);
  return cert;
};

const getCertificateById = async (tenantId, id, userId, role) => {
  const cert = await Certificate.findOne({ _id: id, tenantId });
  if (!cert) throw err('Certificate not found.', 404);

  if (role === 'student' && cert.studentId.toString() !== userId.toString()) {
    throw err('You do not have permission to view this certificate.', 403);
  }
  if (role === 'teacher') {
    const course = await Course.findOne({ _id: cert.courseId, tenantId });
    if (!course || course.instructor.toString() !== userId.toString()) {
      throw err('You do not have permission to view this certificate.', 403);
    }
  }

  return cert;
};

// ── Admin Services ─────────────────────────────────────────────────────────────

const getAdminStats = async (tenantId) => {
  const User = require('../../auth/models/user.model');
  const Session = require('../models/session.model');
  const [totalCourses, activeCourses, totalStudents, totalTeachers, totalCertificates, totalSessions] = await Promise.all([
    Course.countDocuments({ tenantId }),
    Course.countDocuments({ tenantId, status: 'active' }),
    User.countDocuments({ tenantId, role: 'student', isActive: true }),
    User.countDocuments({ tenantId, role: 'teacher', isActive: true }),
    Certificate.countDocuments({ tenantId }),
    Session.countDocuments({ tenantId }),
  ]);
  return { totalCourses, activeCourses, totalStudents, totalTeachers, totalCertificates, totalSessions };
};

const getAdminUsers = async (tenantId) => {
  const User = require('../../auth/models/user.model');
  return User.find({ tenantId, role: { $ne: 'admin' } })
    .select('name email role createdAt isActive')
    .lean()
    .sort({ createdAt: -1 });
};

const updateUserRole = async (tenantId, targetUserId, newRole, requesterId) => {
  if (targetUserId === requesterId) throw err('Cannot change your own role', 400);
  if (!['student', 'teacher'].includes(newRole)) throw err('Invalid role', 400);
  const User = require('../../auth/models/user.model');
  const user = await User.findOneAndUpdate(
    { _id: targetUserId, tenantId },
    { role: newRole },
    { new: true }
  ).select('name email role isActive createdAt');
  if (!user) throw err('User not found.', 404);
  return user;
};

const deactivateUser = async (tenantId, targetUserId, requesterId) => {
  if (targetUserId === requesterId) throw err('Cannot deactivate your own account', 400);
  const User = require('../../auth/models/user.model');
  const user = await User.findOneAndUpdate(
    { _id: targetUserId, tenantId },
    { isActive: false },
    { new: true }
  ).select('name email role isActive createdAt');
  if (!user) throw err('User not found.', 404);
  return user;
};

const getAdminCourses = async (tenantId) => {
  const courses = await Course.find({ tenantId })
    .populate('instructor', 'name email')
    .lean()
    .sort({ createdAt: -1 });
  return courses.map(c => {
    c.studentCount = (c.enrolledStudents || c.students || []).length;
    return c;
  });
};

const deleteAdminCourse = async (tenantId, courseId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  const Quiz = require('../models/quiz.model');
  const QuizQuestion = require('../models/quizQuestion.model');
  const QuizAttempt = require('../models/quizAttempt.model');
  const Session = require('../models/session.model');
  const Attendance = require('../models/attendance.model');
  const Assignment = require('../models/assignment.model');
  const LmsDocument = require('../models/lmsDocument.model');
  // Get quiz IDs first to delete questions
  const quizIds = (await Quiz.find({ courseId, tenantId }).select('_id')).map(q => q._id);
  await Promise.all([
    Session.deleteMany({ courseId, tenantId }),
    Attendance.deleteMany({ courseId, tenantId }),
    Assignment.deleteMany({ courseId, tenantId }),
    Quiz.deleteMany({ courseId, tenantId }),
    QuizQuestion.deleteMany({ quizId: { $in: quizIds }, tenantId }),
    QuizAttempt.deleteMany({ courseId, tenantId }),
    LmsDocument.deleteMany({ courseId, tenantId }),
    Certificate.deleteMany({ courseId, tenantId }),
  ]);
  await Course.deleteOne({ _id: courseId, tenantId });
  return { success: true };
};

const getAdminCertificates = async (tenantId) => {
  return Certificate.find({ tenantId })
    .populate('studentId', 'name email')
    .populate('courseId', 'title')
    .sort({ issuedAt: -1 });
};

const revokeCertificate = async (tenantId, certId) => {
  const cert = await Certificate.findOneAndUpdate(
    { _id: certId, tenantId },
    { isValid: false },
    { new: true }
  );
  if (!cert) throw err('Certificate not found.', 404);
  return cert;
};

module.exports = {
  getCourses, getCourseById, createCourse, updateCourse, saveDraft, deleteCourse, enrollStudent,
  markAttendance, getCourseAttendance,
  createAssignment, updateAssignment, deleteAssignment, submitAssignment, getCourseAssignments,
  createSession, updateSession, toggleSession, getCourseSessions, getSessionAttendance, overrideAttendance,
  markSelfAttendance, getMyAttendanceSummary,
  uploadCourseDocument, getCourseDocuments, deleteCourseDocument, getLmsDocumentById, getCourseDocumentAccess,
  gradeSubmission, getAssignmentSubmissions, getMySubmission,
  createQuiz, updateQuiz, addQuizQuestion, updateQuizQuestion, publishQuiz, getCourseQuizzes, startQuizAttempt, submitQuizAttempt, getQuizResults, getMyQuizAttempts,
  getCoursePerformance, getMyPerformance, checkEligibility, generateCertificate, generateAllCertificates, getCourseCertificates, getMyCertificates, verifyCertificate, getCertificateById,
  getCertificateTemplate, saveCertificateTemplate,
  getAdminStats, getAdminUsers, updateUserRole, deactivateUser, getAdminCourses, deleteAdminCourse, getAdminCertificates, revokeCertificate,
};
