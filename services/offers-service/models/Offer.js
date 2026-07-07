const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  // Store reference (denormalized for quick reads)
  storeId:   { type: String, required: true, index: true },
  storeName: { type: String, required: true },

  // Store location snapshot — used for $near queries
  storeLocation: {
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

  // Offer details
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  image:       { type: String, required: true },   // uploaded image path
  category:    { type: String, default: 'General' },

  // Pricing
  originalPrice: { type: Number, required: true, min: 0 },
  offerPrice:    { type: Number, required: true, min: 0 },
  discountPercent: {
    type: Number,
    default: function () {
      if (!this.originalPrice || this.originalPrice === 0) return 0;
      return Math.round(((this.originalPrice - this.offerPrice) / this.originalPrice) * 100);
    }
  },

  // Validity window
  validFrom:  { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },

  // Notification settings
  notificationRadius: { type: Number, default: 5, min: 1, max: 50 }, // km

  // Flags
  isActive:           { type: Boolean, default: true },
  notificationSent:   { type: Boolean, default: false },

  // Counters
  viewCount:  { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

offerSchema.index({ storeLocation: '2dsphere' });
offerSchema.index({ storeId: 1, isActive: 1 });
offerSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Offer', offerSchema);
