// middleware/verifyToken.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Token = require('../models/Token');

const verifyToken = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    // Check if token exists in database and is active
    const tokenDoc = await Token.findOne({ 
      token: token, 
      isActive: true 
    });

    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        // If user not found, deactivate token
        await Token.findByIdAndUpdate(tokenDoc._id, { isActive: false });
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update last used timestamp
      await Token.findByIdAndUpdate(tokenDoc._id, { 
        lastUsedAt: new Date() 
      });

      // Attach user and token info to request
      req.user = user;
      req.token = tokenDoc;
      
      next();
    } catch (jwtError) {
      // If JWT verification fails, deactivate token in database
      await Token.findByIdAndUpdate(tokenDoc._id, { isActive: false });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
};

// Optional: Middleware to check if token exists in DB (without JWT verification)
const checkTokenInDB = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const tokenDoc = await Token.findOne({ 
      token: token, 
      isActive: true 
    });

    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        message: 'Token not found or inactive'
      });
    }

    req.token = tokenDoc;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyToken, checkTokenInDB };