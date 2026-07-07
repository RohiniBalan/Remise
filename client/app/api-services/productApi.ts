import axios from 'axios';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const productApi = {
  // ── Public ──────────────────────────────────────────────────────────────────
  getAll: (params?: Record<string, string | number>) =>
    axios.get(`${BASE}/api/products`, { params }),

  getById: (id: string) =>
    axios.get(`${BASE}/api/products/${id}`),

  getByStore: (storeId: string, params?: Record<string, string | number>) =>
    axios.get(`${BASE}/api/products/store/${storeId}`, { params }),

  getCategories: () =>
    axios.get(`${BASE}/api/categories`),

  // ── Store Owner / Admin ──────────────────────────────────────────────────────
  create: (formData: FormData, token: string) =>
    axios.post(`${BASE}/api/products`, formData, { headers: auth(token) }),

  update: (id: string, formData: FormData, token: string) =>
    axios.put(`${BASE}/api/products/${id}`, formData, { headers: auth(token) }),

  delete: (id: string, token: string) =>
    axios.delete(`${BASE}/api/products/${id}`, { headers: auth(token) }),

  createCategory: (name: string, token: string) =>
    axios.post(`${BASE}/api/categories`, { name }, { headers: auth(token) }),

  deleteCategory: (id: string, token: string) =>
    axios.delete(`${BASE}/api/categories/${id}`, { headers: auth(token) }),
};
