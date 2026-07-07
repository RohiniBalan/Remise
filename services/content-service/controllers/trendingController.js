const TrendingConfig = require('../models/TrendingConfig');
const TrendingVideo = require('../models/TrendingVideo');

const getTrendingConfig = async (req, res) => {
  try {
    const config = await TrendingConfig.getConfig();
    const videos = await TrendingVideo.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: { config, videos } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trending data', error: error.message });
  }
};

const updateTrendingConfig = async (req, res) => {
  try {
    let config = await TrendingConfig.findOne();
    if (config) { Object.assign(config, req.body); await config.save(); }
    else config = await TrendingConfig.create(req.body);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTrendingVideo = async (req, res) => {
  try {
    const video = await TrendingVideo.create(req.body);
    res.status(201).json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTrendingVideo = async (req, res) => {
  try {
    const video = await TrendingVideo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTrendingVideo = async (req, res) => {
  try {
    const video = await TrendingVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTrendingConfig, updateTrendingConfig, createTrendingVideo, updateTrendingVideo, deleteTrendingVideo };
