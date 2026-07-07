'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ShoppingBag, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, Building2, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../layout/layout';
import axios from 'axios';
import ServicesPage from '../../../app/services/page';

const API_URL = "https://wow-lifebackend.onrender.com/api";
const axiosInstance = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DEFAULT_RETAIL_OFFER = {
  badgeText: "EXCLUSIVE OFFER", discountPercentage: "25", title: "OFF FOR RETAIL CUSTOMERS",
  description: "Special discount on all retail purchases",
  perk1: { title: "Minimum Purchase", desc: "₹5,000" }, perk2: { title: "Valid Until", desc: "Dec 31, 2024" }, perk3: { title: "Free Gift", desc: "Premium Wrapping Included" },
  buttonText: "APPLY 25% DISCOUNT", terms: "*Terms & Conditions apply. Valid on select products."
};

const DEFAULT_WHOLESALE_OFFER = {
  badgeText: "VOLUME DISCOUNT", discountPercentage: "50", title: "OFF FOR BUSINESS PARTNERS",
  description: "Maximum discount on bulk purchases",
  perk1: { title: "Minimum Order", desc: "200+ Units" }, perk2: { title: "Free Shipping", desc: "Pan India Delivery" }, perk3: { title: "Dedicated Support", desc: "Account Manager Included" },
  buttonText: "APPLY 50% DISCOUNT", terms: "*Valid on orders above ₹5,00,000. Limited time offer."
};

