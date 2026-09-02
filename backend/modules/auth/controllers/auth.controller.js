const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');

// ── Validation Rules ───────────────────────────────────────────────────────────
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('tenantId').optional().trim().escape(),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('tenantId').optional().trim().escape(),
];

const verifyValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('code').notEmpty().withMessage('Verification code is required'),
  body('tenantId').optional().trim().escape(),
];

const registerAdminValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('tenantId')
    .trim()
    .notEmpty()
    .withMessage('Tenant ID is required')
    .matches(/^[a-z0-9]{3,20}$/)
    .withMessage('College code must be 3-20 lowercase letters/numbers')
    .escape(),
  body('secretKey').notEmpty().withMessage('Secret key is required'),
];

const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').escape(),
  body('avatar').optional().trim().escape(),
];

// ── Helper ─────────────────────────────────────────────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

// ── Controllers ────────────────────────────────────────────────────────────────

/** POST /api/auth/register/admin */
const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, tenantId, secretKey } = req.body;
    const result = await authService.registerAdmin({ name, email, password, tenantId }, secretKey);
    
    res.status(201).json({ 
      success: true, 
      message: 'Admin registered successfully.', 
      data: result 
    });
  } catch (err) { 
    next(err); 
  }
};

/** POST /api/auth/register */
const register = async (req, res, next) => {
  try {
    console.log(`[Auth] Register attempt for email: ${req.body.email}, tenant: ${req.body.tenantId}`);
    
    if (!validate(req, res)) return;
    
    const tenantId = req.body.tenantId || process.env.DEFAULT_TENANT_ID || 'cszone';
    const { name, email, password, role } = req.body;
    const user = await authService.registerUser({ tenantId, name, email, password, role });
    
    console.log(`[Auth] User registered successfully: ${user._id}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully.', 
      data: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId
      } 
    });
  } catch (err) { 
    console.error(`[Auth] Registration error:`, err);
    next(err); 
  }
};


/** POST /api/auth/verify-email */
const verifyEmail = async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { email, code, tenantId } = req.body;
    await authService.verifyEmail(email, code, tenantId);

    res.json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    console.log(`[Auth] Login attempt: ${req.body.email}`);
    
    if (!validate(req, res)) return;
    
    const { tenantId, email, password } = req.body;
    const result = await authService.loginUser({ tenantId, email, password });
    
    console.log(`[Auth] Login successful: ${result.user._id}`);
    
    res.json({ success: true, message: 'Login successful.', data: result });
  } catch (err) { 
    console.error(`[Auth] Login error:`, err);
    next(err); 
  }
};


/** POST /api/auth/refresh */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required.' });
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
};

/** POST /api/auth/logout */
const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

/** GET /api/auth/me */
const getMe = (req, res) => {
  res.json({ success: true, data: req.user });
};

/** GET /api/auth/users (admin/hr only) */
const getUsers = async (req, res, next) => {
  try {
    const users = await authService.getTenantUsers(req.tenantId);
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

/** PATCH /api/auth/profile */
const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateUser(req.user._id, req.body);
    res.json({ success: true, message: 'Profile updated successfully.', data: user });
  } catch (err) { next(err); }
};

/** PATCH /api/auth/password */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPwd, newPwd } = req.body;
    if (!currentPwd || !newPwd) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    if (newPwd.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    await authService.updatePassword(req.user._id, currentPwd, newPwd);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerAdmin,
  register,
  verifyEmail,
  registerValidation,
  login,
  loginValidation,
  verifyValidation,
  registerAdminValidation,
  refreshValidation,
  updateProfileValidation,
  refresh,
  logout,
  getMe,
  getUsers,
  updateProfile,
  updatePassword
};
