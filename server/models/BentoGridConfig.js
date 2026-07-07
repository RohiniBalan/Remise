const mongoose = require('mongoose');

const bentoGridItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  className: { type: String, required: true }, // Controls grid span
  img: { type: String, required: true },
  isVideo: { type: Boolean, default: false },
  icon: { type: String, required: true }, // e.g. "Star"
  iconColor: { type: String, required: true }, // e.g. "text-yellow-400"
  color: { type: String, required: true } // Hover overlay hex color
}, { _id: false });

const bentoGridConfigSchema = new mongoose.Schema({
  items: [bentoGridItemSchema]
}, { timestamps: true });

// Default items matching your exact original layout
const defaultItems = [
  { id: "1", title: "Iconic Heroes", subtitle: "Legends Assemble", className: "md:col-span-1 md:row-span-2", img: "/chars/dead.avif", isVideo: false, icon: "Star", iconColor: "text-yellow-400", color: "#C41E3A" },
  { id: "2", title: "Holiday Bestsellers", subtitle: "Trending Now", className: "md:col-span-2 md:row-span-2", img: "https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314414/car_x8lshu.mp4", isVideo: true, icon: "Gift", iconColor: "text-purple-400", color: "#800080" },
  { id: "3", title: "Smart Play", subtitle: "Educational", className: "md:col-span-1 md:row-span-1", img: "/chars/car1.png", isVideo: false, icon: "Brain", iconColor: "text-blue-400", color: "#0066CC" },
  { id: "4", title: "Indoor Fun", subtitle: "Active Play", className: "md:col-span-1 md:row-span-1", img: "/chars/car2.png", isVideo: false, icon: "Music", iconColor: "text-pink-400", color: "#FF1493" },
  { id: "5", title: "Outdoor Adventure", subtitle: "Go Explore", className: "md:col-span-2 md:row-span-1", img: "https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314437/drone_fogxvc.mp4", isVideo: true, icon: "Rocket", iconColor: "text-orange-400", color: "#FF4500" },
  { id: "6", title: "Speed Zone", subtitle: "Race Ready", className: "md:col-span-1 md:row-span-1", img: "/chars/car3.png", isVideo: false, icon: "Zap", iconColor: "text-red-400", color: "#DC143C" },
  { id: "7", title: "Creative Studio", subtitle: "Arts & Crafts", className: "md:col-span-1 md:row-span-1", img: "/chars/barbie.avif", isVideo: false, icon: "Palette", iconColor: "text-teal-400", color: "#00CED1" },
  { id: "8", title: "Future Tech", subtitle: "Robotics & Coding", className: "md:col-span-2 md:row-span-1", img: "https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314440/rc_zxsclo.mp4", isVideo: true, icon: "Bot", iconColor: "text-cyan-400", color: "#00B7FF" },
  { id: "9", title: "Family Games", subtitle: "Board Games", className: "md:col-span-2 md:row-span-1", img: "/chars/pokemon.avif", isVideo: false, icon: "Gamepad2", iconColor: "text-green-400", color: "#32CD32" }
];

bentoGridConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ items: defaultItems });
  }
  return config;
};

bentoGridConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    config.items = defaultItems;
    await config.save();
  } else {
    config = await this.create({ items: defaultItems });
  }
  return config;
};

module.exports = mongoose.model('BentoGridConfig', bentoGridConfigSchema);