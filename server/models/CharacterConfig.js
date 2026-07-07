const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  src: { type: String, required: true }
});

const characterConfigSchema = new mongoose.Schema({
  characters: [characterSchema]
}, { timestamps: true });

// Default characters to seed the database
const defaultCharacters = [
  { id: "1", name: "Avengers", color: "#E62429", src: "/chars/avengers.avif" },
  { id: "2", name: "Frozen", color: "#00B7FF", src: "/chars/frozen.avif" },
  { id: "3", name: "Spiderman", color: "#F0131E", src: "/chars/spiderman.avif" },
  { id: "4", name: "Barbie", color: "#E0218A", src: "/chars/barbie.avif" },
  { id: "5", name: "Paw Patrol", color: "#005EB8", src: "/chars/Masha.avif" },
  { id: "6", name: "Pokemon", color: "#FFCB05", src: "/chars/pokemon.avif" },
  { id: "7", name: "Harry Potter", color: "#740001", src: "/chars/harrypotter.avif" },
  { id: "8", name: "Mickey Mouse", color: "#FFCC00", src: "/chars/mickey.avif" },
  { id: "9", name: "Disney Princess", color: "#FF69B4", src: "/chars/princess.avif" }
];

// Static method to get or create the config
characterConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ characters: defaultCharacters });
  }
  return config;
};

// Static method to reset the config
characterConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    config.characters = defaultCharacters;
    await config.save();
  } else {
    config = await this.create({ characters: defaultCharacters });
  }
  return config;
};

module.exports = mongoose.model('CharacterConfig', characterConfigSchema);