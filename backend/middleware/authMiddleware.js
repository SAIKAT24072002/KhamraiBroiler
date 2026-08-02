const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'khamrai_broiler_center_super_secret_key_12345');

      // Get user from token (exclude password details since we don't store passwords)
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found. Authorization failed.' });
      }

      if (req.user.status === 'inactive') {
        return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
      }

      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};

module.exports = { protect };
