const express = require('express');
const router = express.Router();
const { getOffers, createOffer, updateOffer, deleteOffer } = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getOffers);
router.post('/', protect, authorize(['admin', 'manager']), createOffer);
router.put('/:id', protect, authorize(['admin', 'manager']), updateOffer);
router.delete('/:id', protect, authorize(['admin']), deleteOffer);

module.exports = router;
