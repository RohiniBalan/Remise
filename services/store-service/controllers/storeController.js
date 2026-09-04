const Store = require("../models/Store");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { isValidUpiId, generateUpiQrDataUri } = require("../utils/upiQr");

// GeoJSON-valid ranges — anything outside this can never be indexed by the
// Store.location 2dsphere index, and MongoDB's own rejection error dumps the
// full document, which is not something we want to surface to the client.
const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) &&
  lat >= -90 &&
  lat <= 90 &&
  Number.isFinite(lng) &&
  lng >= -180 &&
  lng <= 180;

// ─── POST /api/stores — Register a new store ────────────────────────────────
const registerStore = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // One store per user
    const existing = await Store.findOne({ ownerId });
    if (existing) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You already have a registered store.",
        });
    }

    const {
      name,
      description,
      phone,
      email,
      category,
      address,
      latitude,
      longitude,
      ownerName,
      upiId,
      storeType,
      pan,
      gstin,
      fssai,
      fssaiNumber,
      legalBusinessName,
      businessType,
      bankAccount,
    } = req.body;

    // PAN validation (Mandatory)
    if (!pan || !pan.trim()) {
      return res.status(400).json({
        success: false,
        message: "PAN number is mandatory.",
      });
    }

    const trimmedPan = pan.trim().toUpperCase();
    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!PAN_REGEX.test(trimmedPan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN format (expected 10 characters e.g. ABCDE1234F).",
      });
    }

    // FSSAI validation (Mandatory for Food & Beverages)
    const rawFssai = (fssaiNumber || fssai || "").trim();
    let trimmedFssai = null;
    const isFoodCategory = (category || "").toLowerCase().includes("food");
    if (isFoodCategory) {
      if (!rawFssai) {
        return res.status(400).json({
          success: false,
          message: "FSSAI License Number is mandatory for Food & Beverages category.",
        });
      }
      const FSSAI_REGEX = /^[0-9]{14}$/;
      if (!FSSAI_REGEX.test(rawFssai)) {
        return res.status(400).json({
          success: false,
          message: "Invalid FSSAI License Number (expected 14-digit numeric code e.g. 10012345678901).",
        });
      }
      trimmedFssai = rawFssai;
    } else if (rawFssai) {
      trimmedFssai = rawFssai;
    }

    // GSTIN validation (Optional)
    let trimmedGstin = null;
    if (gstin && gstin.trim()) {
      trimmedGstin = gstin.trim().toUpperCase();
      const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!GSTIN_REGEX.test(trimmedGstin)) {
        return res.status(400).json({
          success: false,
          message: "Invalid GSTIN format (expected 15 characters e.g. 22AAAAA0000A1Z5).",
        });
      }
    }

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Store location (latitude & longitude) is required.",
        });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isValidLatLng(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: `Invalid location coordinates (lat: ${latitude}, lng: ${longitude}). Latitude must be between -90 and 90, longitude between -180 and 180 — please re-detect your location or enter it manually.`,
      });
    }

    let parsedBankAccount = null;
    if (bankAccount) {
      parsedBankAccount = typeof bankAccount === "string" ? JSON.parse(bankAccount) : bankAccount;
    }

    let qrCodeImage = null;
    if (upiId) {
      if (!isValidUpiId(upiId)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid UPI ID format (expected e.g. name@bank).",
          });
      }
      qrCodeImage = await generateUpiQrDataUri(upiId.trim(), ownerName || name);
    }

    const logoPath = req.file ? `/uploads/stores/${req.file.filename}` : null;
    const parsedAddress = typeof address === "string" ? JSON.parse(address) : address || {};

    const store = await Store.create({
      ownerId,
      ownerName: ownerName || "Store Owner",
      name,
      description,
      phone,
      email,
      category,
      fssai: trimmedFssai,
      storeType: storeType || "store",
      pan: trimmedPan,
      gstin: trimmedGstin,
      businessDetails: {
        legalBusinessName: legalBusinessName || ownerName || name,
        businessType: businessType || "individual",
        pan: trimmedPan,
        gstin: trimmedGstin,
        fssaiNumber: trimmedFssai,
        bankAccount: parsedBankAccount ? {
          accountNumber: parsedBankAccount.accountNumber || null,
          ifscCode: (parsedBankAccount.ifscCode || "").toUpperCase(),
          beneficiaryName: parsedBankAccount.beneficiaryName || legalBusinessName || ownerName || name,
        } : {},
      },
      address: parsedAddress,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      logo: logoPath,
      upiId: upiId ? upiId.trim() : null,
      qrCodeImage,
    });

    // Attempt automatic Razorpay Route vendor onboarding if bank details provided
    if (parsedBankAccount?.accountNumber && parsedBankAccount?.ifscCode) {
      try {
        const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';
        const onboardPayload = {
          storeId: store._id.toString(),
          ownerId: store.ownerId,
          ownerName: ownerName || store.ownerName || req.user.name,
          name: store.name,
          email: store.email,
          phone: store.phone,
          legalBusinessName: legalBusinessName || store.businessDetails?.legalBusinessName || store.name,
          businessType: businessType || store.businessDetails?.businessType || 'individual',
          pan: trimmedPan,
          gstin: trimmedGstin,
          bankAccount: store.businessDetails.bankAccount,
          address: store.address || {},
        };
        const onboardRes = await axios.post(`${paymentServiceUrl}/api/payment/razorpay/vendor/onboard`, onboardPayload);
        if (onboardRes.data?.success && onboardRes.data?.data) {
          const { accountId, stakeholderId, routeStatus, productStatus } = onboardRes.data.data;
          if (accountId) store.razorpayAccountId = accountId;
          if (stakeholderId) store.razorpayStakeholderId = stakeholderId;
          if (routeStatus) store.razorpayRouteStatus = routeStatus.toLowerCase();
          if (productStatus) store.razorpayRouteProductStatus = productStatus.toLowerCase();
          await store.save();
        }
      } catch (onboardErr) {
        console.warn("Initial Razorpay onboarding note:", onboardErr.response?.data?.message || onboardErr.message);
      }
    }

    // Upgrade user's role to store_owner and get a fresh token
    let newToken = null;
    try {
      const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
      const upgradeRes = await axios.post(
        `${authUrl}/api/auth/internal/upgrade-role`,
        { userId: ownerId, role: storeType },
        { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } },
      );
      newToken = upgradeRes.data?.data?.token || null;
    } catch (upgradeErr) {
      // Non-fatal — store is created; user may need to log out and back in
      console.warn("Could not upgrade user role:", upgradeErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Store registered successfully!",
      data: store,
      ...(newToken ? { token: newToken } : {}),
    });
  } catch (err) {
    console.error("registerStore error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/stores/my-store — Logged-in owner's store ─────────────────────
const getMyStore = async (req, res) => {
  try {
    // This URL never changes per user (only the Authorization header does),
    // so it must never be cached — otherwise a browser/proxy cache keyed on
    // the URL alone can serve one owner's store to a different owner.
    res.set("Cache-Control", "no-store");
    const store = await Store.findOne({ ownerId: req.user.id });
    if (!store) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No store found. Please register one.",
        });
    }
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/stores/nearby?lat=X&lng=Y&radius=5&storeType=whole_saler ──────
const getNearbyStores = async (req, res) => {
  try {
    const { lat, lng, radius = 10, storeType } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({
          success: false,
          message: "lat and lng query params are required.",
        });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadiusKm = parseFloat(radius) || 10;
    const radiusInMeters = parsedRadiusKm * 1000;

    let stores = [];

    // 1. Try Mongo geospatial $near query
    try {
      const geoFilter = {
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parsedLng, parsedLat],
            },
            $maxDistance: radiusInMeters,
          },
        },
      };
      if (storeType) {
        if (storeType === "store") {
          geoFilter.$or = [
            { storeType: "store" },
            { storeType: { $exists: false } },
            { storeType: null },
          ];
        } else {
          geoFilter.storeType = storeType;
        }
      }
      stores = await Store.find(geoFilter).select("-ownerId").limit(50);
    } catch (geoErr) {
      console.warn(
        "getNearbyStores: $near query fallback to manual calculation:",
        geoErr.message
      );
      // Fallback: fetch active stores and compute distance manually
      const fallbackFilter = { isActive: true };
      if (storeType) {
        if (storeType === "store") {
          fallbackFilter.$or = [
            { storeType: "store" },
            { storeType: { $exists: false } },
            { storeType: null },
          ];
        } else {
          fallbackFilter.storeType = storeType;
        }
      }
      stores = await Store.find(fallbackFilter).select("-ownerId").limit(100);
    }

    // 2. Attach distance safely to each store
    const R = 6371; // Earth radius in km
    const storesWithDistance = stores
      .map((s) => {
        const coords = s.location?.coordinates;
        let distKm = 0;
        if (
          Array.isArray(coords) &&
          coords.length >= 2 &&
          !isNaN(coords[0]) &&
          !isNaN(coords[1])
        ) {
          const sLng = Number(coords[0]);
          const sLat = Number(coords[1]);
          const dLat = ((sLat - parsedLat) * Math.PI) / 180;
          const dLng = ((sLng - parsedLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((parsedLat * Math.PI) / 180) *
              Math.cos((sLat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        } else {
          // If store has no coordinates, assign 0.5km for local dev/testing
          distKm = 0.5;
        }

        const storeObj = s.toObject ? s.toObject() : s;
        return {
          ...storeObj,
          distanceKm: parseFloat(distKm.toFixed(2)),
        };
      })
      .filter((s) => s.distanceKm <= parsedRadiusKm);

    // Sort by distance ascending
    storesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      success: true,
      count: storesWithDistance.length,
      data: storesWithDistance,
    });
  } catch (err) {
    console.error("getNearbyStores error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to retrieve nearby stores" });
  }
};

