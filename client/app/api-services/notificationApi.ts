import axios from 'axios';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const notificationApi = {
  getVapidKey: () =>
    axios.get(`${BASE}/api/notifications/vapid-public-key`),

  subscribe: (subscription: PushSubscriptionJSON, lat: number, lng: number, token: string) =>
    axios.post(`${BASE}/api/notifications/subscribe`, { subscription, latitude: lat, longitude: lng }, {
      headers: authHeaders(token)
    }),

  updateLocation: (lat: number, lng: number, token: string) =>
    axios.put(`${BASE}/api/notifications/location`, { latitude: lat, longitude: lng }, {
      headers: authHeaders(token)
    }),

  getAll: (token: string) =>
    axios.get(`${BASE}/api/notifications`, { headers: authHeaders(token) }),

  markRead: (id: string, token: string) =>
    axios.patch(`${BASE}/api/notifications/${id}/read`, {}, { headers: authHeaders(token) }),

  markAllRead: (token: string) =>
    axios.patch(`${BASE}/api/notifications/read-all`, {}, { headers: authHeaders(token) }),
};
