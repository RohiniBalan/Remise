'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Loader2, PackageX, Circle, Star } from 'lucide-react';
import NavbarHome from '@/app/components-main/NavbarHome'; 

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

interface DisplayItem extends OrderItem {
  parentOrderId: string;
  displayStatus: string;
  orderDate: string;
  deliveryDate: string; 
}

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

      const response = await fetch(`http://localhost:5000/api/orders/my-orders?userId=${userId}&email=${email}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
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

  const displayItems: DisplayItem[] = orders.flatMap(order => 
    order.items.map(item => {
      const orderDateObj = new Date(order.createdAt);
      
      // Estimated delivery is Order Date + 5 days
      const deliveryDateObj = new Date(orderDateObj);
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 5);

      return {
        ...item,
        parentOrderId: order.orderId,
        // Using the REAL status from MongoDB modified by the admin
        displayStatus: order.orderStatus || 'Processing', 
        orderDate: orderDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        deliveryDate: deliveryDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
    })
  );

  // Apply Search AND Status Filters
  const filteredItems = displayItems.filter(item => {
    // 1. Check Search Query
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Check Status Filters
    let matchesStatus = true;
    if (statusFilters.length > 0) {
      matchesStatus = statusFilters.some(filter => {
        // Map UI filters to Backend Statuses
        if (filter === 'Cancelled') return item.displayStatus === 'Cancelled';
        if (filter === 'Delivered') return item.displayStatus === 'Delivered';
        if (filter === 'Returned') return item.displayStatus === 'Returned';
        if (filter === 'On the way') return item.displayStatus === 'Shipped' || item.displayStatus === 'Processing';
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

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-24 md:pt-32">
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
              ) : filteredItems.length === 0 ? (
                <div className={`p-16 text-center rounded-sm shadow-sm flex flex-col items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-[#111] border border-[#222]'}`}>
                  <PackageX className="text-gray-300 mb-4" size={64} />
                  <h3 className={`text-xl font-medium mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>No Orders Found</h3>
                  <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>Looks like you haven't placed any orders matching that filter.</p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const statusUI = getStatusUI(item.displayStatus, item.orderDate, item.deliveryDate);

                  return (
                    <div 
                      key={`${item.parentOrderId}-${idx}`} 
                      className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-6 rounded-sm shadow-sm border transition-colors hover:shadow-md cursor-pointer ${
                        theme === 'light' ? 'bg-white border-gray-100 hover:border-gray-200' : 'bg-[#111] border-[#222] hover:border-[#333]'
                      }`}
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white border border-gray-100 rounded">
                        <img src={item.image} alt={item.title} className="w-full h-full object-contain p-2" />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-start">
                        <h4 className={`text-sm font-medium line-clamp-2 mb-1 hover:text-blue-600 ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>
                          {item.title}
                        </h4>
                        <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <div className={`w-24 flex-shrink-0 flex sm:justify-center text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                        ₹{item.price.toLocaleString()}
                      </div>

                      <div className="sm:w-72 flex-shrink-0 flex flex-col justify-start gap-1">
                        <div className="flex items-center gap-2">
                          <Circle size={10} className={`fill-current ${statusUI.dot.replace('bg-', 'text-')}`} />
                          <span className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                            {statusUI.text}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {statusUI.subText}
                        </p>
                        
                        {item.displayStatus === 'Delivered' && (
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 flex items-center gap-1.5 w-fit">
                            <Star size={16} className="fill-blue-600" /> Rate & Review Product
                          </button>
                        )}
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