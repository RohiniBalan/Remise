const mongoose = require('mongoose');

const studioVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  src: { type: String, required: true },
  thumbnail: { type: String },
  description: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String },
  updatedBy: { type: String },
}, { timestamps: true });

const studioConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Studio Showcase' },
  sectionSubtitle: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

studioConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

const StudioConfig = mongoose.model('StudioConfig', studioConfigSchema);
const StudioVideo = mongoose.model('StudioVideo', studioVideoSchema);

module.exports = { StudioConfig, StudioVideo };
