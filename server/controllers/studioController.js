const { StudioShowcase, StudioVideo } = require('../models/StudioShowcase');
const jwt = require('jsonwebtoken');

// Helper function to verify admin
const verifyAdminById = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required'
      };
    }

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const isAdmin = user.role === 'admin';

    return {
      success: true,
      isAdmin,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return {
      success: false,
      message: 'Error verifying admin status',
      error: error.message
    };
  }
};

// @desc    Get studio showcase config
// @route   GET /api/studio/config
// @access  Public
const getStudioConfig = async (req, res) => {
  try {
    const config = await StudioShowcase.getConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching studio config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch studio configuration',
      error: error.message
    });
  }
};

// @desc    Get all studio videos
// @route   GET /api/studio/videos
// @access  Public
const getStudioVideos = async (req, res) => {
  try {
    const videos = await StudioVideo.find()
      .sort({ order: 1, videoId: 1 })
      .lean();

    res.json({
      success: true,
      data: videos,
      count: videos.length
    });
  } catch (error) {
    console.error('Error fetching studio videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch studio videos',
      error: error.message
    });
  }
};

// @desc    Update studio config
// @route   PUT /api/studio/config
// @access  Private/Admin
const updateStudioConfig = async (req, res) => {
  try {
    // Verify admin
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Decode token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const adminCheck = await verifyAdminById(decoded.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const {
      title,
      subtitle,
      badgeText,
      highlightText,
      buttonText,
      isActive,
      autoCycleDuration,
      theme
    } = req.body;

    let config = await StudioShowcase.findOne();
    
    if (!config) {
      config = new StudioShowcase();
    }

    // Update fields
    if (title !== undefined) config.title = title;
    if (subtitle !== undefined) config.subtitle = subtitle;
    if (badgeText !== undefined) config.badgeText = badgeText;
    if (highlightText !== undefined) config.highlightText = highlightText;
    if (buttonText !== undefined) config.buttonText = buttonText;
    if (isActive !== undefined) config.isActive = isActive;
    if (autoCycleDuration !== undefined) config.autoCycleDuration = autoCycleDuration;
    if (theme !== undefined) config.theme = theme;

    await config.save();

    res.json({
      success: true,
      data: config,
      message: 'Studio configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating studio config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update studio configuration',
      error: error.message
    });
  }
};

// @desc    Create studio video
// @route   POST /api/studio/videos
// @access  Private/Admin
const createStudioVideo = async (req, res) => {
  try {
    // Verify admin
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const adminCheck = await verifyAdminById(decoded.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const {
      title,
      description,
      videoId,
      src,
      color,
      rating,
      category,
      order,
      isActive
    } = req.body;

    // Check if videoId already exists
    const existingVideo = await StudioVideo.findOne({ videoId });
    if (existingVideo) {
      return res.status(400).json({
        success: false,
        message: `Video with ID ${videoId} already exists`
      });
    }

    const video = await StudioVideo.create({
      title,
      description,
      videoId,
      src,
      color: color || '#C41E3A',
      rating: rating || '9.5',
      category: category || 'Vintage Collection',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      data: video,
      message: 'Video created successfully'
    });
  } catch (error) {
    console.error('Error creating studio video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create studio video',
      error: error.message
    });
  }
};

// @desc    Update studio video
// @route   PUT /api/studio/videos/:id
// @access  Private/Admin
const updateStudioVideo = async (req, res) => {
  try {
    // Verify admin
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const adminCheck = await verifyAdminById(decoded.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const video = await StudioVideo.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // If updating videoId, check if it's unique
    if (updates.videoId && updates.videoId !== video.videoId) {
      const existingVideo = await StudioVideo.findOne({ videoId: updates.videoId });
      if (existingVideo) {
        return res.status(400).json({
          success: false,
          message: `Video with ID ${updates.videoId} already exists`
        });
      }
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        video[key] = updates[key];
      }
    });

    await video.save();

    res.json({
      success: true,
      data: video,
      message: 'Video updated successfully'
    });
  } catch (error) {
    console.error('Error updating studio video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update studio video',
      error: error.message
    });
  }
};

