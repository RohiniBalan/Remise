const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getDateRange, extractLineItems, computeAnalytics } = require('../utils/analytics');

const ORDER_SERVICE_URL   = process.env.ORDER_SERVICE_URL   || 'http://localhost:3004';
const OFFERS_SERVICE_URL  = process.env.OFFERS_SERVICE_URL  || 'http://localhost:3008';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

router.get('/:storeId/analytics', async (req, res) => {
  const { storeId } = req.params;
  const { range = 'month', from: customFrom, to: customTo, category, product } = req.query;
  const token = req.headers.authorization; // forward caller's token to protected endpoints

  try {
    const [smartOrdersRes, offerOrdersRes, productsRes] = await Promise.allSettled([
      axios.get(`${ORDER_SERVICE_URL}/api/orders/store/${storeId}`,        { headers: { Authorization: token } }),
      axios.get(`${OFFERS_SERVICE_URL}/api/offers/orders/store/${storeId}`, { headers: { Authorization: token } }),
      axios.get(`${PRODUCT_SERVICE_URL}/api/products/store/${storeId}`),
    ]);

    const smartOrders = smartOrdersRes.status === 'fulfilled' ? (smartOrdersRes.value.data.data || []) : [];
    const offerOrders  = offerOrdersRes.status === 'fulfilled' ? (offerOrdersRes.value.data.data || []) : [];
    const products     = productsRes.status === 'fulfilled' ? (productsRes.value.data.data || []) : [];

    const { from, to } = getDateRange(range, customFrom, customTo);
    const inRange = (o) => { const d = new Date(o.createdAt); return d >= from && d <= to; };

    const filteredSmart = smartOrders.filter(inRange);
    const filteredOffer = offerOrders.filter(inRange);

    const productCategoryMap = new Map(products.map(p => [p.title, p.category || 'Uncategorized']));

    let items = extractLineItems(filteredSmart, filteredOffer, productCategoryMap);
    if (category) items = items.filter(i => i.category === category);
    if (product)  items = items.filter(i => i.productTitle === product);

    const analytics = computeAnalytics(items);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to compute analytics.' });
  }
});

module.exports = router;