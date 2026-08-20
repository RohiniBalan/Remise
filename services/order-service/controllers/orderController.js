const crypto = require('crypto');
const Order = require('../models/Order');
const { notifyCustomerOrderParties, notifyWholeSaleOrderParties } = require('../utils/notifications');


// Internal: create order (called by payment-service)
// const createOrder = async (req, res) => {
//   try {
//     const order = await Order.create(req.body);
//     res.status(201).json({ success: true, data: order });
//   } catch (error) {
//     if (error.code === 11000) return res.status(409).json({ success: false, message: 'Order ID already exists' });
//     res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
//   }
// };

const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // Send notifications after the order is successfully created.
    // Notification failure must not make the order fail.
    notifyCustomerOrderParties(order).catch((error) => {
      console.error(
        '[Order Notification] Background notification failed:',
        error.message
      );
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Order ID already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

// Internal: get order by orderId (called by payment-service)
const getOrderByOrderId = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
  }
};

// Internal: update payment status (called by payment-service)
const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    const order = await Order.findOneAndUpdate(
      { orderId },
      { paymentStatus },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payment status', error: error.message });
  }
};

// Admin: get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// Admin: update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// User: get own orders
const getMyOrders = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { userId, email } = req.query;
    if (!userId && !email) {
      return res.status(400).json({ success: false, message: 'User ID or Email is required to fetch orders.' });
    }

    const conditions = [];
    if (userId && userId !== 'undefined' && userId !== 'null') conditions.push({ userId });
    if (email && email !== 'undefined' && email !== 'null') conditions.push({ contactEmail: email });

    if (!conditions.length) {
      return res.status(400).json({ success: false, message: 'Valid user credentials required.' });
    }

    const orders = await Order.find({ $or: conditions }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch your orders' });
  }
};

// Store owner: orders placed against their store (e.g. via Smart Order Comparison)
const getOrdersByStore = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const orders = await Order.find({ storeId: req.params.storeId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch store orders' });
  }
};

// Customer: self-declares a QR payment as complete (optionally with a screenshot).
// No auth middleware — the orderId itself (an unguessable 'TXN...' token) is the
// access token here, same convention already used by getMyOrders and
// payment-service's GET /status/:orderId, which keeps guest checkout working.
const confirmQrPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.paymentMethod !== 'qr') {
      return res.status(400).json({ success: false, message: 'This order is not a QR payment.' });
    }
    if (order.paymentStatus === 'SUCCESS') {
      return res.status(200).json({ success: true, data: order });
    }

    order.paymentStatus = 'SUCCESS';
    if (req.file) order.paymentProofImage = `/uploads/payment-proofs/${req.file.filename}`;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm payment', error: error.message });
  }
};

