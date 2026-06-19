const { validationResult } = require('express-validator');

/**
 * Standard request validation error responder middleware.
 * Returns a standardized error format when validation fails.
 */
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    return res.status(400).json({
      success: false,
      message: errorArray[0].msg || 'Validation failed.',
      errors: errorArray.map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

module.exports = {
  validateResult,
};
