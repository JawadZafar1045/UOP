const Course = require('../models/course.model');
const Attendance = require('../models/attendance.model');
const Assignment = require('../models/assignment.model');
const { logActivity } = require('../../shared/services/activityLogger.service');

// ── Courses ────────────────────────────────────────────────────────────────────
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
  if (!course) throw Object.assign(new Error('Course not found.'), { statusCode: 404 });
  return course;
};

const createCourse = async (tenantId, data, userId) => {
  const course = await Course.create({ ...data, tenantId });
  await logActivity({ userId, tenantId, action: 'CREATE_COURSE', entityType: 'Course', entityId: course._id });
  return course;
};

const updateCourse = async (tenantId, courseId, data, userId) => {
  const course = await Course.findOneAndUpdate({ _id: courseId, tenantId }, data, { new: true, runValidators: true });
  if (!course) throw Object.assign(new Error('Course not found.'), { statusCode: 404 });
  await logActivity({ userId, tenantId, action: 'UPDATE_COURSE', entityType: 'Course', entityId: courseId });
  return course;
};

const deleteCourse = async (tenantId, courseId, userId) => {
  const course = await Course.findOneAndDelete({ _id: courseId, tenantId });
  if (!course) throw Object.assign(new Error('Course not found.'), { statusCode: 404 });
  await logActivity({ userId, tenantId, action: 'DELETE_COURSE', entityType: 'Course', entityId: courseId });
};

// ── Enrollment ─────────────────────────────────────────────────────────────────
const enrollStudent = async (tenantId, courseId, studentId, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw Object.assign(new Error('Course not found.'), { statusCode: 404 });

  if (course.enrolledStudents.includes(studentId)) {
    throw Object.assign(new Error('Student already enrolled.'), { statusCode: 409 });
  }

  course.enrolledStudents.push(studentId);
  await course.save();
  await logActivity({ userId, tenantId, action: 'ENROLL_STUDENT', entityType: 'Course', entityId: courseId, meta: { studentId } });
  return course;
};

// ── Attendance ─────────────────────────────────────────────────────────────────
const markAttendance = async (tenantId, attendanceData, userId) => {
  const record = await Attendance.create({ tenantId, ...attendanceData });
  await logActivity({ userId, tenantId, action: 'MARK_ATTENDANCE', entityType: 'Attendance', entityId: record._id });
  return record;
};

const getCourseAttendance = async (tenantId, courseId) => {
  return Attendance.find({ tenantId, courseId })
    .populate('studentId', 'name email')
    .sort({ date: -1 });
};

// ── Assignments ────────────────────────────────────────────────────────────────
const createAssignment = async (tenantId, data, userId) => {
  const assignment = await Assignment.create({ tenantId, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_ASSIGNMENT', entityType: 'Assignment', entityId: assignment._id });
  return assignment;
};

const submitAssignment = async (tenantId, assignmentId, studentId, submissionData) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw Object.assign(new Error('Assignment not found.'), { statusCode: 404 });

  assignment.submissions.push({ studentId, ...submissionData });
  await assignment.save();
  return assignment;
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, enrollStudent, markAttendance, getCourseAttendance, createAssignment, submitAssignment };
