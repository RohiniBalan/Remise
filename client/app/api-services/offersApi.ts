import axios from 'axios';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const offersApi = {
  create: (formData: FormData, token: string) =>
    axios.post(`${BASE}/api/offers`, formData, {
      headers: authHeaders(token)
    }),

  getNearby: (lat: number, lng: number, radius = 10) =>
    axios.get(`${BASE}/api/offers/nearby`, { params: { lat, lng, radius } }),

  getByStore: (storeId: string) =>
    axios.get(`${BASE}/api/offers/store/${storeId}`),

  getById: (id: string) =>
    axios.get(`${BASE}/api/offers/${id}`),

  update: (id: string, formData: FormData, token: string) =>
    axios.put(`${BASE}/api/offers/${id}`, formData, {
      headers: authHeaders(token)
    }),

  delete: (id: string, token: string) =>
    axios.delete(`${BASE}/api/offers/${id}`, { headers: authHeaders(token) }),

  placeOrder: (offerId: string, orderData: Record<string, any>) =>
    axios.post(`${BASE}/api/offers/${offerId}/order`, orderData),

  getMyOrders: (token: string, email?: string) =>
    axios.get(`${BASE}/api/offers/orders/my`, {
      headers: authHeaders(token),
      params: email ? { email } : {}
    }),

  getStoreOrders: (storeId: string, token: string) =>
    axios.get(`${BASE}/api/offers/orders/store/${storeId}`, { headers: authHeaders(token) }),

  updateOrderStatus: (orderId: string, status: string, token: string) =>
    axios.patch(`${BASE}/api/offers/orders/${orderId}/status`, { status }, { headers: authHeaders(token) }),
};
