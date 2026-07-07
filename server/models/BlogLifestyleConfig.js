const mongoose = require('mongoose');

const featuredArticleSchema = new mongoose.Schema({
  category: { type: String, default: "Heritage & History" },
  title: { type: String, default: "A Dream Fulfilled: From a Cornish Shop to the World's Finest" },
  excerpt: { type: String, default: "In 1760, William Hamley set out to create 'the best toy shop in the world'. Nearly three centuries later, that dream continues to spark joy in over 170 locations globally." },
  author: { type: String, default: "WOW Lifestyle Publishing" },
  date: { type: String, default: "Feb 02, 2026" },
  readTime: { type: String, default: "15 min read" },
  image: { type: String, default: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=2000&q=80" },
  stats: {
    years: { type: String, default: "265+" },
    stores: { type: String, default: "170+" },
    countries: { type: String, default: "40+" },
    smiles: { type: String, default: "5M+" }
  }
}, { _id: false });

const articleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  date: { type: String, required: true },
  excerpt: { type: String, required: true },
  icon: { type: String, required: true } // string name of lucide icon
}, { _id: false });

const testimonialSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number, required: true },
  location: { type: String, required: true }
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  id: { type: String, required: true },
  year: { type: String, required: true },
  event: { type: String, required: true },
  highlight: { type: Boolean, default: false }
}, { _id: false });

const blogLifestyleConfigSchema = new mongoose.Schema({
  featuredArticle: { type: featuredArticleSchema, default: () => ({}) },
  articles: [articleSchema],
  testimonials: [testimonialSchema],
  timeline: [timelineSchema]
}, { timestamps: true });

// --- Default Data ---
const defaultArticles = [
  { id: "1", category: "Global Magic", title: "Spreading the Joy: How 170 Global Shops Unite Children", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80", date: "Jan 28, 2026", excerpt: "From London to Prague to Mumbai, witness the magical experience of live toy demos and character interactions that define WOW Lifestyle.", icon: "Globe2" },
  { id: "2", category: "The Experience", title: "A Delightful Experience: Why Interactive Play is Our Core", image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaad55?auto=format&fit=crop&w=1600&q=80", date: "Jan 25, 2026", excerpt: "Adults get the rare chance to be children again, interacting with favorite characters and watching toys come to life in our live exhibit zones.", icon: "Smile" },
  { id: "3", category: "Safety First", title: "The Quality Promise: Certified Materials & Ethical Sourcing", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1600&q=80", date: "Jan 20, 2026", excerpt: "We don't play around when it comes to quality. Discover our rigorous certification process for every handpicked toy in our collection.", icon: "Shield" },
  { id: "4", category: "Toy Innovation", title: "The Future of Play: How Technology Meets Tradition", image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1600&q=80", date: "Jan 15, 2026", excerpt: "Exploring how augmented reality and sustainable materials are shaping the next generation of classic toys.", icon: "Rocket" }
];

const defaultTestimonials = [
  { id: "t1", name: "Priya Sharma", role: "Mother & Educator", content: "The heritage collection brought back childhood memories while creating new ones for my kids. Truly magical!", rating: 5, location: "Mumbai" },
  { id: "t2", name: "Arjun Mehta", role: "Toy Collector", content: "The authenticity and quality of their limited edition collectibles is unmatched in India. A curator's dream.", rating: 5, location: "Delhi" },
  { id: "t3", name: "Sofia Chen", role: "Child Psychologist", content: "WOW's interactive play zones demonstrate how thoughtfully designed toys support cognitive development.", rating: 5, location: "Bangalore" }
];

const defaultTimeline = [
  { id: "tl1", year: "1760", event: "William Hamley opens 'Noah's Ark' in Cornwall", highlight: true },
  { id: "tl2", year: "1881", event: "First London store opens on Regent Street", highlight: false },
  { id: "tl3", year: "1955", event: "Royal Warrant granted by Queen Elizabeth II", highlight: false },
  { id: "tl4", year: "2000", event: "Expansion into Asian markets begins", highlight: false },
  { id: "tl5", year: "2023", event: "WOW Lifestyle launches in India with 12 stores", highlight: false },
  { id: "tl6", year: "2026", event: "170+ stores across 40 countries", highlight: true }
];

blogLifestyleConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ 
      articles: defaultArticles, 
      testimonials: defaultTestimonials, 
      timeline: defaultTimeline 
    });
  }
  return config;
};

blogLifestyleConfigSchema.statics.resetConfig = async function() {
  // Safest approach: delete existing configuration and create a new one to trigger all schema defaults perfectly
  await this.deleteMany({});
  
  return await this.create({
    articles: defaultArticles,
    testimonials: defaultTestimonials,
    timeline: defaultTimeline
  });
};

module.exports = mongoose.model('BlogLifestyleConfig', blogLifestyleConfigSchema);