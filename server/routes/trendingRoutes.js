const express = require('express');
const router = express.Router();
const { 
  getTrendingVideos, 
  getTrendingVideo, 
  createTrendingVideo, 
  updateTrendingVideo, 
  deleteTrendingVideo,
  getTrendingConfig,
  updateTrendingConfig,
  resetTrendingConfig,
  reorderVideos,
  bulkDeleteVideos
} = require('../controllers/trendingController');
const { verifyToken } = require('../middleware/verifyToken');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getTrendingVideos);
router.get('/config', getTrendingConfig);
router.get('/:id', getTrendingVideo);

// Admin routes (protected)
router.post('/', verifyToken, verifyAdmin, createTrendingVideo);
router.put('/:id', verifyToken, verifyAdmin, updateTrendingVideo);
router.delete('/:id', verifyToken, verifyAdmin, deleteTrendingVideo);
router.put('/config/update', verifyToken, verifyAdmin, updateTrendingConfig);
router.post('/config/reset', verifyToken, verifyAdmin, resetTrendingConfig);
router.post('/reorder', verifyToken, verifyAdmin, reorderVideos);
router.post('/bulk-delete', verifyToken, verifyAdmin, bulkDeleteVideos);

module.exports = router;