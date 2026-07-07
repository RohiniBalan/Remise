'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ShoppingBag, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, Palette, Image as ImageIcon, X } from 'lucide-react';
import Layout from '../layout/layout';
import axios from 'axios';
import BestSellersSection, { BestSellerItem } from '../../components-sections/BestSellersSection'; 

const API_URL = "https://wow-lifebackend.onrender.com/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function BestSellersAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [items, setItems] = useState<BestSellerItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | number | null>(null);
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Simplified Form States
  const [newName, setNewName] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newColor, setNewColor] = useState('#831843');

  useEffect(() => {
    checkAuth();
    fetchConfig();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/bestsellers`);
      if (res.data.success) setItems(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return setSaveStatus({ type: 'error', message: 'Login required' });
    try {
      setIsSaving(true);
      const res = await axiosInstance.put('/bestsellers', { items });
      if (res.data.success) {
        setSaveStatus({ type: 'success', message: 'Saved successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to save' });
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Reset Modal
  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };

  // Confirm Reset from Modal
  const confirmReset = async () => {
    setIsResetModalOpen(false); // Close modal immediately
    try {
      setIsResetting(true);
      const res = await axiosInstance.post('/bestsellers/reset');
      if (res.data.success) setItems(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  // Cancel Reset
  const cancelReset = () => {
    setIsResetModalOpen(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newImgUrl) return;
    
    setItems(prev => [...prev, { 
      id: Date.now().toString(), 
      name: newName, 
      img: newImgUrl, 
      color: newColor 
    }]);
    
    setNewName(''); setNewImgUrl('');
  };

  // Trigger Delete Modal
  const handleDeleteItem = (id: string | number) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete from Modal
  const confirmDelete = () => {
    if (itemToDelete !== null) {
      setItems(prev => prev.filter(item => item.id !== itemToDelete));
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // Cancel Delete
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  if (isLoading) return <Layout><div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-[#D4AF37]" size={40}/></div></Layout>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Best Sellers Manager</h1>
            <p className="text-gray-500 text-sm">Manage the auto-expanding image carousel</p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'dark'|'light')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none">
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>

            <div className="flex bg-gray-200 rounded-lg p-1">
              <button onClick={() => setActiveTab('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 ${activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-600'}`}><Edit2 size={16}/> Edit</button>
              <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 ${activeTab === 'preview' ? 'bg-white shadow' : 'text-gray-600'}`}><Eye size={16}/> Preview</button>
            </div>

            {isAuthenticated && (
              <>
                <button onClick={handleResetClick} disabled={isResetting} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm flex gap-2 disabled:opacity-50">
                  {isResetting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16}/>} Reset
                </button>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex gap-2 disabled:opacity-50">
                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Changes
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

        {activeTab === 'preview' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <BestSellersSection theme={theme} isPreview={true} previewData={items} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2"><Plus size={18} className="text-[#D4AF37]" /> Add Item</h3>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><ShoppingBag size={14}/> Title</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="e.g. Marvel Avengers Set" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Palette size={14}/> Background Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-10 w-12 rounded cursor-pointer border-0 p-0" />
                      <input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg outline-none font-mono text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><ImageIcon size={14}/> Image URL</label>
                    <input type="text" value={newImgUrl} onChange={e => setNewImgUrl(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="/chars/toy.avif" />
                  </div>

                  <button type="submit" disabled={!isAuthenticated} className="w-full mt-2 py-3 bg-[#D4AF37] text-white font-bold rounded-lg hover:bg-[#b08d2c] transition-colors disabled:opacity-50">
                    Add Item
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {items.map((item, i) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center">
                  <div className="w-20 h-24 rounded-lg flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: item.color }}>
                    <div className="absolute inset-0 bg-black/20" />
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover relative z-10" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                    <p className="text-xs text-gray-400 mt-2 font-mono">{item.img}</p>
                  </div>

                  <button onClick={() => handleDeleteItem(item.id)} disabled={!isAuthenticated} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">No items added yet</div>
              )}
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-in fade-in zoom-in duration-200"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Item</h3>
                </div>
                <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6 pl-2">
                Are you sure you want to remove this item from your Best Sellers list? 
                This action will be saved immediately if you proceed.
              </p>
              
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={cancelDelete} 
                  className="px-5 py-2.5 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} /> Delete Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Reset Confirmation Modal */}
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-in fade-in zoom-in duration-200"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <RefreshCw size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Reset to Defaults</h3>
                </div>
                <button onClick={cancelReset} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6 pl-2">
                Are you sure you want to reset the Best Sellers list to its default items? 
                All your custom additions and changes will be lost immediately.
              </p>
              
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={cancelReset} 
                  className="px-5 py-2.5 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmReset} 
                  className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={18} /> Reset Items
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}