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
const Program = require('../models/program.model');
const Major   = require('../models/major.model');
const VideoLecture = require('../models/videoLecture.model');
const certificateGenerator = require('../utils/certificateGenerator');
const { uploadFile, deleteFile } = require('../../shared/services/fileService');
const { sendNotification } = require('../../shared/services/notification.service');
const { logActivity } = require('../../shared/services/activityLogger.service');
const { generateQuizTemplate, parseAndValidateQuizExcel } = require('../utils/quizExcelParser');

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
    const User = require('../../auth/models/user.model');
    const studentUser = await User.findOne({ _id: userId, tenantId }).select('programId enrolledPrograms').lean();
    const progIds = [];
    if (studentUser?.programId) progIds.push(studentUser.programId);
    if (Array.isArray(studentUser?.enrolledPrograms)) {
      progIds.push(...studentUser.enrolledPrograms);
    }

    filter.status = 'active';
    filter.$or = [
      { enrolledStudents: userId },
      { programId: { $in: progIds } }
    ];
  } else if (role === 'teacher') {
    filter.instructor = userId;     // only own courses
  }
  // admin: no extra filter, sees everything

  return Course.find(filter)
    .populate('instructor', 'name email avatar')
    .populate('programId', 'name code school faculty degreeLevel')
    .populate('majorId', 'name code description')
    .select('title description status instructor enrolledStudents startDate endDate completionCriteria category thumbnail coverImage programId majorId isCommon courseCode creditHours')
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
    const isEnrolled = course.enrolledStudents.some(s => String(s._id || s) === String(userId));
    if (!isEnrolled) throw err('You are not enrolled in this course.', 403);
    if (course.status !== 'active') throw err('This course is not currently active.', 403);
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
  if (!data.title || data.title.trim().length < 2) {
    errors.push({
      field: 'title',
      message: 'Course title is required (min 2 characters)'
    });
  }
  if (errors.length > 0) {
    const err = new Error(errors[0].message || 'Validation failed');
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
  if (course.programId) {
    const User = require('../../auth/models/user.model');
    const programStudents = await User.find({ tenantId, role: 'student', programId: course.programId, isApproved: true }).select('_id');
    if (programStudents.length > 0) {
      const studentIds = programStudents.map(s => s._id);
      await Course.updateOne(
        { _id: course._id },
        { $addToSet: { enrolledStudents: { $each: studentIds } } }
      );
      course.enrolledStudents = studentIds;
    }
  }
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
    'level', 'maxStudents', 'thumbnail',
    // Academic hierarchy
    'programId', 'majorId', 'isCommon', 'courseCode', 'creditHours', 'weight',
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

const unenrollStudent = async (tenantId, courseId, studentId, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  if (!course.enrolledStudents.map(String).includes(String(studentId))) {
    throw err('Student not enrolled in this course.', 400);
  }

  course.enrolledStudents = course.enrolledStudents.filter(id => String(id) !== String(studentId));
  await course.save();
  await logActivity({ userId, tenantId, action: 'UNENROLL_STUDENT', entityType: 'Course', entityId: courseId, meta: { studentId } });
  return course;
};

const getTenantStudents = async (tenantId, query = {}) => {
  const User = require('../../auth/models/user.model');
  const filter = { tenantId, role: 'student', isActive: true };
  if (query && (query.approvedOnly === 'true' || query.approvedOnly === true)) {
    filter.isApproved = true;
  }
  return User.find(filter)
    .populate('requestedProgramId', 'name code degreeLevel')
    .populate('programId', 'name code degreeLevel')
    .select('name email _id avatar isApproved programId requestedProgramId phone whatsappNumber createdAt')
    .lean()
    .sort({ createdAt: -1 });
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

const deleteSession = async (tenantId, sessionId, userId, userRole) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  const course = await Course.findOne({ _id: session.courseId, tenantId });
  if (!course) throw err('Course associated with session not found.', 404);
  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to delete this session.', 403);
  }

  // Delete all attendance records for this session
  await Attendance.deleteMany({ tenantId, sessionId });

  // Delete the session
  await Session.findByIdAndDelete(sessionId);

  await logActivity({ userId, tenantId, action: 'DELETE_SESSION', entityType: 'Session', entityId: sessionId });
  return { success: true, message: 'Session deleted successfully.' };
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

  const quiz = await Quiz.create({
    tenantId,
    courseId,
    createdBy: userId,
    title: data.title,
    instructions: data.instructions,
    timeLimit: data.timeLimit ? parseInt(data.timeLimit, 10) : null,
    passMark: data.passMark !== undefined ? Number(data.passMark) : 60,
    maxAttempts: data.maxAttempts !== undefined ? Number(data.maxAttempts) : 1,
    allowRetake: data.allowRetake !== undefined ? !!data.allowRetake : true,
    shuffleQuestions: !!data.shuffleQuestions,
    showResultImmediately: data.showResultImmediately !== undefined ? !!data.showResultImmediately : true,
    enableNegativeMarking: !!data.enableNegativeMarking,
    correctMark: data.correctMark !== undefined ? Number(data.correctMark) : 1,
    negativeMark: data.negativeMark !== undefined ? Math.abs(Number(data.negativeMark)) : (data.enableNegativeMarking ? 0.25 : 0),
    unattemptedMark: data.unattemptedMark !== undefined ? Number(data.unattemptedMark) : 0,
    status: data.status || 'draft',
  });
  await logActivity({ userId, tenantId, action: 'CREATE_QUIZ', entityType: 'Quiz', entityId: quiz._id });
  return quiz;
};

const generateQuizExcelTemplate = () => {
  return generateQuizTemplate();
};

const validateQuizExcel = (buffer, options) => {
  return parseAndValidateQuizExcel(buffer, options);
};

