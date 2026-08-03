const express = require('express');
const router = express.Router();
const { loginWithPhone, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginWithPhone);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
