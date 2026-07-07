'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, Type, ImageIcon, Star, MessageSquare, LayoutTemplate, StarHalf } from 'lucide-react';
import Layout from '../layout/layout';
import axios from 'axios';
import EnhancedTestimonials from '../../../app/testimonials/page'; 

const API_URL = "https://wow-lifebackend.onrender.com/api";
const axiosInstance = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function TestimonialsAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editSection, setEditSection] = useState<'reviews' | 'page'>('reviews');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [data, setData] = useState<any>({
    reviews: [], hero: {}, spotlight: {}, cta: {}
  });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: () => {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // Form States
  const [revName, setRevName] = useState('');
  const [revRole, setRevRole] = useState('');
  const [revText, setRevText] = useState('');
  const [revImage, setRevImage] = useState('');
  const [revRating, setRevRating] = useState(5);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/enhanced-testimonials`);
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
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
      
      // Clean the payload to avoid sending Mongoose internal fields (_id, __v) back to the server
      const payload = {
        reviews: data.reviews,
        hero: data.hero,
        spotlight: data.spotlight,
        cta: data.cta
      };

      const res = await axiosInstance.put('/enhanced-testimonials', payload);
      
      if (res.data.success) {
        setSaveStatus({ type: 'success', message: 'Saved successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      console.error(error);
      setSaveStatus({ type: 'error', message: 'Failed to save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  const executeReset = async () => {
    try {
      setIsResetting(true);
      const res = await axiosInstance.post('/enhanced-testimonials/reset');
      if (res.data.success) {
        setData(res.data.data);
        setSaveStatus({ type: 'success', message: 'Reset successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to reset' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetClick = () => {
    if (!isAuthenticated) return setSaveStatus({ type: 'error', message: 'Login required' });
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Configuration',
      message: 'Are you sure you want to restore default reviews and page settings? This action cannot be undone.',
      action: executeReset
    });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName || !revText) return;
    
    setData((prev: any) => ({
      ...prev,
      reviews: [...prev.reviews, {
        id: Date.now().toString(),
        name: revName,
        role: revRole || "Customer",
        text: revText,
        image: revImage || `https://i.pravatar.cc/150?u=${revName.replace(/\s+/g, '')}`,
        rating: revRating
      }]
    }));
    
    setRevName(''); setRevRole(''); setRevText(''); setRevImage(''); setRevRating(5);
  };

  const executeDeleteReview = (id: string) => {
    setData((prev: any) => ({ ...prev, reviews: prev.reviews.filter((r: any) => r.id !== id) }));
  };

  const handleDeleteReviewClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Review',
      message: 'Are you sure you want to remove this review? Note: You must click "Save Changes" to update the database.',
      action: () => executeDeleteReview(id)
    });
  };

  const handlePageSettingChange = (section: 'hero' | 'spotlight' | 'cta', field: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  if (isLoading) return <Layout><div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-[#D4AF37]" size={40}/></div></Layout>;

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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enhanced Testimonials</h1>
            <p className="text-gray-500 text-sm">Manage infinite marquee reviews and page layout</p>
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
                <button onClick={handleResetClick} disabled={isSaving || isResetting} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                  {isResetting ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Reset
                </button>
                <button onClick={handleSave} disabled={isSaving || isResetting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative" style={{ height: '800px', overflowY: 'auto' }}>
            <EnhancedTestimonials isPreview={true} previewData={data} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button onClick={() => setEditSection('reviews')} className={`flex-1 py-4 text-center font-bold text-sm flex justify-center items-center gap-2 ${editSection === 'reviews' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-yellow-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
                <StarHalf size={16}/> Manage Marquee Reviews
              </button>
              <button onClick={() => setEditSection('page')} className={`flex-1 py-4 text-center font-bold text-sm flex justify-center items-center gap-2 ${editSection === 'page' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-yellow-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
                <LayoutTemplate size={16}/> Page Settings
              </button>
            </div>

            <div className="p-6">
              
              {/* REVIEWS EDITOR */}
              {editSection === 'reviews' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 sticky top-6">
                      <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2"><Plus size={18} className="text-[#D4AF37]" /> Add Review</h3>
                      <form onSubmit={handleAddReview} className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Type size={14}/> Customer Name</label>
                          <input type="text" value={revName} onChange={e => setRevName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="e.g. Sarah Jenkins" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Type size={14}/> Role</label>
                            <input type="text" value={revRole} onChange={e => setRevRole(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="e.g. Parent" />
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Star size={14}/> Rating</label>
                            <select value={revRating} onChange={e => setRevRating(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]">
                              {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><MessageSquare size={14}/> Review Quote</label>
                          <textarea value={revText} onChange={e => setRevText(e.target.value)} required rows={3} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none" placeholder="The Gold-Foil wrapping was beautiful..." />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><ImageIcon size={14}/> Avatar URL (Optional)</label>
                          <input type="text" value={revImage} onChange={e => setRevImage(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="Leave blank to auto-generate" />
                        </div>
                        <button type="submit" disabled={!isAuthenticated} className="w-full mt-2 py-3 bg-[#D4AF37] text-white font-bold rounded-lg hover:bg-[#b08d2c] transition-colors disabled:opacity-50">
                          Add to Marquee
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4 max-h-[800px] overflow-y-auto pr-2">
                    {data.reviews.map((item: any) => (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm border p-4 flex gap-4 items-center border-gray-200">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">{item.rating} <Star size={10} fill="currentColor"/></span>
                          </div>
                          <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-2">{item.role}</p>
                          <p className="text-sm text-gray-600 italic line-clamp-2">"{item.text}"</p>
                        </div>
                        <button onClick={() => handleDeleteReviewClick(item.id)} disabled={!isAuthenticated} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    {data.reviews.length === 0 && (
                      <div className="py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">No reviews added yet. These will appear in the 3-row marquee.</div>
                    )}
                  </div>
                </div>
              )}

              {/* PAGE SETTINGS EDITOR */}
              {editSection === 'page' && (
                <div className="max-w-4xl mx-auto space-y-10">
                  
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2"><LayoutTemplate size={20} className="text-[#D4AF37]"/> Top Hero Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 block mb-1">Badge Text</label>
                        <input type="text" value={data.hero?.badge || ''} onChange={e => handlePageSettingChange('hero', 'badge', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Main Title</label>
                        <input type="text" value={data.hero?.title || ''} onChange={e => handlePageSettingChange('hero', 'title', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Title Highlight (Gold text)</label>
                        <input type="text" value={data.hero?.titleHighlight || ''} onChange={e => handlePageSettingChange('hero', 'titleHighlight', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 block mb-1">Subtitle / Description</label>
                        <textarea value={data.hero?.subtitle || ''} onChange={e => handlePageSettingChange('hero', 'subtitle', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none resize-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2"><Star size={20} className="text-[#D4AF37]"/> Owner Spotlight Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Badge Text</label>
                        <input type="text" value={data.spotlight?.badge || ''} onChange={e => handlePageSettingChange('spotlight', 'badge', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Large Quote (Use 'research' for gold text)</label>
                        <input type="text" value={data.spotlight?.quote || ''} onChange={e => handlePageSettingChange('spotlight', 'quote', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 block mb-1">Detailed Description Quote</label>
                        <textarea value={data.spotlight?.description || ''} onChange={e => handlePageSettingChange('spotlight', 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none resize-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                        <input type="text" value={data.spotlight?.name || ''} onChange={e => handlePageSettingChange('spotlight', 'name', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
                        <input type="text" value={data.spotlight?.role || ''} onChange={e => handlePageSettingChange('spotlight', 'role', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Portrait Image URL</label>
                        <input type="text" value={data.spotlight?.image || ''} onChange={e => handlePageSettingChange('spotlight', 'image', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Corner Stamp Text (e.g. Committed to Quality Since 2012)</label>
                        <input type="text" value={data.spotlight?.stampText || ''} onChange={e => handlePageSettingChange('spotlight', 'stampText', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]"/> Bottom Call to Action</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
                        <input type="text" value={data.cta?.title || ''} onChange={e => handlePageSettingChange('cta', 'title', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Title Highlight (Gold text)</label>
                        <input type="text" value={data.cta?.titleHighlight || ''} onChange={e => handlePageSettingChange('cta', 'titleHighlight', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 block mb-1">Button Text</label>
                        <input type="text" value={data.cta?.buttonText || ''} onChange={e => handlePageSettingChange('cta', 'buttonText', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none" />
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}