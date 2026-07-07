const express = require('express');
const router = express.Router();
const axios = require('axios');
const { sendOrderConfirmationSMS, sendOrderConfirmationEmail, notifyOrderParties } = require('../utils/notifications');

const ORDER_SERVICE_URL  = process.env.ORDER_SERVICE_URL  || 'http://localhost:3004';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

// PhonePe credentials
const CLIENT_ID      = process.env.PHONEPE_CLIENT_ID      || 'M23IOM3UNHZVS_2603051535';
const CLIENT_SECRET  = process.env.PHONEPE_CLIENT_SECRET   || 'YmFjMDMzYjItYjJlOS00NWRkLWFjZDYtYTU1MzU5YzE1ZTJl';
const MERCHANT_ID    = process.env.PHONEPE_MERCHANT_ID     || 'M23IOM3UNHZVS';
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION  || '1';
const PHONEPE_BASE   = process.env.PHONEPE_BASE_URL        || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// ── Helper: deduct stock via product-service ─────────────────────────────────
const deductStock = async (items) => {
  try {
    await axios.post(`${PRODUCT_SERVICE_URL}/api/products/deduct-stock`, { items });
  } catch (err) {
    console.error('Stock deduction error:', err.message);
  }
};

// ── POST /api/payment/initiate ───────────────────────────────────────────────
router.post('/initiate', async (req, res) => {
  try {
    const { amount, redirectUrl, cartItems, contactEmail, shippingAddress, billingAddress, paymentMethod, userId, storeId, storeName, deliveryMethod } = req.body;

    if (!redirectUrl) return res.status(400).json({ success: false, message: 'redirectUrl is required' });

    const merchantOrderId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    const returnUrl = `${redirectUrl}?orderId=${merchantOrderId}`;

    // 1. Create order via order-service
    const orderPayload = {
      orderId: merchantOrderId,
      userId: userId || null,
      contactEmail,
      storeId: storeId || null,
      storeName: storeName || null,
      items: cartItems.map(item => ({
        productId: item.id || item._id || item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      totalAmount: amount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      deliveryMethod: deliveryMethod || undefined,
      paymentStatus: 'PENDING',
    };

    // Order creation is isolated in its own try/catch: if it fails, no order
    // exists yet and it's safe to tell the client the whole thing failed. If
    // it succeeds, everything after this point is best-effort (stock/notify
    // already swallow their own errors) — a bug there must never surface as
    // "payment failed" for an order that was actually created, since that
    // would mislead the customer into retrying/double-ordering.
    let newOrder;
    try {
      const orderRes = await axios.post(`${ORDER_SERVICE_URL}/api/orders/internal`, orderPayload);
      newOrder = orderRes.data.data;
    } catch (orderErr) {
      const detail = orderErr.response?.data?.message || orderErr.message;
      console.error('Initiate Error — could not create order via order-service:', detail);
      return res.status(502).json({ success: false, message: `Could not create your order: ${detail}` });
    }

    // 2. COD — instant success. QR — order placed, payment confirmation deferred
    // until the customer self-declares via PATCH /api/orders/:orderId/confirm-payment.
    if (paymentMethod === 'cod' || paymentMethod === 'qr') {
      try {
        const isCod = paymentMethod === 'cod';
        if (isCod) {
          await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}/payment-status`, { paymentStatus: 'SUCCESS' });
        }
        await deductStock(newOrder.items.map(i => ({ productId: i.productId, quantity: i.quantity })));

        const updatedOrder = { ...newOrder, paymentStatus: isCod ? 'SUCCESS' : 'PENDING', shippingAddress, contactEmail };
        if (shippingAddress?.phone) sendOrderConfirmationSMS(updatedOrder);
        if (contactEmail) sendOrderConfirmationEmail(updatedOrder);
        notifyOrderParties(updatedOrder);
      } catch (postCreateErr) {
        // The order already exists at this point — log and continue instead
        // of reporting failure for an order the customer did successfully place.
        console.error('Initiate Error — post-order-creation step failed (order still created):', postCreateErr.message);
      }

      return res.status(200).json({ success: true, isCod: paymentMethod === 'cod', isQr: paymentMethod === 'qr', url: returnUrl });
    }

    // 3. PhonePe — get access token
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', CLIENT_ID);
    tokenParams.append('client_version', CLIENT_VERSION);
    tokenParams.append('client_secret', CLIENT_SECRET);
    tokenParams.append('grant_type', 'client_credentials');

    const tokenRes = await axios.post(
      `${PHONEPE_BASE}/v1/oauth/token`,
      tokenParams.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = tokenRes.data.access_token;
    if (!accessToken) return res.status(500).json({ success: false, message: 'Failed to generate Auth Token' });

    const paymentPayload = {
      merchantId: MERCHANT_ID,
      merchantOrderId,
      amount: Math.round(amount * 100),
      expireAfter: 1800,
      metaInfo: { udf1: 'Website Order' },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Order Payment',
        merchantUrls: { redirectUrl: returnUrl, cancelUrl: returnUrl },
      },
    };

    const payRes = await axios.post(
      `${PHONEPE_BASE}/checkout/v2/pay`,
      paymentPayload,
      { headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${accessToken}` } }
    );

    const payUrl = payRes.data.redirectUrl || payRes.data.data?.redirectUrl;
    if (!payUrl) return res.status(500).json({ success: false, message: 'Payment URL not found in PhonePe response' });

    res.status(200).json({ success: true, url: payUrl });
  } catch (error) {
    console.error('Initiate Error:', error.message);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
});

// ── GET /api/payment/status/:orderId ────────────────────────────────────────
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderRes = await axios.get(`${ORDER_SERVICE_URL}/api/orders/internal/${orderId}`);
    const order = orderRes.data.data;

    if (order && order.paymentStatus !== 'SUCCESS') {
      await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${orderId}/payment-status`, { paymentStatus: 'SUCCESS' });
      await deductStock(order.items.map(i => ({ productId: i.productId, quantity: i.quantity })));

      const enrichedOrder = { ...order, paymentStatus: 'SUCCESS' };
      if (enrichedOrder.shippingAddress?.phone) sendOrderConfirmationSMS(enrichedOrder);
      if (enrichedOrder.contactEmail) sendOrderConfirmationEmail(enrichedOrder);
    }

    setTimeout(() => {
      res.status(200).json({
        success: true,
        status: 'SUCCESS',
        message: 'Order Placed Successfully!',
        rawData: { transactionId: orderId, state: 'COMPLETED' },
      });
    }, 1500);
  } catch (error) {
    console.error('Status Check Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to check status' });
  }
});

// ── POST /api/payment/callback ───────────────────────────────────────────────
router.post('/callback', (req, res) => res.status(200).send('OK'));

module.exports = router;
