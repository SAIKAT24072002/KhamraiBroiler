const express = require('express');
const router = express.Router();
const { getReviews, createReview, updateReviewStatus, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getReviews);
router.post('/', protect, createReview);
router.put('/:id/status', protect, authorize(['admin', 'manager']), updateReviewStatus);
router.delete('/:id', protect, authorize(['admin']), deleteReview);

module.exports = router;
