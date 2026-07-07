const mongoose = require('mongoose');

const testimonialItemSchema = new mongoose.Schema({ author: String, role: String, comment: String, avatar: String, rating: { type: Number, min: 1, max: 5 } }, { _id: false });

const enhancedTestimonialsSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'What Our Customers Say' },
  sectionSubtitle: { type: String, default: '' },
  testimonials: [testimonialItemSchema],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

enhancedTestimonialsSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('EnhancedTestimonialsConfig', enhancedTestimonialsSchema);
