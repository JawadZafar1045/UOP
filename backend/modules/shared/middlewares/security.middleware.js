const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
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
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
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
/**
 * Get client IP from request, checking Cloudflare and X-Forwarded-For headers
 */
function getClientIP(req) {
  // Check Cloudflare header first
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }
  // Check X-Forwarded-For (for proxies)
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  // Fallback to direct IP
  return req.ip || req.connection.remoteAddress || 'unknown';
}

// ==================== CUSTOM SANITIZERS ====================
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
 *
 * IMPORTANT: We do NOT HTML-encode stored text (no &amp; replacements).
 * MongoDB stores raw strings safely. React/Next.js renders raw text safely
 * via JSX — encoding here causes double-encoding ("&amp;amp;" etc.).
 *
 * Instead we STRIP structurally dangerous patterns:
 *   - <script> blocks and event handlers (onerror=, onclick=, etc.)
 *   - javascript: pseudo-protocol in attribute values
 *   - Null bytes and other control characters
 *
 * This stops XSS injection without corrupting legitimate text like
 * "A & B <Test>" which should be stored and returned exactly as-is.
 */
const xssSanitize = (req, res, next) => {
  const stripDangerous = (val) => {
    if (typeof val === 'string') {
      return val
        // Strip <script>...</script> blocks (case-insensitive, multiline)
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        // Strip standalone <script> tags with no closing tag
        .replace(/<script[^>]*>/gi, '')
        // Strip </script> orphan tags
        .replace(/<\/script>/gi, '')
        // Strip inline event handlers (onclick=, onerror=, onload=, etc.)
        .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
        // Strip javascript: pseudo-protocol
        .replace(/javascript\s*:/gi, '')
        // Strip null bytes
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

  if (req.body)  req.body  = stripDangerous(req.body);
  if (req.query) req.query = stripDangerous(req.query);
  next();
};

// ==================== RATE LIMITERS ====================
/**
 * Strict Rate Limiter for Authentication Endpoints (Brute Force Prevention)
 * 300 requests per 5 minutes for /api/auth/* endpoints
 */
const authLimiter = rateLimit({
  store: redisConnected && redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rate-limit:auth:',
        sendCommand: async (cmd, args) => {
          try {
            return await redisClient.sendCommand(cmd, args);
          } catch (error) {
            console.error('[Rate Limiter Auth] Redis command error:', error);
            throw error;
          }
        },
      })
    : undefined,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300, // 300 requests per window
  keyGenerator: (req) => getClientIP(req),
  skip: (req) => {
    // Skip health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 5 minutes.',
  },
});

/**
 * General Rate Limiter for all API endpoints
 * 500 requests per 5 minutes for all other /api/* endpoints
 */
const generalLimiter = rateLimit({
  store: redisConnected && redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rate-limit:general:',
        sendCommand: async (cmd, args) => {
          try {
            return await redisClient.sendCommand(cmd, args);
          } catch (error) {
            console.error('[Rate Limiter General] Redis command error:', error);
            throw error;
          }
        },
      })
    : undefined,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // 500 requests per window
  keyGenerator: (req) => getClientIP(req),
  skip: (req) => {
    // Skip health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 5 minutes.',
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
  generalLimiter,
  validateUploadedFile,
  redisClient,
  redisConnected,
  getClientIP,
};
