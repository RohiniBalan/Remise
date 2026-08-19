const express = require('express');
const router = express.Router();
const { getAdminDashboardStats } = require('../controllers/adminStatsController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/admin/stats
// @desc    Get aggregated statistics for admin dashboard
// @access  Private/Admin
router.get('/', protect, verifyAdmin, getAdminDashboardStats);

module.exports = router;
