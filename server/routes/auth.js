const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// Rate limiting for auth routes
const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per 15 minutes
  message: 'Too many authentication attempts'
});

// Public routes
router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;