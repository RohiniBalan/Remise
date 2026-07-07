const express = require('express');
const router = express.Router();
const { getCategories, updateCategories, resetCategories } = require('../controllers/shopByCategoryController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getCategories);
router.put('/', protect, verifyAdmin, updateCategories);
router.post('/reset', protect, verifyAdmin, resetCategories);

module.exports = router;