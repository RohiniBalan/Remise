/**
 * Generic singleton-section controller factory.
 * Each CMS section (Hero, Ralleyz, etc.) uses the same CRUD pattern.
 * createSectionController(Model) returns { getConfig, updateConfig, resetConfig }.
 */
const createSectionController = (Model) => ({
  getConfig: async (req, res) => {
    try {
      const config = await Model.getConfig();
      res.json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch configuration', error: error.message });
    }
  },

  updateConfig: async (req, res) => {
    try {
      let config = await Model.findOne();
      if (config) {
        Object.assign(config, req.body);
        await config.save();
      } else {
        config = await Model.create(req.body);
      }
      res.json({ success: true, message: 'Configuration saved successfully', data: config });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update configuration', error: error.message });
    }
  },

  resetConfig: async (req, res) => {
    try {
      await Model.deleteMany({});
      const config = await Model.getConfig();
      res.json({ success: true, message: 'Configuration reset to defaults', data: config });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to reset configuration', error: error.message });
    }
  },
});

module.exports = { createSectionController };
