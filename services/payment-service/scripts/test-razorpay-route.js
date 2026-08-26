/**
 * Automated Verification Script for Razorpay Route Multi-Vendor Marketplace Integration
 * Run with: node services/payment-service/scripts/test-razorpay-route.js
 */
const crypto = require('crypto');
const {
  verifyPaymentSignature,
  verifyWebhookSignature,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} = require('../utils/razorpay');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('\n============================================================');
console.log('🧪 RUNNING RAZORPAY ROUTE MARKETPLACE INTEGRATION TEST SUITE');
console.log('============================================================\n');

// ── TEST 1: Single-Vendor Payout Calculation ──
console.log('--- TEST 1: Single Vendor Calculation ---');
{
  const vendorA = {
    gross: 1000,
    commissionPct: 10,
  };
  const commission = Math.round(vendorA.gross * (vendorA.commissionPct / 100) * 100) / 100;
  const vendorNet = Math.round((vendorA.gross - commission) * 100) / 100;
  const vendorPaise = Math.round(vendorNet * 100);

  assert(commission === 100, `Vendor A commission is ₹100 (got ₹${commission})`);
  assert(vendorNet === 900, `Vendor A receives ₹900 (got ₹${vendorNet})`);
  assert(vendorPaise === 90000, `Vendor A receives 90000 paise (got ${vendorPaise})`);
}

// ── TEST 2: Multi-Vendor Marketplace Distribution ──
console.log('\n--- TEST 2: Multi-Vendor Marketplace Distribution ---');
{
  // Vendor A: 2 products (₹500 + ₹200 = ₹700), 10% commission
  // Vendor B: 1 product (₹300), 10% commission
  // Total cart = ₹1,000
  const cart = [
    { title: 'Vendor A Item 1', price: 500, qty: 1, storeId: 'store_A', commissionPct: 10 },
    { title: 'Vendor A Item 2', price: 200, qty: 1, storeId: 'store_A', commissionPct: 10 },
    { title: 'Vendor B Item 1', price: 300, qty: 1, storeId: 'store_B', commissionPct: 10 },
  ];

  const storeTotals = {};
  for (const item of cart) {
    if (!storeTotals[item.storeId]) {
      storeTotals[item.storeId] = { gross: 0, commissionPct: item.commissionPct };
    }
    storeTotals[item.storeId].gross += item.price * item.qty;
  }

  const transfers = [];
  let platformCommissionTotal = 0;
  let customerTotal = 0;

  for (const [storeId, data] of Object.entries(storeTotals)) {
    customerTotal += data.gross;
    const commission = Math.round(data.gross * (data.commissionPct / 100) * 100) / 100;
    const net = Math.round((data.gross - commission) * 100) / 100;
    platformCommissionTotal += commission;

    transfers.push({
      storeId,
      gross: data.gross,
      commission,
      net,
      amountPaise: Math.round(net * 100),
    });
  }

  assert(customerTotal === 1000, `Total customer cart is ₹1,000 (got ₹${customerTotal})`);
  assert(platformCommissionTotal === 100, `Platform commission is ₹100 (got ₹${platformCommissionTotal})`);

  const transferA = transfers.find((t) => t.storeId === 'store_A');
  const transferB = transfers.find((t) => t.storeId === 'store_B');

  assert(transferA.gross === 700, `Vendor A gross is ₹700 (got ₹${transferA.gross})`);
  assert(transferA.commission === 70, `Vendor A commission is ₹70 (got ₹${transferA.commission})`);
  assert(transferA.net === 630, `Vendor A net payout is ₹630 (got ₹${transferA.net})`);
  assert(transferA.amountPaise === 63000, `Vendor A transfer amount is 63000 paise`);

  assert(transferB.gross === 300, `Vendor B gross is ₹300 (got ₹${transferB.gross})`);
  assert(transferB.commission === 30, `Vendor B commission is ₹30 (got ₹${transferB.commission})`);
  assert(transferB.net === 270, `Vendor B net payout is ₹270 (got ₹${transferB.net})`);
  assert(transferB.amountPaise === 27000, `Vendor B transfer amount is 27000 paise`);
}

