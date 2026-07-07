'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Search, RotateCcw, Users, Shield, User as UserIcon, 
  CheckCircle2, AlertCircle, Mail, Phone, Loader2
} from 'lucide-react';
import Layout from '../layout/layout'; // Importing your centralized Admin Layout

// Define your backend API URL here
const API_URL = "https://wow-lifebackend.onrender.com/api";

// --- Types ---
interface UserData {
  _id: string;
  fullname: string;
  email: string;
  mobilenumber: string;
  role: string;
  createdAt: string;
  avatar?: string;
  googleId?: string;
}

export default function AdminUserManagementPage() {
  const router = useRouter();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, message: '', type: 'success' 
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;
      
      const timestamp = new Date().getTime();
      // Updated fetch URL
      const response = await fetch(`${API_URL}/admin/users?t=${timestamp}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        let usersArray: UserData[] = [];
        if (Array.isArray(data)) usersArray = data;
        else if (data?.users && Array.isArray(data.users)) usersArray = data.users;
        else if (data?.data && Array.isArray(data.data)) usersArray = data.data;

        setUsers(usersArray.reverse()); 
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const filteredUsers = users.filter(user => 
    (user.fullname?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.mobilenumber || '').includes(searchTerm)
  );

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <Layout>
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className={`fixed top-6 right-6 z-[80] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg font-medium text-white ${toast.type === 'success' ? 'bg-green-600 shadow-green-500/20' : 'bg-red-600 shadow-red-500/20'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage all registered users in your system.</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Users size={16} /> Total Users: {users.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Action Bar */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, email, or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50"
              />
            </div>
            
            <button 
              onClick={fetchUsers} 
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
               <RotateCcw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={32} className="animate-spin text-indigo-600" />
                        <span>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Users size={48} className="mb-4 opacity-50" />
                        <p className="text-base font-medium text-gray-900 mb-1">No users found</p>
                        <p className="text-xs">Try adjusting your search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.fullname} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-sm">
                              {getInitials(user.fullname)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{user.fullname || 'Unnamed User'}</p>
                            {user.googleId && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 mt-1 inline-block">Google Auth</span>}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-gray-600 text-xs">
                            <Mail size={14} className="text-gray-400" />
                            {user.email}
                          </div>
                          {user.mobilenumber ? (
                            <div className="flex items-center gap-2 text-gray-600 text-xs">
                              <Phone size={14} className="text-gray-400" />
                              {user.mobilenumber}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                              <Phone size={14} className="opacity-50" /> Not provided
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          user.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {user.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}