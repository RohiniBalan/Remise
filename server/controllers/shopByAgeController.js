const ShopByAgeConfig = require('../models/ShopByAgeConfig');

const getShopByAge = async (req, res) => {
  try {
    const config = await ShopByAgeConfig.getConfig();
    res.status(200).json({ success: true, data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateShopByAge = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid data format.' });
    }

    let config = await ShopByAgeConfig.findOne();
    if (!config) config = new ShopByAgeConfig();

    config.items = items;
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not update' });
  }
};

const resetShopByAge = async (req, res) => {
  try {
    const config = await ShopByAgeConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset successfully', data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not reset' });
  }
};

module.exports = { getShopByAge, updateShopByAge, resetShopByAge };