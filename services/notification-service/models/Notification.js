const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:  { type: String, required: true, index: true },
  offerId: { type: String, default: null },
  storeId: { type: String, default: null },
  type:    { type: String, enum: ['offer', 'order'], default: 'offer' },

  // Display data
  title:   { type: String, required: true },
  body:    { type: String, default: '' },
  image:   { type: String, default: null },
  url:     { type: String, default: '/nearby' },   // deep-link on click

  isRead:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
