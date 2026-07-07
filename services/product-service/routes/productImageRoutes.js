const express = require('express');
const router  = express.Router();
const { getImage, saveImage, getAllImages } = require('../controllers/productImageIndexController');

router.get('/all', getAllImages);   // GET /api/product-images/all
router.get('/',    getImage);       // GET /api/product-images?name=big+onion
router.post('/',   saveImage);      // POST /api/product-images

module.exports = router;
