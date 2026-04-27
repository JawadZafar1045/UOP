const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const ctrl = require('../controllers/lms.controller');

router.use(protect, tenantIsolation);

// Courses
router.get('/courses',        authorize('admin', 'teacher', 'student', 'hr'), ctrl.getCourses);
router.get('/courses/:id',    authorize('admin', 'teacher', 'student', 'hr'), ctrl.getCourse);
router.post('/courses',       authorize('admin', 'teacher'),                  ctrl.createCourse);
router.put('/courses/:id',    authorize('admin', 'teacher'),                  ctrl.updateCourse);
router.delete('/courses/:id', authorize('admin'),                             ctrl.deleteCourse);

// Enrollment
router.post('/courses/:id/enroll', authorize('admin', 'teacher', 'hr'), ctrl.enrollStudent);

// Attendance
router.post('/attendance',          authorize('admin', 'teacher'),                  ctrl.markAttendance);
router.get('/courses/:id/attendance', authorize('admin', 'teacher'),               ctrl.getCourseAttendance);

// Assignments
router.post('/assignments',           authorize('admin', 'teacher'),               ctrl.createAssignment);
router.post('/assignments/:id/submit', authorize('student'),                        ctrl.submitAssignment);

module.exports = router;
