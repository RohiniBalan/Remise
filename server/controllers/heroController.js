const Hero = require('../models/Hero');

// @desc    Get hero section configuration
// @route   GET /api/hero
// @access  Public
const getHeroConfig = async (req, res) => {
  try {
    const config = await Hero.getConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching hero config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hero configuration',
      error: error.message
    });
  }
};

// @desc    Update or create hero section configuration
// @route   PUT /api/hero
// @access  Private/Admin (you can add authentication middleware)
const updateHeroConfig = async (req, res) => {
  try {
    const {
      badgeText,
      title,
      titleGradient,
      description,
      primaryButtonText,
      secondaryButtonText,
      carImages,
      brands
    } = req.body;

    // Validate required fields
    if (!badgeText || !title || !titleGradient || !description || 
        !primaryButtonText || !secondaryButtonText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required text fields'
      });
    }

    // Validate carImages is an array
    if (!Array.isArray(carImages)) {
      return res.status(400).json({
        success: false,
        message: 'carImages must be an array'
      });
    }

    // Validate brands is an array
    if (!Array.isArray(brands)) {
      return res.status(400).json({
        success: false,
        message: 'brands must be an array'
      });
    }

    // Validate each brand has name and src
    for (const brand of brands) {
      if (!brand.name || !brand.src) {
        return res.status(400).json({
          success: false,
          message: 'Each brand must have a name and src'
        });
      }
    }

    // Get existing config or create new one
    let config = await Hero.findOne();
    
    if (config) {
      // Update existing config
      config.badgeText = badgeText;
      config.title = title;
      config.titleGradient = titleGradient;
      config.description = description;
      config.primaryButtonText = primaryButtonText;
      config.secondaryButtonText = secondaryButtonText;
      config.carImages = carImages;
      config.brands = brands;
      
      await config.save();
    } else {
      // Create new config
      config = await Hero.create({
        badgeText,
        title,
        titleGradient,
        description,
        primaryButtonText,
        secondaryButtonText,
        carImages,
        brands
      });
    }

    res.json({
      success: true,
      message: 'Hero configuration saved successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating hero config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hero configuration',
      error: error.message
    });
  }
};

// @desc    Reset hero configuration to defaults
// @route   POST /api/hero/reset
// @access  Private/Admin
const resetHeroConfig = async (req, res) => {
  try {
    // Delete existing config
    await Hero.deleteMany({});
    
    // Create new default config
    const config = await Hero.getConfig();
    
    res.json({
      success: true,
      message: 'Hero configuration reset to defaults',
      data: config
    });
  } catch (error) {
    console.error('Error resetting hero config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset hero configuration',
      error: error.message
    });
  }
};

// @desc    Upload image (optional - if you want to handle file uploads)
// @route   POST /api/hero/upload
// @access  Private/Admin
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Here you would typically upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll return the local path
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

module.exports = {
  getHeroConfig,
  updateHeroConfig,
  resetHeroConfig,
  uploadImage
};