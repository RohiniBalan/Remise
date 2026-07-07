const BentoGridConfig = require('../models/BentoGridConfig');

const getBentoGrid = async (req, res) => {
  try {
    const config = await BentoGridConfig.getConfig();
    res.status(200).json({ success: true, data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateBentoGrid = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid data format.' });
    }

    let config = await BentoGridConfig.findOne();
    if (!config) config = new BentoGridConfig();

    config.items = items;
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not update' });
  }
};

const resetBentoGrid = async (req, res) => {
  try {
    const config = await BentoGridConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset successfully', data: config.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not reset' });
  }
};

module.exports = { getBentoGrid, updateBentoGrid, resetBentoGrid };