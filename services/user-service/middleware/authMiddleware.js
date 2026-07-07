/**
 * Lightweight auth middleware for downstream services.
 * Trusts x-user-* headers set by the API Gateway after JWT verification.
 */
const protect = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  req.user = { id: userId, role: userRole || 'user' };
  next();
};

const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  req.isAdmin = true;
  next();
};

module.exports = { protect, verifyAdmin };
