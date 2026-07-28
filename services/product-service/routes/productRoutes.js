const express = require('express');
const router  = express.Router();
const {
  upload,
  createProduct, getProducts, getProductById, getProductsByStore,
  getProductsByIds, updateProduct, deleteProduct, deductStock,
  matchCart,
} = require('../controllers/productController');
const { protect, authorize, verifyAdmin, verifyAdminOrStoreOwner } = require('../middleware/authMiddleware');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',               getProducts);
router.get('/store/:storeId', getProductsByStore);  // must be before /:id
router.get('/:id',            getProductById);

// ── Internal (service-to-service) ────────────────────────────────────────────
router.post('/batch',         getProductsByIds);
router.post('/deduct-stock',  deductStock);
router.post('/match-cart',    matchCart);

// ── Admin or Store Owner or Sellers ──────────────────────────────────────────────────────
router.post(  '/',    protect, authorize('admin','store_owner','whole_saler','home_business'), upload.single('image'), createProduct);
router.put(   '/:id', protect, authorize('admin','store_owner','whole_saler','home_business'), upload.single('image'), updateProduct);
router.delete('/:id', protect, authorize('admin','store_owner','whole_saler','home_business'), deleteProduct);

module.exports = router;
