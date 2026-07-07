'use client';

import React, { useState } from 'react';
import Layout from '../layout/layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IndianRupee, 
  Package, 
  Users, 
  Gamepad2, 
  TrendingUp, 
  TrendingDown,
  ShoppingBag,
  MoreHorizontal
} from 'lucide-react';

// --- Mock Data for Toy Shop Dashboard ---
const recentOrders = [
  { id: '#ORD-7031', product: 'Ferrari F1 Ultimate Collector', customer: 'Rahul Sharma', amount: '₹12,499', status: 'Delivered', date: 'Today, 10:42 AM' },
  { id: '#ORD-7032', product: 'Robotic Coding Kit Pro', customer: 'Priya Patel', amount: '₹11,999', status: 'Processing', date: 'Today, 09:15 AM' },
  { id: '#ORD-7033', product: 'Magic Artist Studio Pro', customer: 'Amit Kumar', amount: '₹5,499', status: 'Shipped', date: 'Yesterday, 04:30 PM' },
  { id: '#ORD-7034', product: 'Premium LEGO Architecture', customer: 'Sneha Reddy', amount: '₹9,999', status: 'Delivered', date: 'Yesterday, 02:10 PM' },
  { id: '#ORD-7035', product: 'Interactive Globe Explorer', customer: 'Vikram Singh', amount: '₹6,499', status: 'Processing', date: 'Yesterday, 11:20 AM' },
];

const topProducts = [
  { name: 'AI Smart Companion Bot', category: 'Tech Toys', sales: 342, revenue: '₹30,77,658', trend: '+12%' },
  { name: 'Ferrari F1 Diecast', category: 'Collectibles', sales: 289, revenue: '₹36,12,211', trend: '+8%' },
  { name: 'LEGO Architecture', category: 'Building Blocks', sales: 256, revenue: '₹25,59,744', trend: '-3%' },
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
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening at WOW Lifestyle today.</p>
        </div>

        {/* 1. Key Metrics (Stat Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Revenue */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <IndianRupee size={24} />
              </div>
              <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp size={14} className="mr-1" /> +15.3%
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Revenue</h3>
            <div className="text-3xl font-black text-gray-900">₹24,56,890</div>
          </div>

          {/* Card 2: Orders */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Package size={24} />
              </div>
              <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp size={14} className="mr-1" /> +8.2%
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Orders</h3>
            <div className="text-3xl font-black text-gray-900">1,284</div>
          </div>

          {/* Card 3: Customers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Users size={24} />
              </div>
              <span className="flex items-center text-sm font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
                <TrendingDown size={14} className="mr-1" /> -2.4%
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Active Customers</h3>
            <div className="text-3xl font-black text-gray-900">8,439</div>
          </div>

          {/* Card 4: Products */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <Gamepad2 size={24} />
              </div>
              <span className="flex items-center text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                New: 12
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Products in Catalog</h3>
            <div className="text-3xl font-black text-gray-900">452</div>
          </div>

        </div>

        {/* 2. Main Content Grid (Charts & Lists) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Unique Custom Chart Area */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
                <p className="text-xs text-gray-500 mt-1">Last 7 Days Performance</p>
              </div>
              <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-yellow-500 font-medium text-gray-700 cursor-pointer">
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
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
              {topProducts.map((product, i) => (
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

            <button className="w-full mt-6 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors">
              View All Products
            </button>
          </div>

        </div>

        {/* 3. Recent Orders Table */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Order ID</th>
                  <th className="p-4 font-bold">Product</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {recentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono font-medium text-gray-900">{order.id}</td>
                    <td className="p-4 font-semibold text-gray-800">{order.product}</td>
                    <td className="p-4 text-gray-600">{order.customer}</td>
                    <td className="p-4 text-gray-500">{order.date}</td>
                    <td className="p-4 font-bold text-gray-900">{order.amount}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-1 text-gray-400 hover:text-gray-800 transition-colors rounded hover:bg-gray-200">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}