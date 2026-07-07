const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// @route   GET /api/orders/my-orders
// @desc    Get all orders for the currently logged-in user
router.get('/my-orders', async (req, res) => {
    try {
        const { userId, email } = req.query;

        if (!userId && !email) {
            return res.status(400).json({ success: false, message: 'User ID or Email is required to fetch orders.' });
        }

        // Build a query to find orders matching EITHER the userId OR the contactEmail
        const queryConditions = [];
        if (userId && userId !== 'undefined' && userId !== 'null') {
            queryConditions.push({ userId: userId });
        }
        if (email && email !== 'undefined' && email !== 'null') {
            queryConditions.push({ contactEmail: email });
        }

        if (queryConditions.length === 0) {
            return res.status(400).json({ success: false, message: 'Valid user credentials required.' });
        }

        // Find matching orders and sort by newest first
        const orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch your orders' });
    }
});

module.exports = router;