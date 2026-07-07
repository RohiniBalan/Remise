const express = require('express');
const router = express.Router();
const { getConfig, updateConfig, resetConfig } = require('../controllers/blogLifestyleController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getConfig);
router.put('/', protect, verifyAdmin, updateConfig);
router.post('/reset', protect, verifyAdmin, resetConfig);

module.exports = router;