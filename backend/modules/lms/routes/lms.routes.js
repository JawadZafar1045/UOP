const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const { upload } = require('../../documents/middlewares/upload.middleware');
const ctrl   = require('../controllers/lms.controller');

const { validateResult } = require('../../shared/middlewares/validation.middleware');
const val = require('../validators/lms.validator');

// ── Rate limiter: file signing endpoint ────────────────────────────────────────
const signLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20,             // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many signing requests, please try again later'
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (No Auth Required)
// ══════════════════════════════════════════════════════════════════════════════
router.get('/public/courses', ctrl.getPublicCourses);
router.get('/public/courses/:slug', ctrl.getPublicCourseBySlug);
router.get('/public/categories', ctrl.getPublicCategories);
router.get('/courses/:courseId/lectures/:lectureId/preview', ctrl.getLecturePlayback);

// Public certificate verification
router.get('/certificates/verify/:code', val.verifyCertificateVal, validateResult, ctrl.verifyCertificate);
router.get('/certificates/verify/:code/pdf', ctrl.getCertificatePdfPublic);

// ══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Require Valid JWT + tenantId)
// ══════════════════════════════════════════════════════════════════════════════
router.use(protect, tenantIsolation);

// ── Student Learning & Dashboard ───────────────────────────────────────────────
router.get('/student/courses', authorize('student', 'teacher', 'admin'), ctrl.getStudentEnrolledCourses);
router.get('/student/continue-learning', authorize('student', 'teacher', 'admin'), ctrl.getStudentContinueLearning);
router.get('/courses/:id/learn', authorize('student', 'teacher', 'admin'), ctrl.getCourseLearningData);
router.get('/courses/:courseId/lectures/:lectureId/playback', authorize('student', 'teacher', 'admin'), ctrl.getLecturePlayback);
router.post('/lectures/:lectureId/progress', authorize('student', 'teacher', 'admin'), ctrl.updateLectureProgress);

// ── Course Enrollment & Paid Registration ──────────────────────────────────────
router.post('/courses/:id/enroll', val.enrollStudentVal, validateResult, authorize('student', 'teacher', 'admin'), ctrl.enrollFreeCourse);
router.post('/courses/:id/register', authorize('student', 'teacher', 'admin'), ctrl.registerPaidCourse);
router.get('/courses/:id/registration-status', authorize('student', 'teacher', 'admin'), ctrl.getRegistrationStatus);

// ── Admin Registrations Management ─────────────────────────────────────────────
router.get('/admin/registrations', authorize('admin'), ctrl.getAdminRegistrations);
router.post('/admin/registrations/:id/approve', authorize('admin'), ctrl.approveRegistration);
router.post('/admin/registrations/:id/reject', authorize('admin'), ctrl.rejectRegistration);

// ── Course Builder (Modules, Lectures, Video Upload) ───────────────────────────
router.post('/admin/courses/:id/modules', authorize('admin', 'teacher'), ctrl.addModule);
router.patch('/admin/courses/:id/modules/:moduleId', authorize('admin', 'teacher'), ctrl.updateModule);
router.delete('/admin/courses/:id/modules/:moduleId', authorize('admin', 'teacher'), ctrl.deleteModule);

router.post('/admin/courses/:id/modules/:moduleId/lectures', authorize('admin', 'teacher'), ctrl.addLecture);
router.patch('/admin/courses/:id/modules/:moduleId/lectures/:lectureId', authorize('admin', 'teacher'), ctrl.updateLecture);
router.delete('/admin/courses/:id/modules/:moduleId/lectures/:lectureId', authorize('admin', 'teacher'), ctrl.deleteLecture);

router.post('/admin/upload-video', authorize('admin', 'teacher'), upload.single('video'), ctrl.uploadLectureVideo);
router.post('/admin/upload-thumbnail', authorize('admin', 'teacher'), upload.single('thumbnail'), ctrl.uploadThumbnail);

// ── Instructors / Faculty ──────────────────────────────────────────────────────
router.get('/instructors', authorize('admin', 'teacher'), ctrl.getInstructors);

// ── Certificates ───────────────────────────────────────────────────────────────
router.get('/certificates/mine', authorize('student'), ctrl.getMyCertificates);
router.get('/certificates/:id/access', val.getCertificateAccessVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getCertificateAccess);

