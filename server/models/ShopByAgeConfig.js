const mongoose = require('mongoose');

const shopByAgeItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  sub: { type: String, required: true },
  img: { type: String, required: true },
  gradient: { type: String, required: true },
  icon: { type: String, required: true } 
}, { _id: false });

const shopByAgeConfigSchema = new mongoose.Schema({
  items: [shopByAgeItemSchema]
}, { timestamps: true });

// Default items based on your design
const defaultItems = [
  { id: "1", label: "0-18 Months", sub: "Infant Care", img: "/chars/Masha.avif", gradient: "from-pink-500 to-rose-600", icon: "Baby" },
  { id: "2", label: "18-36 Months", sub: "Toddler Fun", img: "/chars/mickey.avif", gradient: "from-cyan-500 to-blue-600", icon: "Star" },
  { id: "3", label: "3-5 Years", sub: "Preschool", img: "/chars/pokemon.avif", gradient: "from-amber-400 to-orange-600", icon: "Building2" },
  { id: "4", label: "5-7 Years", sub: "Action Hero", img: "/chars/spiderman.avif", gradient: "from-red-600 to-red-800", icon: "Zap" },
  { id: "5", label: "7-9 Years", sub: "Dreamers", img: "/chars/barbie.avif", gradient: "from-fuchsia-500 to-purple-600", icon: "Sparkles" },
  { id: "6", label: "9-12 Years", sub: "Racers", img: "/chars/car3.png", gradient: "from-orange-500 to-red-600", icon: "Gauge" },
  { id: "7", label: "12-14 Years", sub: "Speed Freak", img: "/pngcar.png", gradient: "from-slate-800 to-black", icon: "Trophy" },
  { id: "8", label: "14-16 Years", sub: "Wizardry", img: "/chars/harrypotter.avif", gradient: "from-purple-800 to-indigo-900", icon: "Wand2" },
];

shopByAgeConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ items: defaultItems });
  }
  return config;
};

shopByAgeConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    config.items = defaultItems;
    await config.save();
  } else {
    config = await this.create({ items: defaultItems });
  }
  return config;
};

module.exports = mongoose.model('ShopByAgeConfig', shopByAgeConfigSchema);