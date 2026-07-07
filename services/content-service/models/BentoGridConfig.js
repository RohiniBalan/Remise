const mongoose = require('mongoose');

const bentoItemSchema = new mongoose.Schema({ title: String, image: String, link: String, size: { type: String, default: 'medium' }, order: { type: Number, default: 0 } }, { _id: false });

const bentoGridConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: '' },
  items: [bentoItemSchema],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

bentoGridConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('BentoGridConfig', bentoGridConfigSchema);
