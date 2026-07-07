const mongoose = require('mongoose');

const trendingVideoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Premium', 'Limited', 'Exclusive', 'Elite', "Collector's", 'Tech', 'Sport', 'Luxury'], default: 'Premium' },
  views: { type: String, default: '0' },
  duration: { type: String, default: '0:00' },
  src: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String },
  updatedBy: { type: String },
}, { timestamps: true });

trendingVideoSchema.index({ order: 1, isActive: 1 });
trendingVideoSchema.index({ category: 1 });

module.exports = mongoose.model('TrendingVideo', trendingVideoSchema);
