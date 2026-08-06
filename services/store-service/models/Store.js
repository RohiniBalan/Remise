const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const storeSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  ownerName: { type: String, required: true },

  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  logo: { type: String, default: null },
  upiId: { type: String, default: null },
  qrCodeImage: { type: String, default: null },
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  category: {
    type: String,
    enum: ['Food & Beverages', 'Grocery', 'Fashion', 'Electronics', 'Pharmacy', 'Toys', 'Home & Living', 'Beauty', 'Sports', 'Other'],
    default: 'Other'
  },

  // FSSAI license number — only meaningful when category is 'Food & Beverages',
  // but stored unconditionally (nulled out if category changes away from it).
  fssai: { type: String, default: null },

  storeType: {
    type: String,
    enum: ['store', 'whole_saler', 'home_business'],
    default: 'store',
    index: true,
  },

  address: {
    street:  { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pinCode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },

  isActive:   { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  totalOffers:    { type: Number, default: 0 },
  totalOrders:    { type: Number, default: 0 },

  targetRevenue: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ ownerId: 1 });
storeSchema.index({ isActive: 1, isVerified: 1 });

module.exports = mongoose.model('Store', storeSchema);