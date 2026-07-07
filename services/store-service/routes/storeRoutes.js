const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const {
  registerStore, getMyStore, getStoreById,
  updateStore, getAllStores, verifyStore, syncOwnerRole,
  getNearbyStores, getStoreInternal
} = require('../controllers/storeController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// Multer setup for store logos
const uploadDir = path.join(__dirname, '..', 'uploads', 'stores');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `store-${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// Authenticated — must be before /:id to prevent 'me' matching as an id
router.get('/me/my-store',  protect, getMyStore);
router.post('/me/sync-role', protect, syncOwnerRole);
router.post('/',            protect, upload.single('logo'), registerStore);
router.put('/:id',        protect, upload.single('logo'), updateStore);

// Public — nearby search (must be before /:id)
router.get('/nearby',     getNearbyStores);

// Internal — service-to-service only (not exposed via gateway)
router.get('/internal/:id', getStoreInternal);

// Admin — full store listing (includes ownerId/phone/email, so it must not be public)
router.get('/',             protect, verifyAdmin, getAllStores);
router.patch('/:id/verify', protect, verifyAdmin, verifyStore);

// Public — wildcard :id route goes last, and never exposes ownerId
router.get('/:id',        getStoreById);

module.exports = router;
