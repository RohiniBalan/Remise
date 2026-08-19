'use client';

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../layout/layout';
import { AuthContext } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IndianRupee, 
  Package, 
  Users, 
  Gamepad2, 
  TrendingUp, 
  ShoppingBag,
  MoreHorizontal,
  Store,
  Truck,
  Home,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { adminApi, AdminDashboardStats, DashboardRecentOrder } from '../../api-services/adminApi';

// --- Static Top Products & Chart Data ---
const fallbackTopProducts = [
  { name: 'AI Smart Companion Bot', category: 'Tech Toys', sales: 342, trend: '+12%' },
  { name: 'Ferrari F1 Diecast', category: 'Collectibles', sales: 289, trend: '+8%' },
  { name: 'LEGO Architecture', category: 'Building Blocks', sales: 256, trend: '-3%' },
];

const revenueData = [
  { label: 'Mon', value: 12500 },
  { label: 'Tue', value: 18200 },
  { label: 'Wed', value: 15400 },
  { label: 'Thu', value: 24600 },
  { label: 'Fri', value: 21800 },
  { label: 'Sat', value: 35500 },
  { label: 'Sun', value: 28900 },
];

// --- Custom Animated SVG Graph Component ---
const UniqueRevenueChart = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // SVG Canvas dimensions
  const width = 800;
  const height = 260;
  const padX = 30;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const maxVal = Math.max(...revenueData.map(d => d.value)) * 1.15; // Add 15% headroom above highest point

  // Calculate coordinates for each data point
  const points = revenueData.map((d, i) => {
    const x = padX + (i / (revenueData.length - 1)) * chartW;
    const y = padY + chartH - (d.value / maxVal) * chartH;
    return { x, y, ...d };
  });

  // Generate smooth bezier curve path for the line
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const cx1 = p1.x + (p2.x - p1.x) / 2;
    const cy1 = p1.y;
    const cx2 = p1.x + (p2.x - p1.x) / 2;
    const cy2 = p2.y;
    pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
  }

  // Generate the area fill path (closes the shape to the bottom)
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <div className="w-full h-full relative font-sans" style={{ minHeight: '300px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FCEEAC" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#b08d2c" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines */}
        {[0, 1, 2, 3].map((i) => {
          const y = padY + (chartH / 3) * i;
          return (
            <line key={i} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#f3f4f6" strokeWidth="1.5" strokeDasharray="5 5" />
          );
        })}

        {/* Animated Fill Area */}
        <motion.path
          d={areaD}
          fill="url(#gradientArea)"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        />

        {/* Animated Smooth Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Data Points and Interaction Areas */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Vertical hover line indicator */}
            {hoveredIdx === i && (
              <line x1={p.x} y1={padY} x2={p.x} y2={padY + chartH} stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            )}
            
            {/* Invisible hover catching area (makes it easier for mouse to trigger) */}
            <rect
              x={p.x - chartW / (points.length - 1) / 2}
              y={0}
              width={chartW / (points.length - 1)}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer outline-none"
            />

            {/* Node Dot */}
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 6 : 4}
              fill="#ffffff"
              stroke={hoveredIdx === i ? "#b08d2c" : "#D4AF37"}
              strokeWidth="3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="pointer-events-none drop-shadow-md transition-all duration-200"
            />
            
            {/* X-Axis Labels */}
            <text x={p.x} y={height - 2} textAnchor="middle" fontSize="12" fill={hoveredIdx === i ? "#111827" : "#9ca3af"} className="pointer-events-none font-bold transition-colors duration-200">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating Tooltip HTML Overlay */}
      <AnimatePresence>
        {hoveredIdx !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 pointer-events-none"
            style={{
              left: `calc(${(points[hoveredIdx].x / width) * 100}% - 42px)`,
              top: `calc(${(points[hoveredIdx].y / height) * 100}% - 48px)`,
            }}
          >
            <div className="bg-gray-900 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xl whitespace-nowrap relative border border-gray-700">
              ₹{points[hoveredIdx].value.toLocaleString()}
              {/* Tooltip pointer arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const ctx = useContext(AuthContext) as any;

  // Access control: only role === 'admin' may render this page.
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  // Dynamic Statistics State
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    totalProducts: 0,
    totalStoreOwners: 0,
    totalWholesalers: 0,
    totalHomeBusinesses: 0,
    totalUsers: 0,
    recentOrders: []
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<DashboardRecentOrder[]>([]);

  // 1. Auth Guard
  useEffect(() => {
    const token = ctx?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    const userStr = ctx?.user ? JSON.stringify(ctx.user) : (typeof window !== 'undefined' ? localStorage.getItem('user') : null);

    if (!token || !userStr) {
      router.replace('/admin/login');
      return;
    }

    try {
      const user = ctx?.user || JSON.parse(userStr);
      if (user?.role !== 'admin') {
        router.replace('/admin/login?error=not_admin');
        return;
      }
      setAuthorized(true);
    } catch {
      router.replace('/admin/login');
      return;
    } finally {
      setChecked(true);
    }
  }, [ctx, router]);

  // 2. Fetch Dynamic Dashboard Statistics
  const fetchDashboardStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const token = ctx?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '') || '';
      if (!token) {
        setStatsError('Authentication token not available');
        setIsLoadingStats(false);
        return;
      }

      const data = await adminApi.getDashboardStats(token);
      setStats({
        totalRevenue: data.totalRevenue ?? 0,
        totalOrders: data.totalOrders ?? 0,
        activeCustomers: data.activeCustomers ?? 0,
        totalProducts: data.totalProducts ?? 0,
        totalStoreOwners: data.totalStoreOwners ?? 0,
        totalWholesalers: data.totalWholesalers ?? 0,
        totalHomeBusinesses: data.totalHomeBusinesses ?? 0,
        totalUsers: data.totalUsers ?? 0,
      });

      if (data.recentOrders && Array.isArray(data.recentOrders)) {
        setRecentOrders(data.recentOrders);
      }
    } catch (err: any) {
      console.error('Error fetching admin statistics:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load real-time statistics';
      setStatsError(msg);
    } finally {
      setIsLoadingStats(false);
    }
  }, [ctx?.token]);

  useEffect(() => {
    if (authorized) {
      fetchDashboardStats();
    }
  }, [authorized, fetchDashboardStats]);

  // Avoid flashing dashboard content before role check resolves
  if (!checked || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  // Stat Card Configs (4 Existing + 4 New Cards)
  const statCards = [
    // 1. Existing: Total Revenue
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`,
      rawValue: stats.totalRevenue,
      tag: 'Live Sales',
      tagColor: 'text-emerald-600 bg-emerald-50',
      icon: IndianRupee,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    // 2. Existing: Total Orders
    {
      id: 'total-orders',
      title: 'Total Orders',
      value: (stats.totalOrders || 0).toLocaleString('en-IN'),
      rawValue: stats.totalOrders,
      tag: 'All Time',
      tagColor: 'text-blue-600 bg-blue-50',
      icon: Package,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    // 3. Existing: Active Customers
    {
      id: 'active-customers',
      title: 'Active Customers',
      value: (stats.activeCustomers || 0).toLocaleString('en-IN'),
      rawValue: stats.activeCustomers,
      tag: 'Retail Buyers',
      tagColor: 'text-purple-600 bg-purple-50',
      icon: Users,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    // 4. Existing: Products in Catalog
    {
      id: 'products-catalog',
      title: 'Products in Catalog',
      value: (stats.totalProducts || 0).toLocaleString('en-IN'),
      rawValue: stats.totalProducts,
      tag: 'Active Catalog',
      tagColor: 'text-yellow-700 bg-yellow-50',
      icon: Gamepad2,
      iconBg: 'bg-yellow-50 text-yellow-600',
    },
    // 5. NEW: Total Store Owners
    {
      id: 'store-owners',
      title: 'Total Store Owners',
      value: (stats.totalStoreOwners || 0).toLocaleString('en-IN'),
      rawValue: stats.totalStoreOwners,
      tag: 'Retailers',
      tagColor: 'text-indigo-600 bg-indigo-50',
      icon: Store,
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    // 6. NEW: Total Wholesalers
    {
      id: 'wholesalers',
      title: 'Total Wholesalers',
      value: (stats.totalWholesalers || 0).toLocaleString('en-IN'),
      rawValue: stats.totalWholesalers,
      tag: 'B2B Suppliers',
      tagColor: 'text-amber-700 bg-amber-50',
      icon: Truck,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    // 7. NEW: Total Home Businesses
    {
      id: 'home-businesses',
      title: 'Total Home Businesses',
      value: (stats.totalHomeBusinesses || 0).toLocaleString('en-IN'),
      rawValue: stats.totalHomeBusinesses,
      tag: 'Local Producers',
      tagColor: 'text-teal-700 bg-teal-50',
      icon: Home,
      iconBg: 'bg-teal-50 text-teal-600',
    },
    // 8. NEW: Total Users
    {
      id: 'total-users',
      title: 'Total Users',
      value: (stats.totalUsers || 0).toLocaleString('en-IN'),
      rawValue: stats.totalUsers,
      tag: 'Excluding Admins',
      tagColor: 'text-sky-700 bg-sky-50',
      icon: UserCheck,
      iconBg: 'bg-sky-50 text-sky-600',
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        
        {/* Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time business performance & platform analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardStats}
              disabled={isLoadingStats}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoadingStats ? 'animate-spin text-yellow-600' : 'text-gray-500'} />
              <span>{isLoadingStats ? 'Updating...' : 'Refresh Stats'}</span>
            </button>
          </div>
        </div>

        {/* Error Notification Banner */}
        <AnimatePresence>
          {statsError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-sm">Failed to load live statistics: </span>
                  <span className="text-sm">{statsError}</span>
                </div>
              </div>
              <button
                onClick={fetchDashboardStats}
                className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors ml-4 whitespace-nowrap"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Key Metrics (8 Stat Cards: 4 Existing + 4 New Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg} transition-transform group-hover:scale-110 duration-200`}>
                    <IconComponent size={24} />
                  </div>
                  <span className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${card.tagColor}`}>
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
                
                {isLoadingStats ? (
                  <div className="h-9 w-28 bg-gray-100 animate-pulse rounded-lg mt-1" />
                ) : (
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate" title={card.value}>
                    {card.value}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 2. Main Content Grid (Charts & Top Products) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Unique Custom Chart Area */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
                <p className="text-xs text-gray-500 mt-1">Performance Trend</p>
              </div>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Last 7 Days
              </span>
            </div>
            
            {/* The Custom Graph */}
            <div className="flex-1 w-full bg-white relative">
              <UniqueRevenueChart />
            </div>
          </div>

          {/* Right Column: Top Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={18} className="text-yellow-500" /> Top Selling Toys
              </h3>
            </div>
            
            <div className="space-y-6 flex-1">
              {fallbackTopProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center font-black text-yellow-600 border border-yellow-100 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                      #{i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{product.name}</h4>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-gray-900">{product.sales} sold</div>
                    <div className="text-xs text-green-600 font-medium">{product.trend}</div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => router.push('/admin/product')}
              className="w-full mt-6 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>View All Products</span>
              <ExternalLink size={14} />
            </button>
          </div>

        </div>

        {/* 3. Recent Orders Table */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
              <p className="text-xs text-gray-500 mt-0.5">Latest customer transactions from database</p>
            </div>
            <button 
              onClick={() => router.push('/admin/order-history')}
              className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ExternalLink size={14} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {isLoadingStats ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <RefreshCw size={28} className="animate-spin text-yellow-500 mb-3" />
                <p className="text-sm font-medium">Loading live orders...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Package size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-base font-semibold text-gray-700">No orders placed yet</p>
                <p className="text-xs text-gray-400 mt-1">When customers place orders, they will appear here in real-time.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Order ID</th>
                    <th className="p-4 font-bold">Product / Item</th>
                    <th className="p-4 font-bold">Customer</th>
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Amount</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {recentOrders.map((order, i) => (
                    <tr key={order.id || order._id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-medium text-gray-900">{order.id}</td>
                      <td className="p-4 font-semibold text-gray-800">
                        {order.product}
                        {order.itemCount > 1 && (
                          <span className="ml-2 text-xs text-gray-500 font-normal">
                            +{order.itemCount - 1} more
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="font-medium text-gray-800">{order.customer}</div>
                        {order.email && <div className="text-xs text-gray-400">{order.email}</div>}
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{order.date}</td>
                      <td className="p-4 font-bold text-gray-900">{order.amount}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'Delivered' 
                            ? 'bg-green-100 text-green-700' :
                          order.status === 'Processing' 
                            ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'Shipped' 
                            ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status === 'Delivered' && <CheckCircle2 size={12} />}
                          {order.status === 'Processing' && <Clock size={12} />}
                          {order.status === 'Cancelled' && <XCircle size={12} />}
                          <span>{order.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => router.push('/admin/order-history')}
                          className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-200"
                          title="View order details in Order History"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}