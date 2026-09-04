const express = require('express');
const router = express.Router();
const { getShopByCategory } = require('../controllers/shopByCategoryController');

router.get('/', getShopByCategory);

module.exports = router;