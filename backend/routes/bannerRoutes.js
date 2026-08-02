const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getBanners);
router.post('/', protect, authorize(['admin', 'manager']), createBanner);
router.put('/:id', protect, authorize(['admin', 'manager']), updateBanner);
router.delete('/:id', protect, authorize(['admin']), deleteBanner);

module.exports = router;
