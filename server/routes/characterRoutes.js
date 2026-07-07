const express = require('express');
const router = express.Router();
const { getCharacters, updateCharacters, resetCharacters } = require('../controllers/characterController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware'); // Adjust path to your auth middleware

// Public route to fetch characters
router.get('/', getCharacters);

// Protected Admin routes to update and reset characters
router.put('/', protect, verifyAdmin, updateCharacters);
router.post('/reset', protect, verifyAdmin, resetCharacters);

module.exports = router;