// Store owner: places a direct B2B order against a wholesaler/home business.
const createWholesaleOrder = async (req, res) => {
  try {
    const { supplierStoreId, supplierStoreName, supplierRole, items, notes } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderId = `WS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const order = await Order.create({
      orderId,
      buyerId: req.user.id,
      buyerRole: req.user.role,
      contactEmail: req.user.email || req.body.contactEmail,
      storeId: supplierStoreId,
      storeName: supplierStoreName,
      supplierRole,
      items,
      totalAmount,
      paymentMethod: 'qr',
      paymentStatus: 'PENDING',
      orderStatus: 'Processing',
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress,
    });

    notifyWholesaleOrderParties(order).catch((error) => {
  console.error(
    '[Wholesale Notification] Background notification failed:',
    error.message
  );
});

    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
};

// Store owner: orders THEY placed as a buyer (mirrors getOrdersByStore but from the buyer's side)
const getOrdersByBuyer = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const orders = await Order.find({ buyerId: req.params.buyerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch your orders' });
  }
};

// Stats: revenue, total orders and recent orders (internal / admin)
const getOrderStats = async (req, res) => {
  try {
    const [revenueResult, totalOrders, recentOrdersRaw] = await Promise.all([
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
      Order.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5)
    ]);

    const totalRevenue =
      revenueResult.length > 0 && revenueResult[0].totalRevenue
        ? revenueResult[0].totalRevenue
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        recentOrders: recentOrdersRaw
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};

const axios = require('axios');
const { generateInvoicePdf } = require('../utils/invoiceGenerator');

const STORE_SERVICE_URL = process.env.STORE_SERVICE_URL || 'http://localhost:3005';


// Helper: build comprehensive, professional invoice data from order & store DB
const buildInvoiceData = async (order) => {
  let storeDetails = null;

  if (order.storeId) {
    try {
      const storeRes = await axios.get(`${STORE_SERVICE_URL}/api/stores/internal/${order.storeId}`, { timeout: 3000 });
      if (storeRes.data?.success && storeRes.data.data) {
        storeDetails = storeRes.data.data;
      }
    } catch (err) {
      console.warn(`[Invoice] Could not fetch store metadata for ${order.storeId}:`, err.message);
    }
  }

  const shipping = order.shippingAddress || {};
  const billing = order.billingAddress || shipping;
  const customerName = [shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || 'Customer';
  const customerAddress = [
    shipping.address,
    shipping.apartment,
    shipping.city,
    shipping.state,
    shipping.pinCode,
    shipping.country
  ].filter(Boolean).join(', ');

  const items = (order.items || []).map(item => ({
    productId: item.productId,
    title: item.title,
    brand: item.brand || null,
    price: item.price || 0,
    quantity: item.quantity || 1,
    subtotal: (item.price || 0) * (item.quantity || 1),
    image: item.image || null,
    tierLabel: item.tierLabel || null,
    moq: item.moq || null,
  }));

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalAmount = order.totalAmount || subtotal;

  const paymentMethodMap = {
    qr: 'UPI / QR Payment',
    phonepe: 'PhonePe UPI / NetBanking',
    cod: 'Cash on Delivery',
  };

  const deliveryMethodMap = {
    pickup: 'Self Store Pickup',
    delivery: 'Home Delivery',
  };

  const invoiceDate = order.createdAt ? new Date(order.createdAt) : new Date();

  return {
    invoiceNumber: `INV-${order.orderId}`,
    orderId: order.orderId,
    paymentId: order.orderId,
    invoiceDate: invoiceDate.toISOString(),
    invoiceDateFormatted: invoiceDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    paymentMethod: order.paymentMethod,
    paymentMethodFormatted: paymentMethodMap[order.paymentMethod] || (order.paymentMethod ? order.paymentMethod.toUpperCase() : 'UPI / QR Payment'),
    paymentStatus: order.paymentStatus || 'SUCCESS',
    orderStatus: order.orderStatus || 'Processing',
    deliveryMethod: order.deliveryMethod || 'delivery',
    deliveryMethodFormatted: deliveryMethodMap[order.deliveryMethod] || 'Home Delivery',
    paymentProofImage: order.paymentProofImage || null,
    store: {
      id: order.storeId || storeDetails?._id || null,
      name: storeDetails?.name || order.storeName || 'Remise Store',
      ownerName: storeDetails?.ownerName || null,
      email: storeDetails?.email || 'support@remise.in',
      phone: storeDetails?.phone || '+91 98765 43210',
      upiId: storeDetails?.upiId || null,
      address: storeDetails?.address || { street: 'Main Commercial Hub', city: 'Chennai', state: 'Tamil Nadu', pinCode: '600001', country: 'India' },
      category: storeDetails?.category || null,
    },
    customer: {
      name: customerName,
      email: order.contactEmail || 'customer@remise.in',
      phone: shipping.phone || billing.phone || '',
      address: customerAddress || 'Address not provided',
      rawAddress: shipping,
    },
    items,
    summary: {
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: subtotal,
      discount: 0,
      tax: 0,
      shipping: 0,
      totalAmount: totalAmount,
    }
  };
};

// User / Store: Get JSON invoice data for a completed payment
const getOrderInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isCod = order.paymentMethod === 'cod' || order.paymentMethod === 'cash';
    if (order.paymentStatus !== 'SUCCESS' && !isCod) {
      return res.status(400).json({
        success: false,
        message: 'Bill/Invoice is only available after payment confirmation or for Cash on Delivery orders.',
        paymentStatus: order.paymentStatus
      });
    }

    const invoiceData = await buildInvoiceData(order);
    res.status(200).json({ success: true, data: invoiceData });
  } catch (error) {
    console.error('Error generating invoice data:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice', error: error.message });
  }
};

// User / Store: Download PDF invoice
const downloadOrderInvoicePdf = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isCod = order.paymentMethod === 'cod' || order.paymentMethod === 'cash';
    if (order.paymentStatus !== 'SUCCESS' && !isCod) {
      return res.status(400).json({
        success: false,
        message: 'Bill/Invoice is only available after payment confirmation or for Cash on Delivery orders.',
        paymentStatus: order.paymentStatus
      });
    }


    const invoiceData = await buildInvoiceData(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.orderId}.pdf"`);

    generateInvoicePdf(invoiceData, res);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate invoice PDF', error: error.message });
    }
  }
};