// ─── GET /api/stores/internal/:id — Service-to-service, includes ownerId ─────
// NOT exposed publicly via API Gateway (internal-only route)
const getStoreInternal = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/stores/:id — Public store profile ──────────────────────────────
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).select("-ownerId");
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/stores/:id — Update store ─────────────────────────────────────
const updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });

    if (store.ownerId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this store.",
        });
    }

    const {
      name,
      description,
      phone,
      email,
      category,
      address,
      latitude,
      longitude,
      upiId,
      targetRevenue,
      fssai,
      pan,
      gstin,
    } = req.body;

    if (pan !== undefined) {
      const trimmed = (pan || "").trim().toUpperCase();
      if (trimmed) {
        const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!PAN_REGEX.test(trimmed)) {
          return res.status(400).json({
            success: false,
            message: "Invalid PAN format (expected 10 characters e.g. ABCDE1234F).",
          });
        }
        store.pan = trimmed;
        if (!store.businessDetails) store.businessDetails = {};
        store.businessDetails.pan = trimmed;
      }
    }

    if (gstin !== undefined) {
      const trimmed = (gstin || "").trim().toUpperCase();
      if (trimmed) {
        const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!GSTIN_REGEX.test(trimmed)) {
          return res.status(400).json({
            success: false,
            message: "Invalid GSTIN format (expected 15 characters e.g. 22AAAAA0000A1Z5).",
          });
        }
        store.gstin = trimmed;
        if (!store.businessDetails) store.businessDetails = {};
        store.businessDetails.gstin = trimmed;
      } else {
        store.gstin = null;
        if (store.businessDetails) store.businessDetails.gstin = null;
      }
    }

    if (name) store.name = name;
    if (description) store.description = description;
    if (phone) store.phone = phone;
    if (email) store.email = email;
    if (category) store.category = category;
    if (address)
      store.address =
        typeof address === "string" ? JSON.parse(address) : address;

    // FSSAI — only relevant for Food & Beverages; clear it if category is
    // (or is being changed to) anything else, so a stale license number
    // never lingers on a store that's no longer in that category.
    const effectiveCategory = category || store.category;
    if (effectiveCategory !== "Food & Beverages") {
      store.fssai = null;
    } else if (fssai !== undefined) {
      store.fssai = fssai.trim() || null;
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isValidLatLng(lat, lng)) {
        return res.status(400).json({
          success: false,
          message: `Invalid location coordinates (lat: ${latitude}, lng: ${longitude}). Latitude must be between -90 and 90, longitude between -180 and 180.`,
        });
      }
      store.location = { type: "Point", coordinates: [lng, lat] };
    }

    if (req.file) {
      if (store.logo) {
        const oldPath = path.join(__dirname, "..", store.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      store.logo = `/uploads/stores/${req.file.filename}`;
    }

    if (upiId !== undefined) {
      const trimmed = upiId.trim();
      if (!trimmed) {
        store.upiId = null;
        store.qrCodeImage = null;
      } else if (trimmed !== store.upiId) {
        if (!isValidUpiId(trimmed)) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Invalid UPI ID format (expected e.g. name@bank).",
            });
        }
        store.upiId = trimmed;
        store.qrCodeImage = await generateUpiQrDataUri(
          trimmed,
          store.ownerName || store.name,
        );
      }
    }

    if (targetRevenue !== undefined && targetRevenue !== "") {
      const val = parseFloat(targetRevenue);
      if (!Number.isFinite(val) || val < 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Target revenue must be a valid positive number.",
          });
      }
      store.targetRevenue = val;
    }

    await store.save();
    res.json({
      success: true,
      message: "Store updated successfully.",
      data: store,
    });
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
      return res
        .status(404)
        .json({ success: false, message: "No store found for this account." });
    }

    const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
    const upgradeRes = await axios.post(
      `${authUrl}/api/auth/internal/upgrade-role`,
      { userId: ownerId },
      { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } },
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
      { new: true },
    );
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    res.json({ success: true, message: "Store verified.", data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/stores/batch — Public: resolve multiple store names/details ──
// Mirrors productController.getProductsByIds. Never returns ownerId/phone/email.
const getStoresByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res
        .status(400)
        .json({ success: false, message: "ids array is required" });
    }
    const stores = await Store.find({ _id: { $in: ids } }).select(
      "name logo storeType isVerified",
    );
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/stores/by-owners — Resolve owner userIds -> store names ──────
// Used by sellers to label their buyers by store name (buyerId on an Order
// is a userId, not a storeId). Deliberately returns only name + storeType —
// never phone/email — so this can be a normal authenticated route, not admin.
const getStoresByOwnerIds = async (req, res) => {
  try {
    const { ownerIds } = req.body;
    if (!Array.isArray(ownerIds) || !ownerIds.length) {
      return res
        .status(400)
        .json({ success: false, message: "ownerIds array is required" });
    }
    const stores = await Store.find({ ownerId: { $in: ownerIds } }).select(
      "ownerId name storeType",
    );
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Store Owner: Enroll in Remise Delivery Portal Network
const enrollDeliveryPortal = async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.user.id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    const { enabled = true, hasOwnDelivery = false } = req.body;
    store.deliveryPortalEnabled = enabled;
    store.hasOwnDelivery = hasOwnDelivery;
    if (enabled && !store.deliveryPortalJoinedAt) {
      store.deliveryPortalJoinedAt = new Date();
    }

    await store.save();

    res.json({
      success: true,
      message: enabled
        ? 'Successfully joined the Remise Delivery Portal network.'
        : 'Delivery Portal network preferences updated.',
      data: {
        deliveryPortalEnabled: store.deliveryPortalEnabled,
        deliveryPortalJoinedAt: store.deliveryPortalJoinedAt,
        hasOwnDelivery: store.hasOwnDelivery
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Store Owner: Configure / Onboard Razorpay Route Linked Account
const onboardStoreRazorpay = async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.user.id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    const {
      legalBusinessName,
      businessType,
      pan,
      gstin,
      bankAccount,
      contactName,
    } = req.body;

    if (!store.businessDetails) store.businessDetails = {};
    if (legalBusinessName) store.businessDetails.legalBusinessName = legalBusinessName;
    if (businessType) store.businessDetails.businessType = businessType;
    if (pan) {
      store.pan = pan.trim().toUpperCase();
      store.businessDetails.pan = pan.trim().toUpperCase();
    }
    if (gstin) {
      store.gstin = gstin.trim().toUpperCase();
      store.businessDetails.gstin = gstin.trim().toUpperCase();
    }
    if (bankAccount) {
      store.businessDetails.bankAccount = {
        accountNumber: bankAccount.accountNumber || store.businessDetails.bankAccount?.accountNumber,
        ifscCode: (bankAccount.ifscCode || store.businessDetails.bankAccount?.ifscCode || '').toUpperCase(),
        beneficiaryName: bankAccount.beneficiaryName || store.businessDetails.bankAccount?.beneficiaryName || store.name,
      };
    }

    const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';
    try {
      const onboardPayload = {
        storeId: store._id.toString(),
        ownerId: store.ownerId,
        ownerName: contactName || store.ownerName || req.user.name,
        name: store.name,
        email: store.email,
        phone: store.phone,
        legalBusinessName: legalBusinessName || store.businessDetails.legalBusinessName || store.name,
        businessType: businessType || store.businessDetails.businessType || 'individual',
        pan: pan || store.businessDetails.pan || store.pan,
        gstin: gstin || store.businessDetails.gstin || store.gstin,
        bankAccount: bankAccount || store.businessDetails.bankAccount,
        address: store.address || {},
        existingAccountId: store.razorpayAccountId || null,
        razorpayAccountId: store.razorpayAccountId || null,
        razorpayStakeholderId: store.razorpayStakeholderId || null,
      };

      const onboardRes = await axios.post(`${paymentServiceUrl}/api/payment/razorpay/vendor/onboard`, onboardPayload);
      if (onboardRes.data.success && onboardRes.data.data) {
        const { accountId, stakeholderId, routeStatus, productStatus } = onboardRes.data.data;
        if (accountId) store.razorpayAccountId = accountId;
        if (stakeholderId) store.razorpayStakeholderId = stakeholderId;
        if (routeStatus) store.razorpayRouteStatus = routeStatus.toLowerCase();
        if (productStatus) store.razorpayRouteProductStatus = productStatus.toLowerCase();
      }
    } catch (onboardErr) {
      console.warn('Razorpay Route sync warning:', onboardErr.response?.data?.message || onboardErr.message);
      // If Razorpay onboarding fails, save error status without generating fake account ID
      if (!store.razorpayAccountId) {
        store.razorpayRouteStatus = 'not_created';
      }
      await store.save();
      return res.status(400).json({
        success: false,
        message: onboardErr.response?.data?.message || onboardErr.message || 'Failed to connect Razorpay Route account.',
        data: store,
      });
    }

    await store.save();

    res.json({
      success: true,
      message: 'Razorpay Route account configured successfully.',
      data: store,
    });
  } catch (err) {
    console.error('onboardStoreRazorpay error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Store Owner: Get Razorpay Route Status
const getStoreRazorpayStatus = async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.user.id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    res.json({
      success: true,
      data: {
        storeId: store._id,
        storeName: store.name,
        razorpayAccountId: store.razorpayAccountId,
        razorpayStakeholderId: store.razorpayStakeholderId,
        razorpayRouteStatus: store.razorpayRouteStatus || 'not_created',
        razorpayRouteProductStatus: store.razorpayRouteProductStatus,
        commissionPercentage: store.commissionPercentage || 0,
        businessDetails: store.businessDetails || {},
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Internal: update store Razorpay status from payment-service / webhook
const updateStoreRazorpayInternal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      razorpayAccountId,
      razorpayStakeholderId,
      razorpayRouteStatus,
      razorpayRouteProductStatus,
    } = req.body;

    const store = await Store.findById(id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    if (razorpayAccountId !== undefined) store.razorpayAccountId = razorpayAccountId;
    if (razorpayStakeholderId !== undefined) store.razorpayStakeholderId = razorpayStakeholderId;
    if (razorpayRouteStatus) store.razorpayRouteStatus = razorpayRouteStatus;
    if (razorpayRouteProductStatus) store.razorpayRouteProductStatus = razorpayRouteProductStatus;

    await store.save();
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  registerStore,
  getMyStore,
  getStoreById,
  updateStore,
  getAllStores,
  verifyStore,
  syncOwnerRole,
  getNearbyStores,
  getStoreInternal,
  getStoresByIds,
  getStoresByOwnerIds,
  enrollDeliveryPortal,
  onboardStoreRazorpay,
  getStoreRazorpayStatus,
  updateStoreRazorpayInternal,
};



