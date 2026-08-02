const express = require('express');
const router = express.Router();
const { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', protect, authorize(['admin', 'manager']), createCategory);
router.put('/:id', protect, authorize(['admin', 'manager']), updateCategory);
router.delete('/:id', protect, authorize(['admin']), deleteCategory);

module.exports = router;