// ── Courses ────────────────────────────────────────────────────────────────────
router.get('/courses', authorize('admin', 'teacher', 'student'), ctrl.getCourses);
router.get('/courses/:id', val.getCourseVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getCourse);
router.post('/courses', val.createCourseVal, validateResult, authorize('admin', 'teacher'), ctrl.createCourse);
router.patch('/courses/:id', val.updateCourseVal, validateResult, authorize('admin', 'teacher'), ctrl.updateCourse);
router.patch('/courses/:id/draft', authorize('admin', 'teacher'), ctrl.saveDraft);
router.delete('/courses/:id', val.deleteCourseVal, validateResult, authorize('admin'), ctrl.deleteCourse);

// ── Legacy Enrollment & Students ───────────────────────────────────────────────
router.get('/students', authorize('admin', 'teacher'), ctrl.getTenantStudents);
router.post('/courses/:id/manual-enroll', val.enrollStudentVal, validateResult, authorize('admin', 'teacher'), ctrl.enrollStudent);
router.delete('/courses/:id/enroll/:studentId', val.unenrollStudentVal, validateResult, authorize('admin', 'teacher'), ctrl.unenrollStudent);

// ── Legacy Attendance ──────────────────────────────────────────────────────────
router.post('/attendance', val.markAttendanceVal, validateResult, authorize('admin', 'teacher'), ctrl.markAttendance);
router.get('/courses/:id/attendance', val.getCourseAttendanceVal, validateResult, authorize('admin', 'teacher'), ctrl.getCourseAttendance);

// ── Assignments ────────────────────────────────────────────────────────────────
router.post('/assignments', authorize('admin', 'teacher'), upload.array('materials', 5), val.createAssignmentVal, validateResult, ctrl.createAssignment);
router.get('/courses/:courseId/assignments', val.getCourseAssignmentsVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getCourseAssignments);
router.patch('/assignments/:id', val.updateAssignmentVal, validateResult, authorize('admin', 'teacher'), ctrl.updateAssignment);
router.delete('/assignments/:id', authorize('admin', 'teacher'), ctrl.deleteAssignment);
router.post('/assignments/:id/submit', authorize('student'), upload.single('file'), val.submitAssignmentVal, validateResult, ctrl.submitAssignment);

// ── Sessions ───────────────────────────────────────────────────────────────────
router.post('/courses/:courseId/sessions', authorize('admin', 'teacher'), upload.array('materials', 5), val.createSessionVal, validateResult, ctrl.createSession);
router.get('/courses/:courseId/sessions', val.getCourseSessionsVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getCourseSessions);
router.patch('/sessions/:id', val.updateSessionVal, validateResult, authorize('admin', 'teacher'), ctrl.updateSession);
router.patch('/sessions/:id/toggle', val.toggleSessionVal, validateResult, authorize('admin', 'teacher'), ctrl.toggleSession);
router.get('/sessions/:id/attendance', val.getSessionAttendanceVal, validateResult, authorize('admin', 'teacher'), ctrl.getSessionAttendance);
router.patch('/sessions/:id/attendance/:studentId', val.overrideAttendanceVal, validateResult, authorize('admin', 'teacher'), ctrl.overrideAttendance);

// ── Student Self-Mark ──────────────────────────────────────────────────────────
router.post('/sessions/:id/attend', val.markSelfAttendanceVal, validateResult, authorize('student'), ctrl.markSelfAttendance);
router.get('/courses/:courseId/attendance/mine', val.getMyAttendanceSummaryVal, validateResult, authorize('student'), ctrl.getMyAttendanceSummary);

// ── LMS Documents ──────────────────────────────────────────────────────────────
router.post('/courses/:courseId/documents', authorize('admin', 'teacher'), upload.single('file'), val.uploadCourseDocumentVal, validateResult, ctrl.uploadCourseDocument);
router.get('/courses/:courseId/documents', val.getCourseDocumentsVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getCourseDocuments);
router.delete('/documents/:id', val.deleteCourseDocumentVal, validateResult, authorize('admin', 'teacher'), ctrl.deleteCourseDocument);
router.get('/documents/:id/access', val.getCourseDocumentAccessVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getCourseDocumentAccess);

// ── Assignment Grading ─────────────────────────────────────────────────────────
router.patch('/submissions/:assignmentId/grade/:studentId', val.gradeSubmissionVal, validateResult, authorize('admin', 'teacher'), ctrl.gradeSubmission);
router.get('/assignments/:id/submissions', val.getAssignmentSubmissionsVal, validateResult, authorize('admin', 'teacher'), ctrl.getAssignmentSubmissions);
router.get('/assignments/:id/submissions/mine', val.getMySubmissionVal, validateResult, authorize('student'), ctrl.getMySubmission);

