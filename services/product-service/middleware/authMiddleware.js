const protect = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  req.user = { id: userId, role: req.headers['x-user-role'] || 'user' };
  next();
};

const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  req.isAdmin = true;
  next();
};

// Allow both admin and store_owner
const verifyAdminOrStoreOwner = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'store_owner') {
    return res.status(403).json({ success: false, message: 'Access denied. Store owner or admin required.' });
  }
  req.isAdmin = role === 'admin';
  next();
};

module.exports = { protect, verifyAdmin, verifyAdminOrStoreOwner };
