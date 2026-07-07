const express = require('express');
const router = express.Router();
const {
  getHeroConfig,
  updateHeroConfig,
  resetHeroConfig,
  uploadImage
} = require('../controllers/heroController');

// Import authentication middleware
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// For file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads';
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
    // Sanitize filename
    const sanitizedName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase();
    cb(null, sanitizedName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
    }
  }
});

// Public route - GET hero configuration (no authentication needed)
// Everyone can view the hero section
router.route('/')
  .get(getHeroConfig);

// Protected routes - Require authentication AND admin verification
// Only authenticated admins can modify hero section

// PUT /api/hero - Update hero configuration
router.route('/')
  .put(
    protect,           // First, verify user is authenticated
    verifyAdmin,       // Then, verify user is an admin
    updateHeroConfig   // Finally, execute the controller
  );

// POST /api/hero/reset - Reset to default configuration
router.post('/reset',
  protect,             // First, verify user is authenticated
  verifyAdmin,         // Then, verify user is an admin
  resetHeroConfig      // Finally, execute the controller
);

// POST /api/hero/upload - Upload image
router.post('/upload',
  protect,             // First, verify user is authenticated
  verifyAdmin,         // Then, verify user is an admin
  (req, res, next) => {
    // Multer error handling middleware
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      // Everything went fine, proceed to controller
      next();
    });
  },
  uploadImage           // Finally, execute the controller
);

// Optional: DELETE route for removing uploaded images (if needed)
router.delete('/upload/:filename',
  protect,             // First, verify user is authenticated
  verifyAdmin,         // Then, verify user is an admin
  async (req, res) => {
    try {
      const filename = req.params.filename;
      const filepath = path.join(uploadDir, filename);
      
      // Check if file exists
      if (fs.existsSync(filepath)) {
        // Delete the file
        fs.unlinkSync(filepath);
        return res.json({
          success: true,
          message: 'File deleted successfully'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting file',
        error: error.message
      });
    }
  }
);

module.exports = router;