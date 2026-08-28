const path = require("path");
const multer = require("multer");
const axios = require("axios");
const Product = require("../models/Product");
const StockReservation = require("../models/StockReservation");
const ProductImageIndex = require("../models/ProductImageIndex");
const { normalize } = require("./productImageIndexController");
const { parseQuantity, bestMatchForItem } = require("../utils/matchItem");
const { checkLowStock } = require("../utils/lowStockAlert");

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3004";

// ── Image upload (multer) ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../uploads/products")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
  // Also allow by mimetype for data-URI uploads that come in as blobs
  const allowedMime = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  cb(
    null,
    allowed.includes(path.extname(file.originalname).toLowerCase()) ||
      allowedMime.includes(file.mimetype),
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const ownershipFilter = (req) => {
  // Admins see/manage all; store owners only see their own
  if (req.user?.role === "admin") return {};
  return { ownerId: req.user.id };
};

// ── Controllers ───────────────────────────────────────────────────────────────

const createProduct = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const data = { ...req.body };

    // Attach uploaded image path
    if (req.file) {
      data.imageUrl = `/uploads/products/${req.file.filename}`;
      if (!data.images) data.images = [];
      data.images.unshift(data.imageUrl);
    }

    // tags / images may come as JSON strings from multipart forms
    if (typeof data.tags === "string")
      try {
        data.tags = JSON.parse(data.tags);
      } catch {
        data.tags = data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    if (typeof data.images === "string")
      try {
        data.images = JSON.parse(data.images);
      } catch {}
    if (typeof data.bulkPricing === "string")
      try {
        data.bulkPricing = JSON.parse(data.bulkPricing);
      } catch {
        data.bulkPricing = [];
      }
    if (data.moq !== undefined) data.moq = Number(data.moq) || 1;

    if (!isAdmin) {
      data.ownerId = req.user.id;
      data.storeId = req.body.storeId || req.headers["x-store-id"] || null;
      data.ownerRole = req.user.role;
    }

    const product = await Product.create(data);

    // Index the image in the shared library (first upload wins — non-blocking)
    // Skip data URIs — they're too large and specific to index
    if (
      product.imageUrl &&
      product.title &&
      !product.imageUrl.startsWith("data:")
    ) {
      ProductImageIndex.findOneAndUpdate(
        { normalizedName: normalize(product.title) },
        {
          $setOnInsert: {
            normalizedName: normalize(product.title),
            displayName: product.title,
            imageUrl: product.imageUrl,
            contributedBy: product.storeId || null,
          },
        },
        { upsert: true },
      ).catch(() => {}); // fire-and-forget, never block the response
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create product",
        error: error.message,
      });
  }
};

const getProducts = async (req, res) => {
  try {
    const {
      category,
      availability,
      featured,
      search,
      storeId,
      ownerRole,
      page = 1,
      limit = 50,
    } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (availability) filter.availability = availability;
    if (featured !== undefined) filter.featured = featured === "true";
    if (storeId) filter.storeId = storeId;
    if (ownerRole) filter.ownerRole = ownerRole;
    if (search)
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res
      .status(200)
      .json({
        success: true,
        count: products.length,
        total,
        page: Number(page),
        data: products,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch products",
        error: error.message,
      });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch product",
        error: error.message,
      });
  }
};

// Products belonging to a specific store (owner's own view)
const getProductsByStore = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const { storeId } = req.params;
    const { page = 1, limit = 50, search, category, availability } = req.query;
    const filter = { storeId };
    if (category) filter.category = category;
    if (availability) filter.availability = availability;
    if (search)
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    res
      .status(200)
      .json({
        success: true,
        count: products.length,
        total,
        page: Number(page),
        data: products,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch products",
        error: error.message,
      });
  }
};

// Internal endpoint: batch fetch by IDs (used by user-service for cart population)
const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res
        .status(400)
        .json({ success: false, message: "ids array is required" });
    }
    const products = await Product.find({ _id: { $in: ids } });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch products",
        error: error.message,
      });
  }
};

