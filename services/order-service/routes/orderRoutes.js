const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router = express.Router();
const { getMyOrders, createOrder, getOrderByOrderId, updatePaymentStatus, getOrdersByStore, confirmQrPayment } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Multer setup for QR payment screenshots
const uploadDir = path.join(__dirname, '..', 'uploads', 'payment-proofs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `proof-${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// User-facing
router.get('/my-orders', getMyOrders);
router.patch('/:orderId/confirm-payment', upload.single('screenshot'), confirmQrPayment);

// Store owner-facing — orders placed against their store
router.get('/store/:storeId', protect, getOrdersByStore);

// Internal service-to-service (payment-service calls these)
router.post('/internal', createOrder);
router.get('/internal/:orderId', getOrderByOrderId);
router.patch('/internal/:orderId/payment-status', updatePaymentStatus);

module.exports = router;
