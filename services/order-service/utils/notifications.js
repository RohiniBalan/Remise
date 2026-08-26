const axios = require('axios');

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009';

const STORE_SERVICE_URL =
  process.env.STORE_SERVICE_URL || 'http://localhost:3007';

const sendNotification = async ({
  userId,
  title,
  body,
  url,
  storeId,
}) => {
  if (!userId) {
    console.log('[Order Notification] Missing userId');
    return;
  }

  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/internal/create`,
      {
        userId,
        title,
        body,
        url,
        storeId: storeId || null,
        type: 'order',
      }
    );

    console.log(`[Order Notification] Sent to user ${userId}`);
  } catch (error) {
    console.error(
      `[Order Notification] Failed for user ${userId}:`,
      error.response?.data || error.message
    );
  }
};

const notifyCustomerOrderParties = async (order) => {
  try {
    if (!order.storeId) {
      console.log('[Order Notification] No storeId');
      return;
    }

    console.log(
      '[Order Notification] Customer order:',
      order.orderId,
      'storeId:',
      order.storeId,
      'userId:',
      order.userId
    );

    // Find the supplier/store owner
    let store;

    try {
      const response = await axios.get(
        `${STORE_SERVICE_URL}/api/stores/internal/${order.storeId}`
      );

      store = response.data?.data;
    } catch (error) {
      console.error(
        '[Order Notification] Could not resolve store:',
        error.response?.data || error.message
      );
      return;
    }

    if (!store) {
      console.log('[Order Notification] Store not found');
      return;
    }

    const itemCount = order.items?.length || 0;

    // Notify supplier
    if (store.ownerId) {
      await sendNotification({
        userId: store.ownerId,
        title: `🛒 New order — ${order.orderId}`,
        body: `${itemCount} item${itemCount === 1 ? '' : 's'} · Rs ${order.totalAmount}`,
        url: '/store/dashboard',
        storeId: order.storeId,
      });
    }

    // Notify customer
    if (order.userId) {
      await sendNotification({
        userId: order.userId,
        title: `Order placed — ${order.orderId}`,
        body: `Your order from ${order.storeName || store.name} has been placed. Total: Rs ${order.totalAmount}`,
        url: '/my-orders',
        storeId: order.storeId,
      });
    }
  } catch (error) {
    console.error(
      '[Order Notification] Customer order notification error:',
      error.message
    );
  }
};

const notifyWholesaleOrderParties = async (order) => {
  try {
    if (!order.storeId) {
      console.log('[Wholesale Notification] No supplier storeId');
      return;
    }

    console.log(
      '[Wholesale Notification] Order:',
      order.orderId,
      'buyerId:',
      order.buyerId,
      'supplierStoreId:',
      order.storeId,
      'supplierRole:',
      order.supplierRole
    );

    // Resolve supplier store/home-business/wholesaler owner
    let supplier;

    try {
      const response = await axios.get(
        `${STORE_SERVICE_URL}/api/stores/internal/${order.storeId}`
      );

      supplier = response.data?.data;
    } catch (error) {
      console.error(
        '[Wholesale Notification] Could not resolve supplier:',
        error.response?.data || error.message
      );
      return;
    }

    if (!supplier) {
      console.log('[Wholesale Notification] Supplier not found');
      return;
    }

    const itemCount = order.items?.length || 0;

    // Notify supplier
    if (supplier.ownerId) {
      await sendNotification({
        userId: supplier.ownerId,
        title: `📦 New wholesale order — ${order.orderId}`,
        body: `${itemCount} item${itemCount === 1 ? '' : 's'} · Rs ${order.totalAmount} from ${order.buyerRole === 'store_owner' ? 'Store Owner' : 'Customer'}`,
        url: '/store/dashboard',
        storeId: order.storeId,
      });
    }

    // Notify store owner who placed the order
    if (order.buyerId) {
      await sendNotification({
        userId: order.buyerId,
        title: `Order placed — ${order.orderId}`,
        body: `Your order from ${order.storeName} has been placed. Total: Rs ${order.totalAmount}`,
        url: '/my-orders',
        storeId: order.storeId,
      });
    }
  } catch (error) {
    console.error(
      '[Wholesale Notification] Error:',
      error.message
    );
  }
};

module.exports = {
  notifyCustomerOrderParties,
  notifyWholesaleOrderParties,
};