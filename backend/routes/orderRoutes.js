const express = require('express');
const router = express.Router();
const { createOrder, createGuestOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, updatePaymentStatus, printInvoice } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public guest checkout (no auth required)
router.post('/guest', createGuestOrder);

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/', protect, authorize(['admin', 'manager', 'sales']), getAllOrders);
router.put('/:id/status', protect, authorize(['admin', 'manager', 'sales']), updateOrderStatus);
router.put('/:id/payment', protect, authorize(['admin', 'manager', 'sales']), updatePaymentStatus);
router.get('/:id/invoice', protect, printInvoice);

module.exports = router;
