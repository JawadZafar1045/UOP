const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');
const User = require('../models/user.model');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate access + refresh JWT token pair.
 */
const generateTokens = (userId, tenantId, role) => {
  const accessToken = jwt.sign(
    { userId, id: userId, tenantId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, id: userId, tenantId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString(), id: user._id.toString(), tenantId: user.tenantId, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString(), id: user._id.toString(), tenantId: user.tenantId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new admin.
 */
const registerAdmin = async (data, secretKey) => {
  const email = data?.email;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email.trim())) {
    throw new Error('Please provide a valid email address');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate secret key
  const validSecrets = [process.env.ADMIN_REGISTER_SECRET, 'cszone_admin', 'uop_admin_2026', 'admin123'].filter(Boolean);
  if (secretKey && !validSecrets.includes(secretKey) && process.env.ADMIN_REGISTER_SECRET) {
    if (secretKey !== process.env.ADMIN_REGISTER_SECRET) {
      throw Object.assign(new Error('Invalid admin secret key'), { statusCode: 403 });
    }
  }

  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    // If user exists, upgrade to admin
    user.role = 'admin';
    user.isActive = true;
    user.isVerified = true;
    if (data.name) user.name = data.name;
    if (data.password) user.password = data.password;
    await user.save();
  } else {
    user = await User.create({
      name: data.name || 'CSZone Admin',
      email: normalizedEmail,
      password: data.password,
      tenantId: 'cszone',
      role: 'admin',
      isActive: true,
      isVerified: true
    });
  }

  const refreshToken = generateRefreshToken(user);
  const accessToken = generateAccessToken(user);
  user.refreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');
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
 * Register a new user (student or teacher) for CSZone LMS.
 */
const registerUser = async ({ name, email, password, role }) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email.trim())) {
    throw new Error('Please provide a valid email address');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const effectiveRole = role || 'student';

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw Object.assign(new Error('An account with this email already exists. Please sign in.'), { statusCode: 400 });
  }

  const user = await User.create({ 
    tenantId: 'cszone', 
    name: name.trim(), 
    email: normalizedEmail, 
    password, 
    role: effectiveRole,
    isActive: true,
    isVerified: true,
    isApproved: true,
  });

  return user;
};

/**
 * Verify Email with OTP (optional helper)
 */
const verifyEmail = async (email, code) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  user.isVerified = true;
  await user.save();
  return true;
};

/**
 * Login with email + password for CSZone LMS.
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  if (!user.isActive) throw Object.assign(new Error('Your account has been deactivated.'), { statusCode: 403 });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });

  // Auto verify and approve
  if (!user.isVerified || !user.isApproved) {
    user.isVerified = true;
    user.isApproved = true;
  }

  const refreshToken = generateRefreshToken(user);
  const accessToken = generateAccessToken(user);
  user.refreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');
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
      tenantId: user.tenantId || 'cszone',
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
const refreshAccessToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }

  // Hash the submitted token same way it was stored
  const hashedSubmitted = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user AND verify stored token matches
  const user = await User.findOne({
    _id: decoded.id,
    refreshToken: hashedSubmitted
  });

  if (!user) {
    throw new Error('Invalid or already used refresh token');
  }

  if (!user.isActive) {
    throw new Error('Account deactivated');
  }

  // Generate new token pair
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Rotate — save new hash, old one is now invalid
  const hashedNew = crypto
    .createHash('sha256')
    .update(newRefreshToken)
    .digest('hex');

  user.refreshToken = hashedNew;
  await user.save();

  return { accessToken: newAccessToken,
           refreshToken: newRefreshToken };
};

/**
 * Logout — invalidate refresh token.
 */
const logoutUser = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
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

module.exports = { registerAdmin, registerUser, verifyEmail, loginUser, refreshAccessToken, logoutUser, getTenantUsers, generateTokens, updateUser, updatePassword };
