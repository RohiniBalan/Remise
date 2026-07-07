const mongoose = require('mongoose');

const contactConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Contact Us' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  mapUrl: { type: String, default: '' },
  socialLinks: { facebook: String, instagram: String, twitter: String, youtube: String },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

contactConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('ContactConfig', contactConfigSchema);
