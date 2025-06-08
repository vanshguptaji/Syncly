const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register-otp', authController.registerOTP);
router.post('/verify-otp', authController.verifyAndRegister);
router.post('/check-otp', authController.checkOTP);

router.post('/login', authController.login);

router.get('/logout', protect, authController.logout);

router.get('/me', protect, authController.getCurrentUser);

module.exports = router;