// @desc    Delete studio video
// @route   DELETE /api/studio/videos/:id
// @access  Private/Admin
const deleteStudioVideo = async (req, res) => {
  try {
    // Verify admin
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const adminCheck = await verifyAdminById(decoded.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id } = req.params;

    const video = await StudioVideo.findById(id);
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
    console.error('Error deleting studio video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete studio video',
      error: error.message
    });
  }
};

// @desc    Reorder studio videos
// @route   POST /api/studio/videos/reorder
// @access  Private/Admin
const reorderVideos = async (req, res) => {
  try {
    // Verify admin
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const adminCheck = await verifyAdminById(decoded.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { orders } = req.body; // Array of { id, order }

    if (!Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Orders must be an array'
      });
    }

    // Update each video's order
    const updatePromises = orders.map(({ id, order }) =>
      StudioVideo.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    // Get updated videos
    const updatedVideos = await StudioVideo.find().sort({ order: 1, videoId: 1 });

    res.json({
      success: true,
      data: updatedVideos,
      message: 'Videos reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder videos',
      error: error.message
    });
  }
};

// @desc    Reset to default videos
// @route   POST /api/studio/config/reset
// @access  Private/Admin
const resetToDefault = async (req, res) => {
  try {
    // Verify admin
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const adminCheck = await verifyAdminById(decoded.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Default videos
    const defaultVideos = [
      { videoId: 1, title: 'Vintage Classic 01', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314454/video8_vkzvjt.mp4', color: '#C41E3A', rating: '9.8' },
      { videoId: 2, title: 'Vintage Classic 02', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314452/video7_pyrylo.mp4', color: '#0066CC', rating: '9.5' },
      { videoId: 3, title: 'Vintage Classic 03', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314454/video11_v67zbd.mp4', color: '#FF4500', rating: '9.7' },
      { videoId: 4, title: 'Vintage Classic 04', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314458/Video3_azubex.mp4', color: '#FFD700', rating: '9.3' },
      { videoId: 5, title: 'Vintage Classic 05', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314455/video12_cpuv4p.mp4', color: '#228B22', rating: '9.6' },
      { videoId: 6, title: 'Vintage Classic 06', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314451/Video6_akaie9.mp4', color: '#800080', rating: '9.4' },
      { videoId: 7, title: 'Vintage Classic 07', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314454/video10_m4fote.mp4', color: '#FF1493', rating: '9.9' },
      { videoId: 8, title: 'Vintage Classic 08', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314452/video7_pyrylo.mp4', color: '#00CED1', rating: '9.8' },
      { videoId: 9, title: 'Vintage Classic 09', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314451/Video5_jhnqnb.mp4', color: '#FF6347', rating: '9.5' },
      { videoId: 10, title: 'Vintage Classic 10', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314445/Video1_sfmwkt.mp4', color: '#1E90FF', rating: '9.7' },
      { videoId: 11, title: 'Vintage Classic 11', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314457/video13_rl4rr0.mp4', color: '#DC143C', rating: '9.9' },
      { videoId: 12, title: 'Vintage Classic 12', src: 'https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314455/video12_cpuv4p.mp4', color: '#32CD32', rating: '9.4' }
    ];

    // Delete all existing videos
    await StudioVideo.deleteMany({});

    // Insert default videos with order
    const videosToInsert = defaultVideos.map((video, index) => ({
      ...video,
      category: 'Vintage Collection',
      description: '',
      order: index,
      isActive: true
    }));

    await StudioVideo.insertMany(videosToInsert);

    // Reset config
    await StudioShowcase.findOneAndUpdate(
      {},
      {
        title: 'STUDIO SHOWCASE',
        subtitle: 'Watch our premium vintage models in action. Fast-paced automotive exhibition.',
        badgeText: 'Live Exhibit',
        highlightText: 'SHOWCASE',
        buttonText: 'View All',
        isActive: true,
        autoCycleDuration: 5000,
        theme: 'dark'
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Reset to default configuration successfully'
    });
  } catch (error) {
    console.error('Error resetting to default:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset to default',
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  getStudioConfig,
  getStudioVideos,
  updateStudioConfig,
  createStudioVideo,
  updateStudioVideo,
  deleteStudioVideo,
  reorderVideos,
  resetToDefault
};