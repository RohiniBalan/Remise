import axios from 'axios';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const storeApi = {
  register: (formData: FormData, token: string) =>
    axios.post(`${BASE}/api/stores`, formData, {
      headers: authHeaders(token)   // let axios set Content-Type + boundary automatically
    }),

  getMyStore: (token: string) =>
    axios.get(`${BASE}/api/stores/me/my-store`, { headers: authHeaders(token) }),

  getById: (id: string) =>
    axios.get(`${BASE}/api/stores/${id}`),

  update: (id: string, formData: FormData, token: string) =>
    axios.put(`${BASE}/api/stores/${id}`, formData, {
      headers: authHeaders(token)
    }),

  getAll: () =>
    axios.get(`${BASE}/api/stores`),
};
