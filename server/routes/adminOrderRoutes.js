const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// @route   GET /api/admin/orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'fullname') 
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        // Validate status
        if (!['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { orderStatus: status }, 
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});

module.exports = router;