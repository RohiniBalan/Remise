const ServicesConfig = require('../models/ServicesConfig');

const getServices = async (req, res) => {
  try {
    const config = await ServicesConfig.getConfig();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateServices = async (req, res) => {
  try {
    const { retailProducts, wholesaleProducts, retailOffer, wholesaleOffer } = req.body;
    
    let config = await ServicesConfig.findOne();
    if (!config) config = new ServicesConfig();

    if (retailProducts) config.retailProducts = retailProducts;
    if (wholesaleProducts) config.wholesaleProducts = wholesaleProducts;
    if (retailOffer) config.retailOffer = retailOffer;
    if (wholesaleOffer) config.wholesaleOffer = wholesaleOffer;
    
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not update configuration' });
  }
};

const resetServices = async (req, res) => {
  try {
    const config = await ServicesConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset successfully', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not reset configuration' });
  }
};

module.exports = { getServices, updateServices, resetServices };