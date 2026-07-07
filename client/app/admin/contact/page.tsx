'use client';

import React, { useState, useEffect } from 'react';
import { Save, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, MapPin, Phone, Mail, Clock, Type, MessageSquare, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../layout/layout';
import axios from 'axios';
import ContactPage, { ContactData } from '../../../app/services/ContactPage'; 

// FIX: Pointing to your local backend for testing!
// Change port 5000 if your node server runs on a different port.
const API_URL = "https://wow-lifebackend.onrender.com/api";



const axiosInstance = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interface for submitted contact messages
interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export default function ContactAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'messages'>('edit');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [data, setData] = useState<ContactData>({
    title: "", subtitle: "", email: "", phone: "", address: "",
    hoursWeekday: "", hoursSaturday: "", hoursSunday: ""
  });

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: () => {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get('/contact');
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
      setSaveStatus({ type: 'error', message: 'Failed to connect to backend server. Make sure it is running locally!' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const res = await axiosInstance.get('/contact/messages');
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setSaveStatus({ type: 'error', message: 'Failed to load messages from server.' });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleTabChange = (tab: 'edit' | 'preview' | 'messages') => {
    setActiveTab(tab);
    if (tab === 'messages') {
      fetchMessages();
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return setSaveStatus({ type: 'error', message: 'Login required' });
    try {
      setIsSaving(true);
      const res = await axiosInstance.put('/contact', data);
      if (res.data.success) {
        setSaveStatus({ type: 'success', message: 'Saved successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus({ type: 'error', message: 'Failed to save. Is your backend running locally?' });
    } finally {
      setIsSaving(false);
    }
  };

  const executeReset = async () => {
    try {
      setIsResetting(true);
      const res = await axiosInstance.post('/contact/reset');
      if (res.data.success) {
        setData(res.data.data);
        setSaveStatus({ type: 'success', message: 'Reset successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to reset connection to server.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetClick = () => {
    if (!isAuthenticated) return setSaveStatus({ type: 'error', message: 'Login required' });
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Configuration',
      message: 'Are you sure you want to restore the default contact settings? This will overwrite your current changes.',
      action: executeReset
    });
  };

  const handleChange = (field: keyof ContactData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <Layout><div className="min-h-screen flex flex-col justify-center items-center gap-4"><Loader2 className="animate-spin text-blue-500" size={40}/><p className="text-gray-500 font-medium">Connecting to Backend...</p></div></Layout>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
        
        {/* CUSTOM CONFIRMATION MODAL */}
        <AnimatePresence>
          {confirmDialog.isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[9998]" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} />
              <motion.div initial={{ opacity: 0, scale: 0.95, top: '50%', left: '50%', x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed z-[9999] bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-sm overflow-hidden border border-gray-100">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <AlertCircle size={24} />
                  <h3 className="text-xl font-bold text-gray-900">{confirmDialog.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">{confirmDialog.message}</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm">Cancel</button>
                  <button onClick={() => { confirmDialog.action(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm shadow-md shadow-red-600/20">Confirm</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Page Manager</h1>
            <p className="text-gray-500 text-sm">Manage business info and view inquiries</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'dark'|'light')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none hidden md:block">
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
            
            <div className="flex bg-gray-200 rounded-lg p-1 mr-2">
              <button onClick={() => handleTabChange('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 ${activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-600'}`}><Edit2 size={16}/> Edit</button>
              <button onClick={() => handleTabChange('preview')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 ${activeTab === 'preview' ? 'bg-white shadow' : 'text-gray-600'}`}><Eye size={16}/> Preview</button>
              <button onClick={() => handleTabChange('messages')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 ${activeTab === 'messages' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}><Inbox size={16}/> Messages</button>
            </div>

            {isAuthenticated && activeTab === 'edit' && (
              <>
                <button onClick={handleResetClick} disabled={isSaving || isResetting} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium flex gap-2">
                  {isResetting ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Reset
                </button>
                <button onClick={handleSave} disabled={isSaving || isResetting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save
                </button>
              </>
            )}
          </div>
        </div>

        {saveStatus.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${saveStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {saveStatus.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
            <span className="font-medium text-sm">{saveStatus.message}</span>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Inbox size={20} className="text-blue-500"/> Customer Inquiries</h2>
              <button onClick={fetchMessages} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <RefreshCw size={14} className={isLoadingMessages ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {isLoadingMessages ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={30}/></div>
              ) : messages.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No messages received yet.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">Contact</th>
                      <th className="p-4 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {messages.map((msg) => (
                      <tr key={msg._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-900">{msg.name}</td>
                        <td className="p-4 text-sm text-gray-600">
                          <div>{msg.email}</div>
                          <div className="text-gray-400 text-xs mt-1">{msg.phone}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-700 max-w-md">
                          <p className="truncate hover:whitespace-normal hover:bg-gray-100 p-1 rounded transition-all cursor-default">
                            {msg.message}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW TAB */}
        {activeTab === 'preview' && (
          <div className={`rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'}`}>
             <div className="w-full max-w-5xl">
               <ContactPage isOpen={true} onClose={() => {}} isDarkMode={theme === 'dark'} isPreview={true} previewData={data} />
             </div>
          </div>
        )}

        {/* EDIT TAB */}
        {activeTab === 'edit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2"><Type size={18} className="text-blue-500"/> Header Text</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                    <input type="text" value={data.title} onChange={e => handleChange('title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Subtitle</label>
                    <input type="text" value={data.subtitle} onChange={e => handleChange('subtitle', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <h3 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2 mt-8"><Mail size={18} className="text-blue-500"/> Contact Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                      <input type="email" value={data.email} onChange={e => handleChange('email', e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                      <input type="text" value={data.phone} onChange={e => handleChange('phone', e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Hours */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2"><MapPin size={18} className="text-blue-500"/> Location</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Physical Address</label>
                  <textarea value={data.address} onChange={e => handleChange('address', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>

                <h3 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2 mt-8"><Clock size={18} className="text-blue-500"/> Business Hours</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Monday - Friday</label>
                    <input type="text" value={data.hoursWeekday} onChange={e => handleChange('hoursWeekday', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="9:00 AM - 8:00 PM" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Saturday</label>
                    <input type="text" value={data.hoursSaturday} onChange={e => handleChange('hoursSaturday', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10:00 AM - 6:00 PM" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Sunday</label>
                    <input type="text" value={data.hoursSunday} onChange={e => handleChange('hoursSunday', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Closed" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}