const createQuizBulk = async (tenantId, courseId, quizData, questions, userId, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to create quizzes for this course.', 403);
  }

  if (!quizData || !quizData.title || !String(quizData.title).trim()) {
    throw err('Quiz title is required.', 400);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw err('At least one valid question is required to create a quiz.', 400);
  }

  // Double-check question data validity before DB insert
  questions.forEach((q, idx) => {
    if (!q.question || !String(q.question).trim()) {
      throw err(`Question at position ${idx + 1} has no question text.`, 400);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw err(`Question at position ${idx + 1} must contain exactly 4 options.`, 400);
    }
    if (q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex > 3) {
      throw err(`Question at position ${idx + 1} has an invalid correct option index.`, 400);
    }
  });

  const quiz = await Quiz.create({
    tenantId,
    courseId,
    createdBy: userId,
    title: String(quizData.title).trim(),
    instructions: quizData.instructions ? String(quizData.instructions).trim() : '',
    timeLimit: quizData.timeLimit ? parseInt(quizData.timeLimit, 10) : null,
    passMark: quizData.passMark !== undefined ? Number(quizData.passMark) : 60,
    maxAttempts: quizData.maxAttempts !== undefined ? Number(quizData.maxAttempts) : 1,
    allowRetake: quizData.allowRetake !== undefined ? !!quizData.allowRetake : true,
    shuffleQuestions: !!quizData.shuffleQuestions,
    showResultImmediately: quizData.showResultImmediately !== undefined ? !!quizData.showResultImmediately : true,
    enableNegativeMarking: !!quizData.enableNegativeMarking,
    correctMark: quizData.correctMark !== undefined ? Number(quizData.correctMark) : 1,
    negativeMark: quizData.negativeMark !== undefined ? Math.abs(Number(quizData.negativeMark)) : (quizData.enableNegativeMarking ? 0.25 : 0),
    unattemptedMark: quizData.unattemptedMark !== undefined ? Number(quizData.unattemptedMark) : 0,
    status: quizData.status || 'draft',
  });

  const questionDocs = questions.map((q, idx) => ({
    tenantId,
    quizId: quiz._id,
    question: String(q.question).trim(),
    options: q.options.map(opt => String(opt).trim()),
    correctIndex: Number(q.correctIndex),
    explanation: q.explanation ? String(q.explanation).trim() : '',
    marks: q.marks !== undefined && Number(q.marks) > 0 ? Number(q.marks) : 1,
    order: idx + 1,
  }));

  await QuizQuestion.insertMany(questionDocs);

  await logActivity({
    userId,
    tenantId,
    action: 'CREATE_QUIZ_BULK',
    entityType: 'Quiz',
    entityId: quiz._id,
    metadata: { questionCount: questionDocs.length }
  });

  const quizObj = quiz.toObject();
  quizObj.questionCount = questionDocs.length;
  return quizObj;
};

const getCourseQuizzes = async (tenantId, courseId, userRole, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);
  if (userRole === 'student' && !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }

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

const getQuizQuestions = async (tenantId, quizId, userId, role) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course) throw err('Course associated with quiz not found.', 404);

  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to view questions for this quiz.', 403);
  }

  return QuizQuestion.find({ quizId, tenantId }).sort({ createdAt: 1 });
};

const updateQuiz = async (tenantId, quizId, data, userId, userRole) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course) throw err('Course associated with quiz not found.', 404);

  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to update this quiz.', 403);
  }

  const updateData = { ...data };
  if (updateData.timeLimit !== undefined) {
    updateData.timeLimit = updateData.timeLimit ? parseInt(updateData.timeLimit, 10) : null;
  }
  if (updateData.passMark !== undefined) updateData.passMark = Number(updateData.passMark);
  if (updateData.maxAttempts !== undefined) updateData.maxAttempts = Number(updateData.maxAttempts);
  if (updateData.allowRetake !== undefined) updateData.allowRetake = !!updateData.allowRetake;
  if (updateData.enableNegativeMarking !== undefined) updateData.enableNegativeMarking = !!updateData.enableNegativeMarking;
  if (updateData.correctMark !== undefined) updateData.correctMark = Number(updateData.correctMark);
  if (updateData.negativeMark !== undefined) updateData.negativeMark = Math.abs(Number(updateData.negativeMark));
  if (updateData.unattemptedMark !== undefined) updateData.unattemptedMark = Number(updateData.unattemptedMark);

  const updatedQuiz = await Quiz.findOneAndUpdate({ _id: quizId, tenantId }, updateData, { new: true, runValidators: true }).lean();
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

