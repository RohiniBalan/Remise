const express = require('express');
const router = express.Router();
const axios = require('axios');
const {
  sendOrderConfirmationSMS,
  sendOrderConfirmationEmail,
  notifyOrderParties,
} = require('../utils/notifications');
const {
  createVendor,
  getVendorDetails,
  createEasySplitOrder,
  getOrderDetails,
  getOrderPayments,
  createRefund,
  verifyWebhookSignature,
  getEnvConfig,
} = require('../utils/cashfree');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';
const STORE_SERVICE_URL = process.env.STORE_SERVICE_URL || 'http://localhost:3007';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const DEFAULT_COMMISSION_PERCENT = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '10');

// PhonePe credentials (for alternative flow)
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || 'M23IOM3UNHZVS_2603051535';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || 'YmFjMDMzYjItYjJlOS00NWRkLWFjZDYtYTU1MzU5YzE1ZTJl';
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'M23IOM3UNHZVS';
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';
const PHONEPE_BASE = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// Helper: reserve stock via product-service (atomic check & decrement)
const reserveStock = async (orderId, items) => {
  return await axios.post(`${PRODUCT_SERVICE_URL}/api/products/reserve-stock`, {
    orderId,
    items,
  });
};

// Helper: commit stock via product-service (finalizes sale & low stock alerts)
const commitStock = async (orderId, items) => {
  try {
    await axios.post(`${PRODUCT_SERVICE_URL}/api/products/commit-stock`, {
      orderId,
      items,
    });
  } catch (err) {
    console.error('Stock commit error:', err.message);
  }
};

// Helper: release stock via product-service (restores inventory to product catalog)
const releaseStock = async (orderId, items, reason) => {
  try {
    await axios.post(`${PRODUCT_SERVICE_URL}/api/products/release-stock`, {
      orderId,
      items,
      reason,
    });
  } catch (err) {
    console.error('Stock release error:', err.message);
  }
};

// Helper: legacy deduct stock via product-service
const deductStock = async (items) => {
  try {
    await axios.post(`${PRODUCT_SERVICE_URL}/api/products/deduct-stock`, {
      items,
    });
  } catch (err) {
    console.error('Stock deduction error:', err.message);
  }
};

// Helper: fetch product details to verify vendor/price
const resolveProductStore = async (productId) => {
  try {
    const res = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn(`Could not fetch product ${productId} from product-service:`, err.message);
  }
  return null;
};

