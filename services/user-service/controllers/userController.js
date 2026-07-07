const axios = require('axios');
const User = require('../models/User');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

const syncCart = async (req, res) => {
  try {
    const { cartItems } = req.body;
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: 'Invalid cart data' });
    }

    const mappedCart = cartItems.map(item => ({
      productId: item.id || item.productId,
      quantity: item.quantity || 1,
    }));

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { cart: mappedCart } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'Cart synced to database successfully' });
  } catch (error) {
    console.error('Cart sync error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync cart', error: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+cart');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.cart.length) return res.status(200).json({ success: true, cart: [] });

    // Fetch product details from product-service
    const productIds = user.cart.map(item => item.productId.toString());
    let productsMap = {};

    try {
      const response = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/batch`, { ids: productIds });
      if (response.data?.success) {
        response.data.data.forEach(p => { productsMap[p._id.toString()] = p; });
      }
    } catch (err) {
      console.error('Could not fetch products from product-service:', err.message);
    }

    const formattedCart = user.cart
      .filter(item => productsMap[item.productId.toString()])
      .map(item => {
        const product = productsMap[item.productId.toString()];
        return {
          id: product._id,
          title: product.title,
          price: product.price,
          brand: product.brand,
          category: product.category,
          image: product.images?.length ? product.images[0] : (product.imageUrl || ''),
          quantity: item.quantity,
        };
      });

    res.status(200).json({ success: true, cart: formattedCart });
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server Error while fetching users' });
  }
};

module.exports = { syncCart, getCart, getAllUsers };
