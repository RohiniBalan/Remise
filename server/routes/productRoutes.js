const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// Route: /api/admin/products
router.route('/')
  .get(getProducts) 
  .post(
    protect, 
    verifyAdmin, 
    createProduct
  );

// Route: /api/admin/products/:id  
router.route('/:id')
  .get(getProductById)
  .put(
    protect, 
    verifyAdmin, 
    updateProduct
  )
  .delete(
    protect, 
    verifyAdmin, 
    deleteProduct
  );

module.exports = router;