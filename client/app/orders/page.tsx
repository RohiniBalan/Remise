'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Loader2, PackageX, Circle, Star } from 'lucide-react';
import NavbarHome from '@/app/components-main/NavbarHome';
import { smartOrderApi } from '@/app/api-services/smartOrderApi';

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface OrderData {
  _id: string;
  orderId: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: OrderItem[];
}

interface DisplayOrder extends OrderData {
  displayStatus: string;
  orderDate: string;
  deliveryDate: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Product-service stores uploaded-image URLs as relative paths
// (e.g. "/uploads/products/xxx.jpg"); AI-generated/external images are
// already absolute. Same prefixing rule as store/dashboard/page.tsx.
const resolveImageUrl = (image: string) =>
  !image ? '' : image.startsWith('http') || image.startsWith('data:') ? image : `${API}${image}`;

export default function MyOrdersPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('light'); 
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI Filters state
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [timeFilters, setTimeFilters] = useState<string[]>([]); // Optional: implement time filtering similar to status

  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail) setTheme(event.detail as 'dark' | 'light');
    };
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (currentTheme) setTheme(currentTheme);

    fetchMyOrders();

    return () => window.removeEventListener('theme-change', handleThemeChange as EventListener);
  }, []);

  const fetchMyOrders = async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      const userId = userData._id || userData.id || '';
      const email = userData.email || '';

      const token = localStorage.getItem('token');
      const response = await smartOrderApi.getMyOrders(userId, email, token);

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Checkbox Toggles
  const handleStatusToggle = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  // One card per order — all items placed together stay together.
  const displayOrders: DisplayOrder[] = orders.map(order => {
    const orderDateObj = new Date(order.createdAt);

    // Estimated delivery is Order Date + 5 days
    const deliveryDateObj = new Date(orderDateObj);
    deliveryDateObj.setDate(deliveryDateObj.getDate() + 5);

    return {
      ...order,
      // Using the REAL status from MongoDB modified by the admin
      displayStatus: order.orderStatus || 'Processing',
      orderDate: orderDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      deliveryDate: deliveryDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  });

  // Apply Search AND Status Filters
  const filteredOrders = displayOrders.filter(order => {
    // 1. Check Search Query — matches if ANY item in the order matches
    const matchesSearch = searchQuery.trim() === '' ||
      order.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Check Status Filters
    let matchesStatus = true;
    if (statusFilters.length > 0) {
      matchesStatus = statusFilters.some(filter => {
        // Map UI filters to Backend Statuses
        if (filter === 'Cancelled') return order.displayStatus === 'Cancelled';
        if (filter === 'Delivered') return order.displayStatus === 'Delivered';
        if (filter === 'Returned') return order.displayStatus === 'Returned';
        if (filter === 'On the way') return order.displayStatus === 'Shipped' || order.displayStatus === 'Processing';
        return false;
      });
    }

    return matchesSearch && matchesStatus;
  });

  // Dynamic UI formatting based on Real DB Status
  const getStatusUI = (status: string, orderDate: string, deliveryDate: string) => {
    if (status === 'Delivered') {
      return { dot: 'bg-green-600', text: `Delivered on ${deliveryDate}`, subText: 'Your item has been delivered.' };
    }
    if (status === 'Cancelled') {
      return { dot: 'bg-red-500', text: `Cancelled on ${orderDate}`, subText: 'Your order was cancelled.' };
    }
    if (status === 'Shipped') {
      return { dot: 'bg-blue-500', text: `Shipped, arriving by ${deliveryDate}`, subText: 'Your item is on the way.' };
    }
    // Default / Processing
    return { dot: 'bg-yellow-500', text: `Processing, expected by ${deliveryDate}`, subText: 'Your order is currently being packed.' };
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#f1f3f6]' : 'bg-[#0a0a0a]'} font-sans pb-12`}>
      <NavbarHome theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-[80px] sm:pt-[112px] lg:pt-[152px]">
        <div className={`flex items-center gap-2 text-xs mb-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push('/')}>Home</span>
          <ChevronRight size={12} />
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push('/profile')}>My Account</span>
          <ChevronRight size={12} />
          <span className={theme === 'light' ? 'text-gray-800 font-medium' : 'text-gray-200 font-medium'}>My Orders</span>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className={`hidden md:block w-64 flex-shrink-0 rounded-sm shadow-sm p-5 h-fit ${theme === 'light' ? 'bg-white' : 'bg-[#111] border border-[#222]'}`}>
            <h2 className={`text-lg font-medium mb-4 pb-3 border-b ${theme === 'light' ? 'text-gray-800 border-gray-200' : 'text-white border-[#333]'}`}>Filters</h2>
            <div className="mb-6">
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-gray-300'}`}>Order Status</h3>
              <div className="space-y-3">
                {['On the way', 'Delivered', 'Cancelled', 'Returned'].map(status => (
                  <label key={status} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={statusFilters.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>{status}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-gray-300'}`}>Order Time</h3>
              <div className="space-y-3">
                {['Last 30 days', '2024', '2023', 'Older'].map(time => (
                  <label key={time} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>{time}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className={`flex w-full mb-4 rounded-sm shadow-sm overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#111] border border-[#333]'}`}>
              <input 
                type="text" 
                placeholder="Search your orders here" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 px-4 py-3 outline-none text-sm ${theme === 'light' ? 'bg-white text-gray-800' : 'bg-[#111] text-white placeholder-gray-600'}`}
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors">
                <Search size={16} /> Search Orders
              </button>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className={`p-12 text-center rounded-sm shadow-sm flex flex-col items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-[#111] border border-[#222]'}`}>
                  <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                  <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Loading your orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className={`p-16 text-center rounded-sm shadow-sm flex flex-col items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-[#111] border border-[#222]'}`}>
                  <PackageX className="text-gray-300 mb-4" size={64} />
                  <h3 className={`text-xl font-medium mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>No Orders Found</h3>
                  <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>Looks like you haven't placed any orders matching that filter.</p>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const statusUI = getStatusUI(order.displayStatus, order.orderDate, order.deliveryDate);

                  return (
                    <div
                      key={order.orderId}
                      className={`rounded-sm shadow-sm border transition-colors hover:shadow-md ${
                        theme === 'light' ? 'bg-white border-gray-100 hover:border-gray-200' : 'bg-[#111] border-[#222] hover:border-[#333]'
                      }`}
                    >
                      {/* Order-level header: one per order, not per item */}
                      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b ${
                        theme === 'light' ? 'border-gray-100 bg-gray-50' : 'border-[#222] bg-[#0c0c0c]'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <Circle size={10} className={`fill-current ${statusUI.dot.replace('bg-', 'text-')}`} />
                            <span className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                              {statusUI.text}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {statusUI.subText}
                          </p>
                        </div>
                        <div className={`flex items-center gap-4 text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                          <span>Order #{order.orderId}</span>
                          <span>Placed {order.orderDate}</span>
                          <span className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                            ₹{order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* All items from this single order, grouped in one card */}
                      <div className={`divide-y ${theme === 'light' ? 'divide-gray-100' : 'divide-[#222]'}`}>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="px-4 sm:px-6 py-2.5 flex items-center gap-3">
                            <div className="w-12 h-12 flex-shrink-0 bg-white border border-gray-100 rounded overflow-hidden">
                              <img src={resolveImageUrl(item.image)} alt={item.title} className="w-full h-full object-contain p-1" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium truncate ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>
                                {item.title}
                              </h4>
                              <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                Qty: {item.quantity}
                              </p>
                            </div>

                            <div className={`text-sm font-medium flex-shrink-0 ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                              ₹{item.price.toLocaleString()}
                            </div>

                            {order.displayStatus === 'Delivered' && (
                              <button
                                title="Rate & Review Product"
                                className="text-blue-600 hover:text-blue-700 flex-shrink-0 p-1"
                              >
                                <Star size={16} className="fill-blue-600" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}