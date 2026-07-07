'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, Type, ImageIcon, Clock, MessageSquare, Star, MapPin } from 'lucide-react';
import Layout from '../layout/layout';
import axios from 'axios';
// Updated to named import
import ToyBlogLifestyle from '../../about/ToyBlogLifestyle';

const API_URL = "https://wow-lifebackend.onrender.com/api";
const axiosInstance = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ICON_OPTIONS = ["Globe2", "Smile", "Shield", "Rocket"];

export default function BlogLifestyleAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editSection, setEditSection] = useState<'featured' | 'articles' | 'timeline' | 'testimonials'>('featured');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [data, setData] = useState<any>({
    featuredArticle: { stats: {} }, articles: [], timeline: [], testimonials: []
  });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: () => {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // Form States
  const [artTitle, setArtTitle] = useState(''); const [artCategory, setArtCat] = useState(''); const [artImage, setArtImg] = useState(''); const [artExcerpt, setArtExc] = useState(''); const [artDate, setArtDate] = useState(''); const [artIcon, setArtIcon] = useState('Globe2');
  const [tlYear, setTlYear] = useState(''); const [tlEvent, setTlEvent] = useState(''); const [tlHighlight, setTlHighlight] = useState(false);
  const [testName, setTestName] = useState(''); const [testRole, setTestRole] = useState(''); const [testLoc, setTestLoc] = useState(''); const [testRating, setTestRating] = useState(5); const [testContent, setTestContent] = useState('');

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/blog-lifestyle`);
      if (res.data.success && res.data.data) setData(res.data.data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return setSaveStatus({ type: 'error', message: 'Login required' });
    try {
      setIsSaving(true);
      const res = await axiosInstance.put('/blog-lifestyle', data);
      if (res.data.success) {
        setSaveStatus({ type: 'success', message: 'Saved successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to save' });
    } finally { setIsSaving(false); }
  };

  const executeReset = async () => {
    try {
      setIsResetting(true);
      const res = await axiosInstance.post('/blog-lifestyle/reset');
      if (res.data.success) {
        setData(res.data.data);
        setSaveStatus({ type: 'success', message: 'Reset to defaults!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) { setSaveStatus({ type: 'error', message: 'Failed to reset' }); } finally { setIsResetting(false); }
  };

  const handleFeaturedChange = (field: string, val: string, isStat = false) => {
    setData((prev: any) => {
      const updated = { ...prev };
      if (isStat) updated.featuredArticle.stats[field] = val;
      else updated.featuredArticle[field] = val;
      return updated;
    });
  };

  const addItem = (type: 'articles' | 'timeline' | 'testimonials', e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    if (type === 'articles') {
      setData((prev:any) => ({ ...prev, articles: [...prev.articles, { id, title: artTitle, category: artCategory, image: artImage, excerpt: artExcerpt, date: artDate, icon: artIcon }]}));
      setArtTitle(''); setArtCat(''); setArtImg(''); setArtExc(''); setArtDate('');
    } else if (type === 'timeline') {
      setData((prev:any) => ({ ...prev, timeline: [...prev.timeline, { id, year: tlYear, event: tlEvent, highlight: tlHighlight }]}));
      setTlYear(''); setTlEvent(''); setTlHighlight(false);
    } else if (type === 'testimonials') {
      setData((prev:any) => ({ ...prev, testimonials: [...prev.testimonials, { id, name: testName, role: testRole, location: testLoc, rating: testRating, content: testContent }]}));
      setTestName(''); setTestRole(''); setTestLoc(''); setTestContent(''); setTestRating(5);
    }
  };

  const deleteItem = (type: 'articles' | 'timeline' | 'testimonials', id: string) => {
    setData((prev:any) => ({ ...prev, [type]: prev[type].filter((item:any) => item.id !== id) }));
  };

  if (isLoading) return <Layout><div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-[#D4AF37]" size={40}/></div></Layout>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
        <AnimatePresence>
          {confirmDialog.isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[9998]" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} />
              <motion.div initial={{ opacity: 0, scale: 0.95, top: '50%', left: '50%', x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed z-[9999] bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-sm overflow-hidden">
                <div className="flex items-center gap-3 mb-4 text-red-600"><AlertCircle size={24} /><h3 className="text-xl font-bold">{confirmDialog.title}</h3></div>
                <p className="text-gray-600 mb-6 text-sm">{confirmDialog.message}</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
                  <button onClick={() => { confirmDialog.action(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="px-4 py-2 bg-red-600 text-white rounded-lg">Confirm</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-2xl font-bold text-gray-900">Blog & Lifestyle</h1></div>
          <div className="flex gap-3">
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'dark'|'light')} className="px-3 py-2 border rounded-lg text-sm bg-white"><option value="dark">Dark Theme</option><option value="light">Light Theme</option></select>
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button onClick={() => setActiveTab('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-600'}`}>Edit</button>
              <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'preview' ? 'bg-white shadow' : 'text-gray-600'}`}>Preview</button>
            </div>
            {isAuthenticated && (
              <>
                <button onClick={() => setConfirmDialog({ isOpen: true, title: 'Reset', message: 'Restore defaults?', action: executeReset })} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm flex gap-2"><RefreshCw size={16}/> Reset</button>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex gap-2"><Save size={16}/> Save</button>
              </>
            )}
          </div>
        </div>

        {saveStatus.message && <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-lg text-sm font-medium">{saveStatus.message}</div>}

        {activeTab === 'preview' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative" style={{ height: '800px', overflowY: 'auto' }}>
            <ToyBlogLifestyle isPreview={true} previewData={data} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50">
              {['featured', 'articles', 'timeline', 'testimonials'].map((tab) => (
                <button key={tab} onClick={() => setEditSection(tab as any)} className={`flex-1 py-4 font-bold text-sm capitalize ${editSection === tab ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-yellow-50/30' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {editSection === 'featured' && (
                <div className="max-w-3xl space-y-4">
                  <h3 className="font-bold text-lg border-b pb-2 mb-4">Featured Story Header</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Category (e.g. Heritage)" value={data.featuredArticle?.category || ''} onChange={e => handleFeaturedChange('category', e.target.value)} className="p-2 border rounded" />
                    <input type="text" placeholder="Date" value={data.featuredArticle?.date || ''} onChange={e => handleFeaturedChange('date', e.target.value)} className="p-2 border rounded" />
                  </div>
                  <input type="text" placeholder="Title (Use : to split gradient part)" value={data.featuredArticle?.title || ''} onChange={e => handleFeaturedChange('title', e.target.value)} className="w-full p-2 border rounded" />
                  <textarea placeholder="Excerpt" value={data.featuredArticle?.excerpt || ''} onChange={e => handleFeaturedChange('excerpt', e.target.value)} rows={3} className="w-full p-2 border rounded resize-none" />
                  <input type="text" placeholder="Image URL" value={data.featuredArticle?.image || ''} onChange={e => handleFeaturedChange('image', e.target.value)} className="w-full p-2 border rounded" />
                  
                  <h3 className="font-bold text-lg border-b pb-2 mb-4 mt-6">Metrics (Stats Grid)</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <input type="text" placeholder="Years" value={data.featuredArticle?.stats?.years || ''} onChange={e => handleFeaturedChange('years', e.target.value, true)} className="p-2 border rounded text-center font-bold text-[#D4AF37]" />
                    <input type="text" placeholder="Stores" value={data.featuredArticle?.stats?.stores || ''} onChange={e => handleFeaturedChange('stores', e.target.value, true)} className="p-2 border rounded text-center font-bold text-[#D4AF37]" />
                    <input type="text" placeholder="Countries" value={data.featuredArticle?.stats?.countries || ''} onChange={e => handleFeaturedChange('countries', e.target.value, true)} className="p-2 border rounded text-center font-bold text-[#D4AF37]" />
                    <input type="text" placeholder="Smiles" value={data.featuredArticle?.stats?.smiles || ''} onChange={e => handleFeaturedChange('smiles', e.target.value, true)} className="p-2 border rounded text-center font-bold text-[#D4AF37]" />
                  </div>
                </div>
              )}

              {editSection === 'articles' && (
                <div className="grid md:grid-cols-3 gap-6">
                  <form onSubmit={e => addItem('articles', e)} className="space-y-3 bg-gray-50 p-4 rounded-xl border">
                    <input type="text" placeholder="Title" value={artTitle} onChange={e=>setArtTitle(e.target.value)} required className="w-full p-2 border rounded text-sm"/>
                    <input type="text" placeholder="Category" value={artCategory} onChange={e=>setArtCat(e.target.value)} required className="w-full p-2 border rounded text-sm"/>
                    <input type="text" placeholder="Date" value={artDate} onChange={e=>setArtDate(e.target.value)} required className="w-full p-2 border rounded text-sm"/>
                    <input type="text" placeholder="Image URL" value={artImage} onChange={e=>setArtImg(e.target.value)} required className="w-full p-2 border rounded text-sm"/>
                    <select value={artIcon} onChange={e=>setArtIcon(e.target.value)} className="w-full p-2 border rounded text-sm">
                      {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <textarea placeholder="Excerpt" value={artExcerpt} onChange={e=>setArtExc(e.target.value)} required rows={2} className="w-full p-2 border rounded text-sm"/>
                    <button type="submit" className="w-full bg-[#D4AF37] text-white p-2 rounded font-bold">Add Article</button>
                  </form>
                  <div className="md:col-span-2 space-y-3 max-h-[500px] overflow-y-auto">
                    {data.articles?.map((item:any) => (
                      <div key={item.id} className="flex gap-4 p-3 border rounded-lg bg-white items-center">
                        <img src={item.image} className="w-16 h-16 object-cover rounded" alt=""/>
                        <div className="flex-1"><h4 className="font-bold text-sm">{item.title}</h4><p className="text-xs text-gray-500">{item.category} • {item.date}</p></div>
                        <button onClick={() => setConfirmDialog({ isOpen: true, title: 'Delete', message: 'Delete article?', action: () => deleteItem('articles', item.id) })} className="p-2 text-red-500"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editSection === 'timeline' && (
                <div className="grid md:grid-cols-3 gap-6">
                  <form onSubmit={e => addItem('timeline', e)} className="space-y-3 bg-gray-50 p-4 rounded-xl border">
                    <input type="text" placeholder="Year (e.g. 1760)" value={tlYear} onChange={e=>setTlYear(e.target.value)} required className="w-full p-2 border rounded text-sm font-bold"/>
                    <textarea placeholder="Event Description" value={tlEvent} onChange={e=>setTlEvent(e.target.value)} required rows={3} className="w-full p-2 border rounded text-sm"/>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tlHighlight} onChange={e=>setTlHighlight(e.target.checked)}/> Highlight this item</label>
                    <button type="submit" className="w-full bg-[#D4AF37] text-white p-2 rounded font-bold">Add Timeline Event</button>
                  </form>
                  <div className="md:col-span-2 space-y-3 max-h-[500px] overflow-y-auto">
                    {data.timeline?.map((item:any) => (
                      <div key={item.id} className={`flex gap-4 p-3 border rounded-lg bg-white items-center ${item.highlight ? 'border-l-4 border-l-[#D4AF37]' : ''}`}>
                        <div className="w-16 font-black text-lg text-[#D4AF37]">{item.year}</div>
                        <div className="flex-1 text-sm">{item.event}</div>
                        <button onClick={() => setConfirmDialog({ isOpen: true, title: 'Delete', message: 'Delete event?', action: () => deleteItem('timeline', item.id) })} className="p-2 text-red-500"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editSection === 'testimonials' && (
                <div className="grid md:grid-cols-3 gap-6">
                  <form onSubmit={e => addItem('testimonials', e)} className="space-y-3 bg-gray-50 p-4 rounded-xl border">
                    <input type="text" placeholder="Name" value={testName} onChange={e=>setTestName(e.target.value)} required className="w-full p-2 border rounded text-sm"/>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Role" value={testRole} onChange={e=>setTestRole(e.target.value)} required className="w-full p-2 border rounded text-sm"/>
                      <input type="text" placeholder="Location" value={testLoc} onChange={e=>setTestLoc(e.target.value)} required className="w-full p-2 border rounded text-sm"/>
                    </div>
                    <select value={testRating} onChange={e=>setTestRating(Number(e.target.value))} className="w-full p-2 border rounded text-sm">
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                    <textarea placeholder="Review Content" value={testContent} onChange={e=>setTestContent(e.target.value)} required rows={3} className="w-full p-2 border rounded text-sm"/>
                    <button type="submit" className="w-full bg-[#D4AF37] text-white p-2 rounded font-bold">Add Testimonial</button>
                  </form>
                  <div className="md:col-span-2 space-y-3 max-h-[500px] overflow-y-auto">
                    {data.testimonials?.map((item:any) => (
                      <div key={item.id} className="flex gap-4 p-3 border rounded-lg bg-white items-center">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700">{item.name.charAt(0)}</div>
                        <div className="flex-1"><h4 className="font-bold text-sm">{item.name}</h4><p className="text-xs text-gray-500 italic line-clamp-1">"{item.content}"</p></div>
                        <button onClick={() => setConfirmDialog({ isOpen: true, title: 'Delete', message: 'Delete testimonial?', action: () => deleteItem('testimonials', item.id) })} className="p-2 text-red-500"><Trash2 size={16}/></button>
                      </div>
                    ))}
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