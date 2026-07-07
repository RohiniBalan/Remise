const Order = require('../models/Order');

// Internal: create order (called by payment-service)
const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Order ID already exists' });
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
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

module.exports = {
  createOrder, getOrderByOrderId, updatePaymentStatus,
  getAllOrders, updateOrderStatus, getMyOrders,
  getOrdersByStore, confirmQrPayment,
};
