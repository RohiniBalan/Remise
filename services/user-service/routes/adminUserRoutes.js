const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, verifyAdmin, getAllUsers);

module.exports = router;
