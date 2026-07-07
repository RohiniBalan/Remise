const Store = require('../models/Store');
const path  = require('path');
const fs    = require('fs');
const axios = require('axios');
const { isValidUpiId, generateUpiQrDataUri } = require('../utils/upiQr');

// GeoJSON-valid ranges — anything outside this can never be indexed by the
// Store.location 2dsphere index, and MongoDB's own rejection error dumps the
// full document, which is not something we want to surface to the client.
const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) && lat >= -90  && lat <= 90 &&
  Number.isFinite(lng) && lng >= -180 && lng <= 180;

// ─── POST /api/stores — Register a new store ────────────────────────────────
const registerStore = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // One store per user
    const existing = await Store.findOne({ ownerId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a registered store.' });
    }

    const { name, description, phone, email, category, address, latitude, longitude, ownerName, upiId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Store location (latitude & longitude) is required.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isValidLatLng(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: `Invalid location coordinates (lat: ${latitude}, lng: ${longitude}). Latitude must be between -90 and 90, longitude between -180 and 180 — please re-detect your location or enter it manually.`,
      });
    }

    let qrCodeImage = null;
    if (upiId) {
      if (!isValidUpiId(upiId)) {
        return res.status(400).json({ success: false, message: 'Invalid UPI ID format (expected e.g. name@bank).' });
      }
      qrCodeImage = await generateUpiQrDataUri(upiId.trim(), ownerName || name);
    }

    const logoPath = req.file ? `/uploads/stores/${req.file.filename}` : null;

    const store = await Store.create({
      ownerId,
      ownerName: ownerName || 'Store Owner',
      name,
      description,
      phone,
      email,
      category,
      address: typeof address === 'string' ? JSON.parse(address) : (address || {}),
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      logo: logoPath,
      upiId: upiId ? upiId.trim() : null,
      qrCodeImage
    });

    // Upgrade user's role to store_owner and get a fresh token
    let newToken = null;
    try {
      const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      const upgradeRes = await axios.post(
        `${authUrl}/api/auth/internal/upgrade-role`,
        { userId: ownerId },
        { headers: { 'x-internal-secret': process.env.INTERNAL_SECRET } }
      );
      newToken = upgradeRes.data?.data?.token || null;
    } catch (upgradeErr) {
      // Non-fatal — store is created; user may need to log out and back in
      console.warn('Could not upgrade user role:', upgradeErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Store registered successfully!',
      data: store,
      ...(newToken ? { token: newToken } : {}),
    });
  } catch (err) {
    console.error('registerStore error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/stores/my-store — Logged-in owner's store ─────────────────────
const getMyStore = async (req, res) => {
  try {
    // This URL never changes per user (only the Authorization header does),
    // so it must never be cached — otherwise a browser/proxy cache keyed on
    // the URL alone can serve one owner's store to a different owner.
    res.set('Cache-Control', 'no-store');
    const store = await Store.findOne({ ownerId: req.user.id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'No store found. Please register one.' });
    }
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/stores/nearby?lat=X&lng=Y&radius=5 ─────────────────────────────
const getNearbyStores = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng query params are required.' });
    }

    const radiusInMeters = parseFloat(radius) * 1000;

    const stores = await Store.find({
      isActive: true,
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radiusInMeters
        }
      }
    }).select('-ownerId').limit(50);

    // Attach distance to each store
    const storesWithDistance = stores.map(s => {
      const [sLng, sLat] = s.location.coordinates;
      const R = 6371;
      const dLat = ((sLat - parseFloat(lat)) * Math.PI) / 180;
      const dLng = ((sLng - parseFloat(lng)) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((parseFloat(lat) * Math.PI) / 180) *
        Math.cos((sLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
      const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return { ...s.toObject(), distanceKm: parseFloat(distKm.toFixed(2)) };
    });

    res.json({ success: true, count: storesWithDistance.length, data: storesWithDistance });
  } catch (err) {
    console.error('getNearbyStores error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/stores/internal/:id — Service-to-service, includes ownerId ─────
// NOT exposed publicly via API Gateway (internal-only route)
const getStoreInternal = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/stores/:id — Public store profile ──────────────────────────────
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).select('-ownerId');
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/stores/:id — Update store ─────────────────────────────────────
const updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    // Only owner or admin
    if (store.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this store.' });
    }

    const { name, description, phone, email, category, address, latitude, longitude, upiId } = req.body;

    if (name)        store.name        = name;
    if (description) store.description = description;
    if (phone)       store.phone       = phone;
    if (email)       store.email       = email;
    if (category)    store.category    = category;
    if (address)     store.address     = typeof address === 'string' ? JSON.parse(address) : address;

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isValidLatLng(lat, lng)) {
        return res.status(400).json({
          success: false,
          message: `Invalid location coordinates (lat: ${latitude}, lng: ${longitude}). Latitude must be between -90 and 90, longitude between -180 and 180.`,
        });
      }
      store.location = { type: 'Point', coordinates: [lng, lat] };
    }

    if (req.file) {
      // Remove old logo
      if (store.logo) {
        const oldPath = path.join(__dirname, '..', store.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      store.logo = `/uploads/stores/${req.file.filename}`;
    }

    // UPI ID drives the generated QR — regenerate whenever it changes,
    // clear both when the owner blanks it out.
    if (upiId !== undefined) {
      const trimmed = upiId.trim();
      if (!trimmed) {
        store.upiId = null;
        store.qrCodeImage = null;
      } else if (trimmed !== store.upiId) {
        if (!isValidUpiId(trimmed)) {
          return res.status(400).json({ success: false, message: 'Invalid UPI ID format (expected e.g. name@bank).' });
        }
        store.upiId = trimmed;
        store.qrCodeImage = await generateUpiQrDataUri(trimmed, store.ownerName || store.name);
      }
    }

    await store.save();
    res.json({ success: true, message: 'Store updated successfully.', data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/stores/me/sync-role — Fix role for existing store owners ──────
// Called when a user registered a store but still has role='user' in their JWT.
// Verifies they actually have a store, then calls auth-service to upgrade role.
const syncOwnerRole = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const store = await Store.findOne({ ownerId });
    if (!store) {
      return res.status(404).json({ success: false, message: 'No store found for this account.' });
    }

    const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    const upgradeRes = await axios.post(
      `${authUrl}/api/auth/internal/upgrade-role`,
      { userId: ownerId },
      { headers: { 'x-internal-secret': process.env.INTERNAL_SECRET } }
    );

    res.json({ success: true, data: upgradeRes.data?.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/stores — Admin: all stores ────────────────────────────────────
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 });
    res.json({ success: true, count: stores.length, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/stores/:id/verify — Admin: verify a store ───────────────────
const verifyStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.json({ success: true, message: 'Store verified.', data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  registerStore, getMyStore, getStoreById, updateStore, getAllStores, verifyStore, syncOwnerRole,
  getNearbyStores, getStoreInternal,
};
