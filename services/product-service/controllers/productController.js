const path               = require('path');
const multer             = require('multer');
const Product            = require('../models/Product');
const ProductImageIndex  = require('../models/ProductImageIndex');
const { normalize }      = require('./productImageIndexController');
const { parseQuantity, bestMatchForItem } = require('../utils/matchItem');

// ── Image upload (multer) ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/products')),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  // Also allow by mimetype for data-URI uploads that come in as blobs
  const allowedMime = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()) || allowedMime.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Helpers ───────────────────────────────────────────────────────────────────
const ownershipFilter = (req) => {
  // Admins see/manage all; store owners only see their own
  if (req.user?.role === 'admin') return {};
  return { ownerId: req.user.id };
};

// ── Controllers ───────────────────────────────────────────────────────────────

const createProduct = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const data    = { ...req.body };

    // Attach uploaded image path
    if (req.file) {
      data.imageUrl = `/uploads/products/${req.file.filename}`;
      if (!data.images) data.images = [];
      data.images.unshift(data.imageUrl);
    }

    // tags / images may come as JSON strings from multipart forms
    if (typeof data.tags   === 'string') try { data.tags   = JSON.parse(data.tags);   } catch { data.tags   = data.tags.split(',').map(t => t.trim()).filter(Boolean); }
    if (typeof data.images === 'string') try { data.images = JSON.parse(data.images); } catch {}

    if (!isAdmin) {
      data.ownerId = req.user.id;
      data.storeId = req.body.storeId || req.headers['x-store-id'] || null;
    }

    const product = await Product.create(data);

    // Index the image in the shared library (first upload wins — non-blocking)
    // Skip data URIs — they're too large and specific to index
    if (product.imageUrl && product.title && !product.imageUrl.startsWith('data:')) {
      ProductImageIndex.findOneAndUpdate(
        { normalizedName: normalize(product.title) },
        { $setOnInsert: { normalizedName: normalize(product.title), displayName: product.title, imageUrl: product.imageUrl, contributedBy: product.storeId || null } },
        { upsert: true }
      ).catch(() => {});   // fire-and-forget, never block the response
    }

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const { category, availability, featured, search, storeId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (category)    filter.category     = category;
    if (availability) filter.availability = availability;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (storeId)     filter.storeId      = storeId;
    if (search) filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand:       { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, count: products.length, total, page: Number(page), data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
};

// Products belonging to a specific store (owner's own view)
const getProductsByStore = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { storeId } = req.params;
    const { page = 1, limit = 50, search, category, availability } = req.query;
    const filter = { storeId };
    if (category)    filter.category     = category;
    if (availability) filter.availability = availability;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, count: products.length, total, page: Number(page), data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

// Internal endpoint: batch fetch by IDs (used by user-service for cart population)
const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    const products = await Product.find({ _id: { $in: ids } });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter  = { _id: req.params.id };
    if (!isAdmin) filter.ownerId = req.user.id; // store owners can only update their own

    const data = { ...req.body };
    if (req.file) {
      data.imageUrl = `/uploads/products/${req.file.filename}`;
      // prepend new image to front of images array
    }
    if (typeof data.tags   === 'string') try { data.tags   = JSON.parse(data.tags);   } catch { data.tags   = data.tags.split(',').map(t => t.trim()).filter(Boolean); }
    if (typeof data.images === 'string') try { data.images = JSON.parse(data.images); } catch {}

    const product = await Product.findOneAndUpdate(filter, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter  = { _id: req.params.id };
    if (!isAdmin) filter.ownerId = req.user.id;

    const product = await Product.findOneAndDelete(filter);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    res.status(200).json({ success: true, message: 'Product deleted successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

// Internal: deduct stock after successful payment (called by payment-service)
const deductStock = async (req, res) => {
  try {
    const { items } = req.body;
    const results   = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) { results.push({ productId: item.productId, success: false, message: 'Not found' }); continue; }
      const newStock       = Math.max(0, product.totalStock - item.quantity);
      const newAvailability = newStock === 0 ? 'Out Of Stock' : product.availability;
      await Product.updateOne({ _id: item.productId }, { $set: { totalStock: newStock, availability: newAvailability } });
      results.push({ productId: item.productId, success: true, newStock });
    }
    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to deduct stock', error: error.message });
  }
};

// Internal: match a shopping list against nearby stores' catalogs, ranked by
// item coverage first then total price (used by the Smart Nearby Store Comparison feature)
const matchCart = async (req, res) => {
  try {
    const { items, storeIds } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }
    if (!Array.isArray(storeIds) || !storeIds.length) {
      return res.status(400).json({ success: false, message: 'storeIds array is required' });
    }

    const products = await Product.find({
      storeId: { $in: storeIds },
      availability: { $ne: 'Out Of Stock' },
    }).lean();

    const byStore = {};
    for (const p of products) {
      (byStore[p.storeId] = byStore[p.storeId] || []).push(p);
    }

    const results = storeIds.map(storeId => {
      const candidates = byStore[storeId] || [];
      const matched = [];
      const insufficientStock = [];
      const unmatched = [];

      for (const item of items) {
        const found = bestMatchForItem(item.name, candidates);
        if (!found) {
          unmatched.push(item.name);
          continue;
        }

        const { product, score } = found;
        const requestedQty = parseQuantity(item.quantity);
        const unitPrice = product.discountedPrice ?? product.price;

        // Soft stock-sufficiency check — only treat as insufficient when
        // stock is explicitly tracked (>0); totalStock:0 is often just untracked.
        if (product.totalStock > 0 && product.totalStock < requestedQty) {
          insufficientStock.push({
            requestedName: item.name,
            requestedQuantity: item.quantity,
            product: { id: product._id, title: product.title, price: unitPrice, availableStock: product.totalStock },
          });
          continue;
        }

        matched.push({
          requestedName: item.name,
          requestedQuantity: item.quantity,
          product: {
            id: product._id,
            title: product.title,
            price: unitPrice,
            image: product.imageUrl || (product.images && product.images[0]) || null,
          },
          matchScore: score,
          lineTotal: unitPrice,
        });
      }

      return {
        storeId,
        matched,
        insufficientStock,
        unmatched,
        matchedCount: matched.length,
        totalRequested: items.length,
        totalAmount: matched.reduce((sum, m) => sum + m.lineTotal, 0),
      };
    });

    const ranked = results
      .filter(r => r.matchedCount > 0)
      .sort((a, b) => b.matchedCount - a.matchedCount || a.totalAmount - b.totalAmount);

    res.status(200).json({ success: true, data: ranked });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to match cart', error: error.message });
  }
};

module.exports = {
  upload,
  createProduct, getProducts, getProductById, getProductsByStore,
  getProductsByIds, updateProduct, deleteProduct, deductStock,
  matchCart,
};
