const mongoose = require('mongoose');

const reviewItemSchema = new mongoose.Schema({ author: String, rating: { type: Number, min: 1, max: 5 }, comment: String, avatar: String, date: String }, { _id: false });

const reviewConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'Customer Reviews' },
  sectionSubtitle: { type: String, default: '' },
  reviews: [reviewItemSchema],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

reviewConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('ReviewConfig', reviewConfigSchema);
