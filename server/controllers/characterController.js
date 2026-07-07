const CharacterConfig = require('../models/CharacterConfig');

// @desc    Get character configuration
// @route   GET /api/characters
// @access  Public
const getCharacters = async (req, res) => {
  try {
    const config = await CharacterConfig.getConfig();
    res.status(200).json({
      success: true,
      data: config.characters
    });
  } catch (error) {
    console.error('Error fetching character config:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Could not fetch character configuration'
    });
  }
};

// @desc    Update character configuration
// @route   PUT /api/characters
// @access  Private/Admin
const updateCharacters = async (req, res) => {
  try {
    const { characters } = req.body;

    if (!Array.isArray(characters)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected an array of characters.'
      });
    }

    let config = await CharacterConfig.findOne();
    if (!config) {
      config = new CharacterConfig();
    }

    config.characters = characters;
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Characters updated successfully',
      data: config.characters
    });
  } catch (error) {
    console.error('Error updating character config:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Could not update character configuration'
    });
  }
};

// @desc    Reset character configuration to defaults
// @route   POST /api/characters/reset
// @access  Private/Admin
const resetCharacters = async (req, res) => {
  try {
    const config = await CharacterConfig.resetConfig();
    
    res.status(200).json({
      success: true,
      message: 'Characters reset to defaults successfully',
      data: config.characters
    });
  } catch (error) {
    console.error('Error resetting character config:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Could not reset character configuration'
    });
  }
};

module.exports = {
  getCharacters,
  updateCharacters,
  resetCharacters
};