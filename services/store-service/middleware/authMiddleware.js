/**
 * Lightweight auth middleware for store-service.
 * The API Gateway verifies the JWT and injects x-user-* headers.
 * This middleware simply reads those trusted internal headers.
 */

const protect = (req, res, next) => {
  const userId   = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authorized — please log in.' });
  }

  req.user = { id: userId, role: userRole };
  next();
};

const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin privileges required.' });
  }
  next();
};

module.exports = { protect, verifyAdmin };
