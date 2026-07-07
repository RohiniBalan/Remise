const mongoose = require('mongoose');

const trendingVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Premium', 'Limited', 'Exclusive', 'Elite', 'Collector\'s', 'Tech', 'Sport', 'Luxury'],
    default: 'Premium'
  },
  views: {
    type: String,
    required: [true, 'Views count is required'],
    default: '0'
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    default: '0:00'
  },
  src: {
    type: String,
    required: [true, 'Video source URL is required']
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
trendingVideoSchema.index({ order: 1, isActive: 1 });
trendingVideoSchema.index({ category: 1 });

module.exports = mongoose.model('TrendingVideo', trendingVideoSchema);