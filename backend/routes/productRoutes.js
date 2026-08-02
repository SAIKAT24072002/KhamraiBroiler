const express = require('express');
const router = express.Router();
const { getProducts, getProductBySlug, createProduct, updateProduct, duplicateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);
router.post('/', protect, authorize(['admin', 'manager', 'inventory']), createProduct);
router.put('/:id', protect, authorize(['admin', 'manager', 'inventory', 'sales']), updateProduct);
router.post('/:id/duplicate', protect, authorize(['admin', 'manager']), duplicateProduct);
router.delete('/:id', protect, authorize(['admin']), deleteProduct);

module.exports = router;