export default function ServicesAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editMode, setEditMode] = useState<'retail' | 'wholesale'>('retail');
  const [leftMode, setLeftMode] = useState<'products' | 'offer'>('products'); 
  
  const [data, setData] = useState({ 
    retailProducts: [], 
    wholesaleProducts: [],
    retailOffer: DEFAULT_RETAIL_OFFER,
    wholesaleOffer: DEFAULT_WHOLESALE_OFFER
  });
  
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

  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newRating, setNewRating] = useState('4.5');
  const [newIcon, setNewIcon] = useState('📦');
  const [newOriginal, setNewOriginal] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newStock, setNewStock] = useState('In Stock');
  const [newSales, setNewSales] = useState('');
  const [newMoq, setNewMoq] = useState('');
  const [newMargin, setNewMargin] = useState('');
  const [newDelivery, setNewDelivery] = useState('');
  const [newOrders, setNewOrders] = useState('');

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/services`);
      if (res.data.success && res.data.data) {
        setData({
          retailProducts: res.data.data.retailProducts || [],
          wholesaleProducts: res.data.data.wholesaleProducts || [],
          retailOffer: res.data.data.retailOffer || DEFAULT_RETAIL_OFFER,
          wholesaleOffer: res.data.data.wholesaleOffer || DEFAULT_WHOLESALE_OFFER
        });
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return setSaveStatus({ type: 'error', message: 'Login required' });
    try {
      setIsSaving(true);
      const res = await axiosInstance.put('/services', data);
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
      const res = await axiosInstance.post('/services/reset');
      if (res.data.success) {
        setData({
          retailProducts: res.data.data.retailProducts,
          wholesaleProducts: res.data.data.wholesaleProducts,
          retailOffer: res.data.data.retailOffer,
          wholesaleOffer: res.data.data.wholesaleOffer
        });
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
      message: 'Are you sure you want to restore default products and offers? This will overwrite your current changes.',
      action: executeReset
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();

    if (editMode === 'retail') {
      const newItem = { id, name: newName, category: newCat, price: newPrice, originalPrice: newOriginal, discount: newDiscount, stock: newStock, rating: newRating, sales: newSales, icon: newIcon };
      setData(prev => ({ ...prev, retailProducts: [...prev.retailProducts, newItem] as any }));
    } else {
      const newItem = { id, name: newName, category: newCat, price: newPrice, moq: newMoq, margin: newMargin, delivery: newDelivery, rating: newRating, orders: newOrders, icon: newIcon };
      setData(prev => ({ ...prev, wholesaleProducts: [...prev.wholesaleProducts, newItem] as any }));
    }

    setNewName(''); setNewCat(''); setNewPrice(''); setNewOriginal(''); setNewDiscount(''); setNewSales(''); setNewMoq(''); setNewMargin(''); setNewDelivery(''); setNewOrders('');
  };

  const executeDelete = (id: string) => {
    if (editMode === 'retail') {
      setData(prev => ({ ...prev, retailProducts: prev.retailProducts.filter((p:any) => p.id !== id) }));
    } else {
      setData(prev => ({ ...prev, wholesaleProducts: prev.wholesaleProducts.filter((p:any) => p.id !== id) }));
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${editMode === 'retail' ? 'Retail' : 'Wholesale'} Product`,
      message: 'Are you sure you want to remove this product? You must click "Save Changes" to apply this to the database.',
      action: () => executeDelete(id)
    });
  };

  const handleOfferChange = (field: string, value: string, perkField: string | null = null) => {
    setData(prev => {
      const modeKey = editMode === 'retail' ? 'retailOffer' : 'wholesaleOffer';
      const newOffer = { ...(prev as any)[modeKey] };
      
      if (perkField) {
        newOffer[field] = { ...newOffer[field], [perkField]: value };
      } else {
        newOffer[field] = value;
      }
      return { ...prev, [modeKey]: newOffer };
    });
  };

  if (isLoading) return <Layout><div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-yellow-500" size={40}/></div></Layout>;

  const currentOfferData = editMode === 'retail' ? data.retailOffer : data.wholesaleOffer;

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

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services Manager</h1>
            <p className="text-gray-500 text-sm">Manage Retail and Wholesale Products & Offers</p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-gray-200 rounded-lg p-1 mr-2">
              <button onClick={() => setActiveTab('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 ${activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-600'}`}><Edit2 size={16}/> Edit</button>
              <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-lg text-sm font-medium flex gap-2 ${activeTab === 'preview' ? 'bg-white shadow' : 'text-gray-600'}`}><Eye size={16}/> Preview</button>
            </div>
            {isAuthenticated && (
              <>
                <button onClick={handleResetClick} disabled={isSaving || isResetting} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium flex gap-2">
                  {isResetting ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Reset
                </button>
                <button onClick={handleSave} disabled={isSaving || isResetting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex gap-2">
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

        {/* Updated Preview Tab matching the Black & Gold aesthetic wrapper */}
        {activeTab === 'preview' ? (
          <div className="bg-black rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden relative" style={{ minHeight: '800px' }}>
             <ServicesPage isPreview={true} previewData={data} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Top Level Mode Tabs */}
            <div className="flex border-b border-gray-200">
              <button onClick={() => setEditMode('retail')} className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 ${editMode === 'retail' ? 'text-yellow-600 border-b-2 border-yellow-500 bg-yellow-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ShoppingBag size={16}/> Retail Config
              </button>
              <button onClick={() => setEditMode('wholesale')} className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 ${editMode === 'wholesale' ? 'text-yellow-600 border-b-2 border-yellow-500 bg-yellow-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Building2 size={16}/> Wholesale Config
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50/50">
              {/* LEFT COLUMN: Contains Toggle for Form vs Offer */}
              <div className="lg:col-span-1">
                
                {/* Left Column Mode Toggle */}
                <div className="flex bg-gray-200 p-1 rounded-lg mb-4">
                  <button onClick={() => setLeftMode('products')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${leftMode === 'products' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:bg-gray-300'}`}>
                    Add Product
                  </button>
                  <button onClick={() => setLeftMode('offer')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${leftMode === 'offer' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:bg-gray-300'}`}>
                    Edit Offer Card
                  </button>
                </div>

                {leftMode === 'products' ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                    <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2"><Plus size={18} className="text-yellow-600" /> Add {editMode === 'retail' ? 'Retail' : 'Wholesale'} Product</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-600">Name</label>
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-sm" placeholder="Product Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Category</label>
                          <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Icon (Emoji)</label>
                          <input type="text" value={newIcon} onChange={e => setNewIcon(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Price</label>
                          <input type="text" value={newPrice} onChange={e => setNewPrice(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-sm" placeholder="₹9,999" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Rating</label>
                          <input type="text" value={newRating} onChange={e => setNewRating(e.target.value)} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-sm" />
                        </div>
                      </div>

                      {editMode === 'retail' ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600">Original Price</label>
                              <input type="text" value={newOriginal} onChange={e => setNewOriginal(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Discount</label>
                              <input type="text" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600">Stock Status</label>
                              <input type="text" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Sales count</label>
                              <input type="text" value={newSales} onChange={e => setNewSales(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600">MOQ</label>
                              <input type="text" value={newMoq} onChange={e => setNewMoq(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Margin</label>
                              <input type="text" value={newMargin} onChange={e => setNewMargin(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600">Delivery Time</label>
                              <input type="text" value={newDelivery} onChange={e => setNewDelivery(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Orders count</label>
                              <input type="text" value={newOrders} onChange={e => setNewOrders(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                          </div>
                        </>
                      )}
                      <button type="submit" disabled={!isAuthenticated} className="w-full mt-2 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">
                        Add Product
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                    <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">
                      <LayoutTemplate size={18} className="text-yellow-600" /> Edit {editMode === 'retail' ? 'Retail' : 'Wholesale'} Offer
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Badge Text</label>
                          <input type="text" value={currentOfferData?.badgeText || ''} onChange={e => handleOfferChange('badgeText', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Discount %</label>
                          <input type="text" value={currentOfferData?.discountPercentage || ''} onChange={e => handleOfferChange('discountPercentage', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Offer Title</label>
                        <input type="text" value={currentOfferData?.title || ''} onChange={e => handleOfferChange('title', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Description</label>
                        <input type="text" value={currentOfferData?.description || ''} onChange={e => handleOfferChange('description', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="text-xs font-bold text-gray-800 mb-2">Feature 1</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Title" value={currentOfferData?.perk1?.title || ''} onChange={e => handleOfferChange('perk1', e.target.value, 'title')} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          <input type="text" placeholder="Value" value={currentOfferData?.perk1?.desc || ''} onChange={e => handleOfferChange('perk1', e.target.value, 'desc')} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-gray-800 mb-2">Feature 2</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Title" value={currentOfferData?.perk2?.title || ''} onChange={e => handleOfferChange('perk2', e.target.value, 'title')} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          <input type="text" placeholder="Value" value={currentOfferData?.perk2?.desc || ''} onChange={e => handleOfferChange('perk2', e.target.value, 'desc')} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-gray-800 mb-2">Feature 3</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Title" value={currentOfferData?.perk3?.title || ''} onChange={e => handleOfferChange('perk3', e.target.value, 'title')} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          <input type="text" placeholder="Value" value={currentOfferData?.perk3?.desc || ''} onChange={e => handleOfferChange('perk3', e.target.value, 'desc')} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <label className="text-xs text-gray-600">Button Text</label>
                        <input type="text" value={currentOfferData?.buttonText || ''} onChange={e => handleOfferChange('buttonText', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" />
                        <label className="text-xs text-gray-600">Terms & Conditions</label>
                        <input type="text" value={currentOfferData?.terms || ''} onChange={e => handleOfferChange('terms', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: List of Products */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">
                  Product Roster
                </h3>
                {(editMode === 'retail' ? data.retailProducts : data.wholesaleProducts).map((item:any) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-4 items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">{item.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.category} • {item.price}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteClick(item.id)} 
                      disabled={!isAuthenticated} 
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                {(editMode === 'retail' ? data.retailProducts : data.wholesaleProducts).length === 0 && (
                  <div className="p-12 text-center text-gray-400 border-2 border-dashed rounded-xl">
                    No products added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}