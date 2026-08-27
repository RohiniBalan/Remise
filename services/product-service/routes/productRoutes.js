const express = require('express');
const router  = express.Router();
const {
  upload,
  createProduct, getProducts, getProductById, getProductsByStore,
  getProductsByIds, updateProduct, deleteProduct, deductStock,
  reserveStock, commitStock, releaseStock, expireReservations,
  matchCart, getGroupedSuppliers
} = require('../controllers/productController');
const { protect, authorize, verifyAdmin, verifyAdminOrStoreOwner } = require('../middleware/authMiddleware');

router.get('/suppliers-grouped', getGroupedSuppliers);

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',               getProducts);
router.get('/store/:storeId', getProductsByStore);  // must be before /:id
router.get('/:id',            getProductById);

// ── Internal (service-to-service) ────────────────────────────────────────────
router.post('/batch',                getProductsByIds);
router.post('/reserve-stock',        reserveStock);
router.post('/commit-stock',         commitStock);
router.post('/release-stock',        releaseStock);
router.post('/expire-reservations',  expireReservations);
router.post('/deduct-stock',         deductStock);
router.post('/match-cart',           matchCart);


// ── Admin or Store Owner or Sellers ──────────────────────────────────────────────────────
router.post(  '/',    protect, authorize('admin','store_owner','wholesaler','home_business'), upload.single('image'), createProduct);
router.put(   '/:id', protect, authorize('admin','store_owner','wholesaler','home_business'), upload.single('image'), updateProduct);
router.delete('/:id', protect, authorize('admin','store_owner','wholesaler','home_business'), deleteProduct);


module.exports = router;
