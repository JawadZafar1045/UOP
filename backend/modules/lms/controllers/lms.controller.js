const lmsService = require('../services/lms.service');
const https = require('https');
const http = require('http');
const pathMod = require('path');
const { validateExternalUrl } = require('../../shared/utils/ssrf');

const MIME_MAP = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

const getMimeType = (filename) => {
  const ext = pathMod.extname(filename || '').toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
};

const extractCloudinaryPublicId = (fileUrl) => {
  const parts = fileUrl.split('/upload/');
  if (parts.length < 2) return null;
  const segments = parts[1].split('/');
  const filteredSegments = segments.filter(seg => {
    if (seg.startsWith('s--')) return false;
    if (/^v\d+$/.test(seg)) return false;
    return true;
  });
  if (filteredSegments.length > 0) {
    const lastIdx = filteredSegments.length - 1;
    filteredSegments[lastIdx] = filteredSegments[lastIdx].split('?')[0];
  }
  return filteredSegments.join('/');
};

const proxyDownload = (fileUrl, fileName, res, next) => {
  let resourceType = 'raw';
  if (fileUrl.includes('/image/')) resourceType = 'image';
  if (fileUrl.includes('/video/')) resourceType = 'video';
  
  const parsedPublicId = extractCloudinaryPublicId(fileUrl);
  if (parsedPublicId) {
    let publicId = parsedPublicId;
    if (resourceType !== 'raw') {
      const lastDot = publicId.lastIndexOf('.');
      if (lastDot !== -1) {
        publicId = publicId.substring(0, lastDot);
      }
    }
    
    const cloudinary = require('../../../config/cloudinary');
    const archiveUrl = cloudinary.utils.download_archive_url({
      public_ids: [publicId],
      resource_type: resourceType,
      flatten_folders: true,
      target_filename: fileName
    });

    const getter = archiveUrl.startsWith('https') ? https : http;
    getter.get(archiveUrl, (cloudRes) => {
      if (cloudRes.statusCode === 200) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}.zip"`);
        return cloudRes.pipe(res);
      }
      
      const fallbackResourceType = resourceType === 'raw' ? 'image' : 'raw';
      let fallbackPublicId = parsedPublicId;
      if (fallbackResourceType !== 'raw') {
        const lastDot = fallbackPublicId.lastIndexOf('.');
        if (lastDot !== -1) {
          fallbackPublicId = fallbackPublicId.substring(0, lastDot);
        }
      }
      
      const fallbackArchiveUrl = cloudinary.utils.download_archive_url({
        public_ids: [fallbackPublicId],
        resource_type: fallbackResourceType,
        flatten_folders: true,
        target_filename: fileName
      });
      
      getter.get(fallbackArchiveUrl, (fallbackRes) => {
        if (fallbackRes.statusCode === 200) {
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}.zip"`);
          return fallbackRes.pipe(res);
        }
        
        try {
          validateExternalUrl(fileUrl);
        } catch (validationErr) {
          return next(validationErr);
        }
        
        getter.get(fileUrl, (directRes) => {
          res.setHeader('Content-Type', getMimeType(fileName));
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
          directRes.pipe(res);
        }).on('error', (e) => next(e));
      }).on('error', (e) => next(e));
    }).on('error', (e) => next(e));
    return;
  }

  try {
    validateExternalUrl(fileUrl);
  } catch (validationErr) {
    return next(validationErr);
  }

  const getter = fileUrl.startsWith('https') ? https : http;
  getter.get(fileUrl, (cloudRes) => {
    res.setHeader('Content-Type', getMimeType(fileName));
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    cloudRes.pipe(res);
  }).on('error', (e) => next(e));
};

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC CATALOG CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

const getPublicCourses = async (req, res, next) => {
  try {
    const tenantId = req.query.tenantId || req.tenantId;
    const result = await lmsService.getPublicCourses(tenantId, req.query);
    res.json({ success: true, data: result.courses, pagination: result.pagination });
  } catch (e) {
    next(e);
  }
};

