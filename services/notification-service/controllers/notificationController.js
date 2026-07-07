const webpush        = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Notification    = require('../models/Notification');

// Set VAPID keys once at startup
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@wowlife.com'}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ─── POST /api/notifications/subscribe ───────────────────────────────────────
const subscribe = async (req, res) => {
  try {
    const { subscription, latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!subscription?.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object.' });
    }

    // Upsert by endpoint
    await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      {
        userId,
        subscription,
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude || 0), parseFloat(latitude || 0)]
        },
        isActive:    true,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Subscribed to push notifications.' });
  } catch (err) {
    console.error('subscribe error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/notifications/location — Update user location ─────────────────
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    await PushSubscription.updateMany(
      { userId, isActive: true },
      {
        location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
        lastUpdated: new Date()
      }
    );

    res.json({ success: true, message: 'Location updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/notifications/internal/send-offer — Called by offers-service ──
// NOT exposed publicly via API Gateway (internal-only route)
const sendOfferNotification = async (req, res) => {
  try {
    const {
      offerId, storeId, storeName,
      title, body, image, url,
      longitude, latitude, notificationRadius
    } = req.body;

    const radiusInMeters = (notificationRadius || 5) * 1000;

    // Find all subscribers within radius
    const subscribers = await PushSubscription.find({
      isActive: true,
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radiusInMeters
        }
      }
    });

    console.log(`[Notification] Sending to ${subscribers.length} subscribers within ${notificationRadius}km`);

    const payload = JSON.stringify({ title, body, image, url, offerId, storeId });

    const results = await Promise.allSettled(
      subscribers.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, payload);

          // Store in-app notification
          await Notification.create({
            userId:  sub.userId,
            offerId,
            storeId,
            title,
            body,
            image,
            url
          });
        } catch (err) {
          // Subscription expired / invalid — deactivate it
          if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.findByIdAndUpdate(sub._id, { isActive: false });
          }
          throw err;
        }
      })
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({ success: true, sent, failed });
  } catch (err) {
    console.error('sendOfferNotification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/notifications/internal/create — direct in-app notification ────
// Called service-to-service (e.g. payment-service after an order is placed).
// NOT exposed publicly via API Gateway (internal-only route). No push — just
// an in-app record, since order recipients (store owners) won't reliably
// have a PushSubscription like geo-radius offer subscribers do.
const createDirectNotification = async (req, res) => {
  try {
    const { userId, title, body, image, url, storeId, offerId, type } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ success: false, message: 'userId and title are required.' });
    }

    const notification = await Notification.create({
      userId,
      title,
      body: body || '',
      image: image || null,
      url: url || '/nearby',
      storeId: storeId || null,
      offerId: offerId || null,
      type: type || 'order',
    });

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    console.error('createDirectNotification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/notifications — User's notification inbox ─────────────────────
const getMyNotifications = async (req, res) => {
  try {
    // Fixed URL, identity comes only from the Authorization header — must
    // never be cached, or one user's notifications can be served to another.
    res.set('Cache-Control', 'no-store');
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

    res.json({ success: true, unreadCount, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/notifications/:id/read ──────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/notifications/read-all ──────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/notifications/vapid-public-key — Frontend needs this ───────────
const getVapidPublicKey = (req, res) => {
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
};

module.exports = {
  subscribe,
  updateLocation,
  sendOfferNotification,
  createDirectNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getVapidPublicKey
};
