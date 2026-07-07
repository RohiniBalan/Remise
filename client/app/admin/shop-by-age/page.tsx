'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, Image as ImageIcon, Type, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../layout/layout';
import axios from 'axios';
import ShopByAgeSection, { AgeGroupItem } from '../../components-sections/ShopByAgeSection'; 

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

const ICON_OPTIONS = ["Baby", "Star", "Building2", "Zap", "Sparkles", "Gauge", "Trophy", "Wand2"];
const GRADIENT_OPTIONS = [
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
  "from-amber-400 to-orange-600",
  "from-red-600 to-red-800",
  "from-fuchsia-500 to-purple-600",
  "from-orange-500 to-red-600",
  "from-slate-800 to-black",
  "from-purple-800 to-indigo-900"
];

export default function ShopByAgeAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [items, setItems] = useState<AgeGroupItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: () => {} });

  // Form States
  const [newLabel, setNewLabel] = useState('');
  const [newSub, setNewSub] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newGradient, setNewGradient] = useState(GRADIENT_OPTIONS[0]);
  const [newIcon, setNewIcon] = useState(ICON_OPTIONS[0]);

  useEffect(() => {
    checkAuth();
    fetchConfig();
  }, []);

  // Sync internal theme state with the local storage so the preview component reads it seamlessly
  useEffect(() => {
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
  }, [theme]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/shopbyage`);
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
      const res = await axiosInstance.put('/shopbyage', { items });
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

  const executeReset = async () => {
    try {
      setIsResetting(true);
      const res = await axiosInstance.post('/shopbyage/reset');
      if (res.data.success) {
        setItems(res.data.data);
        setSaveStatus({ type: 'success', message: 'Reset to defaults successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      console.error(error);
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
      message: 'Are you sure you want to restore the default age groups? This will overwrite your current changes.',
      action: executeReset
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newSub || !newImgUrl) return;
    
    setItems(prev => [...prev, { 
      id: Date.now().toString(), 
      label: newLabel, 
      sub: newSub, 
      img: newImgUrl, 
      gradient: newGradient,
      icon: newIcon
    }]);
    
    setNewLabel(''); setNewSub(''); setNewImgUrl('');
  };

  const executeDelete = (id: string | number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteClick = (id: string | number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Age Group',
      message: 'Are you sure you want to remove this age group? You must click "Save Changes" to apply this deletion to the database.',
      action: () => executeDelete(id)
    });
  };

  if (isLoading) return <Layout><div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-[#D4AF37]" size={40}/></div></Layout>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
        
        {/* CUSTOM CONFIRMATION MODAL */}
        <AnimatePresence>
          {confirmDialog.isOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[9998]" 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, top: '50%', left: '50%', x: '-50%', y: '-50%' }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="fixed z-[9999] bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-sm overflow-hidden border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <AlertCircle size={24} />
                  <h3 className="text-xl font-bold text-gray-900">{confirmDialog.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">{confirmDialog.message}</p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { confirmDialog.action(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} 
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm shadow-md shadow-red-600/20"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shop By Age Manager</h1>
            <p className="text-gray-500 text-sm">Manage the age group gradient cards</p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'dark'|'light')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none">
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>

            <div className="flex bg-gray-200 rounded-lg p-1">
              <button onClick={() => setActiveTab('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 transition-colors ${activeTab === 'edit' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}><Edit2 size={16}/> Edit</button>
              <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 transition-colors ${activeTab === 'preview' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}><Eye size={16}/> Preview</button>
            </div>

            {isAuthenticated && activeTab === 'edit' && (
              <>
                <button 
                  onClick={handleResetClick} 
                  disabled={isSaving || isResetting}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm flex gap-2 transition-colors disabled:opacity-50"
                >
                  {isResetting ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Reset
                </button>
                
                <button 
                  onClick={handleSave} 
                  disabled={isSaving || isResetting} 
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex gap-2 transition-colors disabled:opacity-50"
                >
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

        {/* PREVIEW TAB WITH SCROLLBAR REMOVAL */}
        {activeTab === 'preview' ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <Eye size={16} className="mr-2 text-blue-500" /> 
              <strong>Live Preview Mode</strong>
              <span className="ml-auto text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-100 hidden sm:inline-block">
                Scroll independently (Scrollbar hidden)
              </span>
            </div>
            
            <div className={`w-full h-[80vh] min-h-[600px] rounded-2xl shadow-inner border p-0 sm:p-4 overflow-hidden relative transition-colors duration-500 ${
              theme === 'dark' ? 'bg-neutral-950 border-gray-800' : 'bg-gray-200/50 border-gray-200'
            }`}>
               {/* Inner container specifically to allow scrolling while hiding the tracks */}
               <div className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar rounded-xl">
                 <ShopByAgeSection theme={theme} isPreview={true} previewData={items} />
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2"><Plus size={18} className="text-[#D4AF37]" /> Add Age Group</h3>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Type size={14}/> Age Range (Label)</label>
                    <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="e.g. 0-18 Months" />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><LayoutTemplate size={14}/> Subtitle</label>
                    <input type="text" value={newSub} onChange={e => setNewSub(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="e.g. Infant Care" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><ImageIcon size={14}/> Image URL</label>
                    <input type="text" value={newImgUrl} onChange={e => setNewImgUrl(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="/chars/masha.avif" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1">Gradient Theme</label>
                      <select value={newGradient} onChange={e => setNewGradient(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm">
                        {GRADIENT_OPTIONS.map(g => <option key={g} value={g}>{g.split(' ')[0].replace('from-', '')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1">Card Icon</label>
                      <select value={newIcon} onChange={e => setNewIcon(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm">
                        {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={!isAuthenticated} className="w-full mt-2 py-3 bg-[#D4AF37] text-white font-bold rounded-lg hover:bg-[#b08d2c] transition-colors disabled:opacity-50">
                    Add Category
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {items.map((item, i) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center">
                  <div className={`w-16 h-20 rounded-lg flex-shrink-0 relative overflow-hidden bg-gradient-to-b ${item.gradient}`}>
                    <img src={item.img} alt={item.label} className="w-full h-full object-contain p-2 relative z-10" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">Icon: {item.icon}</span>
                      <h4 className="font-bold text-gray-800 text-lg">{item.label}</h4>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{item.sub}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{item.img}</p>
                  </div>

                  {/* CONNECTED TO handleDeleteClick to trigger modal */}
                  <button 
                    onClick={() => handleDeleteClick(item.id)} 
                    disabled={!isAuthenticated} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">No categories added yet.</div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* GLOBAL CSS TO FORCE HIDE SCROLLBARS ON PREVIEW */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { 
          display: none !important; 
          width: 0 !important; 
          height: 0 !important; 
        }
        .no-scrollbar { 
          -ms-overflow-style: none !important; 
          scrollbar-width: none !important; 
        }
      `}</style>
    </Layout>
  );
}