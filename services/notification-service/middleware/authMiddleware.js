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
