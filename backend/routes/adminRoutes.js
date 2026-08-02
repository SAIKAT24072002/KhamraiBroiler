const express = require('express');
const router = express.Router();
const { uploadSingleFile } = require('../controllers/adminController');
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Central upload endpoint
router.post('/upload', protect, authorize(['admin', 'manager', 'sales', 'inventory']), upload.single('image'), uploadSingleFile);

// Analytics
router.get('/analytics', protect, authorize(['admin', 'manager', 'sales']), getDashboardAnalytics);

// Audit logs
router.get('/audit-logs', protect, authorize(['admin']), getAuditLogs);

module.exports = router;
