import axios from 'axios';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface CartItem { name: string; quantity: string }

export const smartOrderApi = {
  getNearbyStores: (lat: number, lng: number, radius = 10) =>
    axios.get(`${BASE}/api/stores/nearby`, { params: { lat, lng, radius } }),

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
};