const updateProduct = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (!isAdmin) {
      const userStoreId = req.body.storeId || req.headers["x-store-id"];
      const isOwner =
        (existing.ownerId &&
          existing.ownerId.toString() === req.user.id.toString()) ||
        (existing.storeId &&
          userStoreId &&
          existing.storeId.toString() === userStoreId.toString()) ||
        !existing.ownerId;

      if (!isOwner) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Access denied: You do not have permission to update this product",
          });
      }
    }

    const data = { ...req.body };
    if (!existing.ownerId && !isAdmin) {
      data.ownerId = req.user.id;
    }
    if (req.file) {
      data.imageUrl = `/uploads/products/${req.file.filename}`;
      if (!data.images) data.images = existing.images || [];
      data.images = [
        data.imageUrl,
        ...data.images.filter((img) => img !== data.imageUrl),
      ];
    }

    if (data.price !== undefined && data.price !== "") {
      data.price = Number(data.price);
    }
    if (data.discountedPrice !== undefined) {
      data.discountedPrice =
        data.discountedPrice === "" ||
        data.discountedPrice === null ||
        data.discountedPrice === "null"
          ? null
          : Number(data.discountedPrice);
    }
    if (data.totalStock !== undefined) {
      data.totalStock =
        data.totalStock === "" || data.totalStock === null
          ? 0
          : Number(data.totalStock);
    }
    if (data.storePrice !== undefined) {
      data.storePrice =
        data.storePrice === "" ||
        data.storePrice === null ||
        data.storePrice === "null"
          ? null
          : Number(data.storePrice);
    }
    if (data.storeDiscountedPrice !== undefined) {
      data.storeDiscountedPrice =
        data.storeDiscountedPrice === "" ||
        data.storeDiscountedPrice === null ||
        data.storeDiscountedPrice === "null"
          ? null
          : Number(data.storeDiscountedPrice);
    }
    if (data.moq !== undefined) {
      data.moq =
        data.moq === "" || data.moq === null ? 1 : Number(data.moq) || 1;
    }

    if (typeof data.tags === "string") {
      try {
        data.tags = JSON.parse(data.tags);
      } catch {
        data.tags = data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }
    if (typeof data.images === "string") {
      try {
        data.images = JSON.parse(data.images);
      } catch {}
    }
    if (typeof data.bulkPricing === "string") {
      try {
        data.bulkPricing = JSON.parse(data.bulkPricing);
      } catch {
        data.bulkPricing = [];
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // ── Check low stock after update ──
    const { checkLowStock } = require("../utils/lowStockAlert");
    checkLowStock(product);

    res
      .status(200)
      .json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to update product",
      });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (!isAdmin) {
      const userStoreId = req.body?.storeId || req.headers["x-store-id"];
      const isOwner =
        (existing.ownerId &&
          existing.ownerId.toString() === req.user.id.toString()) ||
        (existing.storeId &&
          userStoreId &&
          existing.storeId.toString() === userStoreId.toString()) ||
        !existing.ownerId;

      if (!isOwner) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Access denied: You do not have permission to delete this product",
          });
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({
        success: true,
        message: "Product deleted successfully",
        data: {},
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to delete product",
      });
  }
};