// ── Delivery Portal & Tracking Functions ────────────────────────────────────

// Store Owner: Generate a unique secure delivery link for an order
const generateDeliveryLink = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonName, deliveryPersonPhone, notes } = req.body;

    const order = await Order.findOne({
      $or: [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Generate a secure 48-char hex token if not already present
    let token = order.deliveryToken;
    if (!token) {
      token = crypto.randomBytes(24).toString('hex');
      order.deliveryToken = token;
    }

    order.deliveryMode = 'own_delivery';
    if (!order.deliveryStatus || order.deliveryStatus === 'Pending') {
      order.deliveryStatus = 'Assigned';
    }

    order.deliveryPerson = {
      name: deliveryPersonName || order.deliveryPerson?.name || '',
      phone: deliveryPersonPhone || order.deliveryPerson?.phone || '',
      assignedAt: order.deliveryPerson?.assignedAt || new Date(),
      acceptedAt: order.deliveryPerson?.acceptedAt || null,
      pickedUpAt: order.deliveryPerson?.pickedUpAt || null,
      outForDeliveryAt: order.deliveryPerson?.outForDeliveryAt || null,
      deliveredAt: order.deliveryPerson?.deliveredAt || null,
      notes: notes || order.deliveryPerson?.notes || ''
    };

    if (!order.deliveryTimeline || order.deliveryTimeline.length === 0) {
      order.deliveryTimeline = [{
        status: 'Assigned',
        timestamp: new Date(),
        updatedBy: 'Store Owner',
        note: notes || 'Delivery link created and assigned'
      }];
    } else {
      order.deliveryTimeline.push({
        status: 'Assigned',
        timestamp: new Date(),
        updatedBy: 'Store Owner',
        note: notes || 'Delivery link updated/re-generated'
      });
    }

    await order.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    const deliveryUrl = `${frontendUrl}/delivery/${token}`;

    res.status(200).json({
      success: true,
      message: 'Delivery link generated successfully',
      data: {
        orderId: order.orderId,
        deliveryToken: token,
        deliveryUrl,
        deliveryStatus: order.deliveryStatus,
        deliveryPerson: order.deliveryPerson,
        deliveryTimeline: order.deliveryTimeline
      }
    });
  } catch (error) {
    console.error('Error generating delivery link:', error);
    res.status(500).json({ success: false, message: 'Failed to generate delivery link', error: error.message });
  }
};

// Delivery Person: Public token-authenticated order details
const getDeliveryPortalOrder = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Delivery token is required' });
    }

    const order = await Order.findOne({ deliveryToken: token });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Invalid or expired delivery link' });
    }

    // Sanitize and return only the relevant delivery and order info
    const customerName = [order.shippingAddress?.firstName, order.shippingAddress?.lastName].filter(Boolean).join(' ') || 'Customer';
    const customerPhone = order.shippingAddress?.phone || '';
    const fullAddress = [
      order.shippingAddress?.address,
      order.shippingAddress?.apartment,
      order.shippingAddress?.city,
      order.shippingAddress?.state,
      order.shippingAddress?.pinCode
    ].filter(Boolean).join(', ');

    const data = {
      orderId: order.orderId,
      storeId: order.storeId,
      storeName: order.storeName || 'Remise Partner Store',
      contactEmail: order.contactEmail,
      customerName,
      customerPhone,
      deliveryAddress: {
        address: order.shippingAddress?.address || '',
        apartment: order.shippingAddress?.apartment || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        pinCode: order.shippingAddress?.pinCode || '',
        country: order.shippingAddress?.country || 'India',
        fullAddress
      },
      items: (order.items || []).map(i => ({
        productId: i.productId,
        title: i.title,
        brand: i.brand || '',
        quantity: i.quantity,
        price: i.price,
        image: i.image || ''
      })),
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryMethod: order.deliveryMethod || 'delivery',
      deliveryStatus: order.deliveryStatus || 'Assigned',
      deliveryMode: order.deliveryMode || 'own_delivery',
      deliveryPerson: order.deliveryPerson || {},
      deliveryTimeline: order.deliveryTimeline || [],
      createdAt: order.createdAt
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching delivery portal order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch delivery order details', error: error.message });
  }
};

