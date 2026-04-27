const lmsService = require('../services/lms.service');

// ── Courses ────────────────────────────────────────────────────────────────────
const getCourses    = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourses({ tenantId: req.tenantId, ...req.query }) }); } catch (e) { next(e); } };
const getCourse     = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseById(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const createCourse  = async (req, res, next) => { try { const c = await lmsService.createCourse(req.tenantId, req.body, req.user._id); res.status(201).json({ success: true, data: c }); } catch (e) { next(e); } };
const updateCourse  = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.updateCourse(req.tenantId, req.params.id, req.body, req.user._id) }); } catch (e) { next(e); } };
const deleteCourse  = async (req, res, next) => { try { await lmsService.deleteCourse(req.tenantId, req.params.id, req.user._id); res.json({ success: true, message: 'Course deleted.' }); } catch (e) { next(e); } };

// ── Enrollment ─────────────────────────────────────────────────────────────────
const enrollStudent = async (req, res, next) => {
  try {
    const course = await lmsService.enrollStudent(req.tenantId, req.params.id, req.body.studentId, req.user._id);
    res.json({ success: true, message: 'Student enrolled.', data: course });
  } catch (e) { next(e); }
};

// ── Attendance ─────────────────────────────────────────────────────────────────
const markAttendance    = async (req, res, next) => { try { const a = await lmsService.markAttendance(req.tenantId, req.body, req.user._id); res.status(201).json({ success: true, data: a }); } catch (e) { next(e); } };
const getCourseAttendance = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseAttendance(req.tenantId, req.params.id) }); } catch (e) { next(e); } };

// ── Assignments ────────────────────────────────────────────────────────────────
const createAssignment = async (req, res, next) => { try { const a = await lmsService.createAssignment(req.tenantId, req.body, req.user._id); res.status(201).json({ success: true, data: a }); } catch (e) { next(e); } };
const submitAssignment = async (req, res, next) => {
  try {
    const a = await lmsService.submitAssignment(req.tenantId, req.params.id, req.user._id, req.body);
    res.json({ success: true, message: 'Assignment submitted.', data: a });
  } catch (e) { next(e); }
};

module.exports = { getCourses, getCourse, createCourse, updateCourse, deleteCourse, enrollStudent, markAttendance, getCourseAttendance, createAssignment, submitAssignment };
