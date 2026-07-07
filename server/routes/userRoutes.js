// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { syncCart ,getCart} = require('../controllers/userController');
const jwt = require('jsonwebtoken');

// Simple middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid or expired token' });
      req.user = decoded; // Attaches the user ID to the request
      next();
    });
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Route: POST /api/user/cart/sync
router.post('/cart/sync', verifyToken, syncCart);
router.get('/cart', verifyToken, getCart);

module.exports = router;