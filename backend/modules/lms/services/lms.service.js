const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const pLimit = require('p-limit');
const Course = require('../models/course.model');
const CourseRegistration = require('../models/courseRegistration.model');
const LectureProgress = require('../models/lectureProgress.model');
const User = require('../../auth/models/user.model');
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
const mediaService = require('../../shared/services/media/media.service');
const { uploadFile, deleteFile } = require('../../shared/services/fileService');
const { sendNotification } = require('../../shared/services/notification.service');
const { logActivity } = require('../../shared/services/activityLogger.service');
const { sendEmail } = require('../../shared/services/emailService');

// ── Helper ─────────────────────────────────────────────────────────────────────
const err = (msg, code = 400) => Object.assign(new Error(msg), { statusCode: code });

const checkOwnership = (course, userId, role) => {
  if (role === 'teacher' && course.instructor && course.instructor.toString() !== userId.toString()) {
    throw err('You do not have permission to modify this course.', 403);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// COURSES (Internal & Public)
// ══════════════════════════════════════════════════════════════════════════════
const getCourses = async (tenantId, userId, role) => {
  const filter = { tenantId };

  if (role === 'student') {
    filter.enrolledStudents = userId;    // only enrolled
  } else if (role === 'teacher') {
    filter.instructor = userId;     // only own courses
  }
  // admin: no extra filter, sees everything

  return Course.find(filter)
    .populate('instructor', 'name email avatar')
    .select('title slug description shortDescription status type price currency instructor instructorName enrolledStudents startDate endDate completionCriteria category level thumbnail duration isPublished isFeatured modules')
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
    if (!isEnrolled && course.status !== 'active' && course.status !== 'published') {
      throw err('This course is not currently active or you are not enrolled.', 403);
    }
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
    const errorObj = new Error(errors[0].message || 'Validation failed');
    errorObj.statusCode = 400;
    errorObj.errors = errors;
    throw errorObj;
  }

  // Sanitize modules if they exist in the incoming data
  if (data.modules && Array.isArray(data.modules)) {
    data.modules = data.modules
      .map(m => {
        if (typeof m === 'string') {
          return { title: m.trim(), lectures: [] };
        } else if (m && typeof m.title === 'string') {
          return {
            ...m,
            title: m.title.trim(),
            lectures: Array.isArray(m.lectures || m.lessons) ? (m.lectures || m.lessons) : []
          };
        }
        return m;
      })
      .filter(m => m && m.title);
  }

  let assignedInstructor = userId;
  let assignedInstructorName = '';

  if (data.instructor && /^[0-9a-fA-F]{24}$/.test(String(data.instructor))) {
    assignedInstructor = data.instructor;
    const instructorUser = await User.findOne({ _id: data.instructor, tenantId }).select('name');
    if (instructorUser) {
      assignedInstructorName = instructorUser.name;
    }
  } else if (userId && /^[0-9a-fA-F]{24}$/.test(String(userId))) {
    const defaultUser = await User.findOne({ _id: userId, tenantId }).select('name');
    if (defaultUser) {
      assignedInstructorName = defaultUser.name;
    }
  }

  if (data.instructorName && typeof data.instructorName === 'string' && data.instructorName.trim()) {
    assignedInstructorName = data.instructorName.trim();
  }

  const courseData = {
    ...data,
    instructor: assignedInstructor,
    instructorName: assignedInstructorName,
    tenantId
  };

  if (courseData.type === 'paid' && (!courseData.price || courseData.price <= 0)) {
    courseData.price = courseData.price || 0;
  }

  const course = await Course.create(courseData);
  await logActivity({ userId, tenantId, action: 'CREATE_COURSE', entityType: 'Course', entityId: course._id });
  return course;
};

const updateCourse = async (tenantId, courseId, data, userId, userRole) => {
  const filter = { _id: courseId, tenantId };
  if (userRole !== 'admin') filter.instructor = userId;

  const VALID_STATUSES = ['draft', 'active', 'published', 'completed', 'archived'];
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    throw new Error(
      `Invalid status '${data.status}'. ` +
      `Allowed values: ${VALID_STATUSES.join(', ')}`
    );
  }

  const ALLOWED_UPDATE_FIELDS = [
    'title', 'slug', 'description', 'shortDescription', 'startDate', 'endDate',
    'status', 'isPublished', 'isFeatured', 'completionCriteria', 'category',
    'level', 'maxStudents', 'thumbnail', 'type', 'price', 'currency',
    'instructor', 'instructorName', 'whatYouWillLearn', 'duration', 'modules', 'tags'
  ];

  const safeUpdate = {};
  ALLOWED_UPDATE_FIELDS.forEach(field => {
    if (data[field] !== undefined) {
      safeUpdate[field] = data[field];
    }
  });

  if (safeUpdate.instructor) {
    if (/^[0-9a-fA-F]{24}$/.test(String(safeUpdate.instructor))) {
      const instructorUser = await User.findOne({ _id: safeUpdate.instructor, tenantId }).select('name');
      if (instructorUser) {
        safeUpdate.instructorName = instructorUser.name;
      }
    }
  } else if (safeUpdate.instructor === '' || safeUpdate.instructor === null) {
    safeUpdate.instructor = null;
    safeUpdate.instructorName = '';
  }

  if (safeUpdate.status === 'published' || safeUpdate.status === 'active') {
    safeUpdate.isPublished = true;
  } else if (safeUpdate.status === 'draft') {
    safeUpdate.isPublished = false;
  }

  const updated = await Course.findOneAndUpdate(
    filter,
    { $set: safeUpdate },
    { new: true, runValidators: true }
  ).populate('instructor', 'name email role avatar');
  if (!updated) throw err('Course not found or you do not have permission to edit it.', 404);
  await logActivity({ userId, tenantId, action: 'UPDATE_COURSE', entityType: 'Course', entityId: courseId });
  return updated;
};

