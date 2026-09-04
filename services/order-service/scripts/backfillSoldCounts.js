// One-time (re-runnable) backfill: recomputes each product's soldCount
// from real order history in order-service's own DB, then pushes the
// totals to product-service. Run this from the order-service directory:
//
//   node scripts/backfillSoldCounts.js
//
// Requires the same env vars order-service already uses to connect to
// Mongo (MONGO_URI), plus PRODUCT_SERVICE_URL if it's not localhost:3003.

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');

const MONGODB_URI = process.env.MONGODB_URI;
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

async function main() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set — aborting.');
    process.exit(1);
  }

  console.log('Connecting to order-service database...');
  await mongoose.connect(MONGODB_URI);

  console.log('Aggregating confirmed sales by product...');
  // Only orders that represent a real, still-standing sale:
  // paid successfully AND not later cancelled (a cancellation after
  // payment restores stock via release-stock, so it shouldn't count).
  const results = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'SUCCESS',
        orderStatus: { $ne: 'Cancelled' },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        soldCount: { $sum: '$items.quantity' },
      },
    },
  ]);

  const counts = results
    .filter((r) => r._id) // skip any malformed items with no productId
    .map((r) => ({ productId: r._id, soldCount: r.soldCount }));

  console.log(`Found sales history for ${counts.length} products.`);

  if (counts.length === 0) {
    console.log('Nothing to backfill. Done.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Sending totals to product-service at ${PRODUCT_SERVICE_URL}...`);
  const res = await axios.post(
    `${PRODUCT_SERVICE_URL}/api/products/backfill-sold-counts`,
    { counts },
  );

  console.log('Backfill complete:', res.data.message);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err.response?.data || err.message);
  process.exit(1);
});