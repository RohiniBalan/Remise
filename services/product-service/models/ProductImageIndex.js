const mongoose = require('mongoose');

// Shared image library — one entry per unique product name (normalised).
// When any store uploads a product image, it's indexed here so other stores
// can reuse it instead of uploading a duplicate.
const schema = new mongoose.Schema({
  // e.g. "bigonion"  (lowercase, alphanumeric only — used for lookup)
  normalizedName: { type: String, required: true, unique: true, index: true },
  // e.g. "Big Onion" (original display name from first upload)
  displayName:    { type: String, required: true },
  // local path like /uploads/products/product-xxx.jpg  OR an external URL
  imageUrl:       { type: String, required: true },
  // which store first contributed this image
  contributedBy:  { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('ProductImageIndex', schema);
