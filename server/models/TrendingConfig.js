const mongoose = require('mongoose');

const trendingConfigSchema = new mongoose.Schema({
  sectionTitle: {
    type: String,
    default: 'Hot Drops'
  },
  sectionSubtitle: {
    type: String,
    default: 'Discover the most coveted R/C and scale models dominating the community this week.'
  },
  badgeText: {
    type: String,
    default: 'Trending Now'
  },
  buttonText: {
    type: String,
    default: 'EXPLORE ALL'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one configuration document exists
trendingConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('TrendingConfig', trendingConfigSchema);