const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getCategories)
  .post(protect, verifyAdmin, createCategory);

router.route('/:id')
  .delete(protect, verifyAdmin, deleteCategory);

module.exports = router;