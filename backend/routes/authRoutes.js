const express = require('express');
const router = express.Router();
const { requestOtp, verifyOtpAndLogin, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp', otpLimiter, requestOtp);
router.post('/verify-otp', verifyOtpAndLogin);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
