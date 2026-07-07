const express = require('express');
const router  = express.Router();
const {
  subscribe, updateLocation,
  sendOfferNotification, createDirectNotification,
  getMyNotifications, markAsRead, markAllAsRead,
  getVapidPublicKey
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Public — frontend needs the VAPID key to create a subscription
router.get('/vapid-public-key', getVapidPublicKey);

// Authenticated user routes
router.post('/subscribe',      protect, subscribe);
router.put('/location',        protect, updateLocation);
router.get('/',                protect, getMyNotifications);
router.patch('/:id/read',      protect, markAsRead);
router.patch('/read-all',      protect, markAllAsRead);

// Internal route — called by offers-service only (not exposed via gateway)
router.post('/internal/send-offer', sendOfferNotification);

// Internal route — called by payment-service only (not exposed via gateway)
router.post('/internal/create', createDirectNotification);

module.exports = router;
