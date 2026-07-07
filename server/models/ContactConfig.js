const mongoose = require('mongoose');

const contactConfigSchema = new mongoose.Schema({
  title: { type: String, default: "Get in Touch" },
  subtitle: { type: String, default: "We'd love to hear from you. Contact us for any queries." },
  email: { type: String, default: "contact@wowlifestyle.com" },
  phone: { type: String, default: "+91 98765 43210" },
  address: { type: String, default: "123 Lifestyle Street, Mumbai, India 400001" },
  hoursWeekday: { type: String, default: "9:00 AM - 8:00 PM" },
  hoursSaturday: { type: String, default: "10:00 AM - 6:00 PM" },
  hoursSunday: { type: String, default: "Closed" }
}, { timestamps: true });

const defaultContact = {
  title: "Get in Touch",
  subtitle: "We'd love to hear from you. Contact us for any queries.",
  email: "contact@wowlifestyle.com",
  phone: "+91 98765 43210",
  address: "123 Lifestyle Street, Mumbai, India 400001",
  hoursWeekday: "9:00 AM - 8:00 PM",
  hoursSaturday: "10:00 AM - 6:00 PM",
  hoursSunday: "Closed"
};

contactConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create(defaultContact);
  }
  return config;
};

contactConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    Object.assign(config, defaultContact);
    await config.save();
  } else {
    config = await this.create(defaultContact);
  }
  return config;
};

module.exports = mongoose.model('ContactConfig', contactConfigSchema);