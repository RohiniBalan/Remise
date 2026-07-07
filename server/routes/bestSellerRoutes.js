const express = require('express');
const router = express.Router();
const { getBestSellers, updateBestSellers, resetBestSellers } = require('../controllers/bestSellerController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getBestSellers);
router.put('/', protect, verifyAdmin, updateBestSellers);
router.post('/reset', protect, verifyAdmin, resetBestSellers);

module.exports = router;