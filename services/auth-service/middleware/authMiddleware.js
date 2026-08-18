const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Trust headers forwarded by the API Gateway
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (userId) {
    req.user = { id: userId, role: userRole || 'user' };
    return next();
  }

  // Fallback: direct JWT verification (when calling auth-service directly in dev)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  }

  res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const expandedRoles = new Set(roles);
  if (expandedRoles.has('wholesaler') || expandedRoles.has('whole_saler')) {
    expandedRoles.add('wholesaler');
    expandedRoles.add('whole_saler');
  }
  if (expandedRoles.has('customer') || expandedRoles.has('user')) {
    expandedRoles.add('customer');
    expandedRoles.add('user');
  }

  if (!expandedRoles.has(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Role ${req.user?.role} is not authorized to access this route`,
    });
  }
  next();
};

const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  req.isAdmin = true;
  next();
};

const verifyAdminOrStoreOwner = (req, res, next) => {
  if (!['admin', 'store_owner'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Store owner or admin only.' });
  }
  next();
};

module.exports = { protect, authorize, verifyAdmin, verifyAdminOrStoreOwner  };
