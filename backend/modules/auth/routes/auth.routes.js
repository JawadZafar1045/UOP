const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const { validateResult } = require('../../shared/middlewares/validation.middleware');
const { authLimiter } = require('../../shared/middlewares/security.middleware');
const {
  registerAdmin, register, registerValidation,
  verifyEmail, verifyValidation, getPublicPrograms,
  login, loginValidation, registerAdminValidation,
  refreshValidation, updateProfileValidation,
  refresh, logout, getMe, getUsers, updateProfile, updatePassword,
} = require('../controllers/auth.controller');

// Public routes with strict rate limiting and request validation
router.get('/programs', getPublicPrograms);
router.post('/register/admin', authLimiter, registerAdminValidation, validateResult, registerAdmin);
router.post('/register', authLimiter, registerValidation, validateResult, register);
router.post('/verify-email', authLimiter, verifyValidation, validateResult, verifyEmail);
router.post('/login', authLimiter, loginValidation, validateResult, login);
router.post('/refresh', authLimiter, refreshValidation, validateResult, refresh);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfileValidation, validateResult, updateProfile);
router.patch('/password', protect, updatePassword);
router.get('/users', protect, authorize('admin'), getUsers);

module.exports = router;
