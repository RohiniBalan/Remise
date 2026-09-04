const axios      = require('axios');
const OfferOrder = require('../models/OfferOrder');
const Offer      = require('../models/Offer');
const { isStoreOwnedBy } = require('../utils/verifyStoreOwner');

const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009';
const STORE_SERVICE        = process.env.STORE_SERVICE_URL        || 'http://localhost:3007';

// ─── POST /api/offers/:id/order ──────────────────────────────────────────────
const placeOfferOrder = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer || !offer.isActive) {
      return res.status(404).json({ success: false, message: 'Offer not found or no longer active.' });
    }
    if (new Date() > offer.validUntil) {
      return res.status(400).json({ success: false, message: 'This offer has expired.' });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      city,
      state,
      pinCode,
      deliveryMethod = 'delivery',
      paymentMethod = 'cod',
      utrNumber,
      screenshot,
      quantity = 1,
      notes
    } = req.body;

    const total = offer.offerPrice * parseInt(quantity);
    const userId = req.headers['x-user-id'] || req.user?.id || null;

    const order = await OfferOrder.create({
      offerId:         offer._id.toString(),
      storeId:         offer.storeId,
      storeName:       offer.storeName,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress: deliveryAddress || '',
      city:            city || '',
      state:           state || '',
      pinCode:         pinCode || '',
      deliveryMethod:  deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
      paymentMethod:   paymentMethod || 'cod',
      paymentStatus:   (paymentMethod === 'online' || paymentMethod === 'razorpay') ? 'Completed' : 'Pending',
      utrNumber:       utrNumber || '',
      screenshot:      screenshot || '',
      offerTitle:      offer.title,
      offerImage:      offer.image,
      unitPrice:       offer.offerPrice,
      quantity:        parseInt(quantity),
      totalAmount:     total,
      notes:           notes || ''
    });

    // Increment order counter on offer
    await Offer.findByIdAndUpdate(req.params.id, { $inc: { orderCount: 1 } });

    // 1) Send notification to Store Owner (Seller)
    try {
      const storeRes = await axios.get(`${STORE_SERVICE}/api/stores/internal/${offer.storeId}`).catch(() => null);
      const store = storeRes?.data?.data;
      if (store?.ownerId) {
        const methodLabel = (paymentMethod || 'cod').toUpperCase();
        const deliveryLabel = deliveryMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery';
        axios.post(`${NOTIFICATION_SERVICE}/api/notifications/internal/create`, {
          userId:  store.ownerId,
          title:   `🛒 New Offer Order: ${offer.title}`,
          body:    `Order from ${customerName} (${parseInt(quantity)} pcs) · ₹${total} · ${deliveryLabel} (${methodLabel})`,
          url:     '/store/dashboard',
          storeId: offer.storeId,
          offerId: offer._id.toString(),
          type:    'order',
        }).catch(err => console.error('[Offer Order] Store owner notification failed:', err.message));
      }
    } catch (err) {
      console.error('[Offer Order] Store lookup notification error:', err.message);
    }

    // 2) Send notification to Customer if logged in
    if (userId) {
      const deliveryLabel = deliveryMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery';
      axios.post(`${NOTIFICATION_SERVICE}/api/notifications/internal/create`, {
        userId,
        title:   `Order Placed: ${offer.title}`,
        body:    `Your order with ${offer.storeName || 'the store'} is confirmed. Total: ₹${total} (${deliveryLabel})`,
        url:     '/nearby',
        storeId: offer.storeId,
        offerId: offer._id.toString(),
        type:    'order',
      }).catch(err => console.error('[Offer Order] Customer notification failed:', err.message));
    }

    res.status(201).json({ success: true, message: 'Order placed! The store will confirm shortly.', data: order });
  } catch (err) {
    console.error('placeOfferOrder error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/offers/orders/store/:storeId — Store owner sees their orders ───
const getStoreOrders = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    if (!(await isStoreOwnedBy(req.params.storeId, req.user.id, req.user.role))) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    const orders = await OfferOrder.find({ storeId: req.params.storeId }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/offers/orders/my — Logged-in user's offer orders ───────────────
const getMyOfferOrders = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.headers['x-user-id'];
    const { email } = req.query;

    const query = [];
    if (userId) query.push({ userId });
    if (email)  query.push({ customerEmail: email });

    const orders = await OfferOrder.find(
      query.length ? { $or: query } : { userId: null }
    ).sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/offers/orders/:id/status — Store owner updates status ────────
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending', 'Confirmed', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const order = await OfferOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (!(await isStoreOwnedBy(order.storeId, req.user.id, req.user.role))) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, message: `Order marked as ${status}.`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { placeOfferOrder, getStoreOrders, getMyOfferOrders, updateOrderStatus };
