const mongoose = require('mongoose');

const trendingConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Hot Drops' },
  sectionSubtitle: { type: String, default: 'Trending this week' },
  badgeText: { type: String, default: 'NEW' },
  buttonText: { type: String, default: 'View All' },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

trendingConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('TrendingConfig', trendingConfigSchema);
