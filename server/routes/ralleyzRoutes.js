const express = require('express');
const router = express.Router();
const {
  getRalleyzConfig,
  updateRalleyzConfig,
  resetRalleyzConfig,
  uploadImage,
  deleteImage
} = require('../controllers/ralleyzController');

// Import authentication middleware
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// For file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/ralleyz directory exists
const uploadDir = 'uploads/ralleyz';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = 'ralleyz-' + uniqueSuffix + path.extname(file.originalname).toLowerCase();
    cb(null, sanitizedName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// TEST ROUTE - Add this temporarily to test if route is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Ralleyz API is working!' });
});

// Public route - GET ralleyz configuration
router.route('/')
  .get(getRalleyzConfig);

// Protected routes - Admin only
router.route('/')
  .put(protect, verifyAdmin, updateRalleyzConfig);

router.post('/reset', protect, verifyAdmin, resetRalleyzConfig);

// Image upload route
router.post('/upload', protect, verifyAdmin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, uploadImage);

// Delete image
router.delete('/upload/:filename', protect, verifyAdmin, deleteImage);

module.exports = router;