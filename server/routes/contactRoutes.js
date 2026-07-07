const express = require('express');
const router = express.Router();
const { 
  getContact, 
  updateContact, 
  resetContact,
  createMessage,
  getMessages
} = require('../controllers/contactController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getContact);
router.post('/messages', createMessage); // Form submission from the frontend

// Protected admin routes
router.put('/', protect, verifyAdmin, updateContact);
router.post('/reset', protect, verifyAdmin, resetContact);
router.get('/messages', protect, verifyAdmin, getMessages); // Fetching messages for admin panel

module.exports = router;