// controllers/userController.js
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Sync user cart from frontend to database
// @route   POST /api/user/cart/sync
// @access  Private (Requires Login)
const syncCart = async (req, res) => {
  try {
    const { cartItems } = req.body; 
    
    // cartItems should be an array of objects: [{ id: "product_id", quantity: 2 }]
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: 'Invalid cart data' });
    }

    // Map the incoming frontend data to match the cartItemSchema in User.js
    const mappedCart = cartItems.map(item => ({
      productId: item.id || item.productId, 
      quantity: item.quantity || 1
    }));

    // Find the user by the ID embedded in their login token and update the cart
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id || req.user._id, // Gotten from your auth middleware
      { $set: { cart: mappedCart } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Cart synced to database successfully'
    });

  } catch (error) {
    console.error('Cart sync error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync cart', 
      error: error.message 
    });
  }
};


const getCart = async (req, res) => {
  try {
    // 1. Find the logged-in user
    // 2. .select('+cart') forces Mongoose to include the hidden cart field
    // 3. .populate('cart.productId') replaces the raw ID with the FULL product document from the Product model
    const user = await User.findById(req.user.id || req.user._id)
      .select('+cart')
      .populate('cart.productId'); 

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 4. Map the populated data into a clean array for your React frontend
    const formattedCart = user.cart
      .filter(item => item.productId !== null) // Safety check: removes items if the product was deleted from the main database
      .map(item => {
        const product = item.productId; // This is now the FULL Product document
        
        return {
          id: product._id,
          title: product.title,
          price: product.price,
          brand: product.brand,
          category: product.category,
          // Safely grab the first image
          image: product.images && product.images.length > 0 ? product.images[0] : (product.imageUrl || ''),
          quantity: item.quantity
        };
      });

    // 5. Send it back to the frontend
    res.status(200).json({
      success: true,
      cart: formattedCart
    });

  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart', error: error.message });
  }
};
module.exports = {
  syncCart,
  getCart
};