// Delivery Person: Update status (Assigned -> Accepted -> Picked Up -> Out for Delivery -> Delivered)
const updateDeliveryPortalStatus = async (req, res) => {
  try {
    const { token } = req.params;
    const { status, note, deliveryPersonName, deliveryPersonPhone } = req.body;

    const validStatuses = ['Assigned', 'Accepted', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findOne({ deliveryToken: token });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Invalid or expired delivery link' });
    }

    order.deliveryStatus = status;

    if (!order.deliveryPerson) {
      order.deliveryPerson = {};
    }

    if (deliveryPersonName) order.deliveryPerson.name = deliveryPersonName;
    if (deliveryPersonPhone) order.deliveryPerson.phone = deliveryPersonPhone;

    const now = new Date();
    if (status === 'Accepted') order.deliveryPerson.acceptedAt = now;
    if (status === 'Picked Up') order.deliveryPerson.pickedUpAt = now;
    if (status === 'Out for Delivery') order.deliveryPerson.outForDeliveryAt = now;
    if (status === 'Delivered') {
      order.deliveryPerson.deliveredAt = now;
      order.orderStatus = 'Delivered';
      // If Cash on Delivery, mark as paid upon delivery
      if (order.paymentMethod === 'cod' || order.paymentMethod === 'cash') {
        order.paymentStatus = 'SUCCESS';
      }
    }

    order.deliveryTimeline = order.deliveryTimeline || [];
    order.deliveryTimeline.push({
      status,
      timestamp: now,
      updatedBy: order.deliveryPerson.name || 'Delivery Person',
      note: note || `Order status updated to ${status}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: {
        orderId: order.orderId,
        deliveryStatus: order.deliveryStatus,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        deliveryPerson: order.deliveryPerson,
        deliveryTimeline: order.deliveryTimeline
      }
    });
  } catch (error) {
    console.error('Error updating delivery portal status:', error);
    res.status(500).json({ success: false, message: 'Failed to update delivery status', error: error.message });
  }
};

// Store Owner: Set delivery mode (own_delivery, portal_delivery, self_arrange)
const setDeliveryMode = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { mode, notes } = req.body;

    const validModes = ['own_delivery', 'portal_delivery', 'self_arrange'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery mode. Must be one of: ${validModes.join(', ')}`
      });
    }

    const order = await Order.findOne({
      $or: [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.deliveryMode = mode;
    const now = new Date();

    if (mode === 'portal_delivery') {
      order.deliveryStatus = 'Assigned';
    } else if (mode === 'self_arrange') {
      if (!order.deliveryStatus || order.deliveryStatus === 'Pending') {
        order.deliveryStatus = 'Ready';
      }
    }

    order.deliveryTimeline = order.deliveryTimeline || [];
    order.deliveryTimeline.push({
      status: order.deliveryStatus || 'Pending',
      timestamp: now,
      updatedBy: 'Store Owner',
      note: notes || `Delivery mode set to: ${mode}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Delivery mode updated to ${mode}`,
      data: order
    });
  } catch (error) {
    console.error('Error setting delivery mode:', error);
    res.status(500).json({ success: false, message: 'Failed to set delivery mode', error: error.message });
  }
};

// Store Owner / Admin: Direct delivery status update
const updateDeliveryStatusDirect = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Pending', 'Assigned', 'Accepted', 'Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findOne({
      $or: [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.deliveryStatus = status;
    const now = new Date();

    if (status === 'Delivered') {
      order.orderStatus = 'Delivered';
      if (order.paymentMethod === 'cod' || order.paymentMethod === 'cash') {
        order.paymentStatus = 'SUCCESS';
      }
    }

    order.deliveryTimeline = order.deliveryTimeline || [];
    order.deliveryTimeline.push({
      status,
      timestamp: now,
      updatedBy: 'Store Owner',
      note: notes || `Delivery status changed to ${status}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Error updating direct delivery status:', error);
    res.status(500).json({ success: false, message: 'Failed to update delivery status', error: error.message });
  }
};

module.exports = {
  createOrder, getOrderByOrderId, updatePaymentStatus,
  getAllOrders, updateOrderStatus, getMyOrders,
  getOrdersByStore, confirmQrPayment,
  createWholesaleOrder, getOrdersByBuyer,
  getOrderStats,
  getOrderInvoice, downloadOrderInvoicePdf,
  generateDeliveryLink, getDeliveryPortalOrder, updateDeliveryPortalStatus,
  setDeliveryMode, updateDeliveryStatusDirect
};




