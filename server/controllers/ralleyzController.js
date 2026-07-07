const RalleyzConfig = require('../models/RalleyzConfig');
const path = require('path');
const fs = require('fs');

// @desc    Get ralleyz configuration
// @route   GET /api/ralleyz
// @access  Public
const getRalleyzConfig = async (req, res) => {
  try {
    console.log('Fetching ralleyz config...');
    const config = await RalleyzConfig.getConfig();
    console.log('Config found:', config ? 'Yes' : 'No');
    
    res.json({
      success: true,
      data: config.items
    });
  } catch (error) {
    console.error('Error fetching ralleyz config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update ralleyz configuration
// @route   PUT /api/ralleyz
// @access  Private/Admin
const updateRalleyzConfig = async (req, res) => {
  try {
    console.log('Updating ralleyz config...');
    console.log('Request body:', req.body);
    
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      console.log('Invalid data format:', items);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of items.'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.id || !item.title || !item.subtitle || !item.location || !item.description || !item.bg) {
        console.log('Missing required fields in item:', item);
        return res.status(400).json({
          success: false,
          message: 'Each item must have id, title, subtitle, location, description, and bg fields.'
        });
      }
    }

    // Find existing config or create new one
    let config = await RalleyzConfig.findOne();
    
    if (!config) {
      console.log('No existing config found, creating new one');
      config = new RalleyzConfig();
    }
    
    config.items = items;
    await config.save();
    console.log('Config saved successfully');

    res.json({
      success: true,
      message: 'Ralleyz configuration updated successfully',
      data: config.items
    });
  } catch (error) {
    console.error('Error updating ralleyz config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reset to default configuration
// @route   POST /api/ralleyz/reset
// @access  Private/Admin
const resetRalleyzConfig = async (req, res) => {
  try {
    console.log('Resetting ralleyz config...');
    
    // Delete existing config
    await RalleyzConfig.deleteMany({});
    console.log('Existing config deleted');
    
    // Create new default config
    const config = await RalleyzConfig.getConfig();
    console.log('Default config created');
    
    res.json({
      success: true,
      message: 'Reset to default successfully',
      data: config.items
    });
  } catch (error) {
    console.error('Error resetting ralleyz config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload image
// @route   POST /api/ralleyz/upload
// @access  Private/Admin
const uploadImage = async (req, res) => {
  try {
    console.log('Uploading image...');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('File uploaded:', req.file.filename);
    const imageUrl = `/uploads/ralleyz/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete image
// @route   DELETE /api/ralleyz/upload/:filename
// @access  Private/Admin
const deleteImage = async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log('Deleting image:', filename);
    
    const filepath = path.join(__dirname, '../uploads/ralleyz', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log('File deleted successfully');
      return res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      console.log('File not found:', filepath);
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
};

module.exports = {
  getRalleyzConfig,
  updateRalleyzConfig,
  resetRalleyzConfig,
  uploadImage,
  deleteImage
};