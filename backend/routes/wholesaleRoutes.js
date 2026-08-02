const express = require('express');
const router = express.Router();
const { submitEnquiry, getEnquiries, updateEnquiryStatus } = require('../controllers/wholesaleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', submitEnquiry);
router.get('/', protect, authorize(['admin', 'manager', 'sales']), getEnquiries);
router.put('/:id/status', protect, authorize(['admin', 'manager', 'sales']), updateEnquiryStatus);

module.exports = router;