// Internal: Atomically reserve stock for an order during checkout (prevents race conditions)
const reserveStock = async (req, res) => {
  try {
    const { orderId, items, ttlMinutes = 15 } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: "items array is required" });
    }

    // Check if a reservation already exists for this orderId (Idempotency)
    const existing = await StockReservation.findOne({ orderId });
    if (existing) {
      if (existing.status === "ACTIVE" || existing.status === "COMMITTED") {
        return res.status(200).json({
          success: true,
          message: "Stock already reserved for this order",
          orderId,
          status: existing.status,
          expiresAt: existing.expiresAt,
        });
      }
    }

    const reservedItems = [];
    let failureInfo = null;

    // Process items in deterministic sorted order of productId to prevent lock contention
    const sortedItems = [...items].sort((a, b) =>
      String(a.productId || a._id || a.id).localeCompare(
        String(b.productId || b._id || b.id)
      )
    );

    for (const item of sortedItems) {
      const pId = item.productId || item._id || item.id;
      const requestedQty = Number(item.quantity) || 1;

      // Atomic conditional decrement: Only succeeds if totalStock >= requestedQty
      const updated = await Product.findOneAndUpdate(
        {
          _id: pId,
          totalStock: { $gte: requestedQty },
        },
        [
          {
            $set: {
              totalStock: { $subtract: ["$totalStock", requestedQty] },
              availability: {
                $cond: {
                  if: { $lte: [{ $subtract: ["$totalStock", requestedQty] }, 0] },
                  then: "Out Of Stock",
                  else: "$availability",
                },
              },
            },
          },
        ],
        { new: true }
      );

      if (!updated) {
        // Atomic reservation condition failed!
        const currentProd = await Product.findById(pId).lean();
        failureInfo = {
          productId: pId,
          title: item.title || currentProd?.title || "Product",
          requestedQuantity: requestedQty,
          availableStock: currentProd ? Math.max(0, currentProd.totalStock) : 0,
        };
        break;
      }

      reservedItems.push({
        productId: pId,
        title: updated.title || item.title || "",
        quantity: requestedQty,
        price: Number(updated.discountedPrice ?? updated.price ?? item.price ?? 0),
      });
    }

    // Rollback all previously reserved items if ANY item failed
    if (failureInfo) {
      for (const r of reservedItems) {
        await Product.findByIdAndUpdate(r.productId, {
          $inc: { totalStock: r.quantity },
          $set: { availability: "In Stock" },
        });
      }

      return res.status(409).json({
        success: false,
        code: "OUT_OF_STOCK",
        message: `Product "${failureInfo.title}" is out of stock or does not have enough quantity available (Requested: ${failureInfo.requestedQuantity}, Available: ${failureInfo.availableStock}).`,
        details: failureInfo,
      });
    }

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const reservation = await StockReservation.create({
      orderId,
      items: reservedItems,
      status: "ACTIVE",
      expiresAt,
    });

    res.status(200).json({
      success: true,
      message: "Stock reserved successfully",
      orderId,
      expiresAt,
      reservationId: reservation._id,
    });
  } catch (error) {
    console.error("[reserveStock Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reserve stock",
      error: error.message,
    });
  }
};

// Internal: Commit a stock reservation upon successful payment confirmation
const commitStock = async (req, res) => {
  try {
    const { orderId, items } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const reservation = await StockReservation.findOne({ orderId });
    if (reservation) {
      if (reservation.status === "COMMITTED") {
        return res.status(200).json({
          success: true,
          message: "Stock reservation already committed",
          orderId,
        });
      }

      reservation.status = "COMMITTED";
      reservation.committedAt = new Date();
      await reservation.save();

      // Check low stock for reserved items
      for (const item of reservation.items) {
        const prod = await Product.findById(item.productId);
        if (prod) checkLowStock(prod);
      }

      return res.status(200).json({
        success: true,
        message: "Stock reservation committed successfully",
        orderId,
      });
    }

    // Fallback if no explicit reservation document was tracked (legacy/direct callers)
    if (Array.isArray(items)) {
      for (const item of items) {
        const pId = item.productId || item._id || item.id;
        const prod = await Product.findById(pId);
        if (prod) checkLowStock(prod);
      }
    }

    res.status(200).json({
      success: true,
      message: "Stock committed",
      orderId,
    });
  } catch (error) {
    console.error("[commitStock Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to commit stock",
      error: error.message,
    });
  }
};

// Internal: Release reserved stock back to inventory (on payment failure, cancellation, or refund)
const releaseStock = async (req, res) => {
  try {
    const { orderId, items, reason } = req.body;
    if (!orderId && (!items || !items.length)) {
      return res.status(400).json({ success: false, message: "orderId or items array is required" });
    }

    let itemsToRelease = items || [];
    let reservation = null;

    if (orderId) {
      reservation = await StockReservation.findOne({ orderId });
      if (reservation) {
        // Prevent releasing already released or expired reservations multiple times (idempotency)
        if (reservation.status === "RELEASED" || reservation.status === "EXPIRED") {
          return res.status(200).json({
            success: true,
            message: `Stock reservation is already ${reservation.status.toLowerCase()}`,
            orderId,
          });
        }

        // If committed and reason is NOT a cancellation/refund, prevent accidental release
        const isCancellation =
          reason === "order_cancelled" ||
          reason === "refund" ||
          reason === "admin_cancellation";
        if (reservation.status === "COMMITTED" && !isCancellation) {
          return res.status(400).json({
            success: false,
            message: "Cannot release already committed stock without a valid cancellation/refund reason",
          });
        }

        itemsToRelease = reservation.items;
        reservation.status = "RELEASED";
        reservation.releasedAt = new Date();
        reservation.releaseReason = reason || "released";
        await reservation.save();
      }
    }

    // Atomically increment stock back to products
    for (const item of itemsToRelease) {
      const pId = item.productId || item._id || item.id;
      const qty = Number(item.quantity) || 1;
      await Product.findByIdAndUpdate(pId, {
        $inc: { totalStock: qty },
        $set: { availability: "In Stock" },
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock released and returned to inventory successfully",
      orderId,
    });
  } catch (error) {
    console.error("[releaseStock Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to release stock",
      error: error.message,
    });
  }
};

