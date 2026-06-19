const roleMap = {
  super_admin: 'super_admin',
  institute_admin: 'admin',
  admin: 'admin',
  instructor: 'teacher',
  teacher: 'teacher',
  student: 'student'
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    // Map both requested and database-compatible role names
    const targetRoles = roles.map(role => roleMap[role] || role);

    if (!targetRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
