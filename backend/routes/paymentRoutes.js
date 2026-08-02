const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPaymentSignature, handleRazorpayWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-signature', protect, verifyPaymentSignature);
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;
