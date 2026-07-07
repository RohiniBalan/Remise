const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema({ title: String, description: String, icon: String }, { _id: false });

const servicesConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Our Services' },
  sectionSubtitle: { type: String, default: '' },
  services: [serviceItemSchema],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

servicesConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('ServicesConfig', servicesConfigSchema);
