const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user.model');

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
 * Register a new admin (with college code creation).
 */
const registerAdmin = async (data, secretKey) => {
  const email = data?.email;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email.trim())) {
    throw new Error('Please provide a valid email address');
  }

  const normalizedEmail = email.toLowerCase().trim();

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

  const tenantId = data.tenantId;
  const existing = await User.findOne({
    email: normalizedEmail, tenantId
  });
  if (existing) throw new Error('Email already registered');

  const user = await User.create({
    name: data.name,
    email: normalizedEmail,
    password: data.password,
    tenantId: data.tenantId,
    role: 'admin',
    isActive: true,
    isVerified: true
  });

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
 * Register a new user (student or teacher only).
 */
const registerUser = async ({ 
  tenantId, name, email, password, role = 'student',
  whatsappNumber, district, degreeQualification,
  workExperience, currentJobTitle, programId
}) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(normalizedEmail)) {
    throw new Error('Please provide a valid email address');
  }

  const effectiveTenantId = tenantId || process.env.DEFAULT_TENANT_ID || 'cszone';

  if (!['student', 'teacher'].includes(role)) {
    throw Object.assign(new Error('Invalid role'), { statusCode: 400 });
  }

  let tenantExists = await User.findOne({ tenantId: effectiveTenantId });
  if (!tenantExists) {
    // Auto-initialize tenant for default institution if missing
    tenantExists = { tenantId: effectiveTenantId };
  }

  const existing = await User.findOne({
    email: normalizedEmail, tenantId: effectiveTenantId
  });
  if (existing) throw Object.assign(new Error('Email already registered.'), { statusCode: 400 });

  let resolvedProgramId = null;
  if (programId) {
    try {
      const Program = require('../../lms/models/program.model');
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(programId)) {
        const prog = await Program.findById(programId);
        if (prog) resolvedProgramId = prog._id;
      }
      if (!resolvedProgramId) {
        const prog = await Program.findOne({
          tenantId: effectiveTenantId,
          $or: [
            { name: new RegExp('^' + programId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { code: String(programId).toUpperCase() }
          ]
        });
        if (prog) resolvedProgramId = prog._id;
      }
    } catch (e) {
      // fallback
    }
  }

  const user = await User.create({ 
    tenantId: effectiveTenantId, 
    name, 
    email: normalizedEmail, 
    password, 
    role,
    phone: whatsappNumber,
    whatsappNumber: whatsappNumber || undefined,
    district: district || undefined,
    degreeQualification: degreeQualification || undefined,
    workExperience: workExperience || 'No Experience',
    currentJobTitle: currentJobTitle || 'N/A',
    programId: resolvedProgramId || null,
    requestedProgramId: resolvedProgramId || null,
    isActive: true,
    isVerified: true,
    isApproved: false // Requires admin panel approval
  });

  return user;
};

/**
 * Verify Email with OTP (Legacy / optional fallback)
 */
const verifyEmail = async (email, code, tenantId) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const user = await User.findOne({ tenantId, email: normalizedEmail });

  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  if (user.isVerified) return true;

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  return true;
};

/**
 * Login with email + password. Returns tokens.
 */
const loginUser = async ({ tenantId, email, password }) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const effectiveTenantId = tenantId || process.env.DEFAULT_TENANT_ID || 'cszone';

  let user = await User.findOne({ tenantId: effectiveTenantId, email: normalizedEmail }).select('+password');
  if (!user) {
    // Fallback search by email if tenant is default
    user = await User.findOne({ email: normalizedEmail }).select('+password');
  }

  if (!user) throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
  if (!user.isActive) throw Object.assign(new Error('Account is deactivated.'), { statusCode: 403 });
  if ((user.role === 'teacher' || user.role === 'student') && !user.isApproved) {
    throw Object.assign(new Error('Your registration request is pending admin approval. Please wait for the admin to accept your request.'), { statusCode: 403 });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });

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
