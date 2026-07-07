'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Package, Search, RotateCcw, CheckCircle2, Clock, 
  XCircle, Eye, X, Loader2, User as UserIcon, Mail, Phone, AlertCircle 
} from 'lucide-react';
import Layout from '../layout/layout';

// Define your backend API URL here
const API_URL = "https://wow-lifebackend.onrender.com/api";

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
  userId?: { _id: string; fullname: string; };
  contactEmail: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: any;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token')?.replace(/['"]+/g, '') || '';
      // Updated fetch URL
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // --- NEW: Handle Status Update ---
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')?.replace(/['"]+/g, '') || '';
      // Updated fetch URL
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showNotification('Order status updated successfully!', 'success');
        // Update local state instantly
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
        }
      } else {
        showNotification(data.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Server error while updating status', 'error');
    }
  };

  const filteredOrders = orders.filter(o => 
    (o.orderId && o.orderId.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (o.contactEmail && o.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (o.userId?.fullname && o.userId.fullname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Success</span>;
      case 'PENDING': return <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-bold border border-yellow-200 flex items-center gap-1 w-fit"><Clock size={12}/> Pending</span>;
      case 'FAILED': return <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200 flex items-center gap-1 w-fit"><XCircle size={12}/> Failed</span>;
      default: return <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">{status}</span>;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
        
        {/* Toast */}
        <AnimatePresence>
          {toast.show && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-6 right-6 z-[80] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg font-medium text-white ${toast.type === 'success' ? 'bg-green-600 shadow-green-500/20' : 'bg-red-600 shadow-red-500/20'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order History</h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">View and manage all customer orders and statuses.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by Order ID, Email, or User Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
              />
            </div>
            <button onClick={fetchOrders} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium text-sm">
               <RotateCcw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Order ID</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Customer Info</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Payment</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Order Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><Loader2 size={32} className="animate-spin mx-auto mb-3 text-blue-600" />Fetching Orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-16 text-center"><Package size={48} className="mb-4 opacity-50 mx-auto text-gray-400" /><p className="text-base font-medium text-gray-900">No orders found</p></td></tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{order.orderId}</p>
                        <p className="text-[10px] text-gray-500 font-semibold mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="font-bold text-blue-600 flex items-center gap-1.5"><UserIcon size={12}/> {order.userId?.fullname || `${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}`}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{order.contactEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-black text-gray-900">₹{order.totalAmount?.toLocaleString()}</span>
                          {getPaymentBadge(order.paymentStatus)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {/* DYNAMIC STATUS DROPDOWN */}
                        <select 
                          value={order.orderStatus} 
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className={`text-xs font-bold border rounded-md px-2 py-1 outline-none cursor-pointer transition-colors ${
                            order.orderStatus === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200 focus:border-green-500' :
                            order.orderStatus === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:border-blue-500' :
                            order.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200 focus:border-red-500' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200 focus:border-yellow-500'
                          }`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors ml-auto">
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col relative z-10 overflow-hidden" >
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between sticky top-0">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-0.5">{selectedOrder.orderId}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2"><UserIcon size={14}/> Shipping Info</h3>
                      <p className="font-bold text-gray-900">{selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}</p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{selectedOrder.shippingAddress?.address}</p>
                      <p className="text-sm text-gray-600 font-medium">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pinCode}</p>
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        <p className="text-xs font-bold text-gray-800 flex items-center gap-2"><Phone size={12} className="text-blue-500"/> {selectedOrder.shippingAddress?.phone}</p>
                        <p className="text-xs font-bold text-gray-800 flex items-center gap-2"><Mail size={12} className="text-blue-500"/> {selectedOrder.contactEmail}</p>
                      </div>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2"><CheckCircle2 size={14}/> Status & Payment</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 font-medium">Order Status:</span> 
                          {/* Modal Status Update Dropdown */}
                          <select 
                            value={selectedOrder.orderStatus} 
                            onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                            className="text-xs font-bold border border-gray-300 rounded-md px-2 py-1 outline-none bg-white text-gray-800 focus:border-blue-500"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-xs text-gray-500 font-medium">Payment:</span> 
                          {getPaymentBadge(selectedOrder.paymentStatus)}
                        </div>
                      </div>
                      <div className="h-px w-full bg-gray-200 my-4" />
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Grand Total</span>
                        <span className="text-2xl font-black text-gray-900">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Items Ordered ({selectedOrder.items?.length || 0})</h3>
                    <div className="space-y-3">
                      {selectedOrder.items && selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl">
                          <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 p-1 flex-shrink-0"><img src={item.image} className="w-full h-full object-contain" alt={item.title} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{item.title}</p>
                            <p className="text-[10px] font-bold text-blue-500 mt-0.5">QTY: {item.quantity} × ₹{item.price}</p>
                          </div>
                          <div className="text-right"><p className="font-black text-gray-900 text-sm">₹{(item.price * item.quantity).toLocaleString()}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}