const express = require('express');
const router = express.Router();
const { getServices, updateServices, resetServices } = require('../controllers/servicesController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getServices);
router.put('/', protect, verifyAdmin, updateServices);
router.post('/reset', protect, verifyAdmin, resetServices);

module.exports = router;