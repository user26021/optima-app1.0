const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply authentication to all chat routes
router.use(authMiddleware);

// Apply rate limiting for API calls
const chatRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes
  message: 'Too many chat requests, please try again later'
});

const aiRateLimit = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 AI requests per minute
  message: 'Too many AI requests, please wait before sending more messages'
});

// Chat session routes
router.post('/sessions', chatRateLimit, chatController.createSession);
router.get('/sessions', chatRateLimit, chatController.getSessions);
router.get('/sessions/:sessionId', chatRateLimit, chatController.getSession);
router.delete('/sessions/:sessionId', chatRateLimit, chatController.deleteSession);

// Chat message routes
router.post('/message', aiRateLimit, chatController.sendMessage);

module.exports = router;