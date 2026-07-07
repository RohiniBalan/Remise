const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, default: "General" },
  tags: [String],
  featured: { type: Boolean, default: false }
}, { _id: false });

const enhancedTestimonialsConfigSchema = new mongoose.Schema({
  reviews: [reviewSchema],
  hero: {
    badge: { type: String, default: "The Gold Standard of Play" },
    title: { type: String, default: "Voices of " },
    titleHighlight: { type: String, default: "Wonder" },
    subtitle: { type: String, default: "At WOW Lifestyle, we don't just sell toys; we curate memories. Experience why collectors and families trust our vision." }
  },
  spotlight: {
    badge: { type: String, default: "The Visionary" },
    quote: { type: String, default: "\"Play is the highest form of research.\"" },
    description: { type: String, default: "\"Every item in our shop is hand-vetted to ensure it sparks curiosity and developmental growth.\"" },
    name: { type: String, default: "Alexander V. Sterling" },
    role: { type: String, default: "Founder & CEO, WOW Lifestyle" },
    image: { type: String, default: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800" },
    stampText: { type: String, default: "Committed to Quality Since 2012" }
  },
  cta: {
    title: { type: String, default: "Your Story " },
    titleHighlight: { type: String, default: "Awaits" },
    buttonText: { type: String, default: "Share Your Experience" }
  }
}, { timestamps: true });

const defaultReviews = [
  { id: "1", name: "Sarah Jenkins", role: "Parent", text: "The 'Gold-Foil' wrapping was beautiful. WOW Lifestyle understands the magic of gifting.", rating: 5, image: "https://i.pravatar.cc/150?u=sarah", category: "Gifting", tags: ["Premium Packaging"], featured: true },
  { id: "2", name: "David Chen", role: "Enthusiast", text: "Their drone repair lab saved my custom FPV drone. Expert technicians.", rating: 5, image: "https://i.pravatar.cc/150?u=david", category: "Repairs", tags: ["Quick Service"], featured: false },
  { id: "3", name: "Marcus Thorne", role: "Hobbyist", text: "The selection of STEM toys is unmatched. Engineering principles through play.", rating: 5, image: "https://i.pravatar.cc/150?u=marcus", category: "Education", tags: ["STEM Learning"], featured: false },
  { id: "4", name: "Elena Rodriguez", role: "Collector", text: "Personal Shopper service was a godsend. Found the perfect age-appropriate gift.", rating: 5, image: "https://i.pravatar.cc/150?u=elena", category: "Shopping", tags: ["Bespoke"], featured: true },
];

enhancedTestimonialsConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ reviews: defaultReviews });
  }
  return config;
};

enhancedTestimonialsConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    config.reviews = defaultReviews;
    config.hero = { badge: "The Gold Standard of Play", title: "Voices of ", titleHighlight: "Wonder", subtitle: "At WOW Lifestyle, we don't just sell toys; we curate memories. Experience why collectors and families trust our vision." };
    config.spotlight = { badge: "The Visionary", quote: "\"Play is the highest form of research.\"", description: "\"Every item in our shop is hand-vetted to ensure it sparks curiosity and developmental growth.\"", name: "Alexander V. Sterling", role: "Founder & CEO, WOW Lifestyle", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", stampText: "Committed to Quality Since 2012" };
    config.cta = { title: "Your Story ", titleHighlight: "Awaits", buttonText: "Share Your Experience" };
    await config.save();
  } else {
    config = await this.create({ reviews: defaultReviews });
  }
  return config;
};

module.exports = mongoose.model('EnhancedTestimonialsConfig', enhancedTestimonialsConfigSchema);