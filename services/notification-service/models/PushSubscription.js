const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },

  // Web Push Protocol subscription object
  subscription: {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true }
    }
  },

  // User's last known location — used for geospatial matching
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],   // [longitude, latitude]
      default: [0, 0]
    }
  },

  isActive:    { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
});

pushSubscriptionSchema.index({ location: '2dsphere' });
pushSubscriptionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
