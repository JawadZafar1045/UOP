const { body, param } = require('express-validator');

const isObjectId = (value) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

const getDocumentVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid document ID format'),
];

const uploadDocumentVal = [
  body('title')
    .optional()
    .trim()
    .escape(),
  body('scope')
    .optional()
    .isIn(['institute', 'course', 'student_submission'])
    .withMessage('Invalid scope type'),
  body('category')
    .optional()
    .trim()
    .escape(),
];

const updateLifecycleVal = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid document ID format'),
  body('event')
    .trim()
    .notEmpty()
    .withMessage('Lifecycle event is required')
    .escape(),
  body('note')
    .optional()
    .trim()
    .escape(),
];

module.exports = {
  getDocumentVal,
  uploadDocumentVal,
  updateLifecycleVal,
};
