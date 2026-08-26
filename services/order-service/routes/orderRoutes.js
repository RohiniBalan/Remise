const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router = express.Router();
const {
  getMyOrders, createOrder, getOrderByOrderId, updatePaymentStatus, expireReservation,
  getOrdersByStore, confirmQrPayment, createWholesaleOrder, getOrdersByBuyer,
  updateOrderStatus, getOrderStats, getOrderInvoice, downloadOrderInvoicePdf,
  generateDeliveryLink, getDeliveryPortalOrder, updateDeliveryPortalStatus,
  setDeliveryMode, updateDeliveryStatusDirect,
  updateOrderCashfreeDetails, updateOrderRazorpayDetails, updateTransferStatus, getOrderByTransferId
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

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

// Delivery Portal (Token authenticated — no login required for delivery person)
router.get('/delivery-portal/:token', getDeliveryPortalOrder);
router.patch('/delivery-portal/:token/status', updateDeliveryPortalStatus);

// User-facing
router.get('/my-orders', getMyOrders);
router.patch('/:orderId/confirm-payment', upload.single('screenshot'), confirmQrPayment);

// Invoice / Bill Generation & Download (Available after confirmed payment)
router.get('/:orderId/invoice', getOrderInvoice);
router.get('/:orderId/invoice/pdf', downloadOrderInvoicePdf);

// Store owner-facing — orders placed against their store
router.get('/store/:storeId', protect, getOrdersByStore);

// Store owner delivery management
router.post('/:orderId/delivery-link', protect, generateDeliveryLink);
router.patch('/:orderId/delivery-mode', protect, setDeliveryMode);
router.patch('/:orderId/delivery-status', protect, updateDeliveryStatusDirect);

// Internal service-to-service (payment-service and admin stats call these)
router.get('/internal/stats', getOrderStats);
router.post('/internal', createOrder);
router.get('/internal/:orderId', getOrderByOrderId);
router.patch('/internal/:orderId/payment-status', updatePaymentStatus);
router.patch('/internal/:orderId/expire-reservation', expireReservation);
router.patch('/internal/:orderId/cashfree-details', updateOrderCashfreeDetails);
router.patch('/internal/:orderId/razorpay-details', updateOrderRazorpayDetails);
router.patch('/internal/:orderId/transfer-status', updateTransferStatus);
router.get('/internal/by-transfer/:transferId', getOrderByTransferId);


// Store owner: orders THEY placed as a buyer (mirrors getOrdersByStore, but from the buyer's side)
router.post('/wholesale',        protect, authorize('user','store_owner'), createWholesaleOrder);
router.get('/buyer/:buyerId',    protect, authorize('user','store_owner'), getOrdersByBuyer);

router.patch('/:id/seller-status', protect, authorize('whole_saler', 'home_business'), updateOrderStatus);

module.exports = router;


