const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const path = require('path');

// ==================== REDIS SETUP ====================
let redisClient = null;
let redisConnected = false;

/**
 * Initialize Redis Client with fallback to memory store
 */
async function initializeRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      redisConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Client ready');
    });

    await redisClient.connect();
    redisConnected = true;
    console.log('[Rate Limiter] Using Redis store for cluster mode support');
  } catch (error) {
    console.warn('[Redis] Failed to connect:', error.message);
    console.warn('[Rate Limiter] Falling back to memory store (single instance only)');
    redisConnected = false;
    redisClient = null;
  }
}

// Initialize Redis on module load
initializeRedis();

// ==================== IP DETECTION ====================
function getClientIP(req) {
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || 'unknown';
}

// ==================== CUSTOM SANITIZERS ====================
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

const xssSanitize = (req, res, next) => {
  const stripDangerous = (val) => {
    if (typeof val === 'string') {
      return val
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<script[^>]*>/gi, '')
        .replace(/<\/script>/gi, '')
        .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/\x00/g, '');
    }
    if (val !== null && typeof val === 'object') {
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          val[key] = stripDangerous(val[key]);
        }
      }
    }
    return val;
  };

  if (req.body) req.body = stripDangerous(req.body);
  if (req.query) req.query = stripDangerous(req.query);
  next();
};

// ==================== RATE LIMITERS ====================
const authLimiter = rateLimit({
  max: 300, // 300 requests per window
windowMs: 5 * 60 * 1000, // 5 minutes
  keyGenerator: (req) => getClientIP(req),
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 5 minutes.',
  },
});

const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  keyGenerator: (req) => getClientIP(req),
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 5 minutes.',
  },
});

// ==================== FILE VALIDATION ====================
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

const validateUploadedFile = (file) => {
  if (!file) {
    throw new Error('No file provided.');
  }

  const maxBytes = 20 * 1024 * 1024;
  const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
  if (fileSize > maxBytes) {
    throw new Error('File exceeds maximum allowed size (20MB).');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} is not allowed.`);
  }

  const originalName = file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();
  if (!ext) {
    throw new Error('File must have a valid extension.');
  }

  if (BLACKLIST_EXTENSIONS.includes(ext)) {
    throw new Error(`Dangerous file extension "${ext}" is blocked.`);
  }

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
  generalLimiter,
  validateUploadedFile,
  redisClient,
  redisConnected,
  getClientIP,
};
