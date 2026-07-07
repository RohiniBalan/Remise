const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path to your user model if necessary

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    // Fetch all users and exclude their passwords from the response for security
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error while fetching users' 
    });
  }
});

module.exports = router;