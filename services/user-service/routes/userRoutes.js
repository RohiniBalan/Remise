const express = require('express');
const router = express.Router();
const { syncCart, getCart } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/cart/sync', protect, syncCart);
router.get('/cart', protect, getCart);

module.exports = router;
