const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

/**
 * @desc    Get Admin Dashboard Statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      revenueResult,
      totalOrders,
      activeCustomers,
      totalProducts,
      totalStoreOwners,
      totalWholesalers,
      totalHomeBusinesses,
      totalUsers,
      recentOrdersRaw
    ] = await Promise.all([
      // Total Revenue: Excludes failed payments and cancelled orders
      Order.aggregate([
        {
          $match: {
            orderStatus: { $ne: 'Cancelled' },
            paymentStatus: { $ne: 'FAILED' }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      ]),
      // Total Orders
      Order.countDocuments(),
      // Active Customers (roles: customer or user)
      User.countDocuments({ role: { $in: ['customer', 'user'] } }),
      // Products in Catalog
      Product.countDocuments(),
      // Total Store Owners
      User.countDocuments({ role: 'store_owner' }),
      // Total Wholesalers (handling both role variations: wholesaler and whole_saler)
      User.countDocuments({ role: { $in: ['wholesaler', 'whole_saler'] } }),
      // Total Home Businesses
      User.countDocuments({ role: 'home_business' }),
      // Total Users (all non-admin registered accounts)
      User.countDocuments({ role: { $ne: 'admin' } }),
      // Recent Orders for dashboard list
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'fullname email')
    ]);

    const totalRevenue = revenueResult.length > 0 && revenueResult[0].totalRevenue 
      ? revenueResult[0].totalRevenue 
      : 0;

    const formattedRecentOrders = recentOrdersRaw.map(order => {
      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
      const productTitle = firstItem ? firstItem.title : (order.orderId || 'Order');
      const customerName = (order.userId && order.userId.fullname)
        ? order.userId.fullname
        : (order.shippingAddress && order.shippingAddress.firstName
            ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim()
            : (order.contactEmail || 'Guest Customer'));

      return {
        id: order.orderId ? `#${order.orderId}` : `#${order._id.toString().slice(-6).toUpperCase()}`,
        _id: order._id,
        product: productTitle,
        itemCount: order.items ? order.items.length : 1,
        customer: customerName,
        email: order.contactEmail || (order.userId && order.userId.email) || '',
        amount: `₹${(order.totalAmount || 0).toLocaleString('en-IN')}`,
        rawAmount: order.totalAmount || 0,
        status: order.orderStatus || 'Processing',
        paymentStatus: order.paymentStatus || 'PENDING',
        paymentMethod: order.paymentMethod || 'N/A',
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
        recentOrders: formattedRecentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAdminDashboardStats
};
