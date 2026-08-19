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

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004';

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server Error while fetching users' });
  }
};

const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      activeCustomers,
      totalStoreOwners,
      totalWholesalers,
      totalHomeBusinesses,
      totalUsers,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['customer', 'user'] } }),
      User.countDocuments({ role: 'store_owner' }),
      User.countDocuments({ role: { $in: ['wholesaler', 'whole_saler'] } }),
      User.countDocuments({ role: 'home_business' }),
      User.countDocuments({ role: { $ne: 'admin' } }),
    ]);

    let totalOrders = 0;
    let totalRevenue = 0;
    let recentOrders = [];
    let totalProducts = 0;

    // Fetch order stats from order-service
    try {
      const orderRes = await axios.get(`${ORDER_SERVICE_URL}/api/orders/internal/stats`);
      if (orderRes.data?.success && orderRes.data?.data) {
        totalOrders = orderRes.data.data.totalOrders || 0;
        totalRevenue = orderRes.data.data.totalRevenue || 0;
        recentOrders = (orderRes.data.data.recentOrders || []).map((order) => {
          const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
          return {
            id: order.orderId ? `#${order.orderId}` : `#${order._id?.toString().slice(-6).toUpperCase()}`,
            _id: order._id,
            product: firstItem ? firstItem.title : (order.orderId || 'Order'),
            itemCount: order.items ? order.items.length : 1,
            customer: order.contactEmail || 'Customer',
            email: order.contactEmail || '',
            amount: `₹${(order.totalAmount || 0).toLocaleString('en-IN')}`,
            rawAmount: order.totalAmount || 0,
            status: order.orderStatus || 'Processing',
            paymentStatus: order.paymentStatus || 'PENDING',
            date: order.createdAt 
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recently'
          };
        });
      }
    } catch (err) {
      console.error('Could not fetch order stats from order-service:', err.message);
    }

    // Fetch product total from product-service
    try {
      const prodRes = await axios.get(`${PRODUCT_SERVICE_URL}/api/products?limit=1`);
      if (prodRes.data?.success) {
        totalProducts = prodRes.data.total || prodRes.data.count || 0;
      }
    } catch (err) {
      console.error('Could not fetch products total from product-service:', err.message);
    }

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        activeCustomers,
        totalProducts,
        totalStoreOwners,
        totalWholesalers,
        totalHomeBusinesses,
        totalUsers,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

module.exports = { syncCart, getCart, getAllUsers, getAdminDashboardStats };

