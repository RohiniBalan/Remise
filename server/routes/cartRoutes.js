// routes/cartRoutes.js (or wherever your user routes are)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth'); // Your JWT auth middleware

// POST /api/user/cart/sync
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { cartItems } = req.body; // Expecting an array of { productId, quantity }

    // Map the incoming frontend cart items to the schema structure
    const mappedCart = cartItems.map(item => ({
      productId: item.id || item._id, // Depends on your frontend data structure
      quantity: item.quantity
    }));

    // Update the user's cart
    await User.findByIdAndUpdate(
      req.user.id, // ID from your JWT token
      { $set: { cart: mappedCart } }
    );

    res.status(200).json({ success: true, message: 'Cart synced successfully' });
  } catch (error) {
    console.error('Cart sync error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync cart' });
  }
});

module.exports = router;