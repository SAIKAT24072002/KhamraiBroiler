const express = require('express');
const router = express.Router();
const { getStaffList, addStaffMember, updateStaffMember } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize(['admin', 'manager']), getStaffList);
router.post('/', protect, authorize(['admin']), addStaffMember);
router.put('/:id', protect, authorize(['admin']), updateStaffMember);

module.exports = router;