const getPublicCourseBySlug = async (req, res, next) => {
  try {
    const tenantId = req.query.tenantId || req.tenantId;
    const course = await lmsService.getPublicCourseBySlug(tenantId, req.params.slug);
    res.json({ success: true, data: course });
  } catch (e) {
    next(e);
  }
};

const getPublicCategories = async (req, res, next) => {
  try {
    const tenantId = req.query.tenantId || req.tenantId;
    const categories = await lmsService.getPublicCategories(tenantId);
    res.json({ success: true, data: categories });
  } catch (e) {
    next(e);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ENROLLMENT & PAID REGISTRATION CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

const enrollFreeCourse = async (req, res, next) => {
  try {
    const result = await lmsService.enrollFreeCourse(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

const registerPaidCourse = async (req, res, next) => {
  try {
    const result = await lmsService.registerPaidCourse(req.tenantId, req.params.id, req.user._id, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

const getRegistrationStatus = async (req, res, next) => {
  try {
    const result = await lmsService.getRegistrationStatus(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN REGISTRATION CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

const getAdminRegistrations = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminRegistrations(req.tenantId, req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const approveRegistration = async (req, res, next) => {
  try {
    const result = await lmsService.approveRegistration(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

const rejectRegistration = async (req, res, next) => {
  try {
    const result = await lmsService.rejectRegistration(req.tenantId, req.params.id, req.body?.reason, req.user._id);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD & LEARNING PROGRESS CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

const getStudentEnrolledCourses = async (req, res, next) => {
  try {
    const data = await lmsService.getStudentEnrolledCourses(req.tenantId, req.user._id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const getStudentContinueLearning = async (req, res, next) => {
  try {
    const data = await lmsService.getStudentContinueLearning(req.tenantId, req.user._id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const getCourseLearningData = async (req, res, next) => {
  try {
    const data = await lmsService.getCourseLearningData(req.tenantId, req.params.id, req.user._id, req.user.role);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const getLecturePlayback = async (req, res, next) => {
  try {
    const data = await lmsService.getLecturePlayback(
      req.tenantId,
      req.params.courseId,
      req.params.lectureId,
      req.user?._id,
      req.user?.role
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const updateLectureProgress = async (req, res, next) => {
  try {
    const courseId = req.body.courseId || req.params.courseId;
    const lectureId = req.params.lectureId;
    const { progressSeconds, durationSeconds } = req.body;
    const record = await lmsService.updateLectureProgress(
      req.tenantId,
      courseId,
      lectureId,
      req.user._id,
      progressSeconds,
      durationSeconds
    );
    res.json({ success: true, data: record });
  } catch (e) {
    next(e);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// COURSE BUILDER CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

const addModule = async (req, res, next) => {
  try {
    const mod = await lmsService.addModule(req.tenantId, req.params.id, req.body, req.user._id);
    res.status(201).json({ success: true, data: mod });
  } catch (e) { next(e); }
};

const updateModule = async (req, res, next) => {
  try {
    const mod = await lmsService.updateModule(req.tenantId, req.params.id, req.params.moduleId, req.body, req.user._id);
    res.json({ success: true, data: mod });
  } catch (e) { next(e); }
};

const deleteModule = async (req, res, next) => {
  try {
    const result = await lmsService.deleteModule(req.tenantId, req.params.id, req.params.moduleId, req.user._id);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

const addLecture = async (req, res, next) => {
  try {
    const lec = await lmsService.addLecture(req.tenantId, req.params.id, req.params.moduleId, req.body, req.user._id);
    res.status(201).json({ success: true, data: lec });
  } catch (e) { next(e); }
};

const updateLecture = async (req, res, next) => {
  try {
    const lec = await lmsService.updateLecture(req.tenantId, req.params.id, req.params.moduleId, req.params.lectureId, req.body, req.user._id);
    res.json({ success: true, data: lec });
  } catch (e) { next(e); }
};

const deleteLecture = async (req, res, next) => {
  try {
    const result = await lmsService.deleteLecture(req.tenantId, req.params.id, req.params.moduleId, req.params.lectureId, req.user._id);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

const uploadLectureVideo = async (req, res, next) => {
  try {
    const videoData = await lmsService.uploadLectureVideo(req.file);
    res.json({ success: true, data: videoData });
  } catch (e) { next(e); }
};

// ══════════════════════════════════════════════════════════════════════════════
// EXISTING COURSES & ENROLLMENT CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

const getCourses = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await lmsService.getCourses(
        req.tenantId,
        req.userId || req.user?._id,
        req.user.role
      )
    });
  } catch (e) {
    next(e);
  }
};

const getCourse = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await lmsService.getCourseById(req.tenantId, req.params.id, req.user._id, req.user.role)
    });
  } catch (e) {
    next(e);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const c = await lmsService.createCourse(req.tenantId, req.body, req.user._id);
    res.status(201).json({ success: true, data: c });
  } catch (error) {
    if (error.errors && Array.isArray(error.errors)) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: error.errors
      });
    }
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await lmsService.updateCourse(req.tenantId, req.params.id, req.body, req.user._id, req.user.role)
    });
  } catch (e) {
    next(e);
  }
};

const saveDraft = async (req, res, next) => {
  try {
    const course = await lmsService.saveDraft(
      req.tenantId,
      req.params.id,
      req.body,
      req.user._id
    );
    res.json({ success: true, data: course });
  } catch (e) {
    next(e);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    await lmsService.deleteCourse(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, message: 'Course deleted.' });
  } catch (e) {
    next(e);
  }
};

const enrollStudent = async (req, res, next) => {
  try {
    const course = await lmsService.enrollStudent(req.tenantId, req.params.id, req.body.studentId, req.user._id);
    res.json({ success: true, message: 'Student enrolled.', data: course });
  } catch (e) { next(e); }
};

const unenrollStudent = async (req, res, next) => {
  try {
    const course = await lmsService.unenrollStudent(req.tenantId, req.params.id, req.params.studentId, req.user._id);
    res.json({ success: true, message: 'Student unenrolled.', data: course });
  } catch (e) { next(e); }
};

const getTenantStudents = async (req, res, next) => {
  try {
    const students = await lmsService.getTenantStudents(req.tenantId);
    res.json({ success: true, data: students });
  } catch (e) { next(e); }
};

// ── Legacy Attendance ──────────────────────────────────────────────────────────
const markAttendance = async (req, res, next) => {
  try {
    const att = await lmsService.markAttendance(req.tenantId, req.body, req.user._id);
    res.status(201).json({ success: true, data: att });
  } catch (e) { next(e); }
};

const getCourseAttendance = async (req, res, next) => {
  try {
    const att = await lmsService.getCourseAttendance(req.tenantId, req.params.id);
    res.json({ success: true, data: att });
  } catch (e) { next(e); }
};

// ── Assignments ────────────────────────────────────────────────────────────────
const createAssignment = async (req, res, next) => {
  try {
    const a = await lmsService.createAssignment(req.tenantId, req.body, req.files, req.user._id, req.user.role);
    res.status(201).json({ success: true, data: a });
  } catch (e) { next(e); }
};

const updateAssignment = async (req, res, next) => {
  try {
    const a = await lmsService.updateAssignment(req.tenantId, req.params.id, req.body, req.user._id, req.user.role);
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

const deleteAssignment = async (req, res, next) => {
  try {
    await lmsService.deleteAssignment(req.tenantId, req.params.id, req.user._id, req.user.role);
    res.json({ success: true, message: 'Assignment deleted.' });
  } catch (e) { next(e); }
};

const submitAssignment = async (req, res, next) => {
  try {
    const a = await lmsService.submitAssignment(req.tenantId, req.params.id, req.file, req.user._id);
    res.json({ success: true, message: 'Assignment submitted.', data: a });
  } catch (e) { next(e); }
};

const getCourseAssignments = async (req, res, next) => {
  try {
    const a = await lmsService.getCourseAssignments(req.tenantId, req.params.courseId, req.user._id, req.user.role);
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

// ── Sessions ───────────────────────────────────────────────────────────────────
const createSession = async (req, res, next) => {
  try {
    const s = await lmsService.createSession(req.tenantId, req.body, req.files, req.user._id);
    res.status(201).json({ success: true, data: s });
  } catch (e) { next(e); }
};

const updateSession = async (req, res, next) => {
  try {
    const s = await lmsService.updateSession(req.tenantId, req.params.id, req.body, req.user._id);
    res.json({ success: true, data: s });
  } catch (e) { next(e); }
};

const getCourseSessions = async (req, res, next) => {
  try {
    const s = await lmsService.getCourseSessions(req.tenantId, req.params.courseId, req.user._id, req.user.role);
    res.json({ success: true, data: s });
  } catch (e) { next(e); }
};

const toggleSession = async (req, res, next) => {
  try {
    const s = await lmsService.toggleSession(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, data: s });
  } catch (e) { next(e); }
};

const getSessionAttendance = async (req, res, next) => {
  try {
    const a = await lmsService.getSessionAttendance(req.tenantId, req.params.id);
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

const overrideAttendance = async (req, res, next) => {
  try {
    const a = await lmsService.overrideAttendance(req.tenantId, req.params.id, req.params.studentId, req.body.status, req.user._id);
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

const markSelfAttendance = async (req, res, next) => {
  try {
    const a = await lmsService.markSelfAttendance(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, message: 'Attendance marked.', data: a });
  } catch (e) { next(e); }
};

const getMyAttendanceSummary = async (req, res, next) => {
  try {
    const a = await lmsService.getMyAttendanceSummary(req.tenantId, req.params.courseId, req.user._id);
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

// ── LMS Documents ──────────────────────────────────────────────────────────────
const uploadCourseDocument = async (req, res, next) => {
  try {
    const doc = await lmsService.uploadCourseDocument(req.tenantId, req.params.courseId, req.file, req.body, req.user._id);
    res.status(201).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

const getCourseDocuments = async (req, res, next) => {
  try {
    const docs = await lmsService.getCourseDocuments(req.tenantId, req.params.courseId, req.user.role);
    res.json({ success: true, data: docs });
  } catch (e) { next(e); }
};

const deleteCourseDocument = async (req, res, next) => {
  try {
    await lmsService.deleteCourseDocument(req.tenantId, req.params.id);
    res.json({ success: true, message: 'Document deleted.' });
  } catch (e) { next(e); }
};

const getCourseDocumentAccess = async (req, res, next) => {
  try {
    const doc = await lmsService.getLmsDocumentById(req.tenantId, req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    proxyDownload(doc.fileUrl, doc.title || 'document', res, next);
  } catch (e) { next(e); }
};

// ── Quizzes & Grading ──────────────────────────────────────────────────────────
const gradeSubmission = async (req, res, next) => {
  try {
    const sub = await lmsService.gradeSubmission(req.tenantId, req.params.assignmentId, req.params.studentId, req.body.grade, req.body.feedback, req.user._id);
    res.json({ success: true, message: 'Submission graded.', data: sub });
  } catch (e) { next(e); }
};

const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const subs = await lmsService.getAssignmentSubmissions(req.tenantId, req.params.id);
    res.json({ success: true, data: subs });
  } catch (e) { next(e); }
};

const getMySubmission = async (req, res, next) => {
  try {
    const sub = await lmsService.getMySubmission(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, data: sub });
  } catch (e) { next(e); }
};

const createQuiz = async (req, res, next) => {
  try {
    const q = await lmsService.createQuiz(req.tenantId, { ...req.body, courseId: req.params.courseId }, req.user._id);
    res.status(201).json({ success: true, data: q });
  } catch (e) { next(e); }
};

const updateQuiz = async (req, res, next) => {
  try {
    const q = await lmsService.updateQuiz(req.tenantId, req.params.id, req.body);
    res.json({ success: true, data: q });
  } catch (e) { next(e); }
};

const getCourseQuizzes = async (req, res, next) => {
  try {
    const q = await lmsService.getCourseQuizzes(req.tenantId, req.params.courseId, req.user._id, req.user.role);
    res.json({ success: true, data: q });
  } catch (e) { next(e); }
};

const addQuizQuestion = async (req, res, next) => {
  try {
    const q = await lmsService.addQuizQuestion(req.tenantId, req.params.id, req.body);
    res.status(201).json({ success: true, data: q });
  } catch (e) { next(e); }
};

const getQuizQuestions = async (req, res, next) => {
  try {
    const q = await lmsService.getQuizQuestions(req.tenantId, req.params.id);
    res.json({ success: true, data: q });
  } catch (e) { next(e); }
};

const updateQuizQuestion = async (req, res, next) => {
  try {
    const q = await lmsService.updateQuizQuestion(req.tenantId, req.params.id, req.body);
    res.json({ success: true, data: q });
  } catch (e) { next(e); }
};

const publishQuiz = async (req, res, next) => {
  try {
    const q = await lmsService.publishQuiz(req.tenantId, req.params.id);
    res.json({ success: true, data: q });
  } catch (e) { next(e); }
};

const startQuizAttempt = async (req, res, next) => {
  try {
    const a = await lmsService.startQuizAttempt(req.tenantId, req.params.id, req.user._id);
    res.status(201).json({ success: true, data: a });
  } catch (e) { next(e); }
};

const submitQuizAttempt = async (req, res, next) => {
  try {
    const a = await lmsService.submitQuizAttempt(req.tenantId, req.params.id, req.body.answers, req.user._id);
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

const getQuizResults = async (req, res, next) => {
  try {
    const r = await lmsService.getQuizResults(req.tenantId, req.params.id);
    res.json({ success: true, data: r });
  } catch (e) { next(e); }
};

const getMyQuizAttempts = async (req, res, next) => {
  try {
    const a = await lmsService.getMyQuizAttempts(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

const getCoursePerformance = async (req, res, next) => {
  try {
    const p = await lmsService.getCoursePerformance(req.tenantId, req.params.courseId);
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
};

const getMyPerformance = async (req, res, next) => {
  try {
    const p = await lmsService.getMyPerformance(req.tenantId, req.params.courseId, req.user._id);
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
};

// ── Certificates ───────────────────────────────────────────────────────────────
const generateCertificate = async (req, res, next) => {
  try {
    const c = await lmsService.generateCertificate(req.tenantId, req.params.courseId, req.params.studentId);
    res.status(201).json({ success: true, data: c });
  } catch (e) { next(e); }
};

const generateAllCertificates = async (req, res, next) => {
  try {
    const c = await lmsService.generateAllCertificates(req.tenantId, req.params.courseId);
    res.json({ success: true, data: c });
  } catch (e) { next(e); }
};

const getCourseCertificates = async (req, res, next) => {
  try {
    const c = await lmsService.getCourseCertificates(req.tenantId, req.params.courseId);
    res.json({ success: true, data: c });
  } catch (e) { next(e); }
};

const getMyCertificates = async (req, res, next) => {
  try {
    const c = await lmsService.getMyCertificates(req.tenantId, req.user._id);
    res.json({ success: true, data: c });
  } catch (e) { next(e); }
};

const verifyCertificate = async (req, res, next) => {
  try {
    const c = await lmsService.verifyCertificate(req.params.code);
    res.json({ success: true, data: c });
  } catch (e) { next(e); }
};

const getCertificatePdfPublic = async (req, res, next) => {
  try {
    const cert = await lmsService.verifyCertificate(req.params.code);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    proxyDownload(cert.fileUrl, `Certificate_${cert.certificateNumber}.pdf`, res, next);
  } catch (e) { next(e); }
};

const getCertificateAccess = async (req, res, next) => {
  try {
    const cert = await lmsService.getCertificateById(req.tenantId, req.params.id, req.user._id, req.user.role);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    proxyDownload(cert.fileUrl, `Certificate_${cert.certificateNumber}.pdf`, res, next);
  } catch (e) { next(e); }
};

const signFileUrl = async (req, res, next) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) return res.status(400).json({ success: false, message: 'fileUrl is required.' });
    res.json({ success: true, data: { signedUrl: fileUrl } });
  } catch (e) { next(e); }
};

const getCertificateTemplate = async (req, res, next) => {
  try {
    const data = await lmsService.getCertificateTemplate(req.tenantId, req.params.courseId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const saveCertificateTemplate = async (req, res, next) => {
  try {
    const data = await lmsService.saveCertificateTemplate(req.tenantId, req.params.courseId, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

// ── Admin Controllers ──────────────────────────────────────────────────────────
const getAdminStats = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminStats(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminUsers(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const data = await lmsService.updateUserRole(req.tenantId, req.params.id, req.body.role, req.user._id.toString());
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const deactivateUser = async (req, res, next) => {
  try {
    const data = await lmsService.deactivateUser(req.tenantId, req.params.id, req.user._id.toString());
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const activateUser = async (req, res, next) => {
  try {
    const data = await lmsService.activateUser(req.tenantId, req.params.id, req.user._id.toString());
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const deleteUser = async (req, res, next) => {
  try {
    const data = await lmsService.deleteUser(req.tenantId, req.params.id, req.user._id.toString());
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const approveUser = async (req, res, next) => {
  try {
    const data = await lmsService.approveUser(req.tenantId, req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const getAdminCourses = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminCourses(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const deleteAdminCourse = async (req, res, next) => {
  try {
    const data = await lmsService.deleteAdminCourse(req.tenantId, req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const getAdminCertificates = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminCertificates(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const revokeCertificate = async (req, res, next) => {
  try {
    const data = await lmsService.revokeCertificate(req.tenantId, req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

module.exports = {
  // Public Catalog
  getPublicCourses,
  getPublicCourseBySlug,
  getPublicCategories,

  // Enrollment & Registration
  enrollFreeCourse,
  registerPaidCourse,
  getRegistrationStatus,

  // Admin Registrations
  getAdminRegistrations,
  approveRegistration,
  rejectRegistration,

  // Student Dashboard & Classroom
  getStudentEnrolledCourses,
  getStudentContinueLearning,
  getCourseLearningData,
  getLecturePlayback,
  updateLectureProgress,

  // Course Builder
  addModule,
  updateModule,
  deleteModule,
  addLecture,
  updateLecture,
  deleteLecture,
  uploadLectureVideo,

  // Existing Courses
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  saveDraft,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
  getTenantStudents,

  // Existing LMS
  markAttendance,
  getCourseAttendance,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getCourseAssignments,
  createSession,
  updateSession,
  getCourseSessions,
  toggleSession,
  getSessionAttendance,
  overrideAttendance,
  markSelfAttendance,
  getMyAttendanceSummary,
  uploadCourseDocument,
  getCourseDocuments,
  deleteCourseDocument,
  getCourseDocumentAccess,
  gradeSubmission,
  getAssignmentSubmissions,
  getMySubmission,
  createQuiz,
  updateQuiz,
  getCourseQuizzes,
  addQuizQuestion,
  getQuizQuestions,
  updateQuizQuestion,
  publishQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizResults,
  getMyQuizAttempts,
  getCoursePerformance,
  getMyPerformance,
  generateCertificate,
  generateAllCertificates,
  getCourseCertificates,
  getMyCertificates,
  verifyCertificate,
  getCertificatePdfPublic,
  getCertificateAccess,
  signFileUrl,
  getCertificateTemplate,
  saveCertificateTemplate,

  // Admin Dashboard
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser,
  approveUser,
  getAdminCourses,
  deleteAdminCourse,
  getAdminCertificates,
  revokeCertificate,
};
