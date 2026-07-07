const express = require('express');
const router = express.Router();
const { getReviews, updateReviews, resetReviews } = require('../controllers/reviewController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getReviews);
router.put('/', protect, verifyAdmin, updateReviews);
router.post('/reset', protect, verifyAdmin, resetReviews);

module.exports = router;