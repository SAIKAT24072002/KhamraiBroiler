const express = require('express');
const router = express.Router();
const { getCoupons, validateCoupon, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getCoupons);
router.post('/validate', validateCoupon);
router.post('/', protect, authorize(['admin', 'manager']), createCoupon);
router.put('/:id', protect, authorize(['admin', 'manager']), updateCoupon);
router.delete('/:id', protect, authorize(['admin']), deleteCoupon);

module.exports = router;
