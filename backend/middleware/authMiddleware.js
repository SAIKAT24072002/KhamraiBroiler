const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Authentication has been completely removed.
  // We mock the user as an admin to allow all requests to pass.
  req.user = {
    _id: '000000000000000000000000',
    role: 'admin',
    name: 'Admin'
  };
  next();
};

module.exports = { protect };
