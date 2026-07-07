const BestSellerConfig = require('../models/BestSellerConfig');

const getBestSellers = async (req, res) => {
  try {
    const config = await BestSellerConfig.getConfig();
    res.status(200).json({ success: true, data: config.items });
  } catch (error) {
    console.error('Error fetching best sellers config:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateBestSellers = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array.' });
    }

    let config = await BestSellerConfig.findOne();
    if (!config) config = new BestSellerConfig();

    config.items = items;
    await config.save();

    res.status(200).json({ success: true, message: 'Best Sellers updated successfully', data: config.items });
  } catch (error) {
    console.error('Error updating best sellers:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not update configuration' });
  }
};

const resetBestSellers = async (req, res) => {
  try {
    const config = await BestSellerConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset to defaults successfully', data: config.items });
  } catch (error) {
    console.error('Error resetting best sellers:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not reset configuration' });
  }
};

module.exports = { getBestSellers, updateBestSellers, resetBestSellers };