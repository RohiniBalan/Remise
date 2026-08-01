const axios = require('axios'); // or native fetch if you're on Node 18+
const Product = require('../models/Product');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL; // e.g. http://localhost:3006

async function checkLowStock(product) {
  if (!product) return;

  if (product.totalStock > (product.lowStockThreshold ?? 5)) {
    if (product.lowStockNotifiedAt) {
      await Product.updateOne({ _id: product._id }, { lowStockNotifiedAt: null });
    }
    return;
  }

  if (product.lowStockNotifiedAt) return; // already alerted for this dip

  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/low-stock`, {
      storeId: product.storeId,
      productId: product._id,
      productTitle: product.title,
      currentStock: product.totalStock,
    });
    await Product.updateOne({ _id: product._id }, { lowStockNotifiedAt: new Date() });
  } catch (err) {
    console.error('Low stock notification failed:', err.message);
    // don't throw — a failed notification should never break the stock update request
  }
}

module.exports = { checkLowStock };