const saveDraft = async (tenantId, courseId, data, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw new Error('Course not found');

  checkOwnership(course, userId, 'teacher');

  const draftFields = {};
  if (data.title) draftFields.title = data.title.trim();
  if (data.description !== undefined) draftFields.description = data.description;
  if (data.shortDescription !== undefined) draftFields.shortDescription = data.shortDescription;
  if (data.startDate) draftFields.startDate = data.startDate;
  if (data.endDate) draftFields.endDate = data.endDate;
  if (data.category) draftFields.category = data.category;
  if (data.type) draftFields.type = data.type;
  if (data.price !== undefined) draftFields.price = data.price;
  if (data.thumbnail) draftFields.thumbnail = data.thumbnail;
  if (data.completionCriteria) draftFields.completionCriteria = data.completionCriteria;

  draftFields.status = 'draft';
  draftFields.isPublished = false;

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

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC COURSE DISCOVERY (Coursera/Udemy style)
// ══════════════════════════════════════════════════════════════════════════════

const getPublicCourses = async (tenantId, query = {}) => {
  const filter = {
    $or: [{ isPublished: true }, { status: 'published' }, { status: 'active' }]
  };

  if (tenantId) {
    filter.tenantId = tenantId;
  }

  if (query.type && (query.type === 'free' || query.type === 'paid')) {
    filter.type = query.type;
  }

  if (query.category && query.category !== 'All') {
    filter.category = new RegExp(`^${query.category}$`, 'i');
  }

  if (query.level && query.level !== 'All') {
    filter.level = new RegExp(`^${query.level}$`, 'i');
  }

  if (query.featured === 'true' || query.featured === true) {
    filter.isFeatured = true;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { category: searchRegex }
      ]
    });
  }

  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('instructor', 'name email avatar')
      .select('title slug description shortDescription thumbnail duration category level type price currency instructor instructorName modules isFeatured tags createdAt updatedAt')
      .sort(query.sort === 'price-asc' ? { price: 1 } : query.sort === 'price-desc' ? { price: -1 } : { isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter)
  ]);

  const shapedCourses = courses.map(c => {
    let moduleCount = (c.modules || []).length;
    let lectureCount = 0;
    let totalDuration = 0;

    (c.modules || []).forEach(m => {
      const lectures = m.lectures || m.lessons || [];
      lectureCount += lectures.length;
      lectures.forEach(l => {
        totalDuration += (l.duration || (l.video && l.video.duration) || 0);
      });
    });

    return {
      _id: c._id,
      title: c.title,
      slug: c.slug || String(c._id),
      description: c.description || '',
      shortDescription: c.shortDescription || c.description?.substring(0, 140) || '',
      thumbnail: c.thumbnail || '',
      category: c.category || 'General',
      level: c.level || 'All levels',
      type: (c.type === 'paid' || (c.price && c.price > 0)) ? 'paid' : 'free',
      price: (c.type === 'paid' || (c.price && c.price > 0)) ? (c.price || 0) : 0,
      currency: c.currency || 'PKR',
      instructor: c.instructor?.name || c.instructorName || '',
      instructorAvatar: c.instructor?.avatar || '',
      isFeatured: !!c.isFeatured,
      tags: Array.isArray(c.tags) ? c.tags : [],
      moduleCount,
      lectureCount,
      totalDuration: c.duration || (totalDuration > 0 ? `${Math.round(totalDuration / 60)} mins` : 'Self-paced'),
      totalDurationSeconds: totalDuration,
      createdAt: c.createdAt
    };
  });

  return {
    courses: shapedCourses,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const getPublicCourseBySlug = async (tenantId, slugOrId) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);
  const filter = {
    $or: [
      { slug: slugOrId.toLowerCase() },
      ...(isObjectId ? [{ _id: slugOrId }] : [])
    ]
  };

  if (tenantId) filter.tenantId = tenantId;

  const course = await Course.findOne(filter)
    .populate('instructor', 'name email avatar bio')
    .lean();

  if (!course) throw err('Course not found.', 404);

  let lectureCount = 0;
  let totalDurationSeconds = 0;

  // Sanitize curriculum outline: do NOT leak protected video URLs
  const modules = (course.modules || []).map((m, mIdx) => {
    const rawLectures = m.lectures || m.lessons || [];
    const lectures = rawLectures.map((l, lIdx) => {
      lectureCount++;
      const duration = l.duration || (l.video && l.video.duration) || 0;
      totalDurationSeconds += duration;

      return {
        _id: l._id || `${mIdx}-${lIdx}`,
        title: l.title,
        description: l.description || '',
        order: l.order ?? lIdx,
        duration,
        durationFormatted: duration > 0 ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : '0:00',
        isPreview: !!l.isPreview,
        contentType: l.contentType || 'video',
        // Only provide preview URL if explicitly marked isPreview
        previewUrl: l.isPreview ? (l.video?.playbackUrl || l.contentUrl || '') : null
      };
    });

    return {
      _id: m._id || String(mIdx),
      title: m.title,
      description: m.description || '',
      order: m.order ?? mIdx,
      lectureCount: lectures.length,
      lectures
    };
  });

  return {
    _id: course._id,
    title: course.title,
    slug: course.slug || String(course._id),
    description: course.description || '',
    shortDescription: course.shortDescription || '',
    thumbnail: course.thumbnail || '',
    category: course.category || 'General',
    level: course.level || 'All levels',
    type: (course.type === 'paid' || (course.price && course.price > 0)) ? 'paid' : 'free',
    price: (course.type === 'paid' || (course.price && course.price > 0)) ? (course.price || 0) : 0,
    currency: course.currency || 'PKR',
    duration: course.duration || (totalDurationSeconds > 0 ? `${Math.round(totalDurationSeconds / 60)} mins` : 'Self-paced'),
    totalDurationSeconds,
    moduleCount: modules.length,
    lectureCount,
    instructor: {
      name: course.instructor?.name || course.instructorName || 'CSZone Team',
      email: course.instructor?.email,
      avatar: course.instructor?.avatar,
      bio: course.instructor?.bio || 'CSZone Instructor'
    },
    whatYouWillLearn: Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : [],
    tags: Array.isArray(course.tags) ? course.tags : [],
    modules,
    isPublished: course.isPublished,
    isFeatured: course.isFeatured,
    enrolledCount: (course.enrolledStudents || course.students || []).length
  };
};

const getPublicCategories = async (tenantId) => {
  const filter = {
    $or: [{ isPublished: true }, { status: 'published' }, { status: 'active' }]
  };
  if (tenantId) filter.tenantId = tenantId;

  const categories = await Course.distinct('category', filter);
  const defaults = ['Cyber Security', 'Web Development', 'Mobile Development', 'DevOps', 'Artificial Intelligence'];
  const allCategories = Array.from(new Set([...defaults, ...categories.filter(Boolean)]));
  return allCategories;
};

// ══════════════════════════════════════════════════════════════════════════════
// ENROLLMENT & REGISTRATION FLOWS (Free vs Paid)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Free course enrollment (or direct enrollment by admin/teacher).
 */
const enrollFreeCourse = async (tenantId, courseId, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const student = await User.findOne({ _id: userId, tenantId });
  if (!student) throw err('User not found.', 404);

  // If already enrolled, return success idempotently
  const isEnrolled = (course.enrolledStudents || []).map(String).includes(String(userId));
  if (isEnrolled) {
    return {
      success: true,
      enrolled: true,
      message: 'You are already enrolled in this course.',
      course: { _id: course._id, title: course.title, slug: course.slug }
    };
  }

  // If course is paid, student cannot self-enroll directly without approval
  if (course.type === 'paid') {
    throw err('This is a paid course. Please submit a registration for approval.', 400);
  }

  course.enrolledStudents.push(userId);
  await course.save();

  await logActivity({
    userId,
    tenantId,
    action: 'ENROLL_STUDENT_FREE',
    entityType: 'Course',
    entityId: course._id,
    meta: { courseTitle: course.title }
  });

  return {
    success: true,
    enrolled: true,
    message: 'Successfully enrolled in course.',
    course: { _id: course._id, title: course.title, slug: course.slug }
  };
};

/**
 * Paid course registration application.
 */
