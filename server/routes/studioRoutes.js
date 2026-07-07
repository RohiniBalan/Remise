const express = require('express');
const router = express.Router();
const studioController = require('../controllers/studioController');

// Public routes
router.get('/config', studioController.getStudioConfig);
router.get('/videos', studioController.getStudioVideos);

// Admin routes
router.put('/config', studioController.updateStudioConfig);
router.post('/config/reset', studioController.resetToDefault);
router.post('/videos', studioController.createStudioVideo);
router.put('/videos/:id', studioController.updateStudioVideo);
router.delete('/videos/:id', studioController.deleteStudioVideo);
router.post('/videos/reorder', studioController.reorderVideos);

module.exports = router;