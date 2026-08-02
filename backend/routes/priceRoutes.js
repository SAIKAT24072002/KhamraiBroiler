const express = require('express');
const router = express.Router();
const { updateDailyPrices, getPriceHistory } = require('../controllers/priceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/update', protect, authorize(['admin', 'manager']), updateDailyPrices);
router.get('/history', protect, authorize(['admin', 'manager', 'sales']), getPriceHistory);

module.exports = router;
