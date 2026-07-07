require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const registerRoutes = require('./routes/index');

const app = express();
app.set('trust proxy', 1);

// Ensure all upload subdirectories exist
const uploadDirs = ['hero', 'trending', 'studio', 'ralleyz', 'characters', 'bestsellers', 'shopbyage', 'shopbycategory', 'bentogrid', 'reviews'];
uploadDirs.forEach(d => {
  const dir = path.join(__dirname, 'uploads', d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register all content routes
registerRoutes(app);

app.get('/health', (req, res) => res.json({ success: true, service: 'content-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const initializeConfigs = async () => {
  const configs = [
    ['Hero',                    () => require('./models/Hero').getConfig()],
    ['TrendingConfig',          () => require('./models/TrendingConfig').getConfig()],
    ['RalleyzConfig',           () => require('./models/RalleyzConfig').getConfig()],
    ['CharacterConfig',         () => require('./models/CharacterConfig').getConfig()],
    ['BestSellerConfig',        () => require('./models/BestSellerConfig').getConfig()],
    ['ShopByAgeConfig',         () => require('./models/ShopByAgeConfig').getConfig()],
    ['ShopByCategoryConfig',    () => require('./models/ShopByCategoryConfig').getConfig()],
    ['BentoGridConfig',         () => require('./models/BentoGridConfig').getConfig()],
    ['ReviewConfig',            () => require('./models/ReviewConfig').getConfig()],
    ['ServicesConfig',          () => require('./models/ServicesConfig').getConfig()],
    ['ContactConfig',           () => require('./models/ContactConfig').getConfig()],
    ['BlogLifestyleConfig',     () => require('./models/BlogLifestyleConfig').getConfig()],
    ['EnhancedTestimonials',    () => require('./models/EnhancedTestimonialsConfig').getConfig()],
    ['StudioConfig',            () => require('./models/StudioConfig').StudioConfig.getConfig()],
  ];

  for (const [name, fn] of configs) {
    try { await fn(); console.log(`✓ ${name} initialized`); }
    catch (e) { console.error(`Error initializing ${name}:`, e.message); }
  }
};

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    await initializeConfigs();
    const PORT = process.env.PORT || 3006;
    app.listen(PORT, () => console.log(`✅ Content Service running on port ${PORT}`));
  })
  .catch(err => { console.error('Content Service — MongoDB error:', err); process.exit(1); });