const registerPaidCourse = async (tenantId, courseId, userId, data = {}) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const student = await User.findOne({ _id: userId, tenantId });
  if (!student) throw err('User not found.', 404);

  // Check if already enrolled
  const isEnrolled = (course.enrolledStudents || []).map(String).includes(String(userId));
  if (isEnrolled) {
    return {
      success: true,
      status: 'enrolled',
      message: 'You already have full access to this course.',
      course: { _id: course._id, title: course.title, slug: course.slug }
    };
  }

  // Check existing registrations
  const existingPending = await CourseRegistration.findOne({
    tenantId,
    courseId,
    userId,
    status: 'pending'
  });

  if (existingPending) {
    return {
      success: true,
      status: 'pending',
      message: 'Your registration is currently under review by CSZone.',
      registration: existingPending
    };
  }

  // Create new registration
  const registration = await CourseRegistration.create({
    tenantId,
    courseId,
    userId,
    status: 'pending',
    paymentReference: data.paymentReference || '',
    notes: data.notes || ''
  });

  // Try sending confirmation email to student
  try {
    if (student.email) {
      await sendEmail(
        student.email,
        `Registration Received: ${course.title}`,
        `Hello ${student.name},\n\nYour registration for "${course.title}" has been submitted successfully.\nOur team will review your application and grant access upon confirmation.\n\nThank you,\nCSZone LMS Team`,
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">Registration Submitted</h2>
          <p>Hello <strong>${student.name}</strong>,</p>
          <p>Your registration for <strong>${course.title}</strong> has been received and is currently under review.</p>
          <p style="background: #F3F4F6; padding: 12px; border-radius: 8px;">
            <strong>Course:</strong> ${course.title}<br/>
            <strong>Type:</strong> Paid Course (${course.currency} ${course.price?.toLocaleString()})<br/>
            <strong>Status:</strong> Pending Admin Verification
          </p>
          <p>You will receive an email once your registration is approved and course access is granted.</p>
          <p>Best regards,<br/><strong>CSZone Learning Platform</strong></p>
        </div>`
      );
    }
  } catch (emailErr) {
    console.warn('[LMS] Email delivery error (non-fatal):', emailErr.message);
  }

  await logActivity({
    userId,
    tenantId,
    action: 'SUBMIT_COURSE_REGISTRATION',
    entityType: 'CourseRegistration',
    entityId: registration._id,
    meta: { courseId, courseTitle: course.title }
  });

  return {
    success: true,
    status: 'pending',
    message: 'Registration submitted successfully. CSZone will review and grant access after approval.',
    registration
  };
};

/**
 * Get registration / enrollment status for logged in student on a course.
 */
const getRegistrationStatus = async (tenantId, courseId, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const isEnrolled = (course.enrolledStudents || []).map(String).includes(String(userId));
  if (isEnrolled) {
    return { status: 'enrolled', courseType: course.type };
  }

  const registration = await CourseRegistration.findOne({
    tenantId,
    courseId,
    userId
  }).sort({ createdAt: -1 });

  if (registration) {
    return {
      status: registration.status, // 'pending' | 'approved' | 'rejected'
      registrationId: registration._id,
      rejectionReason: registration.rejectionReason,
      appliedAt: registration.createdAt,
      courseType: course.type
    };
  }

  return { status: 'not_enrolled', courseType: course.type };
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN REGISTRATION MANAGEMENT (Manual Verification Flow)
// ══════════════════════════════════════════════════════════════════════════════

const getAdminRegistrations = async (tenantId, query = {}) => {
  const filter = { tenantId };

  if (query.status && ['pending', 'approved', 'rejected'].includes(query.status)) {
    filter.status = query.status;
  }

  if (query.courseId) {
    filter.courseId = query.courseId;
  }

  const registrations = await CourseRegistration.find(filter)
    .populate('userId', 'name email avatar phone')
    .populate('courseId', 'title slug type price currency thumbnail')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  if (query.search) {
    const q = query.search.toLowerCase();
    return registrations.filter(r =>
      r.userId?.name?.toLowerCase().includes(q) ||
      r.userId?.email?.toLowerCase().includes(q) ||
      r.courseId?.title?.toLowerCase().includes(q) ||
      r.paymentReference?.toLowerCase().includes(q)
    );
  }

  return registrations;
};

const approveRegistration = async (tenantId, registrationId, adminUserId) => {
  const registration = await CourseRegistration.findOne({ _id: registrationId, tenantId });
  if (!registration) throw err('Registration not found.', 404);

  if (registration.status === 'approved') {
    return { success: true, message: 'Registration is already approved.', registration };
  }

  const course = await Course.findOne({ _id: registration.courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const student = await User.findOne({ _id: registration.userId, tenantId });
  if (!student) throw err('Student not found.', 404);

  // Add to enrolledStudents if not already present
  if (!course.enrolledStudents.map(String).includes(String(student._id))) {
    course.enrolledStudents.push(student._id);
    await course.save();
  }

  // Update registration record
  registration.status = 'approved';
  registration.approvedBy = adminUserId;
  registration.approvedAt = new Date();
  registration.rejectedBy = undefined;
  registration.rejectedAt = undefined;
  registration.rejectionReason = undefined;
  await registration.save();

  // Send approval confirmation email
  try {
    if (student.email) {
      await sendEmail(
        student.email,
        `Registration Approved: ${course.title}`,
        `Hello ${student.name},\n\nYour registration for "${course.title}" has been approved! You now have full access to all lectures and modules.\n\nStart Learning: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${course.slug || course._id}\n\nBest regards,\nCSZone Team`,
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">🎉 Registration Approved!</h2>
          <p>Hello <strong>${student.name}</strong>,</p>
          <p>Congratulations! Your registration for <strong>${course.title}</strong> has been approved by CSZone administrators.</p>
          <p style="background: #ECFDF5; border: 1px solid #A7F3D0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <strong>Course:</strong> ${course.title}<br/>
            <strong>Status:</strong> Active Enrollment Granted
          </p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/learn/${course.slug || course._id}" style="background: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Start Learning Now
            </a>
          </p>
          <p>Best regards,<br/><strong>CSZone LMS Team</strong></p>
        </div>`
      );
    }
  } catch (emailErr) {
    console.warn('[LMS] Email delivery error on approval (non-fatal):', emailErr.message);
  }

  await logActivity({
    userId: adminUserId,
    tenantId,
    action: 'APPROVE_COURSE_REGISTRATION',
    entityType: 'CourseRegistration',
    entityId: registration._id,
    meta: { studentId: student._id, courseId: course._id }
  });

  return {
    success: true,
    message: `Registration for ${student.name} approved successfully. Student is now enrolled.`,
    registration
  };
};

