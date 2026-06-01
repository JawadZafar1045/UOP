const rateLimit = require('express-rate-limit');
const path = require('path');

/**
 * Custom NoSQL Injection Sanitizer
 * Recursively deletes any keys starting with $ or containing a period (.) from req.body, req.query, and req.params.
 */
const mongoSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          console.warn(`[Security] NoSQL Injection attempt blocked: key "${key}" removed.`);
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

/**
 * Custom XSS Sanitizer
 * Recursively escapes HTML tags in request body strings.
 */
const xssSanitize = (req, res, next) => {
  const escapeString = (val) => {
    if (typeof val === 'string') {
      return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (val instanceof Object) {
      for (const key in val) {
        val[key] = escapeString(val[key]);
      }
    }
    return val;
  };

  if (req.body) req.body = escapeString(req.body);
  if (req.query) req.query = escapeString(req.query);
  next();
};

/**
 * Strict Rate Limiter for Authentication Endpoints (Brute Force Prevention)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * File Upload Security Configuration
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/gif',
  'text/plain',
  'video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime',
  'application/zip', 'application/x-zip-compressed'
];

const MIME_EXTENSION_MAP = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'text/plain': ['.txt'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/x-matroska': ['.mkv'],
  'video/quicktime': ['.mov'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip']
};

const BLACKLIST_EXTENSIONS = ['.exe', '.dll', '.msi', '.bat', '.cmd', '.sh', '.js', '.vbs', '.scr', '.com', '.pif', '.htm', '.html', '.php', '.py', '.rb', '.pl', '.jsp', '.asp', '.aspx', '.jar'];

/**
 * Strict file validation validator.
 * Checks MIME types, extensions, size limits, and blocks blacklisted files.
 */
const validateUploadedFile = (file) => {
  if (!file) {
    throw new Error('No file provided.');
  }

  // 1. Size Limit Check (20MB)
  const maxBytes = 20 * 1024 * 1024;
  const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
  if (fileSize > maxBytes) {
    throw new Error('File exceeds maximum allowed size (20MB).');
  }

  // 2. MIME Validation
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} is not allowed.`);
  }

  // 3. Extension Validation
  const originalName = file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();
  if (!ext) {
    throw new Error('File must have a valid extension.');
  }

  // 4. Blacklist Check
  if (BLACKLIST_EXTENSIONS.includes(ext)) {
    throw new Error(`Dangerous file extension "${ext}" is blocked.`);
  }

  // 5. MIME Mismatch Check
  const allowedExtensions = MIME_EXTENSION_MAP[file.mimetype];
  if (!allowedExtensions || !allowedExtensions.includes(ext)) {
    throw new Error(`MIME type mismatch: extension "${ext}" is not permitted for MIME type "${file.mimetype}".`);
  }

  return true;
};

module.exports = {
  mongoSanitize,
  xssSanitize,
  authLimiter,
  validateUploadedFile,
};
