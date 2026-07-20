const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register, login, googleCallback, googleSuccess,
  getProfile, updateProfile, logout, logoutAll,
  forgotPassword, resetPassword,
  verifyEmail, resendVerification, upgradeToStoreOwner,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'https://wow-frontedn-y73e.vercel.app'}/auth?error=google_auth_failed` }),
  googleCallback
);
router.post('/google/success', googleSuccess);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// ── Email verification ────────────────────────────────────────────────────────
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// ── Internal (service-to-service only) ───────────────────────────────────────
router.post('/internal/upgrade-role', upgradeToStoreOwner); // open — accepts { email } in body

router.get('/admin', protect, authorize('admin'), (req, res) =>
  res.json({ success: true, message: 'Welcome admin!', data: req.user })
);
router.get('/moderator', protect, authorize('admin', 'moderator'), (req, res) =>
  res.json({ success: true, message: 'Welcome moderator or admin!', data: req.user })
);

module.exports = router;
