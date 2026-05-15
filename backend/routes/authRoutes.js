const express = require('express');
const router = express.Router();
const { getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Get authenticated user info (Clerk handles login/register via frontend)
router.get('/me', protect, getMe);

module.exports = router;
