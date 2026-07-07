const TrendingVideo = require('../models/TrendingVideo');
const TrendingConfig = require('../models/TrendingConfig');

// @desc    Get all trending videos
// @route   GET /api/trending
// @access  Public
const getTrendingVideos = async (req, res) => {
  try {
    const videos = await TrendingVideo.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching videos',
      error: error.message
    });
  }
};

// @desc    Get single trending video
// @route   GET /api/trending/:id
// @access  Public
const getTrendingVideo = async (req, res) => {
  try {
    const video = await TrendingVideo.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching video',
      error: error.message
    });
  }
};

// @desc    Create new trending video
// @route   POST /api/trending
// @access  Private/Admin
const createTrendingVideo = async (req, res) => {
  try {
    const { title, category, views, duration, src, order } = req.body;

    // Validation
    if (!title || !src) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and video source'
      });
    }

    // Get the highest order number
    const lastVideo = await TrendingVideo.findOne().sort({ order: -1 });
    const newOrder = order !== undefined ? order : (lastVideo ? lastVideo.order + 1 : 0);

    const video = await TrendingVideo.create({
      title,
      category: category || 'Premium',
      views: views || '0',
      duration: duration || '0:00',
      src,
      order: newOrder,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: video
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating video',
      error: error.message
    });
  }
};

// @desc    Update trending video
// @route   PUT /api/trending/:id
// @access  Private/Admin
const updateTrendingVideo = async (req, res) => {
  try {
    const { title, category, views, duration, src, order, isActive } = req.body;

    let video = await TrendingVideo.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Update fields
    video.title = title || video.title;
    video.category = category || video.category;
    video.views = views || video.views;
    video.duration = duration || video.duration;
    video.src = src || video.src;
    video.order = order !== undefined ? order : video.order;
    video.isActive = isActive !== undefined ? isActive : video.isActive;
    video.updatedBy = req.user._id;

    await video.save();

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: video
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating video',
      error: error.message
    });
  }
};

// @desc    Delete trending video
// @route   DELETE /api/trending/:id
// @access  Private/Admin
const deleteTrendingVideo = async (req, res) => {
  try {
    const video = await TrendingVideo.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    await video.deleteOne();

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting video',
      error: error.message
    });
  }
};

// @desc    Get trending config
// @route   GET /api/trending/config
// @access  Public
const getTrendingConfig = async (req, res) => {
  try {
    const config = await TrendingConfig.getConfig();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching trending config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching config',
      error: error.message
    });
  }
};

// @desc    Update trending config
// @route   PUT /api/trending/config/update
// @access  Private/Admin
const updateTrendingConfig = async (req, res) => {
  try {
    const { sectionTitle, sectionSubtitle, badgeText, buttonText, isActive } = req.body;

    let config = await TrendingConfig.getConfig();

    // Update fields
    config.sectionTitle = sectionTitle || config.sectionTitle;
    config.sectionSubtitle = sectionSubtitle || config.sectionSubtitle;
    config.badgeText = badgeText || config.badgeText;
    config.buttonText = buttonText || config.buttonText;
    config.isActive = isActive !== undefined ? isActive : config.isActive;
    config.updatedBy = req.user._id;

    await config.save();

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating config',
      error: error.message
    });
  }
};

// @desc    Reset trending config to defaults
// @route   POST /api/trending/config/reset
// @access  Private/Admin
const resetTrendingConfig = async (req, res) => {
  try {
    // Delete existing config and create new with defaults
    await TrendingConfig.deleteMany({});
    
    const config = await TrendingConfig.create({
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Configuration reset to defaults',
      data: config
    });
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting config',
      error: error.message
    });
  }
};

// @desc    Reorder videos
// @route   POST /api/trending/reorder
// @access  Private/Admin
const reorderVideos = async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, order }

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide orders array'
      });
    }

    // Update each video's order
    const updatePromises = orders.map(({ id, order }) => 
      TrendingVideo.findByIdAndUpdate(id, { order, updatedBy: req.user._id })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Videos reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering videos:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reordering videos',
      error: error.message
    });
  }
};

// @desc    Bulk delete videos
// @route   POST /api/trending/bulk-delete
// @access  Private/Admin
const bulkDeleteVideos = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide video IDs array'
      });
    }

    await TrendingVideo.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${ids.length} videos deleted successfully`
    });
  } catch (error) {
    console.error('Error bulk deleting videos:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting videos',
      error: error.message
    });
  }
};

module.exports = {
  getTrendingVideos,
  getTrendingVideo,
  createTrendingVideo,
  updateTrendingVideo,
  deleteTrendingVideo,
  getTrendingConfig,
  updateTrendingConfig,
  resetTrendingConfig,
  reorderVideos,
  bulkDeleteVideos
};