// ── Quizzes ────────────────────────────────────────────────────────────────────
router.post('/courses/:courseId/quizzes', val.createQuizVal, validateResult, authorize('admin', 'teacher'), ctrl.createQuiz);
router.get('/courses/:courseId/quizzes', val.getCourseQuizzesVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getCourseQuizzes);
router.patch('/quizzes/:id', val.updateQuizVal, validateResult, authorize('admin', 'teacher'), ctrl.updateQuiz);
router.get('/quizzes/:id/questions', val.getQuizResultsVal, validateResult, authorize('admin', 'teacher'), ctrl.getQuizQuestions);
router.post('/quizzes/:id/questions', val.addQuizQuestionVal, validateResult, authorize('admin', 'teacher'), ctrl.addQuizQuestion);
router.patch('/questions/:id', val.updateQuizQuestionVal, validateResult, authorize('admin', 'teacher'), ctrl.updateQuizQuestion);
router.patch('/quizzes/:id/publish', val.publishQuizVal, validateResult, authorize('admin', 'teacher'), ctrl.publishQuiz);
router.post('/quizzes/:id/start', val.startQuizAttemptVal, validateResult, authorize('student'), ctrl.startQuizAttempt);
router.post('/quizzes/:id/submit', val.submitQuizAttemptVal, validateResult, authorize('student'), ctrl.submitQuizAttempt);
router.get('/quizzes/:id/results', val.getQuizResultsVal, validateResult, authorize('admin', 'teacher'), ctrl.getQuizResults);
router.get('/quizzes/:id/attempts/mine', val.getMyQuizAttemptsVal, validateResult, authorize('student'), ctrl.getMyQuizAttempts);

// ── Performance ────────────────────────────────────────────────────────────────
router.get('/courses/:courseId/performance', val.getCoursePerformanceVal, validateResult, authorize('admin', 'teacher'), ctrl.getCoursePerformance);
router.get('/courses/:courseId/performance/mine', val.getMyPerformanceVal, validateResult, authorize('student'), ctrl.getMyPerformance);

// ── Certificates ───────────────────────────────────────────────────────────────
router.post('/courses/:courseId/certificates/generate/:studentId', val.generateCertificateVal, validateResult, authorize('admin', 'teacher'), ctrl.generateCertificate);
router.post('/courses/:courseId/certificates/generate-all', val.generateAllCertificatesVal, validateResult, authorize('admin', 'teacher'), ctrl.generateAllCertificates);
router.get('/courses/:courseId/certificates', val.getCourseCertificatesVal, validateResult, authorize('admin', 'teacher'), ctrl.getCourseCertificates);

// ── Certificate Template ───────────────────────────────────────────────────────
router.get('/courses/:courseId/certificate-template', val.getCertificateTemplateVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getCertificateTemplate);
router.post('/courses/:courseId/certificate-template', authorize('admin', 'teacher'), upload.single('logo'), val.saveCertificateTemplateVal, validateResult, ctrl.saveCertificateTemplate);

router.post('/files/sign', protect, tenantIsolation, signLimiter, val.signFileUrlVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.signFileUrl);

// ── Admin Routes ───────────────────────────────────────────────────────────────
router.get('/admin/stats', authorize('admin'), ctrl.getAdminStats);
router.get('/admin/users', authorize('admin'), ctrl.getAdminUsers);
router.patch('/admin/users/:id/approve', val.deleteCourseVal, validateResult, authorize('admin'), ctrl.approveUser);
router.patch('/admin/users/:id/role', val.deleteCourseVal, validateResult, authorize('admin'), ctrl.updateUserRole);
router.delete('/admin/users/:id', val.deleteCourseVal, validateResult, authorize('admin'), ctrl.deactivateUser);
router.patch('/admin/users/:id/activate', val.deleteCourseVal, validateResult, authorize('admin'), ctrl.activateUser);
router.delete('/admin/users/:id/hard', val.deleteCourseVal, validateResult, authorize('admin'), ctrl.deleteUser);
router.get('/admin/courses', authorize('admin'), ctrl.getAdminCourses);
router.delete('/admin/courses/:id', val.deleteCourseVal, validateResult, authorize('admin'), ctrl.deleteAdminCourse);
router.get('/admin/certificates', authorize('admin'), ctrl.getAdminCertificates);
router.patch('/admin/certificates/:id/revoke', val.deleteCourseVal, validateResult, authorize('admin'), ctrl.revokeCertificate);

module.exports = router;