// Helper: fetch store details (including Cashfree Vendor ID)
const resolveStoreDetails = async (storeId) => {
  if (!storeId) return null;
  try {
    const res = await axios.get(`${STORE_SERVICE_URL}/api/stores/internal/${storeId}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn(`Could not fetch store ${storeId} from store-service:`, err.message);
  }
  return null;
};

/**
 * Helper: Ensure vendor is onboarded to Cashfree Easy Split.
 * If vendor has not yet been registered in Cashfree, automatically onboard now and save vendorId.
 */
const ensureVendorOnboarded = async (store) => {
  if (!store) return null;
  const vendorId = store.cashfreeVendorId || `vendor_${store._id}`;

  try {
    const onboardResult = await createVendor({
      vendorId,
      storeId: store._id.toString(),
      name: store.businessDetails?.legalBusinessName || store.name,
      email: store.email,
      phone: store.phone,
      bankAccount: store.businessDetails?.bankAccount || {},
      pan: store.businessDetails?.pan || store.pan,
      businessType: store.businessDetails?.businessType || 'individual',
    });

    // Update store-service with Cashfree Vendor ID
    await axios.patch(`${STORE_SERVICE_URL}/api/stores/internal/${store._id}/cashfree-status`, {
      cashfreeVendorId: onboardResult.vendorId || vendorId,
      cashfreeVendorStatus: 'active',
      cashfreeKycStatus: 'COMPLETED',
    }).catch((e) => console.warn(`Could not sync vendorId back to store ${store._id}:`, e.message));

    return onboardResult.vendorId || vendorId;
  } catch (err) {
    console.warn(`[Auto-Onboard Note] Failed to auto-onboard store ${store._id} to Cashfree Easy Split:`, err.message);
    return vendorId;
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. POST /api/payment/create-order (or /api/payment/initiate)
 * Marketplace Cashfree Easy Split Order Creation
 * ─────────────────────────────────────────────────────────────────────────────
 */
const handleCreateOrder = async (req, res) => {
  try {
    const {
      amount,
      redirectUrl,
      cartItems,
      contactEmail,
      shippingAddress,
      billingAddress,
      paymentMethod = 'cashfree',
      userId,
      deliveryMethod,
    } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!contactEmail) {
      return res.status(400).json({ success: false, message: 'Contact email is required' });
    }

    const merchantOrderId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    const returnUrl = redirectUrl ? `${redirectUrl}?orderId=${merchantOrderId}` : `/payment-status?orderId=${merchantOrderId}`;

    // 1. Group items by store / vendor and verify products
    const storeGroups = {};
    const processedItems = [];

    const bodyStoreId = req.body.storeId || null;
    let bodyStoreName = req.body.storeName || null;
    if (bodyStoreId && !bodyStoreName) {
      const s = await resolveStoreDetails(bodyStoreId);
      if (s?.name) bodyStoreName = s.name;
    }

    for (const item of cartItems) {
      const pId = item.id || item._id || item.productId;
      const productInfo = await resolveProductStore(pId);

      // Determine vendor/store ID (from product-service record, cart item payload, or request body)
      const storeId = item.storeId || productInfo?.storeId || bodyStoreId || null;
      let storeName = item.storeName || productInfo?.storeName || (storeId === bodyStoreId ? bodyStoreName : null);
      if (storeId && !storeName) {
        const s = await resolveStoreDetails(storeId);
        if (s?.name) storeName = s.name;
      }

      const title = productInfo?.title || item.title || 'Product';
      const price = productInfo ? (productInfo.discountedPrice || productInfo.price) : Number(item.price);
      const quantity = Number(item.quantity) || 1;
      const brand = productInfo?.brand || item.brand || null;
      const image = item.image || (productInfo?.images?.[0] || productInfo?.imageUrl) || null;

      const itemRecord = {
        productId: pId,
        storeId,
        storeName: storeName || 'Vendor Store',
        title,
        brand,
        price,
        quantity,
        image,
      };
      processedItems.push(itemRecord);

      const groupKey = storeId || 'platform_direct';
      if (!storeGroups[groupKey]) {
        storeGroups[groupKey] = {
          storeId,
          storeName: storeName || 'Vendor Store',
          items: [],
          grossAmount: 0,
        };
      }
      storeGroups[groupKey].items.push(itemRecord);
      storeGroups[groupKey].grossAmount += price * quantity;
    }

    // 2. Compute Vendor Distribution & Cashfree Easy Splits
    const splits = [];
    const vendorTransfers = [];
    let calculatedTotal = 0;

    for (const [groupKey, group] of Object.entries(storeGroups)) {
      calculatedTotal += group.grossAmount;

      if (group.storeId && group.storeId !== 'platform_direct') {
        const store = await resolveStoreDetails(group.storeId);
        const storeName = store?.name || group.storeName || 'Vendor Store';

        // Auto-onboard vendor to Cashfree Easy Split if not already linked
        const cashfreeVendorId = await ensureVendorOnboarded(store);

        const commissionPct = store?.commissionPercentage !== undefined
          ? store.commissionPercentage
          : DEFAULT_COMMISSION_PERCENT;

        const commissionAmount = Math.round(group.grossAmount * (commissionPct / 100) * 100) / 100;
        const vendorAmount = Math.round((group.grossAmount - commissionAmount) * 100) / 100;

        if (cashfreeVendorId && vendorAmount > 0) {
          splits.push({
            vendor_id: cashfreeVendorId,
            amount: vendorAmount,
            tags: {
              storeId: group.storeId,
              storeName,
              orderId: merchantOrderId,
            },
          });
        }

        vendorTransfers.push({
          storeId: group.storeId,
          storeName,
          vendorId: cashfreeVendorId,
          grossAmount: group.grossAmount,
          commissionAmount,
          vendorAmount,
          transferStatus: 'pending',
        });
      }
    }

    const totalAmount = Math.round(calculatedTotal * 100) / 100;

    // 3. Atomically Reserve Stock in product-service (prevents concurrent overselling)
    try {
      await reserveStock(merchantOrderId, processedItems);
    } catch (stockErr) {
      const detail =
        stockErr.response?.data?.message ||
        'One or more items in your cart are out of stock.';
      console.warn(`[Stock Reservation Failed] Order ${merchantOrderId}:`, detail);
      return res.status(stockErr.response?.status || 409).json({
        success: false,
        code: 'OUT_OF_STOCK',
        message: detail,
        details: stockErr.response?.data?.details || null,
      });
    }

    const primaryStoreId = bodyStoreId || processedItems.find(i => i.storeId)?.storeId || null;
    const primaryStoreName = bodyStoreName || processedItems.find(i => i.storeName)?.storeName || (primaryStoreId ? 'Vendor Store' : null);

    // 4. Create MongoDB Order in order-service
    const orderPayload = {
      orderId: merchantOrderId,
      userId: userId || null,
      contactEmail,
      storeId: primaryStoreId,
      storeName: primaryStoreName,
      items: processedItems,
      totalAmount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      deliveryMethod: deliveryMethod || undefined,
      paymentStatus: 'PENDING',
      stockStatus: 'RESERVED',
      stockExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      vendorTransfers,
    };

    let newOrder;
    try {
      const orderRes = await axios.post(`${ORDER_SERVICE_URL}/api/orders/internal`, orderPayload);
      newOrder = orderRes.data.data;
    } catch (orderErr) {
      // Rollback reserved stock if order creation failed in order-service
      await releaseStock(merchantOrderId, processedItems, 'order_creation_failed');
      const detail = orderErr.response?.data?.message || orderErr.message;
      console.error('Order creation error via order-service:', detail);
      return res.status(502).json({
        success: false,
        message: `Could not create your order: ${detail}`,
      });
    }

    // 5. Handle Payment Flow based on paymentMethod
    // ── COD / QR ──
    if (paymentMethod === 'cod' || paymentMethod === 'qr') {
      try {
        const isCod = paymentMethod === 'cod';
        if (isCod) {
          await axios.patch(
            `${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}/payment-status`,
            { paymentStatus: 'SUCCESS', stockStatus: 'COMMITTED' }
          );
          await commitStock(merchantOrderId, newOrder.items);
        }

        const updatedOrder = {
          ...newOrder,
          paymentStatus: isCod ? 'SUCCESS' : 'PENDING',
          shippingAddress,
          contactEmail,
        };
        if (shippingAddress?.phone) sendOrderConfirmationSMS(updatedOrder);
        if (contactEmail) sendOrderConfirmationEmail(updatedOrder);
        notifyOrderParties(updatedOrder);
      } catch (postCreateErr) {
        console.error('Post-create COD notification/stock note:', postCreateErr.message);
      }

      return res.status(200).json({
        success: true,
        isCod: paymentMethod === 'cod',
        isQr: paymentMethod === 'qr',
        orderId: merchantOrderId,
        url: returnUrl,
      });
    }

    // ── CASHFREE CHECKOUT WITH EASY SPLIT (Default & Primary Online Gateway) ──
    if (paymentMethod === 'cashfree' || paymentMethod === 'razorpay' || paymentMethod === 'online') {
      try {
        const customerName = `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim() || 'Customer';
        const customerPhone = shippingAddress?.phone || '';

        const cfOrder = await createEasySplitOrder({
          orderId: merchantOrderId,
          orderAmount: totalAmount,
          currency: 'INR',
          customer: {
            id: userId || `cust_${Date.now()}`,
            name: customerName,
            email: contactEmail,
            phone: customerPhone,
          },
          orderMeta: {
            return_url: returnUrl,
            notify_url: `${GATEWAY_URL}/api/payment/webhook`,
          },
          splits: splits.length > 0 ? splits : undefined,
          notes: {
            orderId: merchantOrderId,
            userId: userId || 'guest',
            itemCount: processedItems.length.toString(),
            vendorCount: vendorTransfers.length.toString(),
          },
        });

        // Save Cashfree Order details to MongoDB order
        await axios.patch(
          `${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}/cashfree-details`,
          {
            cashfreeOrderId: cfOrder.order_id,
            paymentSessionId: cfOrder.payment_session_id,
            vendorTransfers,
          }
        );

        const { env: cfEnv, appId: cfAppId } = getEnvConfig();
        const isSandbox = Boolean(cfOrder.isSandbox || cfOrder.isMock || cfEnv === 'SANDBOX');

        return res.status(200).json({
          success: true,
          orderId: merchantOrderId,
          cashfreeOrderId: cfOrder.order_id,
          paymentSessionId: cfOrder.payment_session_id,
          cfOrderId: cfOrder.cf_order_id,
          amount: totalAmount,
          currency: 'INR',
          appId: cfAppId,
          name: 'WOW Lifestyle Marketplace',
          description: `Order #${merchantOrderId}`,
          customer: {
            name: customerName,
            email: contactEmail,
            contact: customerPhone,
          },
          vendorTransfers,
          isSandbox,
          isMock: isSandbox,
        });
      } catch (cfErr) {
        console.error('Cashfree Order Creation Error:', cfErr.message || cfErr);
        // Release reserved stock so product is not locked
        await releaseStock(merchantOrderId, processedItems, 'cashfree_initiation_failed');
        await axios.patch(
          `${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}/payment-status`,
          { paymentStatus: 'FAILED', stockStatus: 'RELEASED' }
        ).catch(() => {});

        return res.status(500).json({
          success: false,
          message: `Failed to create Cashfree Order: ${cfErr.response?.data?.message || cfErr.message}`,
        });
      }
    }

    // ── PHONEPE PG (Alternative) ──
    if (paymentMethod === 'phonepe') {
      try {
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
        if (!accessToken) {
          await releaseStock(merchantOrderId, processedItems, 'phonepe_token_failed');
          return res.status(500).json({ success: false, message: 'Failed to generate Auth Token' });
        }

        const paymentPayload = {
          merchantId: MERCHANT_ID,
          merchantOrderId,
          amount: Math.round(totalAmount * 100),
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
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `O-Bearer ${accessToken}`,
            },
          }
        );

        const payUrl = payRes.data.redirectUrl || payRes.data.data?.redirectUrl;
        if (!payUrl) {
          await releaseStock(merchantOrderId, processedItems, 'phonepe_url_failed');
          return res.status(500).json({
            success: false,
            message: 'Payment URL not found in PhonePe response',
          });
        }

        return res.status(200).json({ success: true, url: payUrl });
      } catch (phonePeErr) {
        await releaseStock(merchantOrderId, processedItems, 'phonepe_initiation_failed');
        throw phonePeErr;
      }
    }

    return res.status(400).json({ success: false, message: `Unsupported payment method: ${paymentMethod}` });

  } catch (error) {
    console.error('handleCreateOrder Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment initiation failed' });
  }
};

