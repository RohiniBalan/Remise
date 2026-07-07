const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const {
  createOffer, getNearbyOffers, getStoreOffers,
  getOfferById, updateOffer, deleteOffer
} = require('../controllers/offerController');
const {
  placeOfferOrder, getStoreOrders, getMyOfferOrders, updateOrderStatus
} = require('../controllers/offerOrderController');
const { protect } = require('../middleware/authMiddleware');

// Multer for offer images
const uploadDir = path.join(__dirname, '..', 'uploads', 'offers');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `offer-${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp|gif/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// ── Offer CRUD ───────────────────────────────────────────────────────────────
router.get('/nearby',              getNearbyOffers);                         // public
router.get('/store/:storeId',      getStoreOffers);                         // public
router.get('/:id',                 getOfferById);                           // public
router.post('/',    protect,       upload.single('image'), createOffer);    // store owner
router.put('/:id',  protect,       upload.single('image'), updateOffer);    // store owner
router.delete('/:id', protect,     deleteOffer);                            // store owner / admin

// ── Offer Orders ─────────────────────────────────────────────────────────────
router.post('/:id/order',                 placeOfferOrder);                 // public (guest checkout ok)
router.get('/orders/my',     protect,     getMyOfferOrders);                // logged-in user
router.get('/orders/store/:storeId', protect, getStoreOrders);              // store owner
router.patch('/orders/:id/status', protect, updateOrderStatus);             // store owner

module.exports = router;
