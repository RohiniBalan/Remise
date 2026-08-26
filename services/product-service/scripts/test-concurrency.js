const axios = require('axios');
const mongoose = require('mongoose');

const PRODUCT_SERVICE_URL = 'http://localhost:3003';
const PAYMENT_SERVICE_URL = 'http://localhost:3005';
const GATEWAY_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING CONCURRENT STOCK & RESERVATION TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // Connect to MongoDB to inspect / create test fixtures
    await mongoose.connect('mongodb://127.0.0.1:27017/wowlife_products');
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const StockReservation = mongoose.model('StockReservation', new mongoose.Schema({}, { strict: false }));

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Direct Concurrent Race Condition on Product with Stock = 1
    // ─────────────────────────────────────────────────────────────
    console.log('▶ TEST 1: Simultaneous Race Condition (Stock = 1, 10 Concurrent Buyers)');
    const testProd1 = await Product.create({
      title: 'Race Condition Test Product',
      price: 100,
      totalStock: 1,
      availability: 'In Stock',
    });

    const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
      return axios.post(`${PRODUCT_SERVICE_URL}/api/products/reserve-stock`, {
        orderId: `TEST-RACE-1-USER-${i}-${Date.now()}`,
        items: [{ productId: testProd1._id.toString(), quantity: 1, title: testProd1.title }],
      }).catch(err => err.response || { status: 500, data: { success: false, message: err.message } });
    });

    const results1 = await Promise.all(concurrentRequests);
    const successCount1 = results1.filter(r => r.status === 200 && r.data?.success).length;
    const failureCount1 = results1.filter(r => r.status === 409 || !r.data?.success).length;

    console.log(`  - 10 concurrent requests sent: ${successCount1} succeeded, ${failureCount1} failed.`);
    assert(successCount1 === 1, 'Exactly 1 concurrent request succeeded');
    assert(failureCount1 === 9, 'Exactly 9 concurrent requests were rejected with Out of Stock');

    const updatedProd1 = await Product.findById(testProd1._id);
    assert(updatedProd1.totalStock === 0, 'Database stock is exactly 0 (no negative stock)');
    assert(updatedProd1.availability === 'Out Of Stock', 'Availability updated to Out Of Stock');
    console.log('');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Multi-Item Atomicity & Rollback
    // ─────────────────────────────────────────────────────────────
    console.log('▶ TEST 2: Multi-Item Atomic Reservation & Rollback');
    const testProd2A = await Product.create({
      title: 'Multi-Item Prod A',
      price: 50,
      totalStock: 5,
      availability: 'In Stock',
    });
    const testProd2B = await Product.create({
      title: 'Multi-Item Prod B',
      price: 150,
      totalStock: 1,
      availability: 'In Stock',
    });

    // Requesting Prod A (qty 2) and Prod B (qty 3 - which exceeds available stock 1)
    let multiResError = null;
    try {
      await axios.post(`${PRODUCT_SERVICE_URL}/api/products/reserve-stock`, {
        orderId: `TEST-MULTI-FAIL-${Date.now()}`,
        items: [
          { productId: testProd2A._id.toString(), quantity: 2, title: testProd2A.title },
          { productId: testProd2B._id.toString(), quantity: 3, title: testProd2B.title },
        ],
      });
    } catch (err) {
      multiResError = err.response;
    }

    assert(multiResError && multiResError.status === 409, 'Multi-item reservation failed with 409');
    assert(multiResError.data?.code === 'OUT_OF_STOCK', 'Error code is OUT_OF_STOCK');

    const checkProd2A = await Product.findById(testProd2A._id);
    const checkProd2B = await Product.findById(testProd2B._id);
    assert(checkProd2A.totalStock === 5, 'Product A stock rolled back to original 5 (no partial reservation leak)');
    assert(checkProd2B.totalStock === 1, 'Product B stock remains untouched at 1');
    console.log('');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Payment Cancellation & Idempotent Stock Release
    // ─────────────────────────────────────────────────────────────
    console.log('▶ TEST 3: Payment Cancellation & Idempotent Release');
    const testProd3 = await Product.create({
      title: 'Cancellation Test Product',
      price: 200,
      totalStock: 2,
      availability: 'In Stock',
    });

    const orderId3 = `TEST-CANCEL-${Date.now()}`;
    const res3 = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/reserve-stock`, {
      orderId: orderId3,
      items: [{ productId: testProd3._id.toString(), quantity: 1, title: testProd3.title }],
    });
    assert(res3.data?.success, 'Stock reserved for cancellation test');

    const prod3AfterReserve = await Product.findById(testProd3._id);
    assert(prod3AfterReserve.totalStock === 1, 'Stock decremented to 1 after reservation');

    // First Release call
    const releaseRes1 = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/release-stock`, {
      orderId: orderId3,
      reason: 'user_cancelled',
    });
    assert(releaseRes1.data?.success, 'Stock released successfully on cancellation');

    const prod3AfterRelease = await Product.findById(testProd3._id);
    assert(prod3AfterRelease.totalStock === 2, 'Stock restored to original 2');

    // Second Release call (Idempotency test - should not restore stock a second time!)
    const releaseRes2 = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/release-stock`, {
      orderId: orderId3,
      reason: 'user_cancelled',
    });
    assert(releaseRes2.data?.success, 'Duplicate release call handled safely');

    const prod3AfterSecondRelease = await Product.findById(testProd3._id);
    assert(prod3AfterSecondRelease.totalStock === 2, 'Stock is still 2 (prevented double-restoration)');
    console.log('');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Payment Success & Stock Commitment
    // ─────────────────────────────────────────────────────────────
    console.log('▶ TEST 4: Payment Success & Stock Commitment');
    const testProd4 = await Product.create({
      title: 'Commit Test Product',
      price: 300,
      totalStock: 3,
      availability: 'In Stock',
    });

    const orderId4 = `TEST-COMMIT-${Date.now()}`;
    await axios.post(`${PRODUCT_SERVICE_URL}/api/products/reserve-stock`, {
      orderId: orderId4,
      items: [{ productId: testProd4._id.toString(), quantity: 1, title: testProd4.title }],
    });

    const commitRes = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/commit-stock`, {
      orderId: orderId4,
    });
    assert(commitRes.data?.success, 'Stock reservation committed');

    const resRecord4 = await StockReservation.findOne({ orderId: orderId4 });
    assert(resRecord4.status === 'COMMITTED', 'Reservation status updated to COMMITTED');

    // Duplicate commit call (Idempotency test)
    const commitRes2 = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/commit-stock`, {
      orderId: orderId4,
    });
    assert(commitRes2.data?.success, 'Duplicate commit call handled safely');
    console.log('');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Reservation Expiration & Auto-Restoration
    // ─────────────────────────────────────────────────────────────
    console.log('▶ TEST 5: Automatic Expiration of Abandoned Reservations');
    const testProd5 = await Product.create({
      title: 'Expiration Test Product',
      price: 400,
      totalStock: 1,
      availability: 'In Stock',
    });

    const orderId5 = `TEST-EXPIRE-${Date.now()}`;
    await axios.post(`${PRODUCT_SERVICE_URL}/api/products/reserve-stock`, {
      orderId: orderId5,
      items: [{ productId: testProd5._id.toString(), quantity: 1, title: testProd5.title }],
    });

    // Artificially set expiration to 1 minute ago in MongoDB
    await StockReservation.updateOne(
      { orderId: orderId5 },
      { $set: { expiresAt: new Date(Date.now() - 60 * 1000) } }
    );

    // Call expire-reservations
    const expireRes = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/expire-reservations`);
    assert(expireRes.data?.success, 'expire-reservations endpoint succeeded');
    assert(expireRes.data?.count >= 1, 'At least 1 expired reservation processed');

    const prod5AfterExpire = await Product.findById(testProd5._id);
    assert(prod5AfterExpire.totalStock === 1, 'Stock auto-restored back to 1');
    assert(prod5AfterExpire.availability === 'In Stock', 'Product availability restored to In Stock');
    console.log('');

    // ─────────────────────────────────────────────────────────────
    // TEST 6: End-to-End Payment Flow & Gateway Cancel
    // ─────────────────────────────────────────────────────────────
    console.log('▶ TEST 6: End-to-End Gateway Order Creation & Immediate Cancellation');
    const testProd6 = await Product.create({
      title: 'E2E Flow Product',
      price: 500,
      totalStock: 1,
      availability: 'In Stock',
    });

    // Customer 1 initiates order for the last unit
    const orderRes1 = await axios.post(`${GATEWAY_URL}/api/payment/create-order`, {
      amount: 500,
      contactEmail: 'customer1@test.com',
      paymentMethod: 'razorpay',
      shippingAddress: {
        firstName: 'Customer',
        lastName: 'One',
        address: '123 Test St',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pinCode: '600001',
        phone: '9876543210',
        country: 'India',
      },
      cartItems: [
        {
          id: testProd6._id.toString(),
          title: testProd6.title,
          price: 500,
          quantity: 1,
        }
      ],
    });

    assert(orderRes1.data?.success, 'Customer 1 successfully created order & reserved stock');
    const orderIdCust1 = orderRes1.data.orderId;

    // Customer 2 attempts to buy the same product at the same time
    let cust2Error = null;
    try {
      await axios.post(`${GATEWAY_URL}/api/payment/create-order`, {
        amount: 500,
        contactEmail: 'customer2@test.com',
        paymentMethod: 'razorpay',
        shippingAddress: {
          firstName: 'Customer',
          lastName: 'Two',
          address: '456 Test St',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pinCode: '600001',
          phone: '9876543211',
          country: 'India',
        },
        cartItems: [
          {
            id: testProd6._id.toString(),
            title: testProd6.title,
            price: 500,
            quantity: 1,
          }
        ],
      });
    } catch (err) {
      cust2Error = err.response;
    }

    assert(cust2Error && cust2Error.status === 409, 'Customer 2 rejected with 409 Out of Stock');

    // Customer 1 cancels checkout
    const cancelRes = await axios.post(`${GATEWAY_URL}/api/payment/cancel`, {
      orderId: orderIdCust1,
      reason: 'user_closed_webview',
    });
    assert(cancelRes.data?.success, 'Customer 1 cancellation released reserved stock');

    // Now Customer 2 tries again and succeeds!
    const orderRes2Retry = await axios.post(`${GATEWAY_URL}/api/payment/create-order`, {
      amount: 500,
      contactEmail: 'customer2@test.com',
      paymentMethod: 'razorpay',
      shippingAddress: {
        firstName: 'Customer',
        lastName: 'Two',
        address: '456 Test St',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pinCode: '600001',
        phone: '9876543211',
        country: 'India',
      },
      cartItems: [
        {
          id: testProd6._id.toString(),
          title: testProd6.title,
          price: 500,
          quantity: 1,
        }
      ],
    });
    assert(orderRes2Retry.data?.success, 'Customer 2 successfully ordered after Customer 1 cancelled');
    console.log('');

    // Clean up test products
    await Product.deleteMany({
      _id: { $in: [testProd1._id, testProd2A._id, testProd2B._id, testProd3._id, testProd4._id, testProd5._id, testProd6._id] }
    });

    console.log('====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message || error);
    process.exit(1);
  }
}

runTests();
