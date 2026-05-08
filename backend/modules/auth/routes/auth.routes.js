const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const {
  register, registerValidation,
  login, loginValidation,
  refresh, logout, getMe, getUsers, updateProfile,
} = require('../controllers/auth.controller');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.get('/users', protect, authorize('admin', 'hr'), getUsers);

module.exports = router;
