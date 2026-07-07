const mongoose = require('mongoose');

const ageGroupSchema = new mongoose.Schema({ label: String, image: String, link: String, ageRange: String }, { _id: false });

const shopByAgeConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Shop by Age' },
  sectionSubtitle: { type: String, default: '' },
  ageGroups: [ageGroupSchema],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

shopByAgeConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('ShopByAgeConfig', shopByAgeConfigSchema);
