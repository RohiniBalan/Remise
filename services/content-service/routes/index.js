/**
 * Content Service — central route registration.
 * Simple sections (get/update/reset) use the createSectionController factory.
 * Complex sections (Hero, Trending, Studio, Contact) have dedicated controllers.
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');
const { createSectionController } = require('../controllers/sectionController');

// ── Dedicated controllers ────────────────────────────────────────────────────
const heroCtrl       = require('../controllers/heroController');
const trendingCtrl   = require('../controllers/trendingController');
const studioCtrl     = require('../controllers/studioController');
const contactCtrl    = require('../controllers/contactController');

// ── Models for generic factory ───────────────────────────────────────────────
const RalleyzConfig              = require('../models/RalleyzConfig');
const CharacterConfig            = require('../models/CharacterConfig');
const BestSellerConfig           = require('../models/BestSellerConfig');
const ShopByAgeConfig            = require('../models/ShopByAgeConfig');
const ShopByCategoryConfig       = require('../models/ShopByCategoryConfig');
const BentoGridConfig            = require('../models/BentoGridConfig');
const ReviewConfig               = require('../models/ReviewConfig');
const ServicesConfig             = require('../models/ServicesConfig');
const BlogLifestyleConfig        = require('../models/BlogLifestyleConfig');
const EnhancedTestimonialsConfig = require('../models/EnhancedTestimonialsConfig');

// ── Multer setup ─────────────────────────────────────────────────────────────
const makeUpload = (subdir) => {
  const dest = path.join(__dirname, '..', 'uploads', subdir);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dest),
      filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|gif|webp|svg/;
      if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) cb(null, true);
      else cb(new Error('Only image files are allowed'));
    },
  });
};

// ── Generic route builder ────────────────────────────────────────────────────
const buildSimpleRouter = (Model) => {
  const ctrl = createSectionController(Model);
  const router = express.Router();
  router.get('/', ctrl.getConfig);
  router.put('/', protect, verifyAdmin, ctrl.updateConfig);
  router.post('/reset', protect, verifyAdmin, ctrl.resetConfig);
  return router;
};

// ── Hero ─────────────────────────────────────────────────────────────────────
const heroRouter = express.Router();
const heroUpload = makeUpload('hero');
heroRouter.get('/', heroCtrl.getHeroConfig);
heroRouter.put('/', protect, verifyAdmin, heroCtrl.updateHeroConfig);
heroRouter.post('/reset', protect, verifyAdmin, heroCtrl.resetHeroConfig);
heroRouter.post('/upload', protect, verifyAdmin, (req, res, next) => heroUpload.single('image')(req, res, (err) => { if (err) return res.status(400).json({ success: false, message: err.message }); next(); }), heroCtrl.uploadImage);

// ── Trending ─────────────────────────────────────────────────────────────────
const trendingRouter = express.Router();
trendingRouter.get('/', trendingCtrl.getTrendingConfig);
trendingRouter.put('/', protect, verifyAdmin, trendingCtrl.updateTrendingConfig);
trendingRouter.post('/videos', protect, verifyAdmin, trendingCtrl.createTrendingVideo);
trendingRouter.put('/videos/:id', protect, verifyAdmin, trendingCtrl.updateTrendingVideo);
trendingRouter.delete('/videos/:id', protect, verifyAdmin, trendingCtrl.deleteTrendingVideo);

// ── Studio ───────────────────────────────────────────────────────────────────
const studioRouter = express.Router();
studioRouter.get('/config', studioCtrl.getStudioConfig);
studioRouter.get('/videos', studioCtrl.getStudioVideos);
studioRouter.put('/config', protect, verifyAdmin, studioCtrl.updateStudioConfig);
studioRouter.post('/config/reset', protect, verifyAdmin, studioCtrl.resetToDefault);
studioRouter.post('/videos', protect, verifyAdmin, studioCtrl.createStudioVideo);
studioRouter.put('/videos/:id', protect, verifyAdmin, studioCtrl.updateStudioVideo);
studioRouter.delete('/videos/:id', protect, verifyAdmin, studioCtrl.deleteStudioVideo);
studioRouter.post('/videos/reorder', protect, verifyAdmin, studioCtrl.reorderVideos);

// ── Contact ──────────────────────────────────────────────────────────────────
const contactRouter = express.Router();
contactRouter.get('/', contactCtrl.getContact);
contactRouter.post('/messages', contactCtrl.createMessage);
contactRouter.put('/', protect, verifyAdmin, contactCtrl.updateContact);
contactRouter.post('/reset', protect, verifyAdmin, contactCtrl.resetContact);
contactRouter.get('/messages', protect, verifyAdmin, contactCtrl.getMessages);

// ── Register all routes on the app ───────────────────────────────────────────
module.exports = (app) => {
  app.use('/api/hero',                  heroRouter);
  app.use('/api/trending',              trendingRouter);
  app.use('/api/studio',                studioRouter);
  app.use('/api/contact',               contactRouter);
  app.use('/api/ralleyz',               buildSimpleRouter(RalleyzConfig));
  app.use('/api/characters',            buildSimpleRouter(CharacterConfig));
  app.use('/api/bestsellers',           buildSimpleRouter(BestSellerConfig));
  app.use('/api/shopbyage',             buildSimpleRouter(ShopByAgeConfig));
  app.use('/api/shopbycategory',        buildSimpleRouter(ShopByCategoryConfig));
  app.use('/api/bentogrid',             buildSimpleRouter(BentoGridConfig));
  app.use('/api/reviews',               buildSimpleRouter(ReviewConfig));
  app.use('/api/services',              buildSimpleRouter(ServicesConfig));
  app.use('/api/blog-lifestyle',        buildSimpleRouter(BlogLifestyleConfig));
  app.use('/api/enhanced-testimonials', buildSimpleRouter(EnhancedTestimonialsConfig));
};
