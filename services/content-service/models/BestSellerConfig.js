const mongoose = require('mongoose');

const bestSellerConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Best Sellers' },
  sectionSubtitle: { type: String, default: '' },
  badgeText: { type: String, default: 'TOP PICKS' },
  buttonText: { type: String, default: 'View All' },
  productIds: [{ type: String }],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

bestSellerConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('BestSellerConfig', bestSellerConfigSchema);
