const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const {
  registerAdmin, register, registerValidation,
  login, loginValidation,
  refresh, logout, getMe, getUsers, updateProfile, updatePassword,
} = require('../controllers/auth.controller');

// Public routes
router.post('/register/admin', registerAdmin);
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, updatePassword);
router.get('/users', protect, authorize('admin'), getUsers);

module.exports = router;