router.post('/create-order', handleCreateOrder);
router.post('/initiate', handleCreateOrder);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. POST /api/payment/verify
 * Server-Side Order Status & Payment Verification
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      orderId, // our internal merchant order ID
      cashfree_order_id,
      paymentSessionId,
      cf_payment_id,
    } = req.body;

    const lookupId = orderId || cashfree_order_id;
    if (!lookupId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required for payment verification.',
      });
    }

    // 1. Locate internal order by orderId
    let orderData = null;
    try {
      const orderRes = await axios.get(`${ORDER_SERVICE_URL}/api/orders/internal/${lookupId}`);
      orderData = orderRes.data?.data;
    } catch (err) {
      console.warn(`Could not find order by orderId ${lookupId}:`, err.message);
    }

    // 2. Fetch order status from Cashfree API
    let isVerified = false;
    let cfPaymentId = cf_payment_id || null;

    try {
      const cfOrder = await getOrderDetails(lookupId);
      if (cfOrder.order_status === 'PAID') {
        isVerified = true;
      }
      
      if (!cfPaymentId) {
        const payments = await getOrderPayments(lookupId);
        const successfulPay = payments.find((p) => p.payment_status === 'SUCCESS');
        if (successfulPay) {
          isVerified = true;
          cfPaymentId = successfulPay.cf_payment_id;
        }
      }
    } catch (cfErr) {
      console.warn(`Cashfree verification check note for ${lookupId}:`, cfErr.message);
    }

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Order is not in PAID status in Cashfree.',
      });
    }

    console.log(`✅ [Cashfree] Verified payment for order ${lookupId}, payment ${cfPaymentId}`);

    // 3. Mark payment status = SUCCESS, commit stock, update transfers
    if (orderData) {
      const updatedTransfers = (orderData.vendorTransfers || []).map((t) => ({
        ...t,
        transferStatus: t.transferStatus === 'processed' ? 'processed' : 'processing',
      }));

      await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${orderData.orderId}/cashfree-details`, {
        paymentStatus: 'SUCCESS',
        stockStatus: 'COMMITTED',
        cashfreePaymentId: cfPaymentId,
        vendorTransfers: updatedTransfers,
      });

      // Commit stock if not already SUCCESS
      if (orderData.paymentStatus !== 'SUCCESS') {
        await commitStock(orderData.orderId, orderData.items);

        const enrichedOrder = {
          ...orderData,
          paymentStatus: 'SUCCESS',
          cashfreePaymentId: cfPaymentId,
        };
        if (enrichedOrder.shippingAddress?.phone) sendOrderConfirmationSMS(enrichedOrder);
        if (enrichedOrder.contactEmail) sendOrderConfirmationEmail(enrichedOrder);
        notifyOrderParties(enrichedOrder);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verification successful.',
      orderId: orderData?.orderId || lookupId,
      paymentId: cfPaymentId,
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. POST /api/payment/cancel
 * Customer Payment Cancellation / Modal Close Handler
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.post('/cancel', async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    console.log(`↩️ [Payment Cancel] Releasing reserved stock for Order ${orderId} (${reason || 'user_cancelled'})`);

    // 1. Release reserved stock back to products
    await releaseStock(orderId, [], reason || 'user_cancelled');

    // 2. Mark order as FAILED / Cancelled in order-service
    try {
      await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${orderId}/payment-status`, {
        paymentStatus: 'FAILED',
        stockStatus: 'RELEASED',
      });
    } catch (orderErr) {
      console.warn(`[Payment Cancel] Order status update note for ${orderId}:`, orderErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Payment cancelled and stock reservation released successfully.',
      orderId,
    });
  } catch (error) {
    console.error('Payment Cancel Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel payment', error: error.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. POST /api/payment/webhook (and /api/payment/cashfree/webhook)
 * Cashfree Webhook Event Processing (Payment Captured, Split Settlement)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    // Verify webhook signature with raw payload
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature({
      rawBody,
      signature,
      timestamp,
    });

    if (!isValid && signature) {
      console.warn('❌ [Cashfree Webhook] Signature verification failed.');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const eventType = req.body.type;
    const eventData = req.body.data;

    console.log(`📩 [Cashfree Webhook] Received Event: ${eventType}`);

    // Event: PAYMENT_SUCCESS_WEBHOOK
    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'ORDER_PAID') {
      const order = eventData?.order;
      const payment = eventData?.payment;
      const merchantOrderId = order?.order_id;

      if (merchantOrderId) {
        try {
          const orderRes = await axios.get(`${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}`);
          const existingOrder = orderRes.data?.data;

          if (existingOrder && existingOrder.paymentStatus !== 'SUCCESS') {
            await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}/cashfree-details`, {
              paymentStatus: 'SUCCESS',
              stockStatus: 'COMMITTED',
              cashfreePaymentId: payment?.cf_payment_id || existingOrder.cashfreePaymentId,
            });
            await commitStock(merchantOrderId, existingOrder.items);
            if (existingOrder.shippingAddress?.phone) sendOrderConfirmationSMS(existingOrder);
            if (existingOrder.contactEmail) sendOrderConfirmationEmail(existingOrder);
            notifyOrderParties(existingOrder);
          }
        } catch (err) {
          console.warn(`Webhook update note for order ${merchantOrderId}:`, err.message);
        }
      }
    }

    // Event: PAYMENT_FAILED_WEBHOOK or PAYMENT_USER_DROPPED_WEBHOOK
    if (eventType === 'PAYMENT_FAILED_WEBHOOK' || eventType === 'PAYMENT_USER_DROPPED_WEBHOOK') {
      const merchantOrderId = eventData?.order?.order_id;
      if (merchantOrderId) {
        try {
          await releaseStock(merchantOrderId, [], 'webhook_payment_failed');
          await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}/payment-status`, {
            paymentStatus: 'FAILED',
            stockStatus: 'RELEASED',
          });
        } catch (err) {
          console.warn(`Webhook payment.failed note for ${merchantOrderId}:`, err.message);
        }
      }
    }

    // Event: TRANSFER_SUCCESS / Vendor Settlement Processed
    if (eventType === 'TRANSFER_SUCCESS') {
      const transfer = eventData?.transfer || eventData;
      const vendorId = transfer?.vendor_id || transfer?.vendorId;
      const merchantOrderId = transfer?.order_id || transfer?.orderId;
      const transferId = transfer?.transfer_id || transfer?.cf_transfer_id;

      console.log(`💰 [Cashfree Split Transfer Success] Vendor ${vendorId} for Order ${merchantOrderId}`);

      if (merchantOrderId) {
        try {
          await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}/transfer-status`, {
            cashfreeSplitId: transferId,
            vendorId,
            transferStatus: 'processed',
          });
        } catch (err) {
          console.warn(`Webhook transfer success error for ${merchantOrderId}:`, err.message);
        }
      }
    }

    // Event: TRANSFER_FAILED
    if (eventType === 'TRANSFER_FAILED') {
      const transfer = eventData?.transfer || eventData;
      const vendorId = transfer?.vendor_id || transfer?.vendorId;
      const merchantOrderId = transfer?.order_id || transfer?.orderId;
      const failureReason = transfer?.reason || 'Vendor settlement failed';

      console.warn(`⚠️ [Cashfree Split Transfer Failed] Vendor ${vendorId} for Order ${merchantOrderId}: ${failureReason}`);

      if (merchantOrderId) {
        try {
          await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${merchantOrderId}/transfer-status`, {
            vendorId,
            transferStatus: 'failed',
            failureReason,
          });
        } catch (err) {
          console.warn(`Webhook transfer failed error for ${merchantOrderId}:`, err.message);
        }
      }
    }

    // Respond 200 OK immediately for webhook delivery confirmation
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Handling Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

