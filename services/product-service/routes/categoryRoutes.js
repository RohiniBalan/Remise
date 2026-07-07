const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, verifyAdminOrStoreOwner } = require('../middleware/authMiddleware');

router.get('/', getCategories);
router.post('/',    protect, verifyAdminOrStoreOwner, createCategory);
router.delete('/:id', protect, verifyAdminOrStoreOwner, deleteCategory);

module.exports = router;
