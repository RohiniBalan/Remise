'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, Image as ImageIcon, Type, Star, Calendar, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../layout/layout';
import axios from 'axios';
import ReviewSection, { ReviewConfigData, ReviewItem, PhotoItem } from '../../components-sections/ReviewSection'; 

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

export default function ReviewAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editMode, setEditMode] = useState<'reviews' | 'photos'>('reviews'); // Sub-tab for editing
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [data, setData] = useState<ReviewConfigData>({ reviews: [], photos: [] });

  // --- State for Custom Popup Modal ---
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // Form States - Review
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revText, setRevText] = useState('');
  const [revDate, setRevDate] = useState('');
  const [revAvatar, setRevAvatar] = useState('');

  // Form States - Photo
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    checkAuth();
    fetchConfig();
  }, []);

  const checkAuth = () => setIsAuthenticated(!!localStorage.getItem('token'));

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/reviews`);
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
      const res = await axiosInstance.put('/reviews', data);
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
      const res = await axiosInstance.post('/reviews/reset');
      if (res.data.success) {
        setData(res.data.data);
        setSaveStatus({ type: 'success', message: 'Reset to defaults!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to reset' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetClick = () => {
    if (!isAuthenticated) {
      setSaveStatus({ type: 'error', message: 'Login required' });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Configuration',
      message: 'Are you sure you want to restore default reviews and photos? This will overwrite current changes.',
      action: executeReset
    });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName || !revText || !revDate) return;
    
    setData(prev => ({
      ...prev,
      reviews: [...prev.reviews, {
        id: Date.now().toString(),
        name: revName, rating: revRating, text: revText,
        date: revDate, avatar: revAvatar
      }]
    }));
    
    setRevName(''); setRevText(''); setRevDate(''); setRevAvatar(''); setRevRating(5);
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;

    setData(prev => ({
      ...prev,
      photos: [...prev.photos, { id: Date.now().toString(), url: photoUrl }]
    }));
    setPhotoUrl('');
  };

  const executeDeleteReview = (id: string | number) => {
    setData(prev => ({ ...prev, reviews: prev.reviews.filter(r => r.id !== id) }));
  };

  const handleDeleteReviewClick = (id: string | number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Review',
      message: 'Are you sure you want to remove this review? Note: You must click "Save Changes" to update the database.',
      action: () => executeDeleteReview(id)
    });
  };

  const executeDeletePhoto = (id: string | number) => {
    setData(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== id) }));
  };

  const handleDeletePhotoClick = (id: string | number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Photo',
      message: 'Are you sure you want to remove this photo from the gallery? Note: You must click "Save Changes" to update the database.',
      action: () => executeDeletePhoto(id)
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
                    onClick={() => {
                      confirmDialog.action();
                      setConfirmDialog({ ...confirmDialog, isOpen: false });
                    }}
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
            <h1 className="text-2xl font-bold text-gray-900">Reviews & Gallery Manager</h1>
            <p className="text-gray-500 text-sm">Manage customer testimonials and grid photos</p>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <ReviewSection theme={theme} isPreview={true} previewData={data} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Sub-Tabs for Edit Mode */}
            <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setEditMode('reviews')} 
                className={`flex-1 py-4 text-center font-bold text-sm flex justify-center items-center gap-2 ${editMode === 'reviews' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-yellow-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <MessageSquare size={16}/> Manage Testimonials
              </button>
              <button 
                onClick={() => setEditMode('photos')} 
                className={`flex-1 py-4 text-center font-bold text-sm flex justify-center items-center gap-2 ${editMode === 'photos' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-yellow-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <ImageIcon size={16}/> Manage Gallery
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50/50">
              
              {/* Form Column */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                  
                  {editMode === 'reviews' ? (
                    <>
                      <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2"><Plus size={18} className="text-[#D4AF37]" /> Add Review</h3>
                      <form onSubmit={handleAddReview} className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Type size={14}/> Customer Name</label>
                          <input type="text" value={revName} onChange={e => setRevName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="e.g. John Doe" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Star size={14}/> Rating</label>
                            <select value={revRating} onChange={e => setRevRating(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]">
                              {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Calendar size={14}/> Date</label>
                            <input type="text" value={revDate} onChange={e => setRevDate(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="e.g. 2 days ago" />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><MessageSquare size={14}/> Review Text</label>
                          <textarea value={revText} onChange={e => setRevText(e.target.value)} required rows={3} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none" placeholder="Great product!" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><ImageIcon size={14}/> Avatar URL (Optional)</label>
                          <input type="text" value={revAvatar} onChange={e => setRevAvatar(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="/avatars/1.jpg" />
                        </div>
                        <button type="submit" disabled={!isAuthenticated} className="w-full mt-2 py-3 bg-[#D4AF37] text-white font-bold rounded-lg hover:bg-[#b08d2c] transition-colors disabled:opacity-50">
                          Add Review
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2"><Plus size={18} className="text-[#D4AF37]" /> Add Photo</h3>
                      <form onSubmit={handleAddPhoto} className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1"><ImageIcon size={14}/> Image URL</label>
                          <input type="text" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="https://..." />
                        </div>
                        <button type="submit" disabled={!isAuthenticated} className="w-full mt-2 py-3 bg-[#D4AF37] text-white font-bold rounded-lg hover:bg-[#b08d2c] transition-colors disabled:opacity-50">
                          Add Photo to Gallery
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>

              {/* List Column */}
              <div className="lg:col-span-2 space-y-4">
                {editMode === 'reviews' ? (
                  data.reviews.map((item, i) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.avatar ? <img src={item.avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-gray-400 font-bold">{item.name.charAt(0)}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-800">{item.name}</h4>
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">{item.rating} <Star size={10} fill="currentColor"/></span>
                          <span className="text-xs text-gray-400">{item.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">"{item.text}"</p>
                      </div>
                      <button onClick={() => handleDeleteReviewClick(item.id)} disabled={!isAuthenticated} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {data.photos.map((item, i) => (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 relative group aspect-square">
                        <img src={item.url} alt="Gallery" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <button onClick={() => handleDeletePhotoClick(item.id)} disabled={!isAuthenticated} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform hover:scale-110">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {editMode === 'reviews' && data.reviews.length === 0 && (
                  <div className="py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">No reviews added yet</div>
                )}
                {editMode === 'photos' && data.photos.length === 0 && (
                  <div className="py-12 text-center text-gray-400 border-2 border-dashed rounded-xl col-span-3">No photos added yet</div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}