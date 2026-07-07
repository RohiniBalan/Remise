const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const storeSchema = new mongoose.Schema({
  // Owner linkage (userId from auth-service)
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  ownerName: { type: String, required: true },

  // Store identity
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  logo: { type: String, default: null },
  // UPI-based payment QR: the owner sets a UPI ID and the server generates
  // a standard UPI QR code from it (see utils/upiQr.js) — shown only to
  // customers who place an order with this specific store.
  upiId: { type: String, default: null },
  qrCodeImage: { type: String, default: null }, // base64 PNG data URI
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  category: {
    type: String,
    enum: ['Food & Beverages', 'Grocery', 'Fashion', 'Electronics', 'Pharmacy', 'Toys', 'Home & Living', 'Beauty', 'Sports', 'Other'],
    default: 'Other'
  },

  // Physical address
  address: {
    street:  { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pinCode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },

  // GeoJSON Point — 2dsphere index for $near queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  // Status
  isActive:   { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  // Stats (updated by offers service)
  totalOffers:    { type: Number, default: 0 },
  totalOrders:    { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ ownerId: 1 });
storeSchema.index({ isActive: 1, isVerified: 1 });

module.exports = mongoose.model('Store', storeSchema);
