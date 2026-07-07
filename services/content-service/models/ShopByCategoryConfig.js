const mongoose = require('mongoose');

const categoryItemSchema = new mongoose.Schema({ name: String, image: String, link: String }, { _id: false });

const shopByCategoryConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Shop by Category' },
  sectionSubtitle: { type: String, default: '' },
  categories: [categoryItemSchema],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

shopByCategoryConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('ShopByCategoryConfig', shopByCategoryConfigSchema);
