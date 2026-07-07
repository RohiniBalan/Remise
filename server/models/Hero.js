const mongoose = require('mongoose');

const brandLogoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  src: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const heroContentSchema = new mongoose.Schema({
  badgeText: {
    type: String,
    required: true,
    default: 'OFFICIAL F1 COLLECTOR SERIES'
  },
  title: {
    type: String,
    required: true,
    default: 'Race Ready.'
  },
  titleGradient: {
    type: String,
    required: true,
    default: 'Miniature Speed.'
  },
  description: {
    type: String,
    required: true,
    default: 'Experience the thrill of the track with our ultra-realistic, precision-engineered diecast Formula 1 collection.'
  },
  primaryButtonText: {
    type: String,
    required: true,
    default: 'Shop Collection'
  },
  secondaryButtonText: {
    type: String,
    required: true,
    default: 'View Gallery'
  },
  carImages: [{
    type: String,
    trim: true
  }],
  brands: [brandLogoSchema]
}, {
  timestamps: true
});

// Only one hero configuration should exist (singleton pattern)
heroContentSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default configuration if none exists
    config = await this.create({
      badgeText: 'OFFICIAL F1 COLLECTOR SERIES',
      title: 'Race Ready.',
      titleGradient: 'Miniature Speed.',
      description: 'Experience the thrill of the track with our ultra-realistic, precision-engineered diecast Formula 1 collection.',
      primaryButtonText: 'Shop Collection',
      secondaryButtonText: 'View Gallery',
      carImages: ['/pngcar.png', '/pngcar2.png', '/pngbike2.png'],
      brands: [
        { name: "Lego City", src: "/logos/city.png" },
        { name: "Technic", src: "/logos/technic.png" }
      ]
    });
  }
  return config;
};

module.exports = mongoose.model('Hero', heroContentSchema);