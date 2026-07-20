const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const Token  = require('../models/Token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter';
  if (!/\d/.test(password)) return 'Password must include at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character';
  return '';
};

const register = async (req, res, next) => {
  try {
    const { fullname, email, mobilenumber, password, role } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { mobilenumber }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile number',
      });
    }

    // Only allow 'user' or 'store_owner' at self-registration — never 'admin' or 'moderator'
    const allowedRoles = ['user', 'store_owner'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    // Generate email verification token (raw → store hashed)
    const rawVerifyToken    = crypto.randomBytes(32).toString('hex');
    const hashedVerifyToken = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');
    const verifyExpires     = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    const user = await User.create({
      fullname, email, mobilenumber, password, role: assignedRole,
      isEmailVerified:          false,
      emailVerificationToken:   hashedVerifyToken,
      emailVerificationExpires: verifyExpires,
    });

    const token = generateToken(user._id, user.role);

    // Fire-and-forget — don't block the response if email fails
    sendVerificationEmail(user.email, user.fullname, rawVerifyToken).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        _id: user._id, fullname: user.fullname, email: user.email,
        mobilenumber: user.mobilenumber, role: user.role,
        isEmailVerified: false,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.googleId && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.',
      });
    }

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id, user.role);

    await Token.create({
      userId: user._id,
      token,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      lastUsedAt: new Date(),
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id, fullname: user.fullname, email: user.email,
        mobilenumber: user.mobilenumber, role: user.role,
        isEmailVerified: user.isEmailVerified,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user._id, user.role);
    const frontendURL = process.env.FRONTEND_URL || 'https://wow-frontedn-y73e.vercel.app';

    res.redirect(
      `${frontendURL}/auth/google-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        _id: user._id, fullname: user.fullname, email: user.email,
        mobilenumber: user.mobilenumber, role: user.role,
      }))}`
    );
  } catch {
    res.redirect(`${process.env.FRONTEND_URL || 'https://wow-frontedn-y73e.vercel.app'}/auth?error=google_auth_failed`);
  }
};

const googleSuccess = async (req, res) => {
  const { token, user } = req.body;
  res.status(200).json({ success: true, message: 'Google authentication successful', data: { ...user, token } });
};

const getProfile = async (req, res, next) => {
  try {
    // Fixed URL, identity comes only from the Authorization header — must
    // never be cached, or one user's profile can be served to another.
    res.set('Cache-Control', 'no-store');
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const {
      fullname,
      email,
      mobilenumber,
      dob,
      gender,
      avatar,
      profileData,
      addresses,
      paymentMethods,
      wishlist,
      savedCart,
      rewardsCoupons,
      recentOrders,
      recentlyViewedProducts,
      favoriteStores,
      storeProfile,
      businessDetails,
      verificationStatus,
      storeActivity,
      upiId,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (mobilenumber && mobilenumber !== user.mobilenumber) {
      const taken = await User.findOne({ mobilenumber });
      if (taken) return res.status(400).json({ success: false, message: 'Mobile number already in use' });
    }

    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) return res.status(400).json({ success: false, message: 'Email address already in use' });
      user.email = email;
      user.isEmailVerified = false;
    }

    user.fullname = fullname || user.fullname;
    user.mobilenumber = mobilenumber !== undefined ? mobilenumber : user.mobilenumber;
    user.dob = dob !== undefined ? dob : user.dob;
    user.gender = gender !== undefined ? gender : user.gender;
    user.avatar = avatar !== undefined ? avatar : user.avatar;

    const nextProfileData = { ...(user.profileData || {}), ...(profileData || {}) };
    if (addresses !== undefined) nextProfileData.addresses = addresses;
    if (paymentMethods !== undefined) nextProfileData.paymentMethods = paymentMethods;
    if (wishlist !== undefined) nextProfileData.wishlist = wishlist;
    if (savedCart !== undefined) nextProfileData.savedCart = savedCart;
    if (rewardsCoupons !== undefined) nextProfileData.rewardsCoupons = rewardsCoupons;
    if (recentOrders !== undefined) nextProfileData.recentOrders = recentOrders;
    if (recentlyViewedProducts !== undefined) nextProfileData.recentlyViewedProducts = recentlyViewedProducts;
    if (favoriteStores !== undefined) nextProfileData.favoriteStores = favoriteStores;
    if (storeProfile !== undefined) nextProfileData.storeProfile = storeProfile;
    if (businessDetails !== undefined) nextProfileData.businessDetails = businessDetails;
    if (verificationStatus !== undefined) nextProfileData.verificationStatus = verificationStatus;
    if (storeActivity !== undefined) nextProfileData.storeActivity = storeActivity;
    if (upiId !== undefined) nextProfileData.upiId = upiId;

    user.profileData = nextProfileData;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        mobilenumber: user.mobilenumber,
        role: user.role,
        avatar: user.avatar,
        dob: user.dob,
        gender: user.gender,
        profileData: user.profileData,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Internal: upgrade a user's role to store_owner ───────────────────────────
// Called by store-service after a store is successfully created.
// Protected by a shared internal secret — never exposed to the frontend.
const upgradeToStoreOwner = async (req, res) => {
  try {
    const secret = req.headers['x-internal-secret'];
    if (!secret || secret !== process.env.INTERNAL_SECRET) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required.' });

    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'store_owner' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const newToken = generateToken(user._id, user.role);
    res.json({
      success: true,
      data: {
        _id: user._id, fullname: user.fullname, email: user.email,
        mobilenumber: user.mobilenumber, role: user.role,
        token: newToken,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) await Token.findOneAndUpdate({ token }, { isActive: false });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Error during logout' });
  }
};

const logoutAll = async (req, res) => {
  try {
    await Token.updateMany({ userId: req.user._id, isActive: true }, { isActive: false });
    res.status(200).json({ success: true, message: 'Logged out from all devices successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Error during logout' });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a reset link has been sent.',
      });
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, user.fullname || 'there', rawResetToken);

    res.status(200).json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ── Email verification ────────────────────────────────────────────────────────

/**
 * GET /api/auth/verify-email/:token
 * Validates the raw token from the link, marks the account as verified.
 */
const verifyEmail = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // Look up the token regardless of isEmailVerified — handles both fresh and repeat clicks
    const user = await User.findOne({
      emailVerificationToken:   hashed,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired.',
      });
    }

    // Already verified (e.g. StrictMode double-call or user clicked twice) → still success
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Your email is already verified. You can log in now.',
      });
    }

    // First-time verification — mark as verified, keep token until it expires naturally
    user.isEmailVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now access all features.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-verification
 * Body: { email }  — or uses req.user if the user is authenticated.
 * Generates a new token and sends the email again.
 */
const resendVerification = async (req, res, next) => {
  try {
    // Accept email from body or from auth token
    const email = req.body.email || req.user?.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await User.findOne({ email })
      .select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      // Don't reveal whether account exists
      return res.status(200).json({ success: true, message: 'If an account exists, a verification email has been sent.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified.' });
    }

    // Rate-limit: block resend if the last token was issued < 60 s ago
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires.getTime() > Date.now() + 23.98 * 3600 * 1000
    ) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another verification email.',
      });
    }

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.emailVerificationToken   = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.fullname, rawToken);

    res.status(200).json({ success: true, message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register, login, googleCallback, googleSuccess,
  getProfile, updateProfile, forgotPassword, resetPassword, changePassword, logout, logoutAll,
  verifyEmail, resendVerification,
  upgradeToStoreOwner,
};
