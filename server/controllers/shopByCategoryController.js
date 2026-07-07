const ShopByCategoryConfig = require('../models/ShopByCategoryConfig');

const getCategories = async (req, res) => {
  try {
    const config = await ShopByCategoryConfig.getConfig();
    res.status(200).json({ success: true, data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateCategories = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid data format.' });
    }

    let config = await ShopByCategoryConfig.findOne();
    if (!config) config = new ShopByCategoryConfig();

    config.items = items;
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not update configuration' });
  }
};

const resetCategories = async (req, res) => {
  try {
    const config = await ShopByCategoryConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset successfully', data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not reset configuration' });
  }
};

module.exports = { getCategories, updateCategories, resetCategories };