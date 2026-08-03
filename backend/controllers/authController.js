const jwt = require('jsonwebtoken');
const User = require('../models/User');
const otpService = require('../utils/otpService');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'khamrai_broiler_center_super_secret_key_12345', {
    expiresIn: '30d'
  });
};

/**
 * Login or Register user using only 10-digit mobile number (No OTP).
 * Endpoint: POST /api/auth/login
 */
const loginWithPhone = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      res.status(400);
      throw new Error('Mobile number is required.');
    }

    // Clean and validate 10-digit mobile
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      res.status(400);
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    // Check if user already exists
    let user = await User.findOne({ mobile: cleanMobile });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Register new user as customer
      user = await User.create({
        mobile: cleanMobile,
        name: 'Customer',
        email: '',
        role: 'customer'
      });
    } else {
      // Check if active
      if (user.status === 'inactive') {
        res.status(403);
        throw new Error('Your account is deactivated. Please contact support.');
      }
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns current logged-in user profile.
 * Endpoint: GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized.');
    }
    
    res.status(200).json({
      id: req.user._id,
      name: req.user.name,
      mobile: req.user.mobile,
      email: req.user.email,
      role: req.user.role,
      loyaltyPoints: req.user.loyaltyPoints,
      status: req.user.status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates current logged-in customer details.
 * Endpoint: PUT /api/auth/me
 */
const updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found.');
    }

    if (name) user.name = name;
    if (email !== undefined) user.email = email;

    await user.save();

    res.status(200).json({
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
      status: user.status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Runs on backend boot to ensure initial Administrator account is seeded.
 */
const seedDefaultAdmin = async () => {
  try {
    // Normalize: strip spaces, +, and 91 prefix to store clean 10-digit number
    const adminMobile = (process.env.INITIAL_ADMIN_MOBILE || '9876543210').replace(/\s+/g, '').replace(/^\+?91/, '');
    const adminName = process.env.INITIAL_ADMIN_NAME || 'Admin Khamrai';

    const existingAdmin = await User.findOne({ mobile: adminMobile });
    if (!existingAdmin) {
      await User.create({
        mobile: adminMobile,
        name: adminName,
        email: 'admin@khamraibroiler.com',
        role: 'admin',
        status: 'active'
      });
      console.log(`[SEED] Seeded initial Admin user with Mobile: ${adminMobile}`);
    } else if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`[SEED] Updated user ${adminMobile} role to Admin.`);
    }
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed default Admin user:', error.message);
  }
};

module.exports = {
  loginWithPhone,
  getMe,
  updateMe,
  seedDefaultAdmin
};
