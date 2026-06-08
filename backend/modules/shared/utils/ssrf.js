/**
 * SSRF Protection Utility
 * Validates that a user-supplied URL is safe to fetch server-side.
 * Blocks internal IPs, private CIDR ranges, non-HTTPS protocols,
 * and any host that is not a Cloudinary domain.
 */

const { URL } = require('url');

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS / GCP metadata endpoint
  '10.0.0.0',
];

const BLOCKED_CIDRS = [
  /^10\./,                        // RFC-1918 class A
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // RFC-1918 class B
  /^192\.168\./,                  // RFC-1918 class C
  /^127\./,                       // loopback
  /^0\./,                         // 0.0.0.0/8
  /^169\.254\./,                  // link-local / metadata
  /^::1$/,                        // IPv6 loopback
  /^fc00:/,                       // IPv6 unique local
  /^fe80:/,                       // IPv6 link-local
];

const ALLOWED_PROTOCOLS = ['https:'];

/**
 * Validates a raw URL string for safe server-side fetching.
 * Throws a descriptive Error if validation fails.
 * Returns the sanitized href string on success.
 *
 * @param {string} rawUrl
 * @returns {string} sanitized URL
 */
const validateExternalUrl = (rawUrl) => {
  // Must be a non-empty string
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Invalid URL');
  }

  // Guard against absurdly long URLs (path traversal tricks, etc.)
  if (rawUrl.length > 2048) {
    throw new Error('URL too long');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Malformed URL');
  }

  // Must use HTTPS — never plain HTTP
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error('Only HTTPS URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known internal hostnames (exact match or subdomain)
  if (BLOCKED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))) {
    throw new Error('Internal URLs are not allowed');
  }

  // Block private / reserved IP ranges
  if (BLOCKED_CIDRS.some(r => r.test(hostname))) {
    throw new Error('Internal IP ranges are not allowed');
  }

  // Allow ONLY Cloudinary domains (this endpoint is exclusively a file proxy)
  if (
    !hostname.endsWith('cloudinary.com') &&
    !hostname.endsWith('res.cloudinary.com')
  ) {
    throw new Error('Only Cloudinary URLs are permitted');
  }

  return parsed.href; // return normalized, sanitized URL
};

module.exports = { validateExternalUrl };
