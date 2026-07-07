const express = require('express');
const router = express.Router();
const { getBentoGrid, updateBentoGrid, resetBentoGrid } = require('../controllers/bentoGridController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getBentoGrid);
router.put('/', protect, verifyAdmin, updateBentoGrid);
router.post('/reset', protect, verifyAdmin, resetBentoGrid);

module.exports = router;