const express = require('express');
const router = express.Router();
const { getShopByAge, updateShopByAge, resetShopByAge } = require('../controllers/shopByAgeController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getShopByAge);
router.put('/', protect, verifyAdmin, updateShopByAge);
router.post('/reset', protect, verifyAdmin, resetShopByAge);

module.exports = router;