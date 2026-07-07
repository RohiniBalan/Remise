const mongoose = require('mongoose');

const bestSellerItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  img: { type: String, required: true },
  color: { type: String, required: true } 
}, { _id: false });

const bestSellerConfigSchema = new mongoose.Schema({
  items: [bestSellerItemSchema]
}, { timestamps: true });

// Default items
const defaultItems = [
  { id: "1", name: "Jasco Bear Muffler", img: "/chars/Masha.avif", color: "#831843" }, 
  { id: "2", name: "Hamleys Activity Ball", img: "/chars/pokemon.avif", color: "#713f12" }, 
  { id: "3", name: "Marvel Avengers Set", img: "/chars/avengers.avif", color: "#7f1d1d" }, 
  { id: "4", name: "Hot Wheels Monster", img: "/chars/car3.png", color: "#1e3a8a" }, 
  { id: "5", name: "Super Rigs Transporter", img: "/chars/car2.png", color: "#0f172a" }, 
];

bestSellerConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ items: defaultItems });
  }
  return config;
};

bestSellerConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    config.items = defaultItems;
    await config.save();
  } else {
    config = await this.create({ items: defaultItems });
  }
  return config;
};

module.exports = mongoose.model('BestSellerConfig', bestSellerConfigSchema);