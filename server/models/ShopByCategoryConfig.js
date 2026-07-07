const mongoose = require('mongoose');

const shopByCategoryItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  img: { type: String, required: true },
  color: { type: String, required: true }, // e.g. "from-red-600 to-rose-900"
  accent: { type: String, required: true }, // e.g. "text-red-500"
  icon: { type: String, required: true }, // e.g. "CarFront"
  count: { type: Number, required: true },
  description: { type: String, required: true },
  badge: { type: String, required: true }
}, { _id: false });

const shopByCategoryConfigSchema = new mongoose.Schema({
  items: [shopByCategoryItemSchema]
}, { timestamps: true });

// Default items matching your exact original design
const defaultItems = [
  { id: 'vehicles', title: "Vehicles & Tracksets", img: "/chars/car3.png", color: "from-red-600 to-rose-900", accent: "text-red-500", icon: "CarFront", count: 42, description: "Remote control & diecast models", badge: "Trending" },
  { id: 'art', title: "Art & Craft", img: "/chars/barbie.avif", color: "from-purple-600 to-indigo-900", accent: "text-purple-500", icon: "Palette", count: 36, description: "Creative kits & painting sets", badge: "Creative" },
  { id: 'collectors', title: "Collectors Edition", img: "/pngcar2.png", color: "from-amber-500 to-orange-800", accent: "text-amber-500", icon: "Trophy", count: 18, description: "Limited edition premium models", badge: "Exclusive" },
  { id: 'puzzles', title: "Games & Puzzles", img: "/chars/pokemon.avif", color: "from-emerald-500 to-green-800", accent: "text-emerald-500", icon: "Gamepad2", count: 27, description: "Strategy games & brain teasers", badge: "Fun" },
  { id: 'dolls', title: "Premium Dolls", img: "/chars/princess.avif", color: "from-pink-500 to-rose-700", accent: "text-pink-500", icon: "Gift", count: 31, description: "Fashion dolls & playsets", badge: "Popular" },
  { id: 'educational', title: "STEM & Learning", img: "/chars/avengers.avif", color: "from-blue-500 to-cyan-700", accent: "text-blue-500", icon: "Brain", count: 24, description: "Science kits & educational toys", badge: "Smart" }
];

shopByCategoryConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ items: defaultItems });
  }
  return config;
};

shopByCategoryConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    config.items = defaultItems;
    await config.save();
  } else {
    config = await this.create({ items: defaultItems });
  }
  return config;
};

module.exports = mongoose.model('ShopByCategoryConfig', shopByCategoryConfigSchema);