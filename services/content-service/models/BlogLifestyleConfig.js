const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({ title: String, excerpt: String, image: String, link: String, date: String, category: String }, { _id: false });

const blogLifestyleConfigSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: 'From Our Blog' },
  sectionSubtitle: { type: String, default: '' },
  posts: [blogPostSchema],
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

blogLifestyleConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('BlogLifestyleConfig', blogLifestyleConfigSchema);
