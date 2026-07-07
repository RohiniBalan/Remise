const express = require('express');
const router = express.Router();
const passport = require('passport');
const { 
  register, 
  login, 
  googleCallback,
  googleSuccess,
  getProfile, 
  updateProfile 
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    // FIXED: Now correctly points back to your Vercel frontend on failure
    failureRedirect: `${process.env.frontendurl11 || 'https://wow-frontedn-y73e.vercel.app'}/auth?error=google_auth_failed`
  }),
  googleCallback
);

router.post('/google/success', googleSuccess);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin only routes
router.get('/admin', protect, authorize('admin'), (req, res) => {
  res.json({ 
    success: true, 
    message: 'Welcome admin!',
    data: req.user 
  });
});

// Moderator and Admin routes
router.get('/moderator', protect, authorize('admin', 'moderator'), (req, res) => {
  res.json({ 
    success: true, 
    message: 'Welcome moderator or admin!',
    data: req.user 
  });
});

module.exports = router;