const protect = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  req.user = { id: userId, role: req.headers['x-user-role'] || 'user' };
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
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

module.exports = { protect, authorize, verifyAdmin };