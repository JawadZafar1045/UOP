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
 * Register a new admin (with college code creation).
 */
const registerAdmin = async (data, secretKey) => {
  if (secretKey !== process.env.ADMIN_REGISTER_SECRET) {
    throw Object.assign(new Error('Invalid secret key'), { statusCode: 403 });
  }

  // Validate tenantId format: 3-20 lowercase letters/numbers
  const tenantRegex = /^[a-z0-9]{3,20}$/;
  if (!tenantRegex.test(data.tenantId)) {
    throw Object.assign(new Error('College code must be 3-20 lowercase letters/numbers'), { statusCode: 400 });
  }

  // Check if tenantId already has an admin
  const exists = await User.findOne({ tenantId: data.tenantId, role: 'admin' });
  if (exists) {
    throw Object.assign(new Error('A college with this code already exists'), { statusCode: 409 });
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    tenantId: data.tenantId,
    role: 'admin',
    isActive: true
  });

  const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.tenantId, user.role);
  
  // Store hashed refresh token
  const salt = await bcrypt.genSalt(10);
  user.refreshToken = await bcrypt.hash(refreshToken, salt);
  await user.save();

  return {
    user: { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      tenantId: user.tenantId,
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
      bio: user.bio
    },
    accessToken,
    refreshToken
  };
};

/**
 * Register a new user (student or teacher only).
 */
const registerUser = async ({ tenantId, name, email, password, role }) => {
  if (!['student', 'teacher'].includes(role)) {
    throw Object.assign(new Error('Invalid role'), { statusCode: 400 });
  }

  const tenantExists = await User.findOne({ tenantId });
  if (!tenantExists) {
    throw Object.assign(new Error('No college found with this code. Ask your admin for the correct college code.'), { statusCode: 404 });
  }

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
    user: { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
      bio: user.bio
    },
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
  const allowedUpdates = ['name', 'avatar', 'phone', 'location', 'bio'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (data[field] !== undefined) updates[field] = data[field];
  });

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password -refreshToken');
  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  
  return user;
};

/**
 * Update user password.
 */
const updatePassword = async (userId, currentPwd, newPwd) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  }

  const isMatch = await user.comparePassword(currentPwd);
  if (!isMatch) {
    throw Object.assign(new Error('Incorrect current password.'), { statusCode: 400 });
  }

  user.password = newPwd;
  await user.save();
  
  return user;
};

module.exports = { registerAdmin, registerUser, loginUser, refreshAccessToken, logoutUser, getTenantUsers, generateTokens, updateUser, updatePassword };
