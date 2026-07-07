const mongoose = require('mongoose');

const ralleyzSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Ralleyz Collection' },
  sectionSubtitle: { type: String, default: '' },
  badgeText: { type: String, default: 'FEATURED' },
  buttonText: { type: String, default: 'Shop Now' },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

ralleyzSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('RalleyzConfig', ralleyzSchema);
