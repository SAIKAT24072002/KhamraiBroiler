const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Get all staff members. (Admin/Manager only)
 * Endpoint: GET /api/staff
 */
const getStaffList = async (req, res, next) => {
  try {
    const staff = await User.find({
      role: { $in: ['admin', 'manager', 'sales', 'inventory'] }
    }).sort({ role: 1, name: 1 });

    res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
};

/**
 * Adds / registers a staff user profile or changes an existing customer to staff.
 * Endpoint: POST /api/staff
 */
const addStaffMember = async (req, res, next) => {
  try {
    const { name, mobile, email, role } = req.body;

    if (!mobile || !role) {
      res.status(400);
      throw new Error('Mobile number and staff role are required.');
    }

    if (!['admin', 'manager', 'sales', 'inventory'].includes(role)) {
      res.status(400);
      throw new Error('Invalid staff role.');
    }

    const cleanMobile = mobile.replace(/\s+/g, '');
    let user = await User.findOne({ mobile: cleanMobile });

    if (user) {
      // User exists - update role to staff
      const oldRole = user.role;
      user.role = role;
      if (name) user.name = name;
      if (email !== undefined) user.email = email;
      user.status = 'active';
      await user.save();

      await AuditLog.create({
        action: 'STAFF_PROMOTED',
        performedBy: req.user._id,
        details: `Promoted existing user ${cleanMobile} to role '${role}' (was '${oldRole}')`,
        targetId: user._id,
        targetModel: 'User'
      });
    } else {
      // Create new user profile as staff
      user = await User.create({
        mobile: cleanMobile,
        name: name || 'Staff Member',
        email: email || '',
        role,
        status: 'active'
      });

      await AuditLog.create({
        action: 'STAFF_ADDED',
        performedBy: req.user._id,
        details: `Created new staff member: ${user.name} (${cleanMobile}) with role '${role}'`,
        targetId: user._id,
        targetModel: 'User'
      });
    }

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Edit staff details or role. (Admin only)
 * Endpoint: PUT /api/staff/:id
 */
const updateStaffMember = async (req, res, next) => {
  try {
    const { name, role, status } = req.body;
    const staffUser = await User.findById(req.params.id);

    if (!staffUser) {
      res.status(404);
      throw new Error('Staff member not found.');
    }

    // Protect against self-modification of admin role
    if (staffUser._id.toString() === req.user._id.toString() && role && role !== staffUser.role) {
      res.status(400);
      throw new Error('You cannot change your own role.');
    }

    if (name) staffUser.name = name;
    if (role) {
      if (!['admin', 'manager', 'sales', 'inventory', 'customer'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role.');
      }
      staffUser.role = role;
    }
    if (status) staffUser.status = status;

    const updated = await staffUser.save();

    await AuditLog.create({
      action: 'STAFF_UPDATED',
      performedBy: req.user._id,
      details: `Updated details for staff user: ${staffUser.name} (${staffUser.mobile})`,
      targetId: staffUser._id,
      targetModel: 'User'
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaffList,
  addStaffMember,
  updateStaffMember
};
