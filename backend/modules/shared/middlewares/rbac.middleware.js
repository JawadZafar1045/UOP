/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Usage: authorize('admin', 'hr')
 *
 * Roles: admin | hr | teacher | sales | student
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
