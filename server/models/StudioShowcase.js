const mongoose = require('mongoose');

const studioShowcaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'STUDIO SHOWCASE'
  },
  subtitle: {
    type: String,
    required: true,
    default: 'Watch our premium vintage models in action. Fast-paced automotive exhibition.'
  },
  badgeText: {
    type: String,
    required: true,
    default: 'Live Exhibit'
  },
  highlightText: {
    type: String,
    required: true,
    default: 'SHOWCASE'
  },
  buttonText: {
    type: String,
    required: true,
    default: 'View All'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoCycleDuration: {
    type: Number,
    default: 5000 // milliseconds
  },
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark'
  }
}, {
  timestamps: true
});

const studioVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  videoId: {
    type: Number,
    required: true,
    unique: true
  },
  src: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true,
    default: '#C41E3A'
  },
  rating: {
    type: String,
    required: true,
    default: '9.5'
  },
  category: {
    type: String,
    required: true,
    default: 'Vintage Collection'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Get or create default config
studioShowcaseSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

const StudioShowcase = mongoose.model('StudioShowcase', studioShowcaseSchema);
const StudioVideo = mongoose.model('StudioVideo', studioVideoSchema);

module.exports = { StudioShowcase, StudioVideo };