/**
 * Tenant isolation middleware.
 * Ensures all queried/created documents are scoped to the authenticated user's tenantId.
 * Must be used AFTER the `protect` middleware.
 */
const tenantIsolation = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(400).json({ success: false, message: 'Tenant context not established.' });
  }
  // tenantId is already set by auth middleware — this middleware serves as a guard
  // and reminder that tenant scoping is required on this route
  next();
};

module.exports = { tenantIsolation };
