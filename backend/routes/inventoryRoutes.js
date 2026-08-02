const express = require('express');
const router = express.Router();
const { adjustStock, getInventoryTransactions, getLowStockProducts } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/adjust', protect, authorize(['admin', 'manager', 'inventory']), adjustStock);
router.get('/transactions', protect, authorize(['admin', 'manager', 'inventory']), getInventoryTransactions);
router.get('/low-stock', protect, authorize(['admin', 'manager', 'inventory', 'sales']), getLowStockProducts);

module.exports = router;