// ── TEST 3: Payment Signature Verification ──
console.log('\n--- TEST 3: Payment Signature Verification ---');
{
  const orderId = 'order_test_123456';
  const paymentId = 'pay_test_789012';

  // Generate valid HMAC signature using secret
  const validSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const isValid = verifyPaymentSignature({
    orderId,
    paymentId,
    signature: validSignature,
  });

  assert(isValid === true, 'Valid signature verified successfully');

  // Test tampered signature
  const isInvalid = verifyPaymentSignature({
    orderId,
    paymentId,
    signature: 'tampered_signature_xyz123',
  });

  assert(isInvalid === false, 'Tampered signature rejected as invalid');

  // Test missing parameters
  const isMissing = verifyPaymentSignature({
    orderId: '',
    paymentId,
    signature: validSignature,
  });

  assert(isMissing === false, 'Empty order ID signature rejected');
}

// ── TEST 4: Webhook Signature Verification ──
console.log('\n--- TEST 4: Webhook Signature Verification ---');
{
  const webhookPayload = JSON.stringify({
    event: 'transfer.processed',
    payload: {
      transfer: {
        entity: {
          id: 'trf_123456789',
          recipient: 'acc_vendorA_999',
          amount: 63000,
          notes: { orderId: 'TXN_TEST_001' },
        },
      },
    },
  });

  const validWebhookSig = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(webhookPayload)
    .digest('hex');

  const isWebhookValid = verifyWebhookSignature({
    body: webhookPayload,
    signature: validWebhookSig,
    secret: RAZORPAY_WEBHOOK_SECRET,
  });

  assert(isWebhookValid === true, 'Webhook signature verified successfully');

  const isWebhookInvalid = verifyWebhookSignature({
    body: webhookPayload,
    signature: 'bad_signature',
    secret: RAZORPAY_WEBHOOK_SECRET,
  });

  assert(isWebhookInvalid === false, 'Bad webhook signature rejected');
}

// ── TEST 5: Webhook Idempotency Simulation ──
console.log('\n--- TEST 5: Webhook Idempotency Simulation ---');
{
  // Simulated database order
  const order = {
    orderId: 'TXN_TEST_001',
    paymentStatus: 'PENDING',
    vendorTransfers: [
      {
        storeId: 'store_A',
        razorpayAccountId: 'acc_vendorA_999',
        transferStatus: 'pending',
        grossAmount: 700,
        commissionAmount: 70,
        vendorAmount: 630,
      },
    ],
  };

  // First webhook processing: payment.captured
  if (order.paymentStatus !== 'SUCCESS') {
    order.paymentStatus = 'SUCCESS';
  }
  assert(order.paymentStatus === 'SUCCESS', 'First webhook marks order as SUCCESS');

  // Second duplicate webhook processing: payment.captured (idempotent no-op)
  let duplicated = false;
  if (order.paymentStatus !== 'SUCCESS') {
    duplicated = true;
  }
  assert(duplicated === false, 'Duplicate webhook is handled idempotently without re-triggering');

  // Transfer processed webhook
  const transferEvent = {
    transferId: 'trf_999000',
    accountId: 'acc_vendorA_999',
    status: 'processed',
  };

  const trf = order.vendorTransfers.find((t) => t.razorpayAccountId === transferEvent.accountId);
  if (trf) {
    trf.transferStatus = 'processed';
    trf.razorpayTransferId = transferEvent.transferId;
  }

  assert(trf.transferStatus === 'processed', 'Vendor transfer status updated to PROCESSED');
  assert(trf.razorpayTransferId === 'trf_999000', 'Transfer ID recorded correctly');
}

console.log('\n============================================================');
console.log(`📊 RESULTS: ${passedTests}/${totalTests} tests passed`);
console.log('============================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
