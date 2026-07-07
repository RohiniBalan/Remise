const EnhancedTestimonialsConfig = require('../models/EnhancedTestimonialsConfig');

const getConfig = async (req, res) => {
  try {
    const config = await EnhancedTestimonialsConfig.getConfig();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateConfig = async (req, res) => {
  try {
    let config = await EnhancedTestimonialsConfig.findOne();
    if (!config) config = new EnhancedTestimonialsConfig();

    Object.assign(config, req.body);
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not update configuration' });
  }
};

const resetConfig = async (req, res) => {
  try {
    const config = await EnhancedTestimonialsConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset successfully', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not reset configuration' });
  }
};

module.exports = { getConfig, updateConfig, resetConfig };