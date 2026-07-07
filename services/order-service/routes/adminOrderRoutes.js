const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, verifyAdmin, getAllOrders);
router.put('/:id/status', protect, verifyAdmin, updateOrderStatus);

module.exports = router;
