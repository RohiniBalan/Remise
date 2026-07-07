const ReviewConfig = require('../models/ReviewConfig');

const getReviews = async (req, res) => {
  try {
    const config = await ReviewConfig.getConfig();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateReviews = async (req, res) => {
  try {
    const { reviews, photos } = req.body;
    
    let config = await ReviewConfig.findOne();
    if (!config) config = new ReviewConfig();

    if (reviews) config.reviews = reviews;
    if (photos) config.photos = photos;
    
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not update configuration' });
  }
};

const resetReviews = async (req, res) => {
  try {
    const config = await ReviewConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset successfully', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not reset configuration' });
  }
};

module.exports = { getReviews, updateReviews, resetReviews };