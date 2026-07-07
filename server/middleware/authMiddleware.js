const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Verify if user is admin by checking their role in database
const verifyAdmin = async (req, res, next) => {
  try {
    // Check if user exists in request (from protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get fresh user data from database to ensure role is current
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user role is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Attach admin status to request for future use
    req.isAdmin = true;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying admin status',
      error: error.message
    });
  }
};

// Alternative: Verify admin by user ID directly (without req.user)
const verifyAdminById = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required'
      };
    }

    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const isAdmin = user.role === 'admin';

    return {
      success: true,
      isAdmin,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return {
      success: false,
      message: 'Error verifying admin status',
      error: error.message
    };
  }
};

module.exports = { 
  protect, 
  authorize, 
  verifyAdmin,
  verifyAdminById 
};