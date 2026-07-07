const Hero = require('../models/Hero');

const getHeroConfig = async (req, res) => {
  try {
    res.json({ success: true, data: await Hero.getConfig() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch hero configuration', error: error.message });
  }
};

const updateHeroConfig = async (req, res) => {
  try {
    const { badgeText, title, titleGradient, description, primaryButtonText, secondaryButtonText, carImages, brands } = req.body;
    if (!badgeText || !title || !titleGradient || !description || !primaryButtonText || !secondaryButtonText) {
      return res.status(400).json({ success: false, message: 'Please provide all required text fields' });
    }
    if (!Array.isArray(carImages)) return res.status(400).json({ success: false, message: 'carImages must be an array' });
    if (!Array.isArray(brands)) return res.status(400).json({ success: false, message: 'brands must be an array' });

    let config = await Hero.findOne();
    if (config) {
      Object.assign(config, { badgeText, title, titleGradient, description, primaryButtonText, secondaryButtonText, carImages, brands });
      await config.save();
    } else {
      config = await Hero.create({ badgeText, title, titleGradient, description, primaryButtonText, secondaryButtonText, carImages, brands });
    }
    res.json({ success: true, message: 'Hero configuration saved successfully', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update hero configuration', error: error.message });
  }
};

const resetHeroConfig = async (req, res) => {
  try {
    await Hero.deleteMany({});
    res.json({ success: true, message: 'Hero configuration reset to defaults', data: await Hero.getConfig() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset hero configuration', error: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image file' });
    res.json({ success: true, message: 'Image uploaded successfully', data: { url: `/uploads/hero/${req.file.filename}`, filename: req.file.filename } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload image', error: error.message });
  }
};

module.exports = { getHeroConfig, updateHeroConfig, resetHeroConfig, uploadImage };
