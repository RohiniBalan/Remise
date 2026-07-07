const OfferOrder = require('../models/OfferOrder');
const Offer      = require('../models/Offer');
const { isStoreOwnedBy } = require('../utils/verifyStoreOwner');

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

    const { customerName, customerPhone, customerEmail, deliveryAddress, quantity = 1, notes } = req.body;

    const total = offer.offerPrice * parseInt(quantity);

    const order = await OfferOrder.create({
      offerId:         offer._id.toString(),
      storeId:         offer.storeId,
      storeName:       offer.storeName,
      userId:          req.headers['x-user-id'] || null,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      offerTitle:  offer.title,
      offerImage:  offer.image,
      unitPrice:   offer.offerPrice,
      quantity:    parseInt(quantity),
      totalAmount: total,
      notes
    });

    // Increment order counter on offer
    await Offer.findByIdAndUpdate(req.params.id, { $inc: { orderCount: 1 } });

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
