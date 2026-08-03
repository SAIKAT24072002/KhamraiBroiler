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
 * Sends a 6-digit OTP to the customer's mobile number.
 * Endpoint: POST /api/auth/send-otp
 */
const requestOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      res.status(400);
      throw new Error('Mobile number is required.');
    }

    // Basic mobile validation (e.g. +91XXXXXXXXXX or clean digits)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(mobile)) {
      res.status(400);
      throw new Error('Invalid mobile number format. Please provide country code.');
    }

    const result = await otpService.sendOTP(mobile);
    if (!result.success) {
      res.status(400);
      throw new Error(result.message);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies OTP and logs in / registers the user.
 * Endpoint: POST /api/auth/verify-otp
 */
const verifyOtpAndLogin = async (req, res, next) => {
  try {
    // We now receive idToken from Firebase along with user info
    const { idToken, mobile, name, email } = req.body;
    
    if (!idToken || !mobile) {
      res.status(400);
      throw new Error('Firebase ID Token and mobile number are required.');
    }

    // Verify Firebase ID Token using Google Identity Toolkit REST API
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      res.status(500);
      throw new Error('Server configuration error: Firebase API Key missing');
    }

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json();
    if (data.error) {
      res.status(400);
      throw new Error('Invalid or expired Firebase token');
    }

    // Normalize mobile: strip spaces and leading '+' for consistent DB lookup
    const cleanMobile = mobile.replace(/\s+/g, '').replace(/^\+/, '');

    // Check if user already exists using the normalized mobile number
    let user = await User.findOne({ mobile: cleanMobile });
    if (!user) {
      // Fallback: try the raw mobile without spaces (in case it was stored with '+' prefix)
      const rawMobile = mobile.replace(/\s+/g, '');
      if (rawMobile !== cleanMobile) {
        user = await User.findOne({ mobile: rawMobile });
      }
    }
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Register new user
      user = await User.create({
        mobile: cleanMobile,
        name: name || 'Customer',
        email: email || '',
        role: 'customer' // Defaults to customer
      });
    }

    // Generate our backend JWT for consistent authorization
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
  requestOtp,
  verifyOtpAndLogin,
  getMe,
  updateMe,
  seedDefaultAdmin
};
