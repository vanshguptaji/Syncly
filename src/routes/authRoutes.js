const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Registration and authentication
router.post('/register-otp', authController.registerOTP);
router.post('/verify-otp', authController.verifyAndRegister);
router.post('/login', authController.login);
router.get('/logout', protect, authController.logout);
router.get('/me', protect, authController.getCurrentUser);

// Password reset flow
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/verify-reset-otp', authController.verifyPasswordResetOTP);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
