const mongoose = require('mongoose');

const retailItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: String, required: true },
  originalPrice: { type: String },
  discount: { type: String },
  stock: { type: String, required: true },
  rating: { type: String, required: true },
  sales: { type: String },
  icon: { type: String, required: true }
}, { _id: false });

const wholesaleItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: String, required: true },
  moq: { type: String, required: true },
  margin: { type: String, required: true },
  delivery: { type: String, required: true },
  rating: { type: String, required: true },
  orders: { type: String },
  icon: { type: String, required: true }
}, { _id: false });

const perkSchema = new mongoose.Schema({
  title: String,
  desc: String
}, { _id: false });

const offerSchema = new mongoose.Schema({
  badgeText: String,
  discountPercentage: String,
  title: String,
  description: String,
  perk1: perkSchema,
  perk2: perkSchema,
  perk3: perkSchema,
  buttonText: String,
  terms: String
}, { _id: false });

const servicesConfigSchema = new mongoose.Schema({
  retailProducts: [retailItemSchema],
  wholesaleProducts: [wholesaleItemSchema],
  retailOffer: { type: offerSchema },
  wholesaleOffer: { type: offerSchema }
}, { timestamps: true });

// --- Default Data ---
const defaultRetail = [
  { id: "1", name: "Ferrari F1 Ultimate Collector", category: "Diecast Models", price: "₹12,499", originalPrice: "₹16,999", discount: "26%", stock: "In Stock", rating: "4.8", sales: "1.2k", icon: "🚗" },
  { id: "2", name: "AI Smart Companion Bot", category: "Educational Tech", price: "₹8,999", originalPrice: "₹11,499", discount: "22%", stock: "Limited", rating: "4.9", sales: "845", icon: "🤖" },
  { id: "3", name: "Magic Artist Studio Pro", category: "Arts & Crafts", price: "₹5,499", originalPrice: "₹7,999", discount: "31%", stock: "In Stock", rating: "4.7", sales: "2.3k", icon: "🎨" }
];

const defaultWholesale = [
  { id: "1", name: "Speed Champions Bulk Pack", category: "Vehicles (100 units)", price: "₹2,49,999", moq: "50 units", margin: "45% margin", delivery: "7 days", rating: "4.9", orders: "45", icon: "📦" },
  { id: "2", name: "Educational STEM Kit Pallet", category: "Learning Toys (200 units)", price: "₹3,75,000", moq: "100 units", margin: "52% margin", delivery: "10 days", rating: "4.8", orders: "32", icon: "🧠" },
  { id: "3", name: "Seasonal Festival Collection", category: "Gift Sets (150 units)", price: "₹1,89,999", moq: "75 units", margin: "48% margin", delivery: "5 days", rating: "4.9", orders: "67", icon: "🎁" }
];

const defaultRetailOffer = {
  badgeText: "EXCLUSIVE OFFER",
  discountPercentage: "25",
  title: "OFF FOR RETAIL CUSTOMERS",
  description: "Special discount on all retail purchases",
  perk1: { title: "Minimum Purchase", desc: "₹5,000" },
  perk2: { title: "Valid Until", desc: "Dec 31, 2024" },
  perk3: { title: "Free Gift", desc: "Premium Wrapping Included" },
  buttonText: "APPLY 25% DISCOUNT",
  terms: "*Terms & Conditions apply. Valid on select products."
};

const defaultWholesaleOffer = {
  badgeText: "VOLUME DISCOUNT",
  discountPercentage: "50",
  title: "OFF FOR BUSINESS PARTNERS",
  description: "Maximum discount on bulk purchases",
  perk1: { title: "Minimum Order", desc: "200+ Units" },
  perk2: { title: "Free Shipping", desc: "Pan India Delivery" },
  perk3: { title: "Dedicated Support", desc: "Account Manager Included" },
  buttonText: "APPLY 50% DISCOUNT",
  terms: "*Valid on orders above ₹5,00,000. Limited time offer."
};

servicesConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ 
      retailProducts: defaultRetail, 
      wholesaleProducts: defaultWholesale,
      retailOffer: defaultRetailOffer,
      wholesaleOffer: defaultWholesaleOffer
    });
  } else {
    // Migrate existing databases to include offers
    let needsSave = false;
    if (!config.retailOffer) { config.retailOffer = defaultRetailOffer; needsSave = true; }
    if (!config.wholesaleOffer) { config.wholesaleOffer = defaultWholesaleOffer; needsSave = true; }
    if (needsSave) await config.save();
  }
  return config;
};

servicesConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    config.retailProducts = defaultRetail;
    config.wholesaleProducts = defaultWholesale;
    config.retailOffer = defaultRetailOffer;
    config.wholesaleOffer = defaultWholesaleOffer;
    await config.save();
  } else {
    config = await this.create({ 
      retailProducts: defaultRetail, 
      wholesaleProducts: defaultWholesale,
      retailOffer: defaultRetailOffer,
      wholesaleOffer: defaultWholesaleOffer
    });
  }
  return config;
};

module.exports = mongoose.model('ServicesConfig', servicesConfigSchema);