const mongoose = require('mongoose');

const reviewItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  date: { type: String, required: true },
  avatar: { type: String, required: true }
}, { _id: false });

const photoItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const reviewConfigSchema = new mongoose.Schema({
  reviews: [reviewItemSchema],
  photos: [photoItemSchema]
}, { timestamps: true });

// Default items based exactly on your code
const defaultReviews = [
  { id: "1", name: "Alex Chen", rating: 5, text: "The detail on the F1 model is absolutely insane! Worth every penny.", date: "2 days ago", avatar: "/avatars/1.jpg" },
  { id: "2", name: "Sarah J.", rating: 5, text: "My son hasn't stopped playing with the drone. Battery life is surprising!", date: "1 week ago", avatar: "/avatars/2.jpg" },
  { id: "3", name: "Mike Ross", rating: 4, text: "Fast shipping, great packaging. The vintage car collection is a must-have.", date: "3 days ago", avatar: "/avatars/3.jpg" },
  { id: "4", name: "Emily D.", rating: 5, text: "Best customer service I've experienced. They replaced a missing part instantly.", date: "Yesterday", avatar: "/avatars/4.jpg" },
  { id: "5", name: "Chris P.", rating: 5, text: "The 3D view on the website really helped me choose. Product looks exactly like the video.", date: "2 weeks ago", avatar: "/avatars/5.jpg" },
];

const defaultPhotos = [
  { id: "p1", url: '/chars/dead.avif' }, 
  { id: "p2", url: '/chars/car1.png' }, 
  { id: "p3", url: '/chars/car2.png' }, 
  { id: "p4", url: '/chars/car3.png' }, 
  { id: "p5", url: '/chars/spiderman.avif' }
];

reviewConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ reviews: defaultReviews, photos: defaultPhotos });
  }
  return config;
};

reviewConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    config.reviews = defaultReviews;
    config.photos = defaultPhotos;
    await config.save();
  } else {
    config = await this.create({ reviews: defaultReviews, photos: defaultPhotos });
  }
  return config;
};

module.exports = mongoose.model('ReviewConfig', reviewConfigSchema);