// Internal: Periodically called by background worker to expire abandoned reservations
const expireReservations = async (req, res) => {
  try {
    const now = new Date();
    const expiredReservations = await StockReservation.find({
      status: "ACTIVE",
      expiresAt: { $lte: now },
    });

    let count = 0;
    for (const resDoc of expiredReservations) {
      // 1. Release stock back to products
      for (const item of resDoc.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { totalStock: item.quantity },
          $set: { availability: "In Stock" },
        });
      }

      // 2. Mark reservation EXPIRED
      resDoc.status = "EXPIRED";
      resDoc.releasedAt = new Date();
      resDoc.releaseReason = "reservation_expired";
      await resDoc.save();

      // 3. Notify order-service to update order status
      try {
        await axios.patch(
          `${ORDER_SERVICE_URL}/api/orders/internal/${resDoc.orderId}/expire-reservation`
        );
      } catch (err) {
        console.warn(`[expireReservations] Notice for order ${resDoc.orderId}:`, err.message);
      }

      count++;
    }

    res.status(200).json({
      success: true,
      message: `Processed ${count} expired reservations`,
      count,
    });
  } catch (error) {
    console.error("[expireReservations Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process expired reservations",
      error: error.message,
    });
  }
};

// Internal: Atomic stock deduction for backward compatibility
const deductStock = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "items array is required" });
    }
    const results = [];
    for (const item of items) {
      const pId = item.productId || item._id || item.id;
      const qty = Number(item.quantity) || 1;

      const updated = await Product.findOneAndUpdate(
        { _id: pId, totalStock: { $gte: qty } },
        [
          {
            $set: {
              totalStock: { $subtract: ["$totalStock", qty] },
              availability: {
                $cond: {
                  if: { $lte: [{ $subtract: ["$totalStock", qty] }, 0] },
                  then: "Out Of Stock",
                  else: "$availability",
                },
              },
            },
          },
        ],
        { new: true }
      );

      if (!updated) {
        results.push({
          productId: pId,
          success: false,
          message: "Insufficient stock or product not found",
        });
        continue;
      }

      checkLowStock(updated);
      results.push({ productId: pId, success: true, newStock: updated.totalStock });
    }
    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deduct stock",
      error: error.message,
    });
  }
};


