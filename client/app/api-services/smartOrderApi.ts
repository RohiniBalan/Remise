import axios from 'axios';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface CartItem { name: string; brand?: string; quantity: string }

export const smartOrderApi = {
getNearbyStores: (lat: number, lng: number, radius = 10, storeType?: string) =>
  axios.get(`${BASE}/api/stores/nearby`, { params: { lat, lng, radius, storeType } }),

  // Orders placed against a store via Smart Order Comparison (order-service),
  // for the store dashboard's Orders tab to merge alongside OfferOrder-based orders.
  getStoreOrders: (storeId: string, token: string) =>
    axios.get(`${BASE}/api/orders/store/${storeId}`, { headers: { Authorization: `Bearer ${token}` } }),

  // Logged-in customer's own order history, for the "My Orders" page.
  getMyOrders: (userId: string, email: string, token?: string | null) =>
    axios.get(`${BASE}/api/orders/my-orders`, {
      params: { userId, email },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  matchCart: (items: CartItem[], storeIds: string[]) =>
    axios.post(`${BASE}/api/products/match-cart`, { items, storeIds }),

  placeOrder: (payload: {
    amount: number;
    cartItems: Array<{ id: string; title: string; price: number; quantity: number; image?: string | null }>;
    contactEmail: string;
    shippingAddress: Record<string, any>;
    userId?: string | null;
    storeId: string;
    storeName: string;
    deliveryMethod: 'pickup' | 'delivery';
    paymentMethod: 'cod' | 'qr';
  }, token?: string | null) =>
    axios.post(`${BASE}/api/payment/initiate`, {
      ...payload,
      billingAddress: payload.shippingAddress,
      redirectUrl: typeof window !== 'undefined' ? `${window.location.origin}/my-orders` : '/my-orders',
    }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),

  // Customer self-declares a QR payment as complete; optional screenshot proof.
  confirmQrPayment: (orderId: string, screenshot?: File | null) => {
    const fd = new FormData();
    if (screenshot) fd.append('screenshot', screenshot);
    return axios.patch(`${BASE}/api/orders/${orderId}/confirm-payment`, fd);
  },

  // Fetch structured invoice / bill data for a confirmed order
  getInvoice: (orderId: string) =>
    axios.get(`${BASE}/api/orders/${orderId}/invoice`),

  // URL for downloading the official PDF invoice
  getInvoicePdfUrl: (orderId: string) =>
    `${BASE}/api/orders/${orderId}/invoice/pdf`,

  // Store Owner: Generate unique delivery link for an order
  generateDeliveryLink: (orderId: string, payload: { deliveryPersonName?: string; deliveryPersonPhone?: string; notes?: string }, token: string) =>
    axios.post(`${BASE}/api/orders/${orderId}/delivery-link`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Store Owner: Set delivery mode (own_delivery, portal_delivery, self_arrange)
  setDeliveryMode: (orderId: string, payload: { mode: 'own_delivery' | 'portal_delivery' | 'self_arrange'; notes?: string }, token: string) =>
    axios.patch(`${BASE}/api/orders/${orderId}/delivery-mode`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Store Owner: Direct delivery status update
  updateDeliveryStatusDirect: (orderId: string, payload: { status: string; notes?: string }, token: string) =>
    axios.patch(`${BASE}/api/orders/${orderId}/delivery-status`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Delivery Person: Get delivery portal details via secure token
  getDeliveryPortalOrder: (token: string) =>
    axios.get(`${BASE}/api/orders/delivery-portal/${token}`),

  // Delivery Person: Update delivery status via token
  updateDeliveryPortalStatus: (token: string, payload: { status: string; note?: string; deliveryPersonName?: string; deliveryPersonPhone?: string }) =>
    axios.patch(`${BASE}/api/orders/delivery-portal/${token}/status`, payload),

  // Store Owner: Join / Update Remise Delivery Portal Network
  enrollDeliveryPortal: (payload: { enabled?: boolean; hasOwnDelivery?: boolean }, token: string) =>
    axios.patch(`${BASE}/api/stores/delivery-portal/enroll`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};


