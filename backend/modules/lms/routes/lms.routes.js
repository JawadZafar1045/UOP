const express = require('express');
const router  = express.Router();
const { protect }         = require('../../shared/middlewares/auth.middleware');
const { authorize }       = require('../../shared/middlewares/rbac.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const { upload } = require('../../documents/middlewares/upload.middleware');
const ctrl   = require('../controllers/lms.controller');

// ── Public certificate verification (no auth) ──────────────────────────────────
router.get('/certificates/verify/:code', ctrl.verifyCertificate);

// All routes below require a valid JWT + tenantId
router.use(protect, tenantIsolation);

// ── Courses ────────────────────────────────────────────────────────────────────
router.get('/courses',        authorize('admin', 'teacher', 'student', 'hr'), ctrl.getCourses);
router.get('/courses/:id',    authorize('admin', 'teacher', 'student', 'hr'), ctrl.getCourse);
router.post('/courses',       authorize('admin', 'teacher'),                  ctrl.createCourse);
router.put('/courses/:id',    authorize('admin', 'teacher'),                  ctrl.updateCourse);
router.delete('/courses/:id', authorize('admin'),                             ctrl.deleteCourse);

// ── Enrollment ─────────────────────────────────────────────────────────────────
router.post('/courses/:id/enroll', authorize('admin', 'teacher', 'hr'), ctrl.enrollStudent);

// ── Legacy Attendance ──────────────────────────────────────────────────────────
router.post('/attendance',              authorize('admin', 'teacher'),                  ctrl.markAttendance);
router.get('/courses/:id/attendance',   authorize('admin', 'teacher'),                  ctrl.getCourseAttendance);

// ── Assignments ────────────────────────────────────────────────────────────────
router.post('/assignments',             authorize('admin', 'teacher'), upload.array('materials', 5), ctrl.createAssignment);
router.get('/courses/:courseId/assignments', authorize('admin', 'teacher', 'student'), ctrl.getCourseAssignments);
router.post('/assignments/:id/submit',  authorize('student'), upload.single('file'), ctrl.submitAssignment);

// ── Sessions ───────────────────────────────────────────────────────────────────
router.post('/courses/:courseId/sessions',                  authorize('admin', 'teacher'), upload.array('materials', 5),  ctrl.createSession);
router.get('/courses/:courseId/sessions',                   authorize('admin', 'teacher', 'student'),          ctrl.getCourseSessions);
router.patch('/sessions/:id/toggle',                        authorize('admin', 'teacher'),                     ctrl.toggleSession);
router.get('/sessions/:id/attendance',                      authorize('admin', 'teacher'),                     ctrl.getSessionAttendance);
router.patch('/sessions/:id/attendance/:studentId',         authorize('admin', 'teacher'),                     ctrl.overrideAttendance);

// ── Student Self-Mark ──────────────────────────────────────────────────────────
router.post('/sessions/:id/attend',                         authorize('student'),                              ctrl.markSelfAttendance);
router.get('/courses/:courseId/attendance/mine',            authorize('student'),                              ctrl.getMyAttendanceSummary);

// ── LMS Documents ──────────────────────────────────────────────────────────────
router.post('/courses/:courseId/documents',   authorize('admin', 'teacher'), upload.single('file'),           ctrl.uploadCourseDocument);
router.get('/courses/:courseId/documents',    authorize('admin', 'teacher', 'student'),                       ctrl.getCourseDocuments);
router.delete('/documents/:id',               authorize('admin', 'teacher'),                                  ctrl.deleteCourseDocument);
router.get('/documents/:id/access',           authorize('admin', 'teacher', 'student'),                       ctrl.getCourseDocumentAccess);

// ── Assignment Grading ─────────────────────────────────────────────────────────
router.patch('/submissions/:assignmentId/grade/:studentId', authorize('admin', 'teacher'),                    ctrl.gradeSubmission);
router.get('/assignments/:id/submissions',                  authorize('admin', 'teacher'),                    ctrl.getAssignmentSubmissions);
router.get('/assignments/:id/submissions/mine',             authorize('student'),                             ctrl.getMySubmission);

// ── Quizzes ────────────────────────────────────────────────────────────────────
router.post('/courses/:courseId/quizzes',     authorize('admin', 'teacher'),                                  ctrl.createQuiz);
router.get('/courses/:courseId/quizzes',      authorize('admin', 'teacher', 'student'),                       ctrl.getCourseQuizzes);
router.post('/quizzes/:id/questions',         authorize('admin', 'teacher'),                                  ctrl.addQuizQuestion);
router.patch('/quizzes/:id/publish',          authorize('admin', 'teacher'),                                  ctrl.publishQuiz);
router.post('/quizzes/:id/start',             authorize('student'),                                           ctrl.startQuizAttempt);
router.post('/quizzes/:id/submit',            authorize('student'),                                           ctrl.submitQuizAttempt);
router.get('/quizzes/:id/results',            authorize('admin', 'teacher'),                                  ctrl.getQuizResults);
router.get('/quizzes/:id/attempts/mine',      authorize('student'),                                           ctrl.getMyQuizAttempts);

// ── Performance ────────────────────────────────────────────────────────────────
router.get('/courses/:courseId/performance',       authorize('admin', 'teacher'),                             ctrl.getCoursePerformance);
router.get('/courses/:courseId/performance/mine',  authorize('student'),                                      ctrl.getMyPerformance);

// ── Certificates ───────────────────────────────────────────────────────────────
router.post('/courses/:courseId/certificates/generate/:studentId', authorize('admin', 'teacher'),             ctrl.generateCertificate);
router.post('/courses/:courseId/certificates/generate-all',        authorize('admin', 'teacher'),             ctrl.generateAllCertificates);
router.get('/courses/:courseId/certificates',                      authorize('admin', 'teacher'),             ctrl.getCourseCertificates);
router.get('/certificates/mine',                                   authorize('student'),                      ctrl.getMyCertificates);

router.post('/files/sign', authorize('admin', 'teacher', 'student'), ctrl.signFileUrl);

module.exports = router;
