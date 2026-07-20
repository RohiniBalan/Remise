const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Token = require('../models/Token');
const { sendEmail } = require('../utils/sendEmail');

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

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { fullname, email, mobilenumber, password } = req.body;

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobilenumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile number'
      });
    }

    // Create new user
    const user = await User.create({
      fullname,
      email,
      mobilenumber,
      password
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        mobilenumber: user.mobilenumber,
        role: user.role,
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email'
      });
    }

    // Check if user registered with Google (no password set)
    if (user.googleId && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.'
      });
    }

    // Compare passwords
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Store token in MongoDB
    await Token.create({
      userId: user._id,
      token: token,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      lastUsedAt: new Date(),
      isActive: true
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        mobilenumber: user.mobilenumber,
        role: user.role,
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  try {
    // User is already attached to req by passport
    const user = req.user;
    
    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Redirect to frontend with token
    const frontendURL = process.env.frontendurl11 || 'https://wow-frontedn-y73e.vercel.app';
    res.redirect(`${frontendURL}/auth/google-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      mobilenumber: user.mobilenumber,
      role: user.role
    }))}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.frontendurl11 || 'https://wow-frontedn-y73e.vercel.app'}/auth?error=google_auth_failed`);
  }
};

// @desc    Handle Google auth success
// @route   POST /api/auth/google/success
// @access  Public
const googleSuccess = async (req, res) => {
  try {
    const { token, user } = req.body;
    
    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        ...user,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
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
      upiId
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (mobilenumber && mobilenumber !== user.mobilenumber) {
      const existingUser = await User.findOne({ mobilenumber });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already in use'
        });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email address already in use'
        });
      }
      user.email = email;
      user.isEmailVerified = false;
    }

    user.fullname = fullname || user.fullname;
    user.mobilenumber = mobilenumber !== undefined ? mobilenumber : user.mobilenumber;
    user.dob = dob !== undefined ? dob : user.dob;
    user.gender = gender !== undefined ? gender : user.gender;
    user.avatar = avatar !== undefined ? avatar : user.avatar;

    const nextProfileData = {
      ...(user.profileData || {}),
      ...(profileData || {})
    };

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
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 1000 * 60 * 30;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2>Reset your Remise password</h2>
        <p>We received a request to reset your password. Click the button below to continue.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#ff0000;color:#fff;text-decoration:none;border-radius:8px;">Reset password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Reset your Remise password',
      html,
      text: `Reset your Remise password: ${resetUrl}`
    });

    res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired'
      });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new passwords are required'
      });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// controllers/authController.js (add logout function)
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Deactivate token in database
      await Token.findOneAndUpdate(
        { token: token },
        { isActive: false }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

// Optional: Logout from all devices
const logoutAll = async (req, res) => {
  try {
    // Deactivate all tokens for the user
    await Token.updateMany(
      { userId: req.user._id, isActive: true },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

module.exports = {
  register,
  login,
  googleCallback,
  googleSuccess,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  logoutAll
};