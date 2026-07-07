// models/Token.js
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // Token will automatically expire after 7 days
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userAgent: String,
  ipAddress: String
});

// Index for faster queries
tokenSchema.index({ userId: 1, isActive: 1 });
tokenSchema.index({ token: 1 });

module.exports = mongoose.model('Token', tokenSchema);