const rejectRegistration = async (tenantId, registrationId, reason, adminUserId) => {
  const registration = await CourseRegistration.findOne({ _id: registrationId, tenantId });
  if (!registration) throw err('Registration not found.', 404);

  const course = await Course.findOne({ _id: registration.courseId, tenantId });
  const student = await User.findOne({ _id: registration.userId, tenantId });

  // Update registration record
  registration.status = 'rejected';
  registration.rejectedBy = adminUserId;
  registration.rejectedAt = new Date();
  registration.rejectionReason = reason || 'Requirements or payment verification could not be confirmed.';
  await registration.save();

  // Send rejection email notification
  try {
    if (student?.email && course) {
      await sendEmail(
        student.email,
        `Update Regarding Your Registration for ${course.title}`,
        `Hello ${student.name},\n\nYour registration for "${course.title}" was not approved at this time.\nReason: ${registration.rejectionReason}\n\nIf you have any questions, please contact CSZone support.\n\nBest regards,\nCSZone Team`,
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #EF4444;">Registration Update</h2>
          <p>Hello <strong>${student.name}</strong>,</p>
          <p>Thank you for your interest in <strong>${course.title}</strong>.</p>
          <p>Unfortunately, your registration could not be approved at this time.</p>
          <p style="background: #FEF2F2; border: 1px solid #FECACA; padding: 14px; border-radius: 8px; color: #991B1B;">
            <strong>Reason:</strong> ${registration.rejectionReason}
          </p>
          <p>If you believe this is an error or would like to provide updated payment details, please reach out to CSZone support.</p>
          <p>Best regards,<br/><strong>CSZone LMS Team</strong></p>
        </div>`
      );
    }
  } catch (emailErr) {
    console.warn('[LMS] Rejection email error (non-fatal):', emailErr.message);
  }

  await logActivity({
    userId: adminUserId,
    tenantId,
    action: 'REJECT_COURSE_REGISTRATION',
    entityType: 'CourseRegistration',
    entityId: registration._id,
    meta: { studentId: student?._id, courseId: course?._id, reason }
  });

  return {
    success: true,
    message: 'Registration rejected.',
    registration
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD & LEARNING PROGRESS
// ══════════════════════════════════════════════════════════════════════════════

const getStudentEnrolledCourses = async (tenantId, userId) => {
  // Fetch ALL published/active courses in the platform or courses where student is enrolled
  const query = {
    $or: [
      { isPublished: true },
      { status: { $in: ['published', 'active'] } },
      { enrolledStudents: userId }
    ]
  };
  if (tenantId) query.tenantId = tenantId;

  const courses = await Course.find(query)
    .populate('instructor', 'name email avatar')
    .lean()
    .sort({ updatedAt: -1 });

  // Get all registrations for this user to check pending/approved status on paid tracks
  const userRegistrations = await CourseRegistration.find({
    userId,
    ...(tenantId ? { tenantId } : {})
  }).lean();

  const regMap = new Map();
  userRegistrations.forEach(r => {
    regMap.set(String(r.courseId), r);
  });

  const enriched = await Promise.all(
    courses.map(async (c) => {
      let totalLectures = 0;
      (c.modules || []).forEach(m => {
        totalLectures += (m.lectures || m.lessons || []).length;
      });

      const isDirectlyEnrolled = (c.enrolledStudents || []).map(String).includes(String(userId));
      const isFree = c.type === 'free' || !c.type || !c.price || c.price === 0;
      
      // If free course, student has free access (or is auto-enrolled)
      const isUnlocked = isDirectlyEnrolled || isFree;

      const reg = regMap.get(String(c._id));
      const registrationStatus = reg?.status || (isUnlocked ? 'enrolled' : 'not_enrolled');

      const completedCount = isUnlocked
        ? await LectureProgress.countDocuments({
            userId,
            courseId: c._id,
            completed: true,
            ...(tenantId ? { tenantId } : {})
          })
        : 0;

      const progressPercent = (isUnlocked && totalLectures > 0)
        ? Math.min(100, Math.round((completedCount / totalLectures) * 100))
        : 0;

      const lastProgress = isUnlocked
        ? await LectureProgress.findOne({
            userId,
            courseId: c._id,
            ...(tenantId ? { tenantId } : {})
          }).sort({ lastWatchedAt: -1 }).lean()
        : null;

      return {
        _id: c._id,
        title: c.title,
        slug: c.slug || String(c._id),
        description: c.description || '',
        shortDescription: c.shortDescription || c.description || '',
        thumbnail: c.thumbnail || '',
        instructor: c.instructor?.name || c.instructorName || 'CSZone Team',
        type: c.type || 'free',
        price: c.price || 0,
        currency: c.currency || 'PKR',
        category: c.category || 'General',
        level: c.level || 'Beginner',
        totalLectures,
        completedLectures: completedCount,
        progressPercent: isUnlocked ? progressPercent : 0,
        isLocked: !isUnlocked,
        isEnrolled: isUnlocked,
        registrationStatus,
        lastLectureId: lastProgress?.lectureId || null,
        lastWatchedAt: lastProgress?.lastWatchedAt || c.updatedAt
      };
    })
  );

  return enriched;
};

const getStudentContinueLearning = async (tenantId, userId) => {
  const lastProgress = await LectureProgress.findOne({ tenantId, userId })
    .sort({ lastWatchedAt: -1 })
    .lean();

  if (!lastProgress) {
    // If no progress yet, get first enrolled course
    const firstCourse = await Course.findOne({ tenantId, enrolledStudents: userId })
      .select('title slug thumbnail modules')
      .lean();
    if (!firstCourse) return null;

    const firstLecture = firstCourse.modules?.[0]?.lectures?.[0] || firstCourse.modules?.[0]?.lessons?.[0];
    return {
      courseId: firstCourse._id,
      courseTitle: firstCourse.title,
      courseSlug: firstCourse.slug || String(firstCourse._id),
      thumbnail: firstCourse.thumbnail,
      lectureId: firstLecture?._id ? String(firstLecture._id) : null,
      lectureTitle: firstLecture?.title || 'Start Course',
      progressPercent: 0
    };
  }

  const course = await Course.findOne({ _id: lastProgress.courseId, tenantId })
    .select('title slug thumbnail modules')
    .lean();

  if (!course) return null;

  let lectureTitle = 'Continue Watching';
  let totalLectures = 0;
  (course.modules || []).forEach(m => {
    (m.lectures || m.lessons || []).forEach(l => {
      totalLectures++;
      if (String(l._id) === String(lastProgress.lectureId)) {
        lectureTitle = l.title;
      }
    });
  });

  const completedCount = await LectureProgress.countDocuments({
    tenantId,
    userId,
    courseId: course._id,
    completed: true
  });

  const progressPercent = totalLectures > 0
    ? Math.min(100, Math.round((completedCount / totalLectures) * 100))
    : 0;

  return {
    courseId: course._id,
    courseTitle: course.title,
    courseSlug: course.slug || String(course._id),
    thumbnail: course.thumbnail,
    lectureId: lastProgress.lectureId,
    lectureTitle,
    progressSeconds: lastProgress.progressSeconds,
    durationSeconds: lastProgress.durationSeconds,
    progressPercent,
    lastWatchedAt: lastProgress.lastWatchedAt
  };
};

const getCourseLearningData = async (tenantId, slugOrId, userId, role) => {
  const decoded = decodeURIComponent(slugOrId || '').trim();
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(decoded);
  const slugified = slugify(decoded, { lower: true, strict: true });

  const filter = {
    $or: [
      { slug: decoded.toLowerCase() },
      { slug: slugified },
      ...(isObjectId ? [{ _id: decoded }] : [])
    ]
  };

  let course = await Course.findOne(filter)
    .populate('instructor', 'name email avatar')
    .lean();

  if (!course) {
    // Fallback search by title
    course = await Course.findOne({
      title: new RegExp(`^${decoded.replace(/[-_]/g, ' ')}$`, 'i')
    }).populate('instructor', 'name email avatar').lean();
  }

  if (!course && isObjectId) {
    course = await Course.findById(decoded).populate('instructor', 'name email avatar').lean();
  }

  if (!course) throw err('Course not found.', 404);

  // Access check
  const isEnrolled = (course.enrolledStudents || course.students || []).map(String).includes(String(userId));
  const isInstructor = course.instructor?._id && String(course.instructor._id) === String(userId);
  const isAdmin = role === 'admin';

  const isPaidCourse = course.type === 'paid' || (course.price && course.price > 0);

  // If free course and not yet enrolled, auto-enroll student on entry
  if (!isEnrolled && !isInstructor && !isAdmin && !isPaidCourse) {
    await Course.updateOne(
      { _id: course._id },
      { $addToSet: { enrolledStudents: userId } }
    );
  } else if (!isEnrolled && !isInstructor && !isAdmin) {
    throw err('This is a paid course. You must submit an enrollment application and receive Admin approval before accessing this classroom.', 403);
  }

  // Fetch all lecture progress for this user
  const progressList = await LectureProgress.find({
    userId,
    courseId: course._id
  }).lean();

  const progressMap = {};
  progressList.forEach(p => {
    progressMap[String(p.lectureId)] = p;
  });

  let totalLectures = 0;
  let completedLectures = 0;

  const modules = (course.modules || []).map((m, mIdx) => {
    const rawLectures = m.lectures || m.lessons || [];
    const lectures = rawLectures.map((l, lIdx) => {
      totalLectures++;
      const lectureIdStr = String(l._id || `${mIdx}-${lIdx}`);
      const prog = progressMap[lectureIdStr];
      const isCompleted = !!prog?.completed;
      if (isCompleted) completedLectures++;

      return {
        _id: lectureIdStr,
        title: l.title || `Lecture ${lIdx + 1}`,
        description: l.description || '',
        order: l.order ?? lIdx,
        duration: l.duration || (l.video && l.video.duration) || 0,
        isPreview: !!l.isPreview,
        contentType: l.contentType || 'video',
        completed: isCompleted,
        progressSeconds: prog?.progressSeconds || 0,
        lastWatchedAt: prog?.lastWatchedAt || null,
        hasVideo: !!(l.video?.publicId || l.video?.playbackUrl || l.contentUrl)
      };
    });

    return {
      _id: String(m._id || mIdx),
      title: m.title || `Module ${mIdx + 1}`,
      description: m.description || '',
      order: m.order ?? mIdx,
      lectures
    };
  });

  const overallProgressPercent = totalLectures > 0
    ? Math.min(100, Math.round((completedLectures / totalLectures) * 100))
    : 0;

  return {
    _id: course._id,
    title: course.title,
    slug: course.slug || slugified || String(course._id),
    description: course.description,
    thumbnail: course.thumbnail,
    instructor: {
      name: course.instructor?.name || course.instructorName || 'CSZone Team',
      avatar: course.instructor?.avatar
    },
    modules,
    totalLectures,
    completedLectures,
    overallProgressPercent
  };
};

const getLecturePlayback = async (tenantId, courseId, lectureId, userId, userRole) => {
  const course = await Course.findById(courseId).lean();
  if (!course) throw err('Course not found.', 404);

  // Find lecture
  let targetLecture = null;
  for (const mod of (course.modules || [])) {
    for (const lec of (mod.lectures || mod.lessons || [])) {
      if (String(lec._id) === String(lectureId)) {
        targetLecture = lec;
        break;
      }
    }
    if (targetLecture) break;
  }

  if (!targetLecture) throw err('Lecture not found in this course.', 404);

  // Access check
  const isPreview = !!targetLecture.isPreview;
  const isEnrolled = userId && (course.enrolledStudents || []).map(String).includes(String(userId));
  const isInstructor = userId && course.instructor && String(course.instructor) === String(userId);
  const isAdmin = userRole === 'admin';

  if (!isPreview && !isEnrolled && !isInstructor && !isAdmin) {
    throw err('Access denied. You must be enrolled in this course to watch this lecture.', 403);
  }

  // Generate secured playback url if video asset exists
  let playbackUrl = targetLecture.video?.playbackUrl || targetLecture.contentUrl || '';
  let thumbnailUrl = targetLecture.video?.thumbnailUrl || '';

  if (targetLecture.video?.publicId) {
    try {
      const mediaData = await mediaService.generatePlaybackUrl(targetLecture.video.publicId);
      playbackUrl = mediaData.playbackUrl;
      thumbnailUrl = mediaData.thumbnailUrl;
    } catch (mediaErr) {
      console.warn('[LMS] Media playback generation fallback:', mediaErr.message);
    }
  }

  // Get student's previous progress if authenticated
  let currentProgressSeconds = 0;
  let isCompleted = false;
  if (userId) {
    const prog = await LectureProgress.findOne({
      tenantId,
      userId,
      courseId,
      lectureId
    }).lean();
    if (prog) {
      currentProgressSeconds = prog.progressSeconds || 0;
      isCompleted = !!prog.completed;
    }
  }

  return {
    lectureId: String(targetLecture._id),
    title: targetLecture.title,
    description: targetLecture.description || '',
    contentType: targetLecture.contentType || 'video',
    playbackUrl,
    thumbnailUrl,
    duration: targetLecture.duration || targetLecture.video?.duration || 0,
    currentProgressSeconds,
    completed: isCompleted,
    isPreview
  };
};

const updateLectureProgress = async (tenantId, courseId, lectureId, userId, progressSeconds, durationSeconds) => {
  const parsedProgress = Math.max(0, parseFloat(progressSeconds) || 0);
  const parsedDuration = Math.max(0, parseFloat(durationSeconds) || 0);

  // Completion threshold: >= 90% watched
  const isCompleted = parsedDuration > 0 && (parsedProgress / parsedDuration) >= 0.90;

  const record = await LectureProgress.findOneAndUpdate(
    { tenantId, userId, courseId, lectureId },
    {
      $set: {
        progressSeconds: parsedProgress,
        durationSeconds: parsedDuration,
        ...(isCompleted ? { completed: true } : {}),
        lastWatchedAt: new Date()
      }
    },
    { new: true, upsert: true }
  );

  return record;
};

// ══════════════════════════════════════════════════════════════════════════════
// COURSE BUILDER (Admin / Teacher Module & Lecture Management)
// ══════════════════════════════════════════════════════════════════════════════

const addModule = async (tenantId, courseId, data, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const newModule = {
    title: data.title?.trim() || 'New Module',
    description: data.description || '',
    order: course.modules.length,
    lectures: []
  };

  course.modules.push(newModule);
  await course.save();

  return course.modules[course.modules.length - 1];
};

const updateModule = async (tenantId, courseId, moduleId, data, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const mod = course.modules.id(moduleId);
  if (!mod) throw err('Module not found.', 404);

  if (data.title !== undefined) mod.title = data.title.trim();
  if (data.description !== undefined) mod.description = data.description;
  if (data.order !== undefined) mod.order = data.order;

  await course.save();
  return mod;
};

const deleteModule = async (tenantId, courseId, moduleId, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  course.modules = course.modules.filter(m => String(m._id) !== String(moduleId));
  await course.save();
  return { success: true };
};

const addLecture = async (tenantId, courseId, moduleId, data, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const mod = course.modules.id(moduleId);
  if (!mod) throw err('Module not found.', 404);

  const exactDuration = (data.video && typeof data.video.duration === 'number' && data.video.duration > 0)
    ? Math.round(data.video.duration)
    : (Number(data.duration) || 0);

  const newLecture = {
    title: data.title?.trim() || 'New Lecture',
    description: data.description || '',
    duration: exactDuration,
    isPreview: !!data.isPreview,
    contentType: data.contentType || 'video',
    contentUrl: data.contentUrl || '',
    content: data.content || '',
    order: (mod.lectures || []).length,
    video: data.video || { provider: 'cloudinary' }
  };

  mod.lectures.push(newLecture);
  mod.lessons = mod.lectures; // keep in sync
  await course.save();

  return mod.lectures[mod.lectures.length - 1];
};

const updateLecture = async (tenantId, courseId, moduleId, lectureId, data, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const mod = course.modules.id(moduleId);
  if (!mod) throw err('Module not found.', 404);

  let lec = mod.lectures.id(lectureId);
  if (!lec && mod.lessons) {
    lec = mod.lessons.id(lectureId);
  }
  if (!lec) throw err('Lecture not found.', 404);

  if (data.title !== undefined) lec.title = data.title.trim();
  if (data.description !== undefined) lec.description = data.description;
  if (data.video && typeof data.video.duration === 'number' && data.video.duration > 0) {
    lec.duration = Math.round(data.video.duration);
  } else if (data.duration !== undefined) {
    lec.duration = Number(data.duration) || 0;
  }
  if (data.isPreview !== undefined) lec.isPreview = !!data.isPreview;
  if (data.contentType !== undefined) lec.contentType = data.contentType;
  if (data.contentUrl !== undefined) lec.contentUrl = data.contentUrl;
  if (data.content !== undefined) lec.content = data.content;
  if (data.video !== undefined) lec.video = { ...lec.video, ...data.video };
  if (data.order !== undefined) lec.order = data.order;

  mod.lessons = mod.lectures;
  await course.save();
  return lec;
};

const deleteLecture = async (tenantId, courseId, moduleId, lectureId, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const mod = course.modules.id(moduleId);
  if (!mod) throw err('Module not found.', 404);

  mod.lectures = (mod.lectures || []).filter(l => String(l._id) !== String(lectureId));
  mod.lessons = mod.lectures;
  await course.save();

  return { success: true };
};

const uploadLectureVideo = async (file) => {
  if (!file) throw err('No video file provided.', 400);
  return mediaService.uploadVideo(file);
};

// ══════════════════════════════════════════════════════════════════════════════
// PRESERVED ENROLLMENT & LEGACY FEATURES
// ══════════════════════════════════════════════════════════════════════════════

const enrollStudent = async (tenantId, courseId, studentIdentifier, userId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

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

const getTenantStudents = async (tenantId) => {
  return User.find({ tenantId, role: 'student', isActive: true, isApproved: true })
    .select('name email _id avatar')
    .lean();
};

// ── Legacy Attendance ──────────────────────────────────────────────────────────
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
    for (const f of files) {
      const up = await uploadFile(f, 'uop_assignments');
      materials.push({ name: f.originalname, url: up.url, publicId: up.publicId });
    }
  }

  const assignment = await Assignment.create({
    tenantId,
    courseId: data.courseId,
    createdBy: userId,
    title: data.title,
    description: data.description || '',
    instructions: data.instructions || '',
    dueDate: data.dueDate,
    maxMarks: data.maxMarks || 100,
    materials,
  });

  await logActivity({ userId, tenantId, action: 'CREATE_ASSIGNMENT', entityType: 'Assignment', entityId: assignment._id });
  return assignment;
};

const updateAssignment = async (tenantId, assignmentId, data, userId, userRole) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  if (userRole !== 'admin' && assignment.createdBy.toString() !== userId.toString()) {
    throw err('You do not have permission to modify this assignment.', 403);
  }

  Object.assign(assignment, data);
  await assignment.save();
  await logActivity({ userId, tenantId, action: 'UPDATE_ASSIGNMENT', entityType: 'Assignment', entityId: assignmentId });
  return assignment;
};

const deleteAssignment = async (tenantId, assignmentId, userId, userRole) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  if (userRole !== 'admin' && assignment.createdBy.toString() !== userId.toString()) {
    throw err('You do not have permission to delete this assignment.', 403);
  }

  for (const m of assignment.materials || []) {
    if (m.publicId) await deleteFile(m.publicId);
  }
  for (const s of assignment.submissions || []) {
    if (s.publicId) await deleteFile(s.publicId);
  }

  await Assignment.deleteOne({ _id: assignmentId, tenantId });
  await logActivity({ userId, tenantId, action: 'DELETE_ASSIGNMENT', entityType: 'Assignment', entityId: assignmentId });
};

const submitAssignment = async (tenantId, assignmentId, file, userId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  const course = await Course.findOne({ _id: assignment.courseId, tenantId });
  if (!course || !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  if (new Date() > new Date(assignment.dueDate)) {
    throw err('Assignment deadline has passed.', 400);
  }

  if (!file) throw err('Submission file is required.', 400);

  const up = await uploadFile(file, 'uop_submissions');

  const existingSubIdx = (assignment.submissions || []).findIndex(s => s.studentId.toString() === userId.toString());

  const subData = {
    studentId: userId,
    fileUrl: up.url,
    publicId: up.publicId,
    submittedAt: new Date(),
    fileName: file.originalname,
  };

  if (existingSubIdx >= 0) {
    if (assignment.submissions[existingSubIdx].publicId) {
      await deleteFile(assignment.submissions[existingSubIdx].publicId);
    }
    assignment.submissions[existingSubIdx] = subData;
  } else {
    assignment.submissions.push(subData);
  }

  await assignment.save();
  await logActivity({ userId, tenantId, action: 'SUBMIT_ASSIGNMENT', entityType: 'Assignment', entityId: assignmentId });
  return assignment;
};

const getCourseAssignments = async (tenantId, courseId, userId, role) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  if (role === 'student' && !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  const assignments = await Assignment.find({ courseId, tenantId })
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 })
    .lean();

  if (role === 'student') {
    return assignments.map(a => {
      const mySub = (a.submissions || []).find(s => s.studentId.toString() === userId.toString());
      return {
        ...a,
        mySubmission: mySub || null,
        submissions: undefined,
      };
    });
  }

  return assignments;
};

// ── Sessions ───────────────────────────────────────────────────────────────────
const createSession = async (tenantId, data, files, userId) => {
  const course = await Course.findOne({ _id: data.courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

  const materials = [];
  if (files && files.length > 0) {
    for (const f of files) {
      const up = await uploadFile(f, 'uop_sessions');
      materials.push({ name: f.originalname, url: up.url, publicId: up.publicId });
    }
  }

  const session = await Session.create({
    tenantId,
    courseId: data.courseId,
    createdBy: userId,
    title: data.title,
    date: data.date || new Date(),
    attendanceCloseAt: data.attendanceCloseAt || null,
    materials,
  });

  await logActivity({ userId, tenantId, action: 'CREATE_SESSION', entityType: 'Session', entityId: session._id });
  return session;
};

const updateSession = async (tenantId, sessionId, data, userId) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  if (data.title !== undefined) session.title = data.title;
  if (data.date !== undefined) session.date = data.date;
  if (data.attendanceCloseAt !== undefined) session.attendanceCloseAt = data.attendanceCloseAt;

  await session.save();
  return session;
};

const toggleSession = async (tenantId, sessionId, userId) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  session.isOpen = !session.isOpen;
  if (session.isOpen) {
    session.attendanceOpenAt = new Date();
  }
  await session.save();
  return session;
};

const getCourseSessions = async (tenantId, courseId, userId, role) => {
  const sessions = await Session.find({ courseId, tenantId }).sort({ date: -1 }).lean();

  if (role === 'student') {
    const attendedSessionIds = (await Attendance.find({ courseId, studentId: userId, tenantId, status: 'present' }))
      .map(a => a.sessionId?.toString());

    return sessions.map(s => ({
      ...s,
      isAttended: attendedSessionIds.includes(s._id.toString()),
    }));
  }

  return sessions;
};

const getSessionAttendance = async (tenantId, sessionId) => {
  return Attendance.find({ sessionId, tenantId }).populate('studentId', 'name email').sort({ createdAt: -1 });
};

const overrideAttendance = async (tenantId, sessionId, studentId, status, userId) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  const att = await Attendance.findOneAndUpdate(
    { sessionId, studentId, tenantId },
    { status, courseId: session.courseId },
    { new: true, upsert: true }
  );

  return att;
};

const markSelfAttendance = async (tenantId, sessionId, userId) => {
  const session = await Session.findOne({ _id: sessionId, tenantId });
  if (!session) throw err('Session not found.', 404);

  if (!session.isOpen) throw err('Attendance is not currently open for this session.', 400);

  if (session.attendanceCloseAt && new Date() > new Date(session.attendanceCloseAt)) {
    throw err('Attendance window has closed.', 400);
  }

  const course = await Course.findOne({ _id: session.courseId, tenantId });
  if (!course || !course.enrolledStudents.map(String).includes(String(userId))) {
    throw err('You are not enrolled in this course.', 403);
  }

  const existing = await Attendance.findOne({ sessionId, studentId: userId, tenantId });
  if (existing) throw err('You have already marked your attendance for this session.', 400);

  const att = await Attendance.create({
    tenantId,
    courseId: session.courseId,
    sessionId,
    studentId: userId,
    status: 'present',
  });

  return att;
};

const getMyAttendanceSummary = async (tenantId, courseId, userId) => {
  const totalSessions = await Session.countDocuments({ courseId, tenantId });
  const attendedCount = await Attendance.countDocuments({ courseId, studentId: userId, tenantId, status: 'present' });
  const percentage = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;
  return { total: totalSessions, present: attendedCount, percentage };
};

// ── LMS Documents ──────────────────────────────────────────────────────────────
const uploadCourseDocument = async (tenantId, courseId, file, data, userId) => {
  if (!file) throw err('No file provided.', 400);
  const up = await uploadFile(file, 'uop_documents');
  const doc = await LmsDocument.create({
    tenantId,
    courseId,
    uploadedBy: userId,
    title: data.title || file.originalname,
    description: data.description || '',
    fileUrl: up.url,
    publicId: up.publicId,
    fileType: file.mimetype,
    fileSize: file.size,
    visibleToStudents: data.visibleToStudents !== undefined ? data.visibleToStudents : true,
  });
  return doc;
};

const getCourseDocuments = async (tenantId, courseId, role) => {
  const filter = { courseId, tenantId };
  if (role === 'student') filter.visibleToStudents = true;
  return LmsDocument.find(filter).sort({ createdAt: -1 });
};

const deleteCourseDocument = async (tenantId, docId) => {
  const doc = await LmsDocument.findOneAndDelete({ _id: docId, tenantId });
  if (!doc) throw err('Document not found.', 404);
  if (doc.publicId) await deleteFile(doc.publicId);
  return { success: true };
};

const getLmsDocumentById = async (tenantId, docId) => {
  return LmsDocument.findOne({ _id: docId, tenantId });
};

const getCourseDocumentAccess = async (tenantId, docId, userId, role) => {
  const doc = await LmsDocument.findOne({ _id: docId, tenantId });
  if (!doc) throw err('Document not found.', 404);
  if (role === 'student' && !doc.visibleToStudents) throw err('Access denied.', 403);
  return { url: doc.fileUrl };
};

// ── Quizzes, Performance & Grading ─────────────────────────────────────────────
const gradeSubmission = async (tenantId, assignmentId, studentId, grade, feedback, userId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
  if (!assignment) throw err('Assignment not found.', 404);

  const sub = (assignment.submissions || []).find(s => s.studentId.toString() === studentId.toString());
  if (!sub) throw err('Submission not found.', 404);

  sub.grade = grade;
  sub.feedback = feedback;
  sub.gradedBy = userId;
  sub.gradedAt = new Date();

  await assignment.save();
  return sub;
};

const getAssignmentSubmissions = async (tenantId, assignmentId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId })
    .populate('submissions.studentId', 'name email avatar')
    .lean();
  return assignment?.submissions || [];
};

const getMySubmission = async (tenantId, assignmentId, userId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, tenantId }).lean();
  return (assignment?.submissions || []).find(s => s.studentId.toString() === userId.toString()) || null;
};

const createQuiz = async (tenantId, data, userId) => {
  return Quiz.create({ tenantId, createdBy: userId, ...data });
};

const getCourseQuizzes = async (tenantId, courseId, userId, role) => {
  const filter = { courseId, tenantId };
  if (role === 'student') filter.status = 'published';
  return Quiz.find(filter).sort({ createdAt: -1 });
};

const addQuizQuestion = async (tenantId, quizId, data) => {
  return QuizQuestion.create({ tenantId, quizId, ...data });
};

const getQuizQuestions = async (tenantId, quizId) => {
  return QuizQuestion.find({ quizId, tenantId });
};

const updateQuiz = async (tenantId, quizId, data) => {
  return Quiz.findOneAndUpdate({ _id: quizId, tenantId }, data, { new: true });
};

const updateQuizQuestion = async (tenantId, questionId, data) => {
  return QuizQuestion.findOneAndUpdate({ _id: questionId, tenantId }, data, { new: true });
};

const publishQuiz = async (tenantId, quizId) => {
  return Quiz.findOneAndUpdate({ _id: quizId, tenantId }, { status: 'published' }, { new: true });
};

const startQuizAttempt = async (tenantId, quizId, userId) => {
  const quiz = await Quiz.findOne({ _id: quizId, tenantId });
  if (!quiz) throw err('Quiz not found.', 404);
  const attempt = await QuizAttempt.create({
    tenantId,
    quizId,
    studentId: userId,
    courseId: quiz.courseId,
    startedAt: new Date(),
  });
  return attempt;
};

const submitQuizAttempt = async (tenantId, attemptId, answers, userId) => {
  const attempt = await QuizAttempt.findOne({ _id: attemptId, studentId: userId, tenantId });
  if (!attempt) throw err('Attempt not found.', 404);

  const questions = await QuizQuestion.find({ quizId: attempt.quizId, tenantId });
  let score = 0;
  questions.forEach(q => {
    if (answers[q._id] === q.correctAnswer) score += (q.marks || 1);
  });

  attempt.score = score;
  attempt.completedAt = new Date();
  await attempt.save();
  return attempt;
};

const getQuizResults = async (tenantId, quizId) => {
  return QuizAttempt.find({ quizId, tenantId }).populate('studentId', 'name email').sort({ createdAt: -1 });
};

const getMyQuizAttempts = async (tenantId, quizId, userId) => {
  return QuizAttempt.find({ quizId, studentId: userId, tenantId }).sort({ createdAt: -1 });
};

const getCoursePerformance = async (tenantId, courseId) => {
  const students = await User.find({ tenantId, role: 'student', isActive: true }).select('name email avatar').lean();
  return students;
};

const getMyPerformance = async (tenantId, courseId, userId) => {
  const summary = await getMyAttendanceSummary(tenantId, courseId, userId);
  return { attendance: summary };
};

const checkEligibility = async (tenantId, courseId, studentId) => {
  return { eligible: true };
};

const generateCertificate = async (tenantId, courseId, studentId) => {
  const certCode = uuidv4();
  const cert = await Certificate.create({
    tenantId,
    courseId,
    studentId,
    certificateNumber: `CERT-${Date.now()}`,
    verificationCode: certCode,
    issuedAt: new Date(),
    isValid: true,
  });
  return cert;
};

const generateAllCertificates = async (tenantId, courseId) => {
  return { success: true };
};

const getCourseCertificates = async (tenantId, courseId) => {
  return Certificate.find({ courseId, tenantId }).populate('studentId', 'name email');
};

const getMyCertificates = async (tenantId, userId) => {
  return Certificate.find({ studentId: userId, tenantId }).populate('courseId', 'title');
};

const verifyCertificate = async (code) => {
  const cert = await Certificate.findOne({ verificationCode: code }).populate('studentId', 'name').populate('courseId', 'title instructor');
  if (!cert) throw err('Invalid certificate code.', 404);
  return cert;
};

const getCertificateById = async (tenantId, id, userId, role) => {
  const cert = await Certificate.findOne({ _id: id, tenantId });
  if (!cert) throw err('Certificate not found.', 404);
  return cert;
};

const getCertificateTemplate = async (tenantId, courseId) => {
  return CertificateTemplate.findOne({ courseId, tenantId });
};

const saveCertificateTemplate = async (tenantId, courseId, data) => {
  return CertificateTemplate.findOneAndUpdate({ courseId, tenantId }, data, { new: true, upsert: true });
};

// ── Admin Services ─────────────────────────────────────────────────────────────

const getAdminStats = async (tenantId) => {
  const [totalCourses, publishedCourses, totalStudents, totalTeachers, totalCertificates, pendingRegistrations] = await Promise.all([
    Course.countDocuments({ tenantId }),
    Course.countDocuments({ tenantId, $or: [{ status: 'published' }, { status: 'active' }, { isPublished: true }] }),
    User.countDocuments({ tenantId, role: 'student', isActive: true }),
    User.countDocuments({ tenantId, role: 'teacher', isActive: true }),
    Certificate.countDocuments({ tenantId }),
    CourseRegistration.countDocuments({ tenantId, status: 'pending' }),
  ]);

  // Compute active enrollments across courses
  const allCourses = await Course.find({ tenantId }).select('enrolledStudents students').lean();
  let activeEnrollments = 0;
  allCourses.forEach(c => {
    activeEnrollments += (c.enrolledStudents || c.students || []).length;
  });

  return {
    totalCourses,
    publishedCourses,
    totalStudents,
    totalTeachers,
    totalCertificates,
    pendingRegistrations,
    activeEnrollments
  };
};

const getAdminUsers = async (tenantId) => {
  return User.find({ tenantId, role: { $ne: 'admin' } })
    .select('name email role createdAt isActive isApproved')
    .lean()
    .sort({ createdAt: -1 });
};

const updateUserRole = async (tenantId, targetUserId, newRole, requesterId) => {
  if (targetUserId === requesterId) throw err('Cannot change your own role', 400);
  if (!['student', 'teacher'].includes(newRole)) throw err('Invalid role', 400);
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
  const user = await User.findOneAndDelete({ _id: targetUserId, tenantId });
  if (!user) throw err('User not found.', 404);
  return { success: true, message: 'User deleted permanently.' };
};

const approveUser = async (tenantId, targetUserId) => {
  const user = await User.findOneAndUpdate(
    { _id: targetUserId, tenantId },
    { isApproved: true },
    { new: true }
  ).select('name email role isApproved isActive createdAt');
  if (!user) throw err('User not found.', 404);
  return user;
};

const getInstructors = async (tenantId) => {
  return User.find({
    tenantId,
    role: { $in: ['teacher', 'admin', 'instructor'] },
    isActive: true,
  })
    .select('name email role avatar bio')
    .lean()
    .sort({ name: 1 });
};

const getAdminCourses = async (tenantId) => {
  const courses = await Course.find({ tenantId })
    .populate('instructor', 'name email role avatar')
    .lean()
    .sort({ createdAt: -1 });
  return courses.map(c => {
    let lectureCount = 0;
    (c.modules || []).forEach(m => {
      lectureCount += (m.lectures || m.lessons || []).length;
    });
    c.moduleCount = (c.modules || []).length;
    c.lectureCount = lectureCount;
    c.studentCount = (c.enrolledStudents || c.students || []).length;
    return c;
  });
};

const deleteAdminCourse = async (tenantId, courseId) => {
  const course = await Course.findOne({ _id: courseId, tenantId });
  if (!course) throw err('Course not found.', 404);

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
    CourseRegistration.deleteMany({ courseId, tenantId }),
    LectureProgress.deleteMany({ courseId, tenantId }),
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

  // Existing preserved Course operations
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  saveDraft,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
  getTenantStudents,

  // Existing LMS operations
  markAttendance,
  getCourseAttendance,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getCourseAssignments,
  createSession,
  updateSession,
  toggleSession,
  getCourseSessions,
  getSessionAttendance,
  overrideAttendance,
  markSelfAttendance,
  getMyAttendanceSummary,
  uploadCourseDocument,
  getCourseDocuments,
  deleteCourseDocument,
  getLmsDocumentById,
  getCourseDocumentAccess,
  gradeSubmission,
  getAssignmentSubmissions,
  getMySubmission,
  createQuiz,
  getCourseQuizzes,
  addQuizQuestion,
  getQuizQuestions,
  updateQuiz,
  updateQuizQuestion,
  publishQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizResults,
  getMyQuizAttempts,
  getCoursePerformance,
  getMyPerformance,
  checkEligibility,
  generateCertificate,
  generateAllCertificates,
  getCourseCertificates,
  getMyCertificates,
  verifyCertificate,
  getCertificateById,
  getCertificateTemplate,
  saveCertificateTemplate,

  // Admin Dashboard
  getAdminStats,
  getAdminUsers,
  getInstructors,
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
