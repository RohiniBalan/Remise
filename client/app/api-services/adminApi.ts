import axios from 'axios';

const resolveApiUrl = () => {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  return 'https://wow-lifebackend.onrender.com/api';
};

const API_BASE = resolveApiUrl();

export interface DashboardRecentOrder {
  id: string;
  _id?: string;
  product: string;
  itemCount: number;
  customer: string;
  email: string;
  amount: string;
  rawAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  date: string;
}

export interface AdminDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  totalProducts: number;
  totalStoreOwners: number;
  totalWholesalers: number;
  totalHomeBusinesses: number;
  totalUsers: number;
  recentOrders?: DashboardRecentOrder[];
}

export const adminApi = {
  getDashboardStats: async (token: string): Promise<AdminDashboardStats> => {
    const cleanToken = token.replace(/['"]+/g, '').trim();
    const timestamp = Date.now();
    const response = await axios.get(`${API_BASE}/admin/stats?t=${timestamp}`, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },
};
