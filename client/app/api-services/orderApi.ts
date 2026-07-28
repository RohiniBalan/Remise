import axios from 'axios';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const orderApi = {
  placeWholesaleOrder: (payload: any, token: string) =>
    axios.post(`${BASE}/api/orders/wholesale`, payload, { headers: auth(token) }),

  getMyWholesaleOrders: (buyerId: string, token: string) =>
    axios.get(`${BASE}/api/orders/buyer/${buyerId}`, { headers: auth(token) }),
};