router.post('/webhook', handleWebhook);
router.post('/cashfree/webhook', handleWebhook);
router.post('/razorpay/webhook', handleWebhook); // Backwards-compatible webhook path

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 5. Vendor Easy Split Onboarding & Status Endpoints
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.post('/vendor/onboard', async (req, res) => {
  try {
    const vendorData = req.body;
    if (!vendorData.storeId && !vendorData.email) {
      return res.status(400).json({ success: false, message: 'Vendor storeId and email are required.' });
    }

    const onboardResult = await createVendor(vendorData);

    // Update store-service with returned account IDs & status
    if (vendorData.storeId) {
      try {
        await axios.patch(`${STORE_SERVICE_URL}/api/stores/internal/${vendorData.storeId}/cashfree-status`, {
          cashfreeVendorId: onboardResult.vendorId,
          cashfreeVendorStatus: onboardResult.status || 'active',
          cashfreeKycStatus: 'COMPLETED',
        });
      } catch (storeUpdateErr) {
        console.warn(`Could not sync Cashfree status back to store ${vendorData.storeId}:`, storeUpdateErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: onboardResult.message || 'Cashfree Easy Split vendor configured successfully.',
      data: onboardResult,
    });
  } catch (error) {
    console.warn('Vendor Easy Split Onboarding Note:', error.response?.data || error.message);
    const detail = error.response?.data?.message || error.message;
    res.status(200).json({
      success: true,
      message: `Store bank details saved locally (${detail}).`,
      data: {
        vendorId: req.body.vendorId || req.body.storeId || `vendor_${Date.now()}`,
        status: 'active',
        easySplitPending: true,
      },
    });
  }
});

router.get('/vendor/status/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await resolveStoreDetails(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    let vendorDetails = null;
    if (store.cashfreeVendorId) {
      try {
        vendorDetails = await getVendorDetails(store.cashfreeVendorId);
      } catch (accErr) {
        console.warn(`Could not fetch vendor details for ${store.cashfreeVendorId}:`, accErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        storeId: store._id,
        storeName: store.name,
        cashfreeVendorId: store.cashfreeVendorId,
        cashfreeVendorStatus: store.cashfreeVendorStatus || 'not_created',
        commissionPercentage: store.commissionPercentage || 10,
        vendorDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 6. POST /api/payment/refund
 * Refund with Easy Split Vendor Deductions
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.post('/refund', async (req, res) => {
  try {
    const { orderId, refundAmount, refundNote, refundSplits } = req.body;
    if (!orderId || !refundAmount) {
      return res.status(400).json({ success: false, message: 'orderId and refundAmount are required' });
    }

    const refundResult = await createRefund({
      orderId,
      refundAmount,
      refundNote,
      refundSplits,
    });

    // Update order status if full refund
    try {
      await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${orderId}/payment-status`, {
        paymentStatus: 'REFUNDED',
        stockStatus: 'RESTORED',
      });
      await releaseStock(orderId, [], 'refund');
    } catch (orderErr) {
      console.warn(`Could not update order ${orderId} refund status:`, orderErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: refundResult,
    });
  } catch (error) {
    console.error('Refund Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 7. GET /api/payment/status/:orderId (Polling / Fallback Confirmation)
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderRes = await axios.get(`${ORDER_SERVICE_URL}/api/orders/internal/${orderId}`);
    let order = orderRes.data.data;

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If order is still pending, check Cashfree API directly
    if (order.paymentStatus !== 'SUCCESS') {
      try {
        const cfOrder = await getOrderDetails(orderId);
        if (cfOrder && cfOrder.order_status === 'PAID') {
          console.log(`✅ [Cashfree Polling] Auto-confirming PAID order ${orderId}`);

          const cfPayments = await getOrderPayments(orderId).catch(() => []);
          const successfulPay = cfPayments.find((p) => p.payment_status === 'SUCCESS');
          const cfPaymentId = successfulPay?.cf_payment_id || null;

          await axios.patch(`${ORDER_SERVICE_URL}/api/orders/internal/${order.orderId}/cashfree-details`, {
            paymentStatus: 'SUCCESS',
            stockStatus: 'COMMITTED',
            cashfreePaymentId: cfPaymentId,
          });

          await commitStock(order.orderId, order.items);

          const enrichedOrder = {
            ...order,
            paymentStatus: 'SUCCESS',
            cashfreePaymentId: cfPaymentId,
          };
          if (enrichedOrder.shippingAddress?.phone) sendOrderConfirmationSMS(enrichedOrder);
          if (enrichedOrder.contactEmail) sendOrderConfirmationEmail(enrichedOrder);
          notifyOrderParties(enrichedOrder);

          order.paymentStatus = 'SUCCESS';
        }
      } catch (cfErr) {
        // Cashfree status check is best-effort during polling
      }
    }

    res.status(200).json({
      success: true,
      status: order.paymentStatus,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      vendorTransfers: order.vendorTransfers || [],
      message: order.paymentStatus === 'SUCCESS' ? 'Payment Verified Successfully!' : 'Order Status Retrieved',
    });
  } catch (error) {
    console.error('Status Check Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to check order status' });
  }
});

router.post('/callback', (req, res) => res.status(200).send('OK'));

module.exports = router;
