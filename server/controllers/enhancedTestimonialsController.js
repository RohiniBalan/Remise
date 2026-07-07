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
    // Destructure ONLY the fields we want to update. This ignores _id and __v.
    const { reviews, hero, spotlight, cta } = req.body;
    
    let config = await EnhancedTestimonialsConfig.findOne();
    if (!config) config = new EnhancedTestimonialsConfig();

    if (reviews) config.reviews = reviews;
    if (hero) config.hero = hero;
    if (spotlight) config.spotlight = spotlight;
    if (cta) config.cta = cta;
    
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config });
  } catch (error) {
    console.error("Update Error:", error);
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