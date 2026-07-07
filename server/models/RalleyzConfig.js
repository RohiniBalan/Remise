const mongoose = require('mongoose');

const ralleyzItemSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Vehicle'
  },
  subtitle: {
    type: String,
    required: true,
    default: 'New Subtitle'
  },
  location: {
    type: String,
    required: true,
    default: 'New Location'
  },
  description: {
    type: String,
    required: true,
    default: 'Description goes here...'
  },
  bg: {
    type: String,
    required: true,
    default: '/chars/bg1.avif'
  }
}, { _id: false });

const ralleyzConfigSchema = new mongoose.Schema({
  items: [ralleyzItemSchema]
}, {
  timestamps: true
});

// Singleton pattern - only one configuration
ralleyzConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default configuration
    config = await this.create({
      items: [
        { 
          id: 1, 
          title: "Big Volt Rover", 
          subtitle: "Remote Control Car",
          location: "Off-Road Series", 
          description: "Tucked away in the Switzerland Alps, Saint Antonien offers an idyllic retreat for those seeking tranquility.",
          bg: "/chars/bg1.avif" 
        },
        { 
          id: 2, 
          title: "Land Rover", 
          subtitle: "Range Rover SUV",
          location: "Luxury Edition",
          description: "A cultural treasure trove with historic shrines and temples, offering a glimpse into the old world.",
          bg: "/chars/bg2.avif" 
        },
        { 
          id: 3, 
          title: "X-Spray Monster", 
          subtitle: "2.4 GHz Racer",
          location: "Speedster",
          description: "The journey from the vibrant souks of Marrakech to the tranquil, starlit sands of Merzouga showcases diversity.",
          bg: "/chars/bg3.avif" 
        },
        { 
          id: 4, 
          title: "Twisted Stunt", 
          subtitle: "Remote Control Car",
          location: "Stunt Zone",
          description: "Yosemite National Park is a sanctuary for those who seek the sublime, featuring towering granite cliffs.",
          bg: "/chars/bg4.avif" 
        },
        { 
          id: 5, 
          title: "Undcad Off Roader", 
          subtitle: "4x4 RC Truck",
          location: "Mountain",
          description: "Famous for its strong winds and sandy shores, widely recognized as a premier destination for kitesurfing.",
          bg: "/chars/bg5.avif" 
        },
      ]
    });
  }
  return config;
};

module.exports = mongoose.model('RalleyzConfig', ralleyzConfigSchema);