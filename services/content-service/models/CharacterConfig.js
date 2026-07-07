const mongoose = require('mongoose');

const characterItemSchema = new mongoose.Schema({ name: String, image: String, link: String }, { _id: false });

const characterConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Shop by Character' },
  sectionSubtitle: { type: String, default: '' },
  characters: [characterItemSchema],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

characterConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('CharacterConfig', characterConfigSchema);
