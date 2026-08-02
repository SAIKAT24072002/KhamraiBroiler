/**
 * Role authorization middleware. Checks if req.user has one of the allowed roles.
 * @param {string[]} roles - Array of permitted roles (e.g. ['admin', 'manager'])
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    // Admins always have access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Access restricted. Required permissions: [${roles.join(', ')}]. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = { authorize };
