const BlogLifestyleConfig = require('../models/BlogLifestyleConfig');

const getConfig = async (req, res) => {
  try {
    const config = await BlogLifestyleConfig.getConfig();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching Blog/Lifestyle config:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateConfig = async (req, res) => {
  try {
    // 1. Sanitize the payload to prevent VersionErrors and ID conflicts
    const updateData = { ...req.body };
    delete updateData._id; 
    delete updateData.__v; // This is the line that fixes your crash!

    let config = await BlogLifestyleConfig.findOne();
    if (!config) config = new BlogLifestyleConfig();

    // 2. Set the sanitized data
    config.set(updateData);
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config });
  } catch (error) {
    console.error('Error updating Blog/Lifestyle config:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not update configuration' });
  }
};

const resetConfig = async (req, res) => {
  try {
    const config = await BlogLifestyleConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset successfully', data: config });
  } catch (error) {
    console.error('Error resetting Blog/Lifestyle config:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not reset configuration' });
  }
};

module.exports = { getConfig, updateConfig, resetConfig };