const express = require('express');
const router = express.Router();
const { getAllUsers, getAdminDashboardStats } = require('../controllers/userController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, verifyAdmin, (req, res) => {
  // If mounted at /api/admin/stats, return stats; if at /api/admin/users, return all users
  if (req.baseUrl.includes('stats') || req.path === '/stats') {
    return getAdminDashboardStats(req, res);
  }
  return getAllUsers(req, res);
});
router.get('/stats', protect, verifyAdmin, getAdminDashboardStats);

module.exports = router;

