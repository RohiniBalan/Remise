const ProductImageIndex = require('../models/ProductImageIndex');

// Normalise a product name for matching:
// "Big Onion", "big onion", "BigOnion", "BIG  ONION" → "bigonion"
function normalize(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// GET /api/product-images?name=big+onion
const getImage = async (req, res) => {
  try {
    const key = normalize(req.query.name || '');
    if (!key) return res.status(400).json({ success: false, message: 'name is required' });

    const entry = await ProductImageIndex.findOne({ normalizedName: key });
    if (!entry) return res.status(404).json({ success: false, message: 'No image found' });

    res.json({ success: true, imageUrl: entry.imageUrl, displayName: entry.displayName });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/product-images  { name, imageUrl, contributedBy? }
// Upserts — first upload wins; subsequent uploads don't overwrite.
const saveImage = async (req, res) => {
  try {
    const { name, imageUrl, contributedBy } = req.body;
    if (!name || !imageUrl) return res.status(400).json({ success: false, message: 'name and imageUrl required' });

    const key = normalize(name);
    // Only insert if not already present (first-uploader wins)
    const existing = await ProductImageIndex.findOne({ normalizedName: key });
    if (existing) return res.json({ success: true, imageUrl: existing.imageUrl, reused: true });

    const entry = await ProductImageIndex.create({
      normalizedName: key,
      displayName:    name,
      imageUrl,
      contributedBy:  contributedBy || null,
    });
    res.status(201).json({ success: true, imageUrl: entry.imageUrl, reused: false });
  } catch (err) {
    if (err.code === 11000) {
      // Race condition — another request just inserted, fetch and return it
      const entry = await ProductImageIndex.findOne({ normalizedName: normalize(req.body.name) });
      return res.json({ success: true, imageUrl: entry?.imageUrl, reused: true });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/product-images/all  (optional — for admin browsing)
const getAllImages = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = search ? { displayName: { $regex: search, $options: 'i' } } : {};
    const [items, total] = await Promise.all([
      ProductImageIndex.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      ProductImageIndex.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getImage, saveImage, getAllImages, normalize };