const deleteQuizQuestion = async (tenantId, questionId, userId, userRole) => {
  const question = await QuizQuestion.findOne({ _id: questionId, tenantId });
  if (!question) throw err('Question not found.', 404);

  const quiz = await Quiz.findOne({ _id: question.quizId, tenantId });
  if (!quiz) throw err('Quiz associated with question not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course) throw err('Course associated with quiz not found.', 404);

  if (userRole !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to delete this question.', 403);
  }

  await QuizQuestion.deleteOne({ _id: questionId, tenantId });
  await logActivity({ userId, tenantId, action: 'DELETE_QUIZ_QUESTION', entityType: 'QuizQuestion', entityId: questionId });
  return { message: 'Question deleted successfully' };
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

  // Count only completed/submitted attempts when evaluating attempt limits
  const submittedAttemptCount = await QuizAttempt.countDocuments({ tenantId, quizId, studentId, submittedAt: { $ne: null } });
  const allowRetake = quiz.allowRetake !== false;

  if (!allowRetake && submittedAttemptCount >= (quiz.maxAttempts || 1)) {
    throw err('Retakes are not allowed for this quiz.', 403);
  }

  if (allowRetake && quiz.maxAttempts > 1 && submittedAttemptCount >= quiz.maxAttempts) {
    throw err(`Maximum attempt limit (${quiz.maxAttempts}) reached.`, 403);
  }

  // Discard any stale unsubmitted attempt so the student starts with a clean attempt
  await QuizAttempt.deleteMany({ tenantId, quizId, studentId, submittedAt: null });

  const totalAttempts = await QuizAttempt.countDocuments({ tenantId, quizId, studentId });
  const attempt = await QuizAttempt.create({
    tenantId,
    quizId,
    courseId: quiz.courseId,
    studentId,
    startedAt: new Date(),
    attemptNumber: totalAttempts + 1
  });
  let questions = await QuizQuestion.find({ tenantId, quizId }).lean();
  if (quiz.shuffleQuestions) questions = questions.sort(() => Math.random() - 0.5);
  const safeQuestions = questions.map(({ correctIndex, explanation, ...q }) => q);
  return { attempt, questions: safeQuestions };
};

const submitQuizAttempt = async (tenantId, quizId, studentId, answers) => {
  const attempt = await QuizAttempt.findOne({ tenantId, quizId, studentId, submittedAt: null }).sort({ createdAt: -1 });
  if (!attempt) throw err('No active attempt found.', 404);
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course || !course.enrolledStudents.map(String).includes(String(studentId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  const questions = await QuizQuestion.find({ tenantId, quizId }).lean();
  
  // Build lookup map of answers submitted by student
  const studentAnsMap = new Map();
  (answers || []).forEach(a => {
    if (a && a.questionId) {
      studentAnsMap.set(String(a.questionId), a.selectedIndex);
    }
  });

  const enableNeg = !!quiz.enableNegativeMarking;
  const correctMarkVal = quiz.correctMark !== undefined && quiz.correctMark !== null ? Number(quiz.correctMark) : null;
  const negativeMarkVal = enableNeg ? (quiz.negativeMark !== undefined ? Math.abs(Number(quiz.negativeMark)) : 0.25) : 0;
  const unattemptedMarkVal = quiz.unattemptedMark !== undefined ? Number(quiz.unattemptedMark) : 0;

  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let totalMarks = 0;
  let maxMarks = 0;
  const breakdown = [];
  const gradedAnswers = [];

  questions.forEach(q => {
    const qCorrectMark = correctMarkVal !== null ? correctMarkVal : (Number(q.marks) || 1);
    maxMarks += qCorrectMark;

    const selectedIdx = studentAnsMap.has(String(q._id)) ? studentAnsMap.get(String(q._id)) : -1;
    const isAnswered = selectedIdx !== undefined && selectedIdx !== null && selectedIdx >= 0 && selectedIdx <= 3;

    let isCorrect = false;
    let marksAwarded = 0;
    let status = 'unattempted';

    if (isAnswered) {
      if (selectedIdx === q.correctIndex) {
        isCorrect = true;
        status = 'correct';
        marksAwarded = qCorrectMark;
        correctCount += 1;
      } else {
        isCorrect = false;
        status = 'wrong';
        marksAwarded = -negativeMarkVal;
        wrongCount += 1;
      }
    } else {
      isCorrect = false;
      status = 'unattempted';
      marksAwarded = unattemptedMarkVal;
      unattemptedCount += 1;
    }

    totalMarks += marksAwarded;

    const roundedMarks = Math.round(marksAwarded * 100) / 100;
    const gradedItem = {
      questionId: q._id,
      question: q.question,
      options: q.options,
      selectedIndex: selectedIdx,
      correctAnswer: q.correctIndex,
      explanation: q.explanation,
      isCorrect,
      status,
      marksAwarded: roundedMarks
    };

    breakdown.push(gradedItem);
    gradedAnswers.push({
      questionId: q._id,
      selectedIndex: selectedIdx,
      isCorrect,
      status,
      marksAwarded: roundedMarks
    });
  });

  totalMarks = Math.round(totalMarks * 100) / 100;
  maxMarks = Math.round(maxMarks * 100) / 100;
  const rawPercent = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
  const percentScore = Math.round(rawPercent * 10) / 10;
  const passed = percentScore >= (quiz.passMark || 60);

  const markingScheme = {
    enableNegativeMarking: enableNeg,
    correctMark: correctMarkVal !== null ? correctMarkVal : 1,
    negativeMark: negativeMarkVal,
    unattemptedMark: unattemptedMarkVal
  };

  Object.assign(attempt, {
    answers: gradedAnswers,
    correctCount,
    wrongCount,
    unattemptedCount,
    totalMarks,
    maxMarks,
    percentScore,
    passed,
    markingScheme,
    submittedAt: new Date(),
    timeTakenSeconds: attempt.startedAt ? Math.round((Date.now() - attempt.startedAt.getTime()) / 1000) : null
  });

  await attempt.save();

  const result = {
    score: percentScore,
    percentScore,
    passed,
    totalMarks,
    maxMarks,
    correctCount,
    wrongCount,
    unattemptedCount,
    markingScheme,
    breakdown
  };
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

  return QuizAttempt.find({ tenantId, quizId }).populate('studentId', 'name email').sort({ submittedAt: -1, createdAt: -1 });
};

const getMyQuizAttempts = async (tenantId, quizId, studentId) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);

  const course = await Course.findOne({ _id: quiz.courseId, tenantId });
  if (!course || !course.enrolledStudents.map(String).includes(String(studentId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  const attempts = await QuizAttempt.find({ tenantId, quizId, studentId })
    .populate('answers.questionId')
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();

  return attempts.map(attempt => {
    const breakdown = (attempt.answers || []).map(ans => {
      const q = ans.questionId;
      return {
        questionId: q?._id || ans.questionId,
        question: q?.question || '',
        options: q?.options || [],
        selectedIndex: ans.selectedIndex,
        correctAnswer: q?.correctIndex,
        explanation: q?.explanation || '',
        isCorrect: ans.isCorrect,
        status: ans.status,
        marksAwarded: ans.marksAwarded
      };
    });
    return {
      ...attempt,
      breakdown
    };
  });
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
    .populate('programId', 'name code degreeLevel')
    .populate('requestedProgramId', 'name code degreeLevel')
    .select('name email role createdAt isActive isApproved phone whatsappNumber district degreeQualification workExperience currentJobTitle programId requestedProgramId rollNumber')
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

const activateUser = async (tenantId, targetUserId, requesterId) => {
  if (targetUserId === requesterId) throw err('Cannot activate your own account', 400);
  const User = require('../../auth/models/user.model');
  const user = await User.findOneAndUpdate(
    { _id: targetUserId, tenantId },
    { isActive: true },
    { new: true }
  ).select('name email role isActive createdAt');
  if (!user) throw err('User not found.', 404);
  return user;
};

const deleteUser = async (tenantId, targetUserId, requesterId) => {
  if (targetUserId === requesterId) throw err('Cannot delete your own account', 400);
  const User = require('../../auth/models/user.model');
  const user = await User.findOneAndDelete({ _id: targetUserId, tenantId });
  if (!user) throw err('User not found.', 404);

  const CleanAllData = [
    { modelName: 'Enrollment', query: { userId: targetUserId } },
    { modelName: 'EnrollmentRequest', query: { studentId: targetUserId } },
    { modelName: 'Submission', query: { userId: targetUserId } },
    { modelName: 'QuizAttempt', query: { studentId: targetUserId } },
    { modelName: 'Certificate', query: { studentId: targetUserId } },
    { modelName: 'Notification', query: { userId: targetUserId } },
    { modelName: 'Attendance', query: { studentId: targetUserId } }
  ];

  for (const item of CleanAllData) {
    try {
      const TargetModel = mongoose.model(item.modelName);
      if (TargetModel) {
        await TargetModel.deleteMany(item.query);
      }
    } catch (e) {
      // Safe boundary fallback if any model isn't active in memory
    }
  }

  // Also remove user from array filters if stored inside Course documents
  try {
    const CourseModel = mongoose.model('Course');
    if (CourseModel) {
      await CourseModel.updateMany(
        { tenantId },
        { $pull: { enrolledStudents: targetUserId } }
      );
    }
  } catch (e) { /* Safe catch */ }

  // Finally remove the User main identity document
  await User.findOneAndDelete({ _id: targetUserId, tenantId });
  
  return { 
    success: true, 
    message: 'User account and all corresponding academic enrollments, submissions, and attempts have been permanently purged successfully.' 
  };
};

const approveUser = async (tenantId, targetUserId, overrideProgramId = null) => {
  const User = require('../../auth/models/user.model');
  const user = await User.findOne({ _id: targetUserId, tenantId });
  if (!user) throw err('User not found.', 404);

  user.isApproved = true;
  user.isActive = true;

  // Use overrideProgramId if provided by admin, otherwise use student's requestedProgramId / programId
  const effectiveProgramId = overrideProgramId || user.requestedProgramId || user.programId;
  if (effectiveProgramId) {
    user.programId = effectiveProgramId;
    user.requestedProgramId = effectiveProgramId;
    await Course.updateMany(
      { tenantId, programId: effectiveProgramId },
      { $addToSet: { enrolledStudents: user._id } }
    );
  }

  await user.save();
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

// ══════════════════════════════════════════════════════════════════════════════
// ACADEMIC STRUCTURE – Programs (Degrees) & Majors (Specializations)
// ══════════════════════════════════════════════════════════════════════════════

// ── Programs ───────────────────────────────────────────────────────────────────
// ── Programs ───────────────────────────────────────────────────────────────────
const getPrograms = async (tenantId, userId = null, role = null) => {
  if (role === 'student' && userId) {
    const User = require('../../auth/models/user.model');
    const studentUser = await User.findOne({ _id: userId, tenantId }).select('programId requestedProgramId enrolledPrograms').lean();
    const enrolledCourses = await Course.find({ tenantId, enrolledStudents: userId, status: 'active' }).select('programId').lean();
    const progIds = enrolledCourses.map(c => c.programId).filter(Boolean);
    if (studentUser?.programId) progIds.push(studentUser.programId);
    if (studentUser?.requestedProgramId) progIds.push(studentUser.requestedProgramId);
    if (Array.isArray(studentUser?.enrolledPrograms)) {
      progIds.push(...studentUser.enrolledPrograms);
    }
    return Program.find({ tenantId, _id: { $in: progIds } }).sort({ name: 1 }).lean();
  }
  return Program.find({ tenantId }).sort({ name: 1 }).lean();
};

const getProgramById = async (tenantId, programId) => {
  const program = await Program.findOne({ _id: programId, tenantId }).lean();
  if (!program) throw err('Program not found.', 404);
  return program;
};

const createProgram = async (tenantId, data) => {
  if (!data.name || data.name.trim().length < 2)
    throw err('Program name is required (min 2 characters).', 400);
  return Program.create({ tenantId, ...data });
};

const updateProgram = async (tenantId, programId, data) => {
  const ALLOWED = ['name', 'code', 'school', 'faculty', 'description', 'degreeLevel', 'totalCreditHours', 'passingGradePercent', 'thumbnail', 'featuredOnHomepage', 'status'];
  const update = {};
  ALLOWED.forEach(f => { if (data[f] !== undefined) update[f] = data[f]; });
  const updated = await Program.findOneAndUpdate({ _id: programId, tenantId }, { $set: update }, { new: true, runValidators: true });
  if (!updated) throw err('Program not found.', 404);
  return updated;
};

const deleteProgram = async (tenantId, programId) => {
  const prog = await Program.findOneAndDelete({ _id: programId, tenantId });
  if (!prog) throw err('Program not found.', 404);

  // Find all courses under this program to cascade delete them completely
  const courses = await Course.find({ tenantId, programId }).select('_id');
  const courseIds = courses.map(c => c._id);

  if (courseIds.length > 0) {
    const Quiz = require('../models/quiz.model');
    const QuizQuestion = require('../models/quizQuestion.model');
    const QuizAttempt = require('../models/quizAttempt.model');
    const Session = require('../models/session.model');
    const Attendance = require('../models/attendance.model');
    const Assignment = require('../models/assignment.model');
    const LmsDocument = require('../models/lmsDocument.model');
    const VideoLecture = require('../models/videoLecture.model');

    const quizIds = (await Quiz.find({ courseId: { $in: courseIds }, tenantId }).select('_id')).map(q => q._id);

    await Promise.all([
      Session.deleteMany({ courseId: { $in: courseIds }, tenantId }),
      Attendance.deleteMany({ courseId: { $in: courseIds }, tenantId }),
      Assignment.deleteMany({ courseId: { $in: courseIds }, tenantId }),
      Quiz.deleteMany({ courseId: { $in: courseIds }, tenantId }),
      QuizQuestion.deleteMany({ quizId: { $in: quizIds }, tenantId }),
      QuizAttempt.deleteMany({ courseId: { $in: courseIds }, tenantId }),
      LmsDocument.deleteMany({ courseId: { $in: courseIds }, tenantId }),
      VideoLecture.deleteMany({ courseId: { $in: courseIds }, tenantId }),
      Certificate.deleteMany({ courseId: { $in: courseIds }, tenantId }),
      Course.deleteMany({ _id: { $in: courseIds }, tenantId }),
    ]);
  }

  // Remove majors in this program
  await Major.deleteMany({ tenantId, programId });

  // Clear programId from any users assigned to this program
  const User = require('../../auth/models/user.model');
  await User.updateMany(
    { tenantId, programId },
    { $set: { programId: null, requestedProgramId: null, majorId: null } }
  );

  return { success: true };
};

// ── Majors ─────────────────────────────────────────────────────────────────────
const getMajors = async (tenantId, programId, userId = null, role = null) => {
  const filter = { tenantId };
  if (programId) filter.programId = programId;
  if (role === 'student' && userId) {
    const User = require('../../auth/models/user.model');
    const studentUser = await User.findOne({ _id: userId, tenantId }).select('programId majorId').lean();
    const enrolledCourses = await Course.find({ tenantId, enrolledStudents: userId, status: 'active' }).select('majorId').lean();
    const majorIds = enrolledCourses.map(c => c.majorId).filter(Boolean);
    if (studentUser?.majorId) majorIds.push(studentUser.majorId);

    const targetProgramId = programId || studentUser?.programId;
    if (targetProgramId) {
      filter.programId = targetProgramId;
    } else if (majorIds.length > 0) {
      filter._id = { $in: majorIds };
    }
  }
  return Major.find(filter).populate('programId', 'name code').sort({ name: 1 }).lean();
};

const createMajor = async (tenantId, data) => {
  if (!data.programId) throw err('programId is required.', 400);
  if (!data.name || data.name.trim().length < 2) throw err('Major name is required (min 2 characters).', 400);
  const program = await Program.findOne({ _id: data.programId, tenantId });
  if (!program) throw err('Program not found.', 404);
  return Major.create({ tenantId, ...data });
};

const updateMajor = async (tenantId, majorId, data) => {
  const ALLOWED = ['name', 'code', 'description', 'coordinator', 'status'];
  const update = {};
  ALLOWED.forEach(f => { if (data[f] !== undefined) update[f] = data[f]; });
  const updated = await Major.findOneAndUpdate({ _id: majorId, tenantId }, { $set: update }, { new: true, runValidators: true });
  if (!updated) throw err('Major not found.', 404);
  return updated;
};

const deleteMajor = async (tenantId, majorId) => {
  const major = await Major.findOneAndDelete({ _id: majorId, tenantId });
  if (!major) throw err('Major not found.', 404);
  // Null-out courses linked to this major
  await Course.updateMany({ tenantId, majorId }, { $set: { majorId: null } });
  return { success: true };
};

// ── Academic Hierarchy Tree ───────────────────────────────────────────────────
const getAcademicHierarchyTree = async (tenantId, userId = null, role = null) => {
  const courseFilter = { tenantId };
  let studentProgramId = null;
  if (role === 'student' && userId) {
    const User = require('../../auth/models/user.model');
    const studentUser = await User.findOne({ _id: userId, tenantId }).select('programId requestedProgramId').lean();
    studentProgramId = studentUser?.programId ? String(studentUser.programId) : (studentUser?.requestedProgramId ? String(studentUser.requestedProgramId) : null);
    courseFilter.enrolledStudents = userId;
    courseFilter.status = 'active';
  }

  const [programs, majors, courses] = await Promise.all([
    Program.find({ tenantId }).sort({ name: 1 }).lean(),
    Major.find({ tenantId }).sort({ name: 1 }).lean(),
    Course.find(courseFilter).select('title courseCode creditHours programId majorId isCommon status enrolledStudents').lean(),
  ]);

  const tree = programs.map(prog => {
    const progMajors = majors.filter(m => String(m.programId) === String(prog._id));
    const progCourses = courses.filter(c => String(c.programId) === String(prog._id));
    const commonSubjects = progCourses.filter(c => c.isCommon || !c.majorId);

    const mappedMajors = progMajors.map(maj => ({
      ...maj,
      subjects: progCourses.filter(c => String(c.majorId) === String(maj._id)),
    }));

    return {
      ...prog,
      commonSubjects,
      majors: mappedMajors,
    };
  });

  if (role === 'student') {
    return tree.filter(p => (studentProgramId && String(p._id) === studentProgramId) || p.commonSubjects.length > 0 || p.majors.length > 0);
  }

  return tree;
};

// ══════════════════════════════════════════════════════════════════════════════
// MULTI-LEVEL WEIGHTED PERFORMANCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate a student's course-level performance score (0–100).
 * Composite: 40% quiz avg + 40% assignment avg + 20% attendance %
 * Falls back gracefully if some data is missing.
 */
const _calcCourseScore = async (tenantId, courseId, studentId) => {
  const [quizAttempts, submissions, sessionsAll, attendanceRecs] = await Promise.all([
    QuizAttempt.find({ tenantId, courseId, studentId, status: 'submitted' }).select('percentScore').lean(),
    Assignment.aggregate([
      { $match: { tenantId, courseId } },
      { $lookup: { from: 'assignmentsubmissions', localField: '_id', foreignField: 'assignmentId', as: 'subs' } },
      { $unwind: '$subs' },
      { $match: { 'subs.studentId': require('mongoose').Types.ObjectId.isValid(studentId) ? new (require('mongoose').Types.ObjectId)(studentId) : studentId } },
      { $project: { grade: '$subs.grade', maxMarks: 1 } },
    ]),
    Session.countDocuments({ tenantId, courseId }),
    Attendance.find({ tenantId, courseId, studentId }).lean(),
  ]);

  const quizAvg = quizAttempts.length
    ? quizAttempts.reduce((s, a) => s + (a.percentScore || 0), 0) / quizAttempts.length
    : null;

  const assignAvg = submissions.length
    ? submissions.reduce((s, sub) => {
        const pct = sub.maxMarks > 0 ? (sub.grade / sub.maxMarks) * 100 : sub.grade;
        return s + pct;
      }, 0) / submissions.length
    : null;

  const attendedCount = attendanceRecs.filter(a => a.status === 'present').length;
  const attendPct = sessionsAll > 0 ? (attendedCount / sessionsAll) * 100 : null;

  // Weighted composite with graceful fallback
  const parts = [];
  const weights = [];
  if (quizAvg !== null)  { parts.push(quizAvg  * 0.4); weights.push(0.4); }
  if (assignAvg !== null) { parts.push(assignAvg * 0.4); weights.push(0.4); }
  if (attendPct !== null) { parts.push(attendPct * 0.2); weights.push(0.2); }

  if (parts.length === 0) return { score: 0, quizAvg: 0, assignAvg: 0, attendPct: 0, dataAvailable: false };

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const rawScore = parts.reduce((s, p) => s + p, 0);
  const score = totalWeight > 0 ? (rawScore / totalWeight) : 0;

  return {
    score: Math.round(score * 100) / 100,
    quizAvg: quizAvg !== null ? Math.round(quizAvg * 100) / 100 : null,
    assignAvg: assignAvg !== null ? Math.round(assignAvg * 100) / 100 : null,
    attendPct: attendPct !== null ? Math.round(attendPct * 100) / 100 : null,
    dataAvailable: true,
  };
};

/**
 * Weighted average helper.
 * @param {Array<{score, creditHours, weight}>} courses
 */
const _weightedAvg = (courses) => {
  const totalW = courses.reduce((s, c) => s + (c.creditHours * c.weight), 0);
  if (totalW === 0) return 0;
  const weighted = courses.reduce((s, c) => s + (c.score * c.creditHours * c.weight), 0);
  return Math.round((weighted / totalW) * 100) / 100;
};

/**
 * Get a student's full multi-level academic performance breakdown.
 * Returns: degree summary, major performance, common subjects performance, per-course detail.
 */
const getStudentDegreePerformance = async (tenantId, studentId, programId) => {
  const User = require('../../auth/models/user.model');
  const student = await User.findOne({ _id: studentId, tenantId }).lean();
  if (!student) throw err('Student not found.', 404);

  const effectiveProgramId = programId || student.programId;
  if (!effectiveProgramId) throw err('Student has no program assigned. Provide programId.', 400);

  const program = await Program.findOne({ _id: effectiveProgramId, tenantId }).lean();
  if (!program) throw err('Program not found.', 404);

  // Get all courses student is enrolled in under this program
  const enrolledCourses = await Course.find({
    tenantId,
    programId: effectiveProgramId,
    enrolledStudents: studentId,
  }).lean();

  if (enrolledCourses.length === 0) {
    return {
      student: { _id: student._id, name: student.name, email: student.email, rollNumber: student.rollNumber },
      program: { _id: program._id, name: program.name, school: program.school },
      degreePerformance: 0,
      majorPerformance: null,
      commonSubjectsPerformance: null,
      courses: [],
      message: 'No enrolled courses found under this program.',
    };
  }

  // Calculate per-course score
  const courseDetails = await Promise.all(
    enrolledCourses.map(async (course) => {
      const perf = await _calcCourseScore(tenantId, String(course._id), String(studentId));
      return {
        _id: course._id,
        title: course.title,
        courseCode: course.courseCode,
        creditHours: course.creditHours || 3,
        weight: course.weight || 1,
        majorId: course.majorId,
        isCommon: course.isCommon,
        score: perf.score,
        quizAvg: perf.quizAvg,
        assignAvg: perf.assignAvg,
        attendPct: perf.attendPct,
        dataAvailable: perf.dataAvailable,
      };
    })
  );

  const commonCourses = courseDetails.filter(c => c.isCommon || !c.majorId);
  const majorCourses  = courseDetails.filter(c => !c.isCommon && c.majorId);

  // Group major courses by majorId
  const majorGroups = {};
  for (const c of majorCourses) {
    const key = String(c.majorId);
    if (!majorGroups[key]) majorGroups[key] = [];
    majorGroups[key].push(c);
  }

  // Enrich major groups with major info
  const majorIds = Object.keys(majorGroups);
  const majorDocs = majorIds.length > 0
    ? await Major.find({ _id: { $in: majorIds }, tenantId }).lean()
    : [];

  const majorBreakdown = majorDocs.map(maj => ({
    majorId: maj._id,
    majorName: maj.name,
    majorCode: maj.code,
    courses: majorGroups[String(maj._id)] || [],
    performance: _weightedAvg(majorGroups[String(maj._id)] || []),
  }));

  // Student's own major performance (based on student.majorId or first major found)
  const studentMajorId = student.majorId ? String(student.majorId) : majorIds[0];
  const studentMajorBreakdown = majorBreakdown.find(m => String(m.majorId) === studentMajorId) || majorBreakdown[0] || null;

  const commonSubjectsPerformance = commonCourses.length > 0 ? _weightedAvg(commonCourses) : null;
  const majorPerformance = studentMajorBreakdown ? studentMajorBreakdown.performance : null;
  const degreePerformance = _weightedAvg(courseDetails);

  return {
    student: { _id: student._id, name: student.name, email: student.email, rollNumber: student.rollNumber },
    program: { _id: program._id, name: program.name, school: program.school, passingGradePercent: program.passingGradePercent },
    degreePerformance,
    majorPerformance,
    commonSubjectsPerformance,
    majorBreakdown,
    commonCourses,
    courses: courseDetails,
    isPassing: degreePerformance >= (program.passingGradePercent || 60),
  };
};

/**
 * Get program-level performance overview for admin/teacher.
 * Shows per-major and per-student aggregates.
 */
const getProgramPerformanceOverview = async (tenantId, programId) => {
  const program = await Program.findOne({ _id: programId, tenantId }).lean();
  if (!program) throw err('Program not found.', 404);

  const majors = await Major.find({ tenantId, programId }).lean();
  const courses = await Course.find({ tenantId, programId }).lean();

  // Get all enrolled students across all courses in this program
  const studentSet = new Set();
  courses.forEach(c => (c.enrolledStudents || []).forEach(sid => studentSet.add(String(sid))));
  const studentIds = [...studentSet];

  const User = require('../../auth/models/user.model');
  const students = await User.find({ _id: { $in: studentIds }, tenantId }).select('name email rollNumber programId majorId').lean();

  const studentPerformances = await Promise.all(
    students.map(async (student) => {
      try {
        const perf = await getStudentDegreePerformance(tenantId, String(student._id), programId);
        return {
          studentId: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          degreePerformance: perf.degreePerformance,
          majorPerformance: perf.majorPerformance,
          commonSubjectsPerformance: perf.commonSubjectsPerformance,
          isPassing: perf.isPassing,
        };
      } catch {
        return { studentId: student._id, name: student.name, email: student.email, degreePerformance: 0, isPassing: false };
      }
    })
  );

  const classAvg = studentPerformances.length
    ? Math.round(studentPerformances.reduce((s, p) => s + p.degreePerformance, 0) / studentPerformances.length * 100) / 100
    : 0;

  return {
    program: { _id: program._id, name: program.name, school: program.school },
    majors,
    totalStudents: studentPerformances.length,
    classAvgPerformance: classAvg,
    students: studentPerformances,
    courses: courses.map(c => ({ _id: c._id, title: c.title, courseCode: c.courseCode, creditHours: c.creditHours, isCommon: c.isCommon, majorId: c.majorId })),
  };
};

function extractYouTubeId(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

// ── Video Lectures ────────────────────────────────────────────────────────────
const getCourseVideoLectures = async (tenantId, courseId, userId, userRole) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  if (userRole === 'student' && !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  const filter = { tenantId, courseId };
  if (userRole === 'student') {
    filter.isPublished = true;
  }

  const lectures = await VideoLecture.find(filter).sort({ order: 1, createdAt: 1 }).lean();

  return lectures.map(l => ({
    ...l,
    isCompleted: (l.completedStudents || []).map(String).includes(String(userId)),
    completedCount: (l.completedStudents || []).length
  }));
};

const createVideoLecture = async (tenantId, courseId, userId, data) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const ytId = extractYouTubeId(data.videoUrl);
  const lectureCount = await VideoLecture.countDocuments({ tenantId, courseId });

  const lecture = await VideoLecture.create({
    tenantId,
    courseId,
    createdBy: userId,
    title: String(data.title).trim(),
    description: data.description ? String(data.description).trim() : '',
    moduleName: data.moduleName ? String(data.moduleName).trim() : 'General',
    videoUrl: String(data.videoUrl).trim(),
    youtubeVideoId: ytId || (data.youtubeVideoId ? String(data.youtubeVideoId).trim() : ''),
    durationMinutes: Number(data.durationMinutes) || 0,
    order: data.order !== undefined ? Number(data.order) : lectureCount + 1,
    notes: data.notes ? String(data.notes).trim() : '',
    resources: Array.isArray(data.resources) ? data.resources : [],
    isPublished: data.isPublished !== undefined ? !!data.isPublished : true,
  });

  return lecture;
};

const updateVideoLecture = async (tenantId, courseId, lectureId, userId, userRole, data) => {
  const lecture = await VideoLecture.findOne({ _id: lectureId, courseId, tenantId });
  if (!lecture) throw err('Video lecture not found.', 404);

  const update = {};
  if (data.title !== undefined) update.title = String(data.title).trim();
  if (data.description !== undefined) update.description = String(data.description).trim();
  if (data.moduleName !== undefined) update.moduleName = String(data.moduleName).trim();
  if (data.videoUrl !== undefined) {
    update.videoUrl = String(data.videoUrl).trim();
    update.youtubeVideoId = extractYouTubeId(data.videoUrl);
  }
  if (data.durationMinutes !== undefined) update.durationMinutes = Number(data.durationMinutes) || 0;
  if (data.order !== undefined) update.order = Number(data.order);
  if (data.notes !== undefined) update.notes = String(data.notes).trim();
  if (data.resources !== undefined) update.resources = Array.isArray(data.resources) ? data.resources : [];
  if (data.isPublished !== undefined) update.isPublished = !!data.isPublished;

  const updated = await VideoLecture.findOneAndUpdate(
    { _id: lectureId, tenantId },
    { $set: update },
    { new: true, runValidators: true }
  );

  return updated;
};

const deleteVideoLecture = async (tenantId, courseId, lectureId, userId, userRole) => {
  const lecture = await VideoLecture.findOneAndDelete({ _id: lectureId, courseId, tenantId });
  if (!lecture) throw err('Video lecture not found.', 404);
  return { message: 'Video lecture deleted successfully.' };
};

const toggleVideoLectureProgress = async (tenantId, courseId, lectureId, studentId) => {
  const lecture = await VideoLecture.findOne({ _id: lectureId, courseId, tenantId });
  if (!lecture) throw err('Video lecture not found.', 404);

  const isCompleted = (lecture.completedStudents || []).map(String).includes(String(studentId));

  if (isCompleted) {
    lecture.completedStudents = (lecture.completedStudents || []).filter(id => String(id) !== String(studentId));
  } else {
    if (!lecture.completedStudents) lecture.completedStudents = [];
    lecture.completedStudents.push(studentId);
  }

  await lecture.save();

  return {
    lectureId,
    isCompleted: !isCompleted,
    completedCount: lecture.completedStudents.length
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// COURSE ENROLLMENT REQUESTS (APPLY & APPROVE)
// ══════════════════════════════════════════════════════════════════════════════
const applyCourseEnrollment = async (tenantId, id, studentId, message = '') => {
  const EnrollmentRequest = require('../models/enrollmentRequest.model');
  const User = require('../../auth/models/user.model');

  // Check if target is a Program (e.g. "Special Grand Test Series — Water Management Officer (BS-17)")
  const program = await Program.findOne({ _id: id, tenantId });
  if (program) {
    const user = await User.findOne({ _id: studentId, tenantId }).select('programId enrolledPrograms').lean();
    const enrolledProgIds = [];
    if (user?.programId) enrolledProgIds.push(String(user.programId));
    if (Array.isArray(user?.enrolledPrograms)) {
      user.enrolledPrograms.forEach(p => enrolledProgIds.push(String(p?._id || p)));
    }

    if (enrolledProgIds.includes(String(id))) {
      throw err('You are already enrolled in this course/program.', 400);
    }

    const existingPending = await EnrollmentRequest.findOne({
      tenantId,
      programId: id,
      studentId,
      status: 'pending'
    });
    if (existingPending) {
      throw err('You already have a pending enrollment application for this course.', 400);
    }

    const newRequest = await EnrollmentRequest.create({
      tenantId,
      programId: id,
      studentId,
      status: 'pending',
      message: String(message || '').trim()
    });

    return {
      success: true,
      message: 'Enrollment application submitted successfully. Waiting for admin approval.',
      data: newRequest
    };
  }

  // Check if target is a Course
  const course = await Course.findOne({ _id: id, tenantId });
  if (course) {
    if (course.status !== 'active') throw err('This course is not currently accepting enrollments.', 400);

    if ((course.enrolledStudents || []).map(String).includes(String(studentId))) {
      throw err('You are already enrolled in this course.', 400);
    }

    const existingPending = await EnrollmentRequest.findOne({
      tenantId,
      courseId: id,
      studentId,
      status: 'pending'
    });
    if (existingPending) {
      throw err('You already have a pending enrollment application for this course.', 400);
    }

    const newRequest = await EnrollmentRequest.create({
      tenantId,
      courseId: id,
      studentId,
      status: 'pending',
      message: String(message || '').trim()
    });

    return {
      success: true,
      message: 'Enrollment application submitted successfully. Waiting for admin approval.',
      data: newRequest
    };
  }

  throw err('Course not found.', 404);
};

const getMyEnrollmentRequests = async (tenantId, studentId) => {
  const EnrollmentRequest = require('../models/enrollmentRequest.model');
  return EnrollmentRequest.find({ tenantId, studentId })
    .populate('courseId', 'title courseCode category thumbnail instructor programId majorId')
    .populate('programId', 'name code school faculty degreeLevel description thumbnail')
    .sort({ createdAt: -1 })
    .lean();
};

const getCoursesCatalog = async (tenantId, studentId) => {
  const EnrollmentRequest = require('../models/enrollmentRequest.model');
  const User = require('../../auth/models/user.model');

  const [programs, courses, myRequests, studentUser] = await Promise.all([
    Program.find({ tenantId, status: { $ne: 'archived' } }).sort({ name: 1 }).lean(),
    Course.find({ tenantId, status: 'active' }).select('programId enrolledStudents title courseCode category').lean(),
    EnrollmentRequest.find({ tenantId, studentId }).sort({ createdAt: -1 }).lean(),
    User.findOne({ _id: studentId, tenantId }).select('programId enrolledPrograms').lean()
  ]);

  const enrolledProgIds = [];
  if (studentUser?.programId) enrolledProgIds.push(String(studentUser.programId));
  if (Array.isArray(studentUser?.enrolledPrograms)) {
    studentUser.enrolledPrograms.forEach(p => enrolledProgIds.push(String(p?._id || p)));
  }

  const requestMap = new Map();
  myRequests.forEach(r => {
    const key = r.programId ? `p_${String(r.programId)}` : `c_${String(r.courseId)}`;
    if (!requestMap.has(key)) {
      requestMap.set(key, r);
    }
  });

  const progSubjectCount = new Map();
  courses.forEach(c => {
    if (c.programId) {
      const pid = String(c.programId);
      progSubjectCount.set(pid, (progSubjectCount.get(pid) || 0) + 1);
    }
  });

  // Programs represent the primary courses (e.g. Special Grand Test Series — Water Management Officer (BS-17))
  const catalogList = programs.map(p => {
    const pIdStr = String(p._id);
    const isEnrolled = enrolledProgIds.includes(pIdStr);
    const req = requestMap.get(`p_${pIdStr}`);

    return {
      _id: p._id,
      title: p.name,
      name: p.name,
      courseCode: p.code || 'DEGREE',
      degreeLevel: p.degreeLevel,
      school: p.school,
      faculty: p.faculty,
      category: p.degreeLevel ? p.degreeLevel.toUpperCase() : 'PROGRAM',
      description: p.description || 'Comprehensive test series, mock exams, study materials and lectures.',
      thumbnail: p.thumbnail,
      isEnrolled,
      requestStatus: isEnrolled ? 'approved' : (req?.status || 'none'),
      requestId: req?._id || null,
      enrolledCount: courses.filter(c => String(c.programId) === pIdStr && c.enrolledStudents?.some(s => String(s) === String(studentId))).length || (isEnrolled ? 1 : 0),
      totalSubjects: progSubjectCount.get(pIdStr) || 0,
      type: 'program'
    };
  });

  return catalogList;
};

const getAdminEnrollmentRequests = async (tenantId, query = {}) => {
  const EnrollmentRequest = require('../models/enrollmentRequest.model');
  const filter = { tenantId };
  if (query.status && ['pending', 'approved', 'rejected'].includes(query.status)) {
    filter.status = query.status;
  }
  return EnrollmentRequest.find(filter)
    .populate('studentId', 'name email rollNumber phone whatsappNumber district programId')
    .populate('courseId', 'title courseCode category instructor thumbnail programId')
    .populate('programId', 'name code school faculty degreeLevel description thumbnail')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

const approveEnrollmentRequest = async (tenantId, requestId, adminId) => {
  const EnrollmentRequest = require('../models/enrollmentRequest.model');
  const request = await EnrollmentRequest.findOne({ _id: requestId, tenantId });
  if (!request) throw err('Enrollment request not found.', 404);

  const User = require('../../auth/models/user.model');

  if (request.programId) {
    const student = await User.findOne({ _id: request.studentId, tenantId });
    if (student) {
      const update = { $addToSet: { enrolledPrograms: request.programId } };
      if (!student.programId) update.$set = { programId: request.programId };
      await User.updateOne({ _id: request.studentId, tenantId }, update);
    }

    // Automatically enroll student into all subjects/courses of this program
    await Course.updateMany(
      { tenantId, programId: request.programId },
      { $addToSet: { enrolledStudents: request.studentId } }
    );

    request.status = 'approved';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    await logActivity({
      userId: adminId,
      tenantId,
      action: 'APPROVE_PROGRAM_ENROLLMENT',
      entityType: 'Program',
      entityId: request.programId,
      meta: { studentId: request.studentId, requestId: request._id }
    });

    return {
      success: true,
      message: 'Course/Program enrollment approved successfully. Student can now access all course materials.',
      data: request
    };
  }

  if (request.courseId) {
    const course = await Course.findOne({ _id: request.courseId, tenantId });
    if (!course) throw err('Requested course not found.', 404);

    await Course.updateOne(
      { _id: request.courseId, tenantId },
      { $addToSet: { enrolledStudents: request.studentId } }
    );

    request.status = 'approved';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    await logActivity({
      userId: adminId,
      tenantId,
      action: 'APPROVE_COURSE_ENROLLMENT',
      entityType: 'Course',
      entityId: request.courseId,
      meta: { studentId: request.studentId, requestId: request._id }
    });

    return {
      success: true,
      message: 'Course enrollment approved successfully. Student can now access all course materials.',
      data: request
    };
  }

  throw err('Invalid enrollment request.', 400);
};

const rejectEnrollmentRequest = async (tenantId, requestId, adminId, reason = '') => {
  const EnrollmentRequest = require('../models/enrollmentRequest.model');
  const request = await EnrollmentRequest.findOne({ _id: requestId, tenantId });
  if (!request) throw err('Enrollment request not found.', 404);

  request.status = 'rejected';
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  request.rejectionReason = String(reason || '').trim();
  await request.save();

  await logActivity({
    userId: adminId,
    tenantId,
    action: 'REJECT_COURSE_ENROLLMENT',
    entityType: 'Course',
    entityId: request.courseId,
    meta: { studentId: request.studentId, requestId: request._id, reason }
  });

  return {
    success: true,
    message: 'Course enrollment request rejected.',
    data: request
  };
};

module.exports = {
  getCourses, getCourseById, createCourse, updateCourse, saveDraft, deleteCourse, enrollStudent, unenrollStudent, getTenantStudents,
  markAttendance, getCourseAttendance,
  createAssignment, updateAssignment, deleteAssignment, submitAssignment, getCourseAssignments,
  createSession, updateSession, toggleSession, deleteSession, getCourseSessions, getSessionAttendance, overrideAttendance,
  markSelfAttendance, getMyAttendanceSummary,
  uploadCourseDocument, getCourseDocuments, deleteCourseDocument, getLmsDocumentById, getCourseDocumentAccess,
  gradeSubmission, getAssignmentSubmissions, getMySubmission,
  createQuiz, createQuizBulk, generateQuizExcelTemplate, validateQuizExcel, getCourseQuizzes, addQuizQuestion, getQuizQuestions, updateQuiz, updateQuizQuestion, deleteQuizQuestion, publishQuiz, startQuizAttempt, submitQuizAttempt, getQuizResults, getMyQuizAttempts,
  getCoursePerformance, getMyPerformance, checkEligibility, generateCertificate, generateAllCertificates, getCourseCertificates, getMyCertificates, verifyCertificate, getCertificateById,
  getCertificateTemplate, saveCertificateTemplate,
  getAdminStats, getAdminUsers, updateUserRole, deactivateUser, activateUser, deleteUser, approveUser, getAdminCourses, deleteAdminCourse, getAdminCertificates, revokeCertificate,
  // Academic hierarchy
  getPrograms, getProgramById, createProgram, updateProgram, deleteProgram,
  getMajors, createMajor, updateMajor, deleteMajor,
  getAcademicHierarchyTree,
  getStudentDegreePerformance, getProgramPerformanceOverview,
  // Video lectures
  getCourseVideoLectures, createVideoLecture, updateVideoLecture, deleteVideoLecture, toggleVideoLectureProgress,
  // Course Enrollment Requests
  applyCourseEnrollment, getMyEnrollmentRequests, getCoursesCatalog, getAdminEnrollmentRequests, approveEnrollmentRequest, rejectEnrollmentRequest,
};
