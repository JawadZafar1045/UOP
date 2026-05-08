const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

/**
 * Generate access + refresh JWT token pair.
 */
const generateTokens = (userId, tenantId, role) => {
  const accessToken = jwt.sign(
    { userId, tenantId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, tenantId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new user.
 */
const registerUser = async ({ tenantId, name, email, password, role }) => {
  const existing = await User.findOne({ tenantId, email });
  if (existing) throw Object.assign(new Error('Email already registered in this tenant.'), { statusCode: 409 });

  const user = await User.create({ tenantId, name, email, password, role });
  return user;
};

/**
 * Login with email + password. Returns tokens.
 */
const loginUser = async ({ tenantId, email, password }) => {
  const user = await User.findOne({ tenantId, email }).select('+password');
  if (!user) throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
  if (!user.isActive) throw Object.assign(new Error('Account is deactivated.'), { statusCode: 403 });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });

  const { accessToken, refreshToken } = generateTokens(user._id.toString(), tenantId, user.role);

  // Store hashed refresh token
  const salt = await bcrypt.genSalt(10);
  user.refreshToken = await bcrypt.hash(refreshToken, salt);
  user.lastLogin = new Date();
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  };
};

/**
 * Refresh access token using a valid refresh token.
 */
const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401 });
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user || !user.refreshToken) throw Object.assign(new Error('User not found or logged out.'), { statusCode: 401 });

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid) throw Object.assign(new Error('Refresh token mismatch.'), { statusCode: 401 });

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString(), user.tenantId, user.role);

  // Rotate refresh token
  const salt = await bcrypt.genSalt(10);
  user.refreshToken = await bcrypt.hash(newRefreshToken, salt);
  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Logout — invalidate refresh token.
 */
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

/**
 * Get all users within a tenant (admin/hr only).
 */
const getTenantUsers = async (tenantId) => {
  return User.find({ tenantId }).select('-password -refreshToken').sort({ createdAt: -1 });
};

/**
 * Update user profile.
 */
const updateUser = async (userId, data) => {
  // Only allow updating specific fields
  const allowedUpdates = ['name', 'avatar'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (data[field] !== undefined) updates[field] = data[field];
  });

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password -refreshToken');
  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  
  return user;
};

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser, getTenantUsers, generateTokens, updateUser };
