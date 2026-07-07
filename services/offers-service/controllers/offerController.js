const axios  = require('axios');
const Offer  = require('../models/Offer');
const path   = require('path');
const fs     = require('fs');
const { isStoreOwnedBy } = require('../utils/verifyStoreOwner');

const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009';
const STORE_SERVICE        = process.env.STORE_SERVICE_URL        || 'http://localhost:3007';

// ─── POST /api/offers — Create a new offer ───────────────────────────────────
const createOffer = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Offer image is required.' });
    }

    const {
      storeId, storeName, title, description, category,
      originalPrice, offerPrice, validUntil,
      latitude, longitude           // radius is no longer accepted from client
    } = req.body;

    if (!storeId || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'storeId and notification coordinates are required.' });
    }

    if (!(await isStoreOwnedBy(storeId, req.user.id, req.user.role))) {
      return res.status(403).json({ success: false, message: 'You can only create offers for your own store.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid latitude/longitude values.' });
    }

    // Fixed server-side notification radius — not exposed to the client
    const NOTIFICATION_RADIUS_KM = parseInt(process.env.NOTIFICATION_RADIUS_KM) || 5;

    const discount = originalPrice > 0
      ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
      : 0;

    const offer = await Offer.create({
      storeId,
      storeName,
      storeLocation: {
        type: 'Point',
        coordinates: [lng, lat]    // GeoJSON: [longitude, latitude]
      },
      title,
      description,
      image: `/uploads/offers/${req.file.filename}`,
      category: category || 'General',
      originalPrice:   parseFloat(originalPrice),
      offerPrice:      parseFloat(offerPrice),
      discountPercent: discount,
      validUntil:      new Date(validUntil),
      notificationRadius: NOTIFICATION_RADIUS_KM   // stored for reference, set by server
    });

    // Fire-and-forget: trigger geo push notifications
    axios.post(`${NOTIFICATION_SERVICE}/api/notifications/internal/send-offer`, {
      offerId:            offer._id.toString(),
      storeId,
      storeName,
      title:              `🏷️ ${storeName}: ${title}`,
      body:               `${discount}% off — valid until ${new Date(validUntil).toLocaleDateString()}`,
      image:              offer.image,
      url:                `/nearby?offer=${offer._id}`,
      longitude:          lng,
      latitude:           lat,
      notificationRadius: NOTIFICATION_RADIUS_KM
    }).catch(err => console.error('[Offers] Notification dispatch failed:', err.message));

    res.status(201).json({ success: true, message: 'Offer published!', data: offer });
  } catch (err) {
    console.error('createOffer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/offers/nearby?lat=X&lng=Y&radius=5 ─────────────────────────────
const getNearbyOffers = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng query params are required.' });
    }

    const radiusInMeters = parseFloat(radius) * 1000;

    const offers = await Offer.find({
      isActive:   true,
      validUntil: { $gte: new Date() },
      storeLocation: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radiusInMeters
        }
      }
    }).limit(50);

    // Attach distance to each offer
    const offersWithDistance = offers.map(o => {
      const [oLng, oLat] = o.storeLocation.coordinates;
      const R = 6371;
      const dLat = ((oLat - parseFloat(lat)) * Math.PI) / 180;
      const dLng = ((oLng - parseFloat(lng)) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((parseFloat(lat) * Math.PI) / 180) *
        Math.cos((oLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
      const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return { ...o.toObject(), distanceKm: parseFloat(distKm.toFixed(2)) };
    });

    res.json({ success: true, count: offersWithDistance.length, data: offersWithDistance });
  } catch (err) {
    console.error('getNearbyOffers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/offers/store/:storeId ─────────────────────────────────────────
const getStoreOffers = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const offers = await Offer.find({ storeId: req.params.storeId }).sort({ createdAt: -1 });
    res.json({ success: true, count: offers.length, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/offers/:id ─────────────────────────────────────────────────────
const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found.' });
    res.json({ success: true, data: offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/offers/:id ─────────────────────────────────────────────────────
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found.' });

    if (!(await isStoreOwnedBy(offer.storeId, req.user.id, req.user.role))) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const updates = { ...req.body };
    delete updates.storeId; // Prevent hijacking
    delete updates.storeLocation;

    if (req.file) {
      const oldPath = path.join(__dirname, '..', offer.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      updates.image = `/uploads/offers/${req.file.filename}`;
    }

    const updated = await Offer.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, message: 'Offer updated.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/offers/:id ──────────────────────────────────────────────────
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found.' });

    if (!(await isStoreOwnedBy(offer.storeId, req.user.id, req.user.role))) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (req.file) {
      const imgPath = path.join(__dirname, '..', offer.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await offer.deleteOne();
    res.json({ success: true, message: 'Offer deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createOffer, getNearbyOffers, getStoreOffers, getOfferById, updateOffer, deleteOffer };
