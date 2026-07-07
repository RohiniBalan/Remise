const { StudioConfig, StudioVideo } = require('../models/StudioConfig');

const getStudioConfig = async (req, res) => {
  try {
    res.json({ success: true, data: await StudioConfig.getConfig() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudioVideos = async (req, res) => {
  try {
    const videos = await StudioVideo.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStudioConfig = async (req, res) => {
  try {
    let config = await StudioConfig.findOne();
    if (config) { Object.assign(config, req.body); await config.save(); }
    else config = await StudioConfig.create(req.body);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetToDefault = async (req, res) => {
  try {
    await StudioConfig.deleteMany({});
    res.json({ success: true, data: await StudioConfig.getConfig() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStudioVideo = async (req, res) => {
  try {
    const video = await StudioVideo.create(req.body);
    res.status(201).json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStudioVideo = async (req, res) => {
  try {
    const video = await StudioVideo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStudioVideo = async (req, res) => {
  try {
    const video = await StudioVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reorderVideos = async (req, res) => {
  try {
    const { order } = req.body; // [{ id, order }]
    await Promise.all(order.map(({ id, order: o }) => StudioVideo.findByIdAndUpdate(id, { order: o })));
    res.json({ success: true, message: 'Videos reordered' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStudioConfig, getStudioVideos, updateStudioConfig, resetToDefault, createStudioVideo, updateStudioVideo, deleteStudioVideo, reorderVideos };