// Internal: match a shopping list against nearby stores' catalogs, ranked by
// item coverage first then total price (used by the Smart Nearby Store Comparison feature)
const matchCart = async (req, res) => {
  try {
    const { items, storeIds, ownerRole } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res
        .status(400)
        .json({ success: false, message: "items array is required" });
    }
    if (!Array.isArray(storeIds) || !storeIds.length) {
      return res
        .status(400)
        .json({ success: false, message: "storeIds array is required" });
    }

    const productFilter = {
      storeId: { $in: storeIds },
      availability: { $ne: "Out Of Stock" },
    };

    // When ownerRole is specified, only match products belonging to that role.
    // Include products with no ownerRole set (legacy data) when filtering for store_owner.
    if (ownerRole) {
      if (ownerRole === "store_owner") {
        productFilter.$or = [
          { ownerRole: "store_owner" },
          { ownerRole: { $exists: false } },
          { ownerRole: null },
        ];
      } else {
        productFilter.ownerRole = ownerRole;
      }
    }

    const products = await Product.find(productFilter).lean();

    const byStore = {};
    for (const p of products) {
      (byStore[p.storeId] = byStore[p.storeId] || []).push(p);
    }

    const results = storeIds.map((storeId) => {
      const candidates = byStore[storeId] || [];
      const matched = [];
      const insufficientStock = [];
      const unmatched = [];

      for (const item of items) {
        const found = bestMatchForItem(item.name, candidates, item.brand);
        if (!found) {
          unmatched.push(item.name);
          continue;
        }

        const { product, score, brandMatched, substituted } = found;
        const requestedQty = parseQuantity(item.quantity) || 1;
        const unitPrice = Number(product?.discountedPrice ?? product?.price ?? 0) || 0;
        const lineTotal = unitPrice * requestedQty;

        // Soft stock-sufficiency check — only treat as insufficient when
        // stock is explicitly tracked (>0); totalStock:0 is often just untracked.
        if (product.totalStock > 0 && product.totalStock < requestedQty) {
          insufficientStock.push({
            requestedName: item.name,
            requestedQuantity: item.quantity,
            product: {
              id: product._id,
              title: product.title,
              price: unitPrice,
              availableStock: product.totalStock,
            },
          });
          continue;
        }

        matched.push({
          requestedName: item.name,
          requestedBrand: item.brand || null,
          requestedQuantity: item.quantity,
          product: {
            id: product._id,
            title: product.title || "Product",
            brand: product.brand || null,
            price: unitPrice,
            image:
              product.imageUrl || (product.images && product.images[0]) || null,
          },
          matchScore: score || 0.5,
          brandMatched: found.brandMatched,
          substituted: found.substituted,
          lineTotal: lineTotal,
        });
      }
      return {
        storeId,
        matched,
        insufficientStock,
        unmatched,
        matchedCount: matched.length,
        totalRequested: items.length,
        totalAmount: matched.reduce((sum, m) => sum + (Number(m.lineTotal) || 0), 0),
      };
    });

    const ranked = results
      .filter((r) => r.matchedCount > 0)
      .sort(
        (a, b) =>
          b.matchedCount - a.matchedCount || a.totalAmount - b.totalAmount,
      );

    res.status(200).json({ success: true, data: ranked });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to match cart",
        error: error.message,
      });
  }
};

// Interim identifier for cross-supplier grouping until Product has a real
// SKU/model field. Normalizes brand+title so "HP Laptop 15.6"" and
// "HP  Laptop 15.6 inch" from different sellers still merge reasonably,
// but this is a heuristic — replace with product.sku once that field exists.
const groupKey = (p) => {
  const norm = (s) => (s || "").toLowerCase().trim().replace(/\s+/g, " ");
  return `${norm(p.brand)}|${norm(p.title)}`;
};

// Public: grouped supplier catalog — one entry per distinct product
// (by groupKey), with each supplier's listing attached under `suppliers`.
const getGroupedSuppliers = async (req, res) => {
  try {
    const { ownerRole, search, category } = req.query;
    const filter = { availability: { $ne: "Out Of Stock" } };
    if (ownerRole) filter.ownerRole = ownerRole;
    if (category) filter.category = category;
    if (search)
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];

    const listings = await Product.find(filter).lean();

    const groups = {};
    for (const p of listings) {
      const key = groupKey(p);
      if (!groups[key]) {
        groups[key] = {
          groupKey: key,
          title: p.title,
          brand: p.brand,
          category: p.category,
          image: p.imageUrl || (p.images && p.images[0]) || null,
          suppliers: [],
        };
      }
      groups[key].suppliers.push({
        productId: p._id,
        storeId: p.storeId,
        ownerId: p.ownerId,
        ownerRole: p.ownerRole,
        price: p.discountedPrice ?? p.price,
        moq: p.moq || 1,
        bulkPricing: p.bulkPricing || [],
        totalStock: p.totalStock,
      });
    }

    const data = Object.values(groups).map((g) => ({
      ...g,
      lowestPrice: Math.min(...g.suppliers.map((s) => s.price)),
      supplierCount: g.suppliers.length,
      suppliers: g.suppliers.sort((a, b) => a.price - b.price),
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch grouped suppliers",
        error: error.message,
      });
  }
};

module.exports = {
  upload,
  createProduct,
  getProducts,
  getProductById,
  getProductsByStore,
  getProductsByIds,
  updateProduct,
  deleteProduct,
  reserveStock,
  commitStock,
  releaseStock,
  expireReservations,
  deductStock,
  matchCart,
  getGroupedSuppliers,
};

