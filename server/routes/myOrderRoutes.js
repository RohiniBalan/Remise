const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { generateInvoicePdf } = require('../utils/invoiceGenerator');

// Helper: build comprehensive, professional invoice data from order & store DB
const buildInvoiceData = (order) => {
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
    price: item.price || 0,
    quantity: item.quantity || 1,
    subtotal: (item.price || 0) * (item.quantity || 1),
    image: item.image || null,
  }));

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalAmount = order.totalAmount || subtotal;

  const paymentMethodMap = {
    qr: 'UPI / QR Payment',
    phonepe: 'PhonePe UPI / NetBanking',
    cod: 'Cash on Delivery',
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
    deliveryMethod: 'delivery',
    deliveryMethodFormatted: 'Standard Delivery',
    store: {
      name: 'Remise Store',
      email: 'support@remise.in',
      phone: '+91 98765 43210',
      address: { street: 'Main Commercial Hub', city: 'Chennai', state: 'Tamil Nadu', pinCode: '600001', country: 'India' },
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

// @route   GET /api/orders/my-orders
// @desc    Get all orders for the currently logged-in user
router.get('/my-orders', async (req, res) => {
    try {
        const { userId, email } = req.query;

        if (!userId && !email) {
            return res.status(400).json({ success: false, message: 'User ID or Email is required to fetch orders.' });
        }

        // Build a query to find orders matching EITHER the userId OR the contactEmail
        const queryConditions = [];
        if (userId && userId !== 'undefined' && userId !== 'null') {
            queryConditions.push({ userId: userId });
        }
        if (email && email !== 'undefined' && email !== 'null') {
            queryConditions.push({ contactEmail: email });
        }

        if (queryConditions.length === 0) {
            return res.status(400).json({ success: false, message: 'Valid user credentials required.' });
        }

        // Find matching orders and sort by newest first
        const orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch your orders' });
    }
});

// @route   GET /api/orders/:orderId/invoice
router.get('/:orderId/invoice', async (req, res) => {
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

        const invoiceData = buildInvoiceData(order);
        res.status(200).json({ success: true, data: invoiceData });
    } catch (error) {
        console.error('Error generating invoice data:', error);
        res.status(500).json({ success: false, message: 'Failed to generate invoice', error: error.message });
    }
});

// @route   GET /api/orders/:orderId/invoice/pdf
router.get('/:orderId/invoice/pdf', async (req, res) => {
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


        const invoiceData = buildInvoiceData(order);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.orderId}.pdf"`);

        generateInvoicePdf(invoiceData, res);
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to generate invoice PDF', error: error.message });
        }
    }
});

module.exports = router;