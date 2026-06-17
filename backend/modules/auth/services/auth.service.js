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
const registerUser = async ({ tenantId, name, email, password, role }) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email.trim())) {
    throw new Error('Please provide a valid email address');
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (!['student', 'teacher'].includes(role)) {
    throw Object.assign(new Error('Invalid role'), { statusCode: 400 });
  }

  const tenantExists = await User.findOne({ tenantId });
  if (!tenantExists) {
    throw Object.assign(new Error('No college found with this code. Ask your admin for the correct college code.'), { statusCode: 404 });
  }

  const existing = await User.findOne({
    email: normalizedEmail, tenantId
  });
  if (existing) throw Object.assign(new Error('Email already registered.'), { statusCode: 400 });

  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  const user = await User.create({ 
    tenantId, 
    name, 
    email: normalizedEmail, 
    password, 
    role,
    isVerified: false,
    isApproved: (role === 'teacher' || role === 'student') ? false : true,
    verificationCode,
    verificationCodeExpires
  });

  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: `UOP LMS <${process.env.RESEND_FROM_EMAIL}>`, // or your verified domain
        to: normalizedEmail,
        subject: 'Verify your UOP Space account',
        html: `<p>Hello ${name},</p><p>Your verification code is: <strong>${verificationCode}</strong></p><p>This code will expire in 15 minutes.</p>`
      });
    } else {
      console.log(`[DEV MODE] Verification code for ${normalizedEmail} is ${verificationCode}`);
    }
  } catch (err) {
    console.error('Error sending verification email:', err);
    // Don't fail the registration if email fails, but it might be a good idea depending on requirements.
  }

  return user;
};

/**
 * Verify Email with OTP
 */
const verifyEmail = async (email, code, tenantId) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const user = await User.findOne({ tenantId, email: normalizedEmail });

  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  if (user.isVerified) throw Object.assign(new Error('Email already verified.'), { statusCode: 400 });

  if (user.verificationCode !== code) {
    throw Object.assign(new Error('Invalid verification code.'), { statusCode: 400 });
  }

  if (new Date() > user.verificationCodeExpires) {
    throw Object.assign(new Error('Verification code has expired. Please request a new one.'), { statusCode: 400 });
  }

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
  const user = await User.findOne({ tenantId, email: normalizedEmail }).select('+password');
  if (!user) throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
  if (!user.isActive) throw Object.assign(new Error('Account is deactivated.'), { statusCode: 403 });
  if ((user.role === 'teacher' || user.role === 'student') && !user.isApproved) throw Object.assign(new Error('Your registration request is pending admin approval. You can login once the admin approves it.'), { statusCode: 403 });
  if (!user.isVerified) throw Object.assign(new Error('Please verify your email before logging in.'), { statusCode: 403 });

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
