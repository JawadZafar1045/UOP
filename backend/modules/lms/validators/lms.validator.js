const { body, param, query } = require('express-validator');

// Helper to check if value is valid MongoDB ObjectId
const isObjectId = (value) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

const verifyCertificateVal = [
  param('code')
    .trim()
    .notEmpty()
    .withMessage('Certificate verification code is required')
    .isUUID()
    .withMessage('Certificate code must be a valid UUID'),
];

const getCourseVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const createCourseVal = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ max: 100 })
    .withMessage('Course title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'archived'])
    .withMessage('Status must be draft, active, or archived'),
];

const updateCourseVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Course title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course description cannot be empty'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'archived'])
    .withMessage('Status must be draft, active, or archived'),
];

const deleteCourseVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const enrollStudentVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('Student identifier (ID or Email) is required'),
];

const unenrollStudentVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  param('studentId')
    .trim()
    .notEmpty()
    .withMessage('Student identifier is required'),
];

const markAttendanceVal = [
  body('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  body('studentId')
    .custom(isObjectId)
    .withMessage('Invalid student ID format'),
  body('status')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Status must be present, absent, or late'),
];

const getCourseAttendanceVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const createAssignmentVal = [
  body('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Assignment title is required')
    .isLength({ max: 100 })
    .withMessage('Assignment title cannot exceed 100 characters'),
  body('dueDate')
    .isISO8601()
    .withMessage('Valid due date (ISO 8601 format) is required'),
];

const getCourseAssignmentsVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const updateAssignmentVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid assignment ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assignment title cannot be empty'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
];

const submitAssignmentVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid assignment ID format'),
  body('text')
    .optional()
    .trim(),
];

const createSessionVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Session title is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid session date (ISO 8601 format) is required'),
];

const getCourseSessionsVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const updateSessionVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid session ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Session title cannot be empty'),
];

const toggleSessionVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid session ID format'),
];

const getSessionAttendanceVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid session ID format'),
];

const overrideAttendanceVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid session ID format'),
  param('studentId')
    .custom(isObjectId)
    .withMessage('Invalid student ID format'),
  body('status')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Status must be present, absent, or late'),
];

const markSelfAttendanceVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid session ID format'),
];

const getMyAttendanceSummaryVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const uploadCourseDocumentVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const getCourseDocumentsVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const deleteCourseDocumentVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid document ID format'),
];

const getCourseDocumentAccessVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid document ID format'),
];

const gradeSubmissionVal = [
  param('assignmentId')
    .custom(isObjectId)
    .withMessage('Invalid assignment ID format'),
  param('studentId')
    .custom(isObjectId)
    .withMessage('Invalid student ID format'),
  body('score')
    .isNumeric()
    .withMessage('Grade score must be a number'),
  body('feedback')
    .optional()
    .trim(),
];

const getAssignmentSubmissionsVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid assignment ID format'),
];

const getMySubmissionVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid assignment ID format'),
];

const createQuizVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Quiz title is required'),
  body('passMark')
    .optional()
    .isNumeric()
    .withMessage('Pass mark must be a number'),
  body('enableNegativeMarking')
    .optional()
    .isBoolean()
    .withMessage('enableNegativeMarking must be a boolean'),
  body('correctMark')
    .optional()
    .isNumeric()
    .withMessage('correctMark must be a number'),
  body('negativeMark')
    .optional()
    .isNumeric()
    .withMessage('negativeMark must be a number'),
  body('unattemptedMark')
    .optional()
    .isNumeric()
    .withMessage('unattemptedMark must be a number'),
];

const validateQuizExcelVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const bulkCreateQuizVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  body('quiz')
    .isObject()
    .withMessage('Quiz configuration object is required'),
  body('quiz.title')
    .trim()
    .notEmpty()
    .withMessage('Quiz title is required'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
];

const getCourseQuizzesVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const updateQuizVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid quiz ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Quiz title cannot be empty'),
  body('passMark')
    .optional()
    .isNumeric()
    .withMessage('Pass mark must be a number'),
  body('enableNegativeMarking')
    .optional()
    .isBoolean()
    .withMessage('enableNegativeMarking must be a boolean'),
  body('correctMark')
    .optional()
    .isNumeric()
    .withMessage('correctMark must be a number'),
  body('negativeMark')
    .optional()
    .isNumeric()
    .withMessage('negativeMark must be a number'),
  body('unattemptedMark')
    .optional()
    .isNumeric()
    .withMessage('unattemptedMark must be a number'),
];

const addQuizQuestionVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid quiz ID format'),
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question text is required'),
  body('options')
    .isArray({ min: 2 })
    .withMessage('Options must be an array with at least 2 choices'),
  body('correctIndex')
    .isInt({ min: 0 })
    .withMessage('Correct option must be a valid option index'),
];

const updateQuizQuestionVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid question ID format'),
  body('question')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Question text cannot be empty'),
  body('options')
    .optional()
    .isArray({ min: 2 })
    .withMessage('Options must be an array with at least 2 choices'),
  body('correctIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Correct option must be a valid option index'),
];

const publishQuizVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid quiz ID format'),
];

const startQuizAttemptVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid quiz ID format'),
];

const submitQuizAttemptVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid quiz ID format'),
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
];

const getQuizResultsVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid quiz ID format'),
];

const getMyQuizAttemptsVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid quiz ID format'),
];

const getCoursePerformanceVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const getMyPerformanceVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const generateCertificateVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
  param('studentId')
    .custom(isObjectId)
    .withMessage('Invalid student ID format'),
];

const generateAllCertificatesVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const getCourseCertificatesVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const getCertificateAccessVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid certificate ID format'),
];

const getCertificateTemplateVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const saveCertificateTemplateVal = [
  param('courseId')
    .custom(isObjectId)
    .withMessage('Invalid course ID format'),
];

const signFileUrlVal = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('Valid file URL is required')
    .isString()
    .withMessage('URL must be a string'),
];

// ── Academic Validators ────────────────────────────────────────────────────────
const academicIdParamVal = [
  param('id').custom(isObjectId).withMessage('Invalid ID format'),
];

const createProgramVal = [
  body('name').trim().notEmpty().withMessage('Program name is required').isLength({ max: 150 }).withMessage('Program name max 150 chars'),
  body('code').optional().trim().isLength({ max: 20 }).withMessage('Code max 20 chars'),
  body('degreeLevel').optional().isIn(['undergraduate', 'postgraduate', 'diploma', 'certificate', 'other']).withMessage('Invalid degree level'),
  body('totalCreditHours').optional().isFloat({ min: 0 }).withMessage('Credit hours must be >= 0'),
  body('passingGradePercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Passing grade must be 0–100'),
];

const updateProgramVal = [
  param('id').custom(isObjectId).withMessage('Invalid program ID'),
  body('name').optional().trim().isLength({ min: 2, max: 150 }).withMessage('Program name must be 2–150 chars'),
  body('degreeLevel').optional().isIn(['undergraduate', 'postgraduate', 'diploma', 'certificate', 'other']).withMessage('Invalid degree level'),
  body('status').optional().isIn(['active', 'archived']).withMessage('Status must be active or archived'),
];

const createMajorVal = [
  body('programId').custom(isObjectId).withMessage('Valid programId is required'),
  body('name').trim().notEmpty().withMessage('Major name is required').isLength({ max: 150 }).withMessage('Major name max 150 chars'),
  body('code').optional().trim().isLength({ max: 20 }).withMessage('Code max 20 chars'),
];

const updateMajorVal = [
  param('id').custom(isObjectId).withMessage('Invalid major ID'),
  body('name').optional().trim().isLength({ min: 2, max: 150 }).withMessage('Major name must be 2–150 chars'),
  body('status').optional().isIn(['active', 'archived']).withMessage('Status must be active or archived'),
];

const programPerformanceVal = [
  param('programId').custom(isObjectId).withMessage('Invalid program ID'),
];

const studentDegreePerformanceVal = [
  param('programId').custom(isObjectId).withMessage('Invalid program ID'),
  param('studentId').optional().custom(isObjectId).withMessage('Invalid student ID'),
];

module.exports = {

  verifyCertificateVal,
  getCourseVal,
  createCourseVal,
  updateCourseVal,
  deleteCourseVal,
  enrollStudentVal,
  unenrollStudentVal,
  markAttendanceVal,
  getCourseAttendanceVal,
  createAssignmentVal,
  getCourseAssignmentsVal,
  updateAssignmentVal,
  submitAssignmentVal,
  createSessionVal,
  getCourseSessionsVal,
  updateSessionVal,
  toggleSessionVal,
  getSessionAttendanceVal,
  overrideAttendanceVal,
  markSelfAttendanceVal,
  getMyAttendanceSummaryVal,
  uploadCourseDocumentVal,
  getCourseDocumentsVal,
  deleteCourseDocumentVal,
  getCourseDocumentAccessVal,
  gradeSubmissionVal,
  getAssignmentSubmissionsVal,
  getMySubmissionVal,
  createQuizVal,
  validateQuizExcelVal,
  bulkCreateQuizVal,
  getCourseQuizzesVal,
  updateQuizVal,
  addQuizQuestionVal,
  updateQuizQuestionVal,
  publishQuizVal,
  startQuizAttemptVal,
  submitQuizAttemptVal,
  getQuizResultsVal,
  getMyQuizAttemptsVal,
  getCoursePerformanceVal,
  getMyPerformanceVal,
  generateCertificateVal,
  generateAllCertificatesVal,
  getCourseCertificatesVal,
  getCertificateAccessVal,
  getCertificateTemplateVal,
  saveCertificateTemplateVal,
  signFileUrlVal,
  // Academic validators
  createProgramVal,
  updateProgramVal,
  createMajorVal,
  updateMajorVal,
  academicIdParamVal,
  programPerformanceVal,
  studentDegreePerformanceVal,
};

