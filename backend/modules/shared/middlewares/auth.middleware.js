const jwt = require('jsonwebtoken');
const User = require('../../auth/models/user.model');

/**
 * Protect routes - verifies JWT access token and attaches user to request.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch fresh user from DB (catches revoked/deleted users)
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Account deactivated.' });
    }

    // Attach user + tenantId to request for downstream use
    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please refresh.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = { protect };
