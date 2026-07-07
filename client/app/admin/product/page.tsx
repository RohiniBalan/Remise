'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Save, Image as ImageIcon, Tag, Package,
  IndianRupee, AlertCircle, CheckCircle2, LayoutGrid,
  X, Edit3, Eye, RotateCcw, Plus, Trash2, Search, AlertTriangle,
  ClipboardList, Info, Truck,
  Zap,
  ShoppingCart,
  Heart,
  Loader2,
  ScanLine,
  Upload,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Layout from '../layout/layout'; 

// Define your backend API URL here
const API_URL = "https://wow-lifebackend.onrender.com/api";

interface ProductSpec {
  label: string;
  value: string;
}

interface ProductFormData {
  [x: string]: any;
  _id?: string;
  id?: string; 
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  badge: string;
  type: string;
  category: string;
  availability: string;
  images: string[];
  description: string;
  aboutFeatures: string[]; 
  aboutDescription: string;
  specifications: ProductSpec[];
  idealFor: string[];
  totalStock: number;
  deliveryTime: string;
}

export default function AdminProductPage() {
  const router = useRouter();
  
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<{_id: string, name: string}[]>([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [previewTab, setPreviewTab] = useState('About');
  const [activePreviewImage, setActivePreviewImage] = useState('');

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const emptyForm: ProductFormData = {
    title: '', brand: '', price: 0, originalPrice: 0, badge: '',
    type: 'Toys & Games', category: '', 
    availability: 'In Stock',
    images: [''], description: '',
    aboutFeatures: [''], 
    aboutDescription: '',
    specifications: [{ label: '', value: '' }],
    idealFor: [''],
    totalStock: 0,
    deliveryTime: '3 to 8 days'
  };

  const [formData, setFormData] = useState<ProductFormData>(emptyForm);

  useEffect(() => {
    if (formData.images && formData.images.length > 0 && formData.images[0].trim() !== '') {
      setActivePreviewImage(formData.images[0]);
    } else if (formData.imageUrl) {
      setActivePreviewImage(formData.imageUrl);
    } else {
      setActivePreviewImage('');
    }
  }, [formData.images, formData.imageUrl, viewMode]);

  useEffect(() => {
    fetchProducts();
    fetchCategories(); 
  }, []);

  const fetchCategories = async () => {
    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;
      
      const response = await fetch(`${API_URL}/admin/categories`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setDynamicCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;
      
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_URL}/admin/products?t=${timestamp}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });

      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        let productsArray: ProductFormData[] = [];
        if (Array.isArray(data)) productsArray = data;
        else if (data?.products && Array.isArray(data.products)) productsArray = data.products;
        else if (data?.data && Array.isArray(data.data)) productsArray = data.data;

        setProducts(productsArray.reverse());
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- UPDATED HANDLE CHANGE (Auto-syncs Stock & Availability) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? 0 : Number(value);
    }
    
    setFormData(prev => {
      const newData = { ...prev, [name]: parsedValue };
      
      // MAGIC HAPPENS HERE: If editing stock, auto-update availability dropdown
      if (name === 'totalStock') {
        newData.availability = parsedValue > 0 ? 'In Stock' : 'Out Of Stock';
      }
      
      return newData;
    });
  };

  const handleArrayChange = (index: number, value: string, field: 'aboutFeatures' | 'idealFor' | 'images') => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: 'aboutFeatures' | 'idealFor' | 'images') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (index: number, field: 'aboutFeatures' | 'idealFor' | 'images') => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', value: string) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  const addSpec = () => {
    setFormData({ ...formData, specifications: [...formData.specifications, { label: '', value: '' }] });
  };

  const removeSpec = (index: number) => {
    const newSpecs = formData.specifications.filter((_, i) => i !== index);
    setFormData({ ...formData, specifications: newSpecs });
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleAddNewClick = () => {
    setFormData(emptyForm);
    setViewMode('edit');
    setIsModalOpen(true);
  };

  const handleScanComplete = (extracted: any) => {
    setFormData({
      ...emptyForm,
      title:       extracted.productName || '',
      brand:       extracted.brand       || '',
      price:       Number(extracted.discountedPrice) || Number(extracted.price) || 0,
      originalPrice: Number(extracted.price) || 0,
      category:    extracted.category    || '',
      description: extracted.description || '',
      images:      extracted.imageUrl ? [extracted.imageUrl] : [''],
      badge:       extracted.validTill ? `Offer valid till ${extracted.validTill}` : '',
    });
    setIsScanModalOpen(false);
    setViewMode('edit');
    setIsModalOpen(true);
  };

  const handleEditClick = (product: any) => {
    let parsedImages = [''];
    if (Array.isArray(product.images) && product.images.length > 0) {
      parsedImages = product.images;
    } else if (product.imageUrl) {
      parsedImages = [product.imageUrl];
    }

    setFormData({
      _id: product._id || product.id, 
      title: product.title || '',
      brand: product.brand || '',
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      badge: product.badge || '',
      type: product.type || 'Toys & Games',
      category: product.category || '',
      availability: product.availability || 'In Stock',
      images: parsedImages,
      description: product.description || '',
      aboutFeatures: product.aboutFeatures && product.aboutFeatures.length > 0 ? product.aboutFeatures : [''],
      aboutDescription: product.aboutDescription || '',
      specifications: product.specifications && product.specifications.length > 0 ? product.specifications : [{ label: '', value: '' }],
      idealFor: product.idealFor && product.idealFor.length > 0 ? product.idealFor : [''],
      totalStock: product.totalStock || 0,
      deliveryTime: product.deliveryTime || '3 to 8 days',
    });
    setViewMode('edit');
    setIsModalOpen(true);
  };

  const initiateDelete = (id: string | undefined) => {
    if (!id) return;
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setProductToDelete(null);
    setDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;

      const response = await fetch(`${API_URL}/admin/products/${productToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete product');
      
      showNotification('Product deleted successfully!', 'success');
      await fetchProducts(); 
    } catch (error: any) {
      console.error('Error deleting:', error);
      showNotification(error.message || 'Failed to delete product.', 'error');
    } finally {
      setIsDeleting(false);
      cancelDelete(); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;

      const productId = formData._id || formData.id;
      const isUpdating = !!productId; 

      const { _id, id, ...dataToSend } = formData;

      const cleanedData = {
        ...dataToSend,
        images: dataToSend.images.filter(i => i.trim() !== ''),
        aboutFeatures: dataToSend.aboutFeatures.filter(f => f.trim() !== ''),
        idealFor: dataToSend.idealFor.filter(i => i.trim() !== ''),
        specifications: dataToSend.specifications.filter(s => s.label.trim() !== '' && s.value.trim() !== '')
      };

      if (cleanedData.images.length === 0) {
        throw new Error("At least one product image URL is required.");
      }
      if (!cleanedData.category) {
        throw new Error("Please select a category for the product.");
      }

      const url = isUpdating 
        ? `${API_URL}/admin/products/${productId}` 
        : `${API_URL}/admin/products`;
      const method = isUpdating ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isUpdating ? 'update' : 'save'} product`);
      }
      
      showNotification(`Product ${isUpdating ? 'updated' : 'saved'} successfully!`, 'success');
      
      setFormData(emptyForm);
      setIsModalOpen(false); 
      setSearchTerm(''); 
      
      await fetchProducts(); 

    } catch (error: any) {
      console.error('Error saving:', error);
      showNotification(error.message || 'Failed to save product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    (p.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (p.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50/50";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  const previewDiscount = formData.originalPrice > formData.price 
    ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100) : 0;

  return (
    <Layout>
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-6 right-6 z-[80] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg font-medium text-white ${toast.type === 'success' ? 'bg-green-600 shadow-green-500/20' : 'bg-red-600 shadow-red-500/20'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your products, pricing, and stock.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-teal-200 flex-1 md:flex-none justify-center"
            >
              <ScanLine size={18} /> AI Scan
            </button>
            <button
              onClick={handleAddNewClick}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 flex-1 md:flex-none justify-center"
            >
              <Plus size={18} /> Add New Product
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products by title or brand..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <button 
              onClick={fetchProducts} 
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
               <RotateCcw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading products...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Package size={48} className="mb-4 opacity-50" />
                        <p className="text-base font-medium text-gray-900 mb-1">No products found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, idx) => {
                    const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.imageUrl;
                    return (
                      <tr key={product._id || product.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                              {displayImg ? <img src={displayImg} alt={product.title} className="h-full w-full object-contain" /> : <ImageIcon className="text-gray-400 opacity-50" size={20} />}
                            </div>
                            <div className="max-w-[250px] overflow-hidden">
                              <p className="font-semibold text-gray-900 truncate">{product.title}</p>
                              <p className="text-xs text-gray-500 truncate">{product.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          ₹{product.price}
                          {product.originalPrice > product.price && <span className="ml-2 text-xs text-gray-400 line-through">₹{product.originalPrice}</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            product.availability === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${product.availability === 'In Stock' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {product.availability}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEditClick(product)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => initiateDelete(product._id || product.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 py-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#f8f9fa] w-full max-w-7xl max-h-full rounded-2xl shadow-2xl flex flex-col relative z-10 overflow-hidden border border-gray-200">
              
              <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {(formData._id || formData.id) ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <div className="hidden sm:flex p-1 bg-gray-100 rounded-lg border border-gray-200">
                    <button type="button" onClick={() => setViewMode('edit')} className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Edit3 size={14} /> Edit</button>
                    <button type="button" onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Eye size={14} /> Preview</button>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-gray-50">
                <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
                  {viewMode === 'edit' ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* LEFT COLUMN */}
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Package size={18} className="text-indigo-600"/> Basic Info</h2>
                          <div className="space-y-4">
                            <div>
                              <label className={labelClass}>Product Title</label>
                              <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Hot Wheels Mainline" className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div><label className={labelClass}>Brand</label><input required type="text" name="brand" value={formData.brand} onChange={handleChange} className={inputClass} /></div>
                              <div><label className={labelClass}>Promo Badge</label><input type="text" name="badge" value={formData.badge} onChange={handleChange} placeholder="e.g. Upto 10%" className={inputClass} /></div>
                            </div>
                            <div>
                              <label className={labelClass}>Short Description</label>
                              <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className={`${inputClass} resize-none`} />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><IndianRupee size={18} className="text-emerald-600"/> Pricing & Category</h2>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div><label className={labelClass}>Selling Price (₹)</label><input required type="number" name="price" value={formData.price || ''} onChange={handleChange} className={inputClass} /></div>
                              <div><label className={labelClass}>Original MRP (₹)</label><input required type="number" name="originalPrice" value={formData.originalPrice || ''} onChange={handleChange} className={inputClass} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                {/* DYNAMIC CATEGORY DROPDOWN */}
                                <label className={labelClass}>Category</label>
                                <select 
                                  required 
                                  name="category" 
                                  value={formData.category} 
                                  onChange={handleChange} 
                                  className={inputClass}
                                >
                                  <option value="" disabled>Select a Category</option>
                                  {dynamicCategories.map((cat) => (
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                  ))}
                                  {/* Legacy Support: If category exists but was deleted from global list */}
                                  {formData.category && !dynamicCategories.find(c => c.name === formData.category) && (
                                    <option value={formData.category}>{formData.category} (Legacy)</option>
                                  )}
                                </select>
                              </div>
                              <div>
                                <label className={labelClass}>Type</label>
                                <input required type="text" name="type" value={formData.type} onChange={handleChange} placeholder="e.g. Toys & Games" className={inputClass} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Truck size={18} className="text-blue-600"/> Inventory & Shipping</h2>
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className={labelClass}>Total Stock</label>
                                <input type="number" name="totalStock" value={formData.totalStock} onChange={handleChange} className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>Availability</label>
                                <select name="availability" value={formData.availability} onChange={handleChange} className={inputClass}>
                                  <option value="In Stock">In Stock</option>
                                  <option value="Out Of Stock">Out Of Stock</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelClass}>Delivery Time</label>
                                <input type="text" name="deliveryTime" value={formData.deliveryTime} onChange={handleChange} placeholder="e.g. 3 to 8 days" className={inputClass} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="space-y-6">

                        {/* Dynamic Multiple Images */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-gray-400"/> Product Images</h2>
                          <div className="space-y-3">
                            {formData.images.map((img, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input type="text" value={img} onChange={(e) => handleArrayChange(idx, e.target.value, 'images')} className={inputClass} placeholder="Image URL..." />
                                {formData.images.length > 1 && (
                                  <button type="button" onClick={() => removeArrayItem(idx, 'images')} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={() => addArrayItem('images')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2">
                              <Plus size={14} /> Add Another Image
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Info size={18} className="text-orange-500"/> About The Product</h2>
                          <div className="space-y-4">
                            <div>
                              <label className={labelClass}>Extended Description</label>
                              <textarea name="aboutDescription" value={formData.aboutDescription} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} placeholder="Detailed narrative..." />
                            </div>
                            <div>
                              <label className={labelClass}>Key Features (Bullet Points)</label>
                              {formData.aboutFeatures.map((feature, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                  <input type="text" value={feature} onChange={(e) => handleArrayChange(idx, e.target.value, 'aboutFeatures')} className={inputClass} placeholder="Add a feature..." />
                                  <button type="button" onClick={() => removeArrayItem(idx, 'aboutFeatures')} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addArrayItem('aboutFeatures')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2">
                                <Plus size={14} /> Add Feature
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><ClipboardList size={18} className="text-purple-600"/> Specifications</h2>
                          <div className="space-y-3">
                            {formData.specifications.map((spec, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input type="text" value={spec.label} onChange={(e) => handleSpecChange(idx, 'label', e.target.value)} className={`${inputClass} w-1/3`} placeholder="Label (e.g. Brand)" />
                                <input type="text" value={spec.value} onChange={(e) => handleSpecChange(idx, 'value', e.target.value)} className={`${inputClass} w-2/3`} placeholder="Value" />
                                <button type="button" onClick={() => removeSpec(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
                              </div>
                            ))}
                            <button type="button" onClick={addSpec} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2">
                              <Plus size={14} /> Add Specification
                            </button>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Tag size={18} className="text-pink-500"/> Ideal For</h2>
                          <div className="space-y-2">
                            {formData.idealFor.map((item, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input type="text" value={item} onChange={(e) => handleArrayChange(idx, e.target.value, 'idealFor')} className={inputClass} placeholder="e.g. Collectors" />
                                <button type="button" onClick={() => removeArrayItem(idx, 'idealFor')} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
                              </div>
                            ))}
                            <button type="button" onClick={() => addArrayItem('idealFor')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2">
                              <Plus size={14} /> Add Tag
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  ) : (
                    /* --- FULL PAGE DUAL PREVIEW MODE --- */
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-0 sm:p-2 flex flex-col gap-12 bg-white rounded-xl h-full overflow-hidden">
                      
                      {/* SECTION 1: CATEGORY CARD PREVIEW */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
                          <LayoutGrid size={20} className="text-[#C9A84C]" /> 1. Storefront Card Preview
                        </h3>
                        <div className="w-full max-w-[280px] group flex flex-col cursor-pointer relative overflow-hidden rounded-xl border border-[#EAEAEA] bg-white shadow-sm">
                          
                          <div className="relative overflow-hidden bg-[#F9F9F9] aspect-square">
                            {previewDiscount > 0 && (
                              <div className="absolute top-2.5 left-2.5 z-10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest rounded-sm bg-[#C9A84C] text-[#000]">
                                −{previewDiscount}%
                              </div>
                            )}
                            {formData.badge && (
                              <div className="absolute top-2.5 right-2.5 z-10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded-sm bg-[#C9A84C] text-[#000]">
                                {formData.badge}
                              </div>
                            )}
                            {activePreviewImage ? (
                              <img src={activePreviewImage} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                <ImageIcon size={40} />
                                <span className="text-xs mt-2">No Image</span>
                              </div>
                            )}
                            
                            {/* Static Wishlist Button for preview */}
                            <button type="button" className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-[#EAEAEA]">
                              <Heart size={12} className="text-[#6B7280]" fill="none" />
                            </button>
                          </div>

                          <div className="flex flex-col border-t border-[#EAEAEA]">
                            <div className="px-3 pt-3 pb-2.5 flex flex-col gap-1">
                              <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#B8860B]">{formData.brand || 'BRAND'}</span>
                              <h3 className="text-[12px] font-medium leading-snug line-clamp-2 text-[#111827]">{formData.title || 'Product Title...'}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[15px] font-semibold text-[#111827]">₹{formData.price?.toLocaleString() || 0}</span>
                                {formData.originalPrice > formData.price && (
                                  <span className="text-[11px] line-through font-medium text-[#6B7280]">₹{formData.originalPrice?.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex border-t border-[#EAEAEA]">
                              <button type="button" className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[9px] font-bold tracking-[0.2em] uppercase text-[#6B7280] border-r border-[#EAEAEA] bg-transparent">
                                <ShoppingCart size={11} /> Cart
                              </button>
                              <button type="button" className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[9px] font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-[#C9A84C] to-[#E2BE6A] text-[#000]">
                                <Zap size={11} /> Buy Now
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: PRODUCT DETAIL PAGE PREVIEW */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
                          <Eye size={20} className="text-[#C9A84C]" /> 2. Product Detail Page Preview
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-start text-left bg-white p-4 sm:p-6 border border-[#EAEAEA] rounded-2xl shadow-sm">
                          {/* Preview Left: Gallery */}
                          <div className="space-y-3">
                            <div className="relative overflow-hidden rounded-2xl w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-[#F9F9F9] border border-[#EAEAEA]">
                              {previewDiscount > 0 && (
                                <div className="absolute top-4 left-4 z-10 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded shadow-md bg-[#C9A84C] text-[#000]">
                                  −{previewDiscount}% OFF
                                </div>
                              )}
                              {activePreviewImage ? (
                                <img src={activePreviewImage} alt="Preview" className="w-full h-full object-contain p-4 md:p-8 drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)]" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                  <ImageIcon size={64} />
                                  <span className="mt-2 text-sm font-medium">No Image Provided</span>
                                </div>
                              )}
                              <button type="button" className="absolute top-4 right-4 p-2.5 rounded-full z-20 bg-white/80 border border-[#EAEAEA]">
                                <Heart size={16} className="text-[#6B7280]" fill="none" />
                              </button>
                            </div>
                            
                            {/* Preview Thumbnails */}
                            {formData.images.filter(i => i.trim() !== '').length > 1 && (
                              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                                {formData.images.filter(i => i.trim() !== '').map((img, idx) => (
                                  <button key={idx} type="button" onClick={() => setActivePreviewImage(img)} className={`flex-shrink-0 w-[70px] h-[70px] overflow-hidden rounded-xl border ${activePreviewImage === img ? 'border-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.4)]' : 'border-[#EAEAEA]'} bg-[#F9F9F9] transition-all`}>
                                    <img src={img} className="w-full h-full object-cover p-1 opacity-80 hover:opacity-100" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Preview Right: Details */}
                          <div className="flex flex-col relative w-full">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#C9A84C]">{formData.brand || 'BRAND'}</span>
                              <span className="w-px h-3 bg-[#EAEAEA]" />
                              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6B7280]">{formData.category || 'CATEGORY'}</span>
                              {formData.badge && (
                                <span className="ml-auto text-[9px] px-2.5 py-1 tracking-widest uppercase font-bold rounded-sm bg-[#C9A84C]/20 text-[#997B21]">
                                  {formData.badge}
                                </span>
                              )}
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-[2.6rem] font-bold leading-[1.1] mb-6 text-[#111827]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {formData.title || 'Your Product Title Will Appear Here'}
                            </h1>

                            <div className="h-px w-full bg-gradient-to-r from-[#C9A84C]/80 via-[#C9A84C]/20 to-transparent mb-6" />

                            <div className="flex items-end gap-5 mb-6">
                              <div>
                                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase block mb-1 text-[#6B7280]">Price</span>
                                <span className="text-4xl md:text-5xl font-bold tracking-tight leading-none text-[#111827]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                  ₹{formData.price?.toLocaleString() || 0}
                                </span>
                              </div>
                              {formData.originalPrice > formData.price && (
                                <div className="mb-1.5 flex flex-col gap-0.5">
                                  <span className="text-sm font-medium line-through text-[#6B7280]">₹{formData.originalPrice?.toLocaleString()}</span>
                                  <span className="text-[10px] font-bold tracking-wide mt-0.5 px-2 py-0.5 rounded-sm bg-[#C9A84C]/15 text-[#997B21]">
                                    Save ₹{(formData.originalPrice - formData.price).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-6 mb-6 pb-5 text-xs border-b border-[#EAEAEA] text-[#6B7280]">
                              <div>
                                <span className="block text-[9px] font-bold tracking-[0.3em] uppercase mb-0.5">Stock</span>
                                <span className="font-semibold text-[#111827]">{formData.totalStock || 0} units</span>
                              </div>
                              <div>
                                <span className="block text-[9px] font-bold tracking-[0.3em] uppercase mb-0.5">Delivery</span>
                                <span className="font-semibold text-[#111827]">{formData.deliveryTime || '3–8 days'}</span>
                              </div>
                            </div>

                            <div className="p-5 md:p-6 rounded-2xl mb-8 bg-[#FFFFFF] border border-[#EAEAEA]">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-bold tracking-widest uppercase text-[#111827]">Select Quantity</span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded ${formData.totalStock > 0 ? 'bg-[#10B98120] text-[#059669]' : 'bg-[#EF444420] text-[#DC2626]'}`}>
                                  {formData.totalStock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 opacity-60 grayscale pointer-events-none">
                                <div className="col-span-1 sm:col-span-4 flex items-center justify-between px-2 h-12 rounded-xl bg-[#F9F9F9] border border-[#EAEAEA]">
                                  <button type="button" className="w-10 h-full flex items-center justify-center text-xl text-[#6B7280]">−</button>
                                  <span className="font-bold text-base text-[#C9A84C]">1</span>
                                  <button type="button" className="w-10 h-full flex items-center justify-center text-xl text-[#6B7280]">+</button>
                                </div>
                                <button type="button" className="col-span-1 sm:col-span-8 h-12 border-2 border-[#C9A84C] text-[#C9A84C] font-bold text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 rounded-xl">
                                  <ShoppingCart size={14} /> Add To Cart
                                </button>
                                <button type="button" className="col-span-1 sm:col-span-12 h-14 bg-gradient-to-r from-[#C9A84C] to-[#E2BE6A] text-[#000] font-black text-[13px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 rounded-xl">
                                  <Zap size={14} /> Buy It Now
                                </button>
                              </div>
                            </div>

                            {/* Preview Tabs */}
                            <div className="mt-2">
                              <div className="flex border-b border-[#EAEAEA] overflow-x-auto scrollbar-hide">
                                {['About', 'Specs', 'Ideal For', 'Shipping'].map(tab => (
                                  <button key={tab} type="button" onClick={() => setPreviewTab(tab)} className={`relative flex-1 min-w-[90px] px-2 py-3.5 text-[11px] font-bold tracking-[0.15em] uppercase whitespace-nowrap transition-colors text-center ${previewTab === tab ? 'text-[#C9A84C]' : 'text-[#6B7280]'}`}>
                                    {tab}
                                    {previewTab === tab && <div className="absolute bottom-[-1px] left-0 right-0 height-[2px] bg-[#C9A84C]" style={{ height: '2px' }} />}
                                  </button>
                                ))}
                              </div>

                              <div className="pt-6 min-h-[200px]">
                                {previewTab === 'About' && (
                                  <div className="space-y-6">
                                    <p className="text-[13px] leading-[1.8] font-medium text-[#6B7280]">
                                      {formData.aboutDescription || formData.description || 'No specific description provided.'}
                                    </p>
                                    {formData.aboutFeatures.filter(f => f.trim() !== '').length > 0 && (
                                      <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4 text-[#C9A84C]">Key Features</h4>
                                        <ul className="space-y-3">
                                          {formData.aboutFeatures.filter(f => f.trim() !== '').map((f, i) => (
                                            <li key={i} className="flex items-start gap-3 text-[13px] font-medium leading-relaxed text-[#111827]">
                                              <div className="w-1.5 h-1.5 rounded-full mt-[6px] flex-shrink-0 bg-[#C9A84C]" />
                                              <span>{f}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {previewTab === 'Specs' && (
                                  <div>
                                    {formData.specifications.filter(s => s.label.trim() !== '' && s.value.trim() !== '').length > 0 ? (
                                      <div className="rounded-xl overflow-hidden border border-[#EAEAEA]">
                                        {formData.specifications.filter(s => s.label.trim() !== '' && s.value.trim() !== '').map((spec, idx) => (
                                          <div key={idx} className={`flex items-center justify-between p-4 border-b border-[#EAEAEA] last:border-b-0 ${idx % 2 === 0 ? 'bg-[#F9F9F9]' : 'bg-transparent'}`}>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7280]">{spec.label}</span>
                                            <span className="text-[13px] font-semibold text-right max-w-[60%] text-[#111827]">{spec.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-center py-6 font-medium text-[#6B7280]">No specifications available.</p>
                                    )}
                                  </div>
                                )}

                                {previewTab === 'Ideal For' && (
                                  <div>
                                    {formData.idealFor.filter(i => i.trim() !== '').length > 0 ? (
                                      <div className="flex flex-wrap gap-3">
                                        {formData.idealFor.filter(i => i.trim() !== '').map((item, idx) => (
                                          <span key={idx} className="px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase bg-[#F9F9F9] border border-[#EAEAEA] text-[#111827]">
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-center py-6 font-medium text-[#6B7280]">No specific tags provided.</p>
                                    )}
                                  </div>
                                )}

                                {previewTab === 'Shipping' && (
                                  <div className="space-y-6">
                                    <div className="flex gap-4 items-start p-5 rounded-xl bg-[#F9F9F9] border border-[#EAEAEA]">
                                      <Truck color="#C9A84C" size={20} className="mt-0.5 flex-shrink-0" />
                                      <div>
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 text-[#111827]">Delivery Options</h4>
                                        <p className="text-[13px] font-medium leading-relaxed text-[#6B7280]">
                                          Free shipping on prepaid orders. Standard delivery typically takes <strong className="text-[#111827]">{formData.deliveryTime || '3 to 8 business days'}</strong>.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  )}
                </form>
              </div>

              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 z-20">
                <button type="button" onClick={() => setFormData(emptyForm)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors text-sm">Clear Form</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" form="productForm" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed text-sm">
                  <Save size={16} /> 
                  {isSubmitting ? 'Saving...' : ((formData._id || formData.id) ? 'Update Product' : 'Save Product')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 sm:px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelDelete} className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5"><AlertTriangle size={32} /></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">Are you sure you want to delete this product? This action cannot be undone and will permanently remove the item from your inventory.</p>
              <div className="flex w-full gap-3">
                <button onClick={cancelDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">Cancel</button>
                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">{isDeleting ? 'Deleting...' : 'Yes, Delete'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isScanModalOpen && (
        <AdminSmartScanModal
          onClose={() => setIsScanModalOpen(false)}
          onComplete={handleScanComplete}
        />
      )}
    </Layout>
  );
}

// ── AI Scan Modal (llava + x/z-image-turbo via Azure Ollama) ─────────────────

type AdminScanStep = 'idle' | 'scanning' | 'review' | 'error';

function AdminSmartScanModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (extracted: any) => void;
}) {
  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState('');
  const [step,        setStep]        = useState<AdminScanStep>('idle');
  const [errMsg,      setErrMsg]      = useState('');
  const [dragging,    setDragging]    = useState(false);
  const [engine,      setEngine]      = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    productName: '', category: '', price: '', discountedPrice: '',
    validTill: '', description: '', brand: '', imageUrl: '',
  });
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const reset = () => {
    setFile(null); setPreview(''); setStep('idle'); setErrMsg('');
    setEngine(''); setAiGenerated(false);
    setForm({ productName: '', category: '', price: '', discountedPrice: '', validTill: '', description: '', brand: '', imageUrl: '' });
  };

  const pickFile = (f: File) => {
    setFile(f); setPreview(URL.createObjectURL(f)); setStep('idle'); setErrMsg('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) pickFile(f);
  };

  const handleScan = async () => {
    if (!file) return;
    setStep('scanning'); setErrMsg('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res  = await fetch('/api/smart-product-upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Scan failed.');
      const x = data.extracted;
      setEngine(data.engine || 'ocr');
      setAiGenerated(!!x.aiGenerated);
      setForm({
        productName:     x.productName     || '',
        category:        x.category        || '',
        price:           String(x.price    || ''),
        discountedPrice: String(x.discountedPrice || x.price || ''),
        validTill:       x.validTill       || '',
        description:     x.description     || '',
        brand:           x.brand           || '',
        imageUrl:        x.imageUrl        || '',
      });
      setStep('review');
    } catch (err: any) {
      setErrMsg(err.message || 'Something went wrong.');
      setStep('error');
    }
  };

  const engineColor: Record<string, string> = {
    ollama: 'bg-teal-100 text-teal-700',
    gemini: 'bg-blue-100 text-blue-700',
    claude: 'bg-purple-100 text-purple-700',
    ocr:    'bg-amber-100 text-amber-700',
  };

  const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition placeholder-gray-400';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <ScanLine size={16} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">AI Product Scan</h2>
              <p className="text-xs text-gray-400">Powered by Ollama llava + z-image-turbo on Azure</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Step 1: upload */}
          {(step === 'idle' || step === 'scanning' || step === 'error') && (
            <>
              <div
                className={`relative border-2 border-dashed rounded-2xl transition cursor-pointer
                  ${dragging ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-400 hover:bg-gray-50'}
                  ${preview ? 'p-2' : 'p-10'}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !preview && inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
                {preview
                  ? <div className="relative">
                      <img src={preview} alt="Product" className="w-full max-h-56 object-contain rounded-xl" />
                      <button onClick={e => { e.stopPropagation(); reset(); }}
                        className="absolute top-2 right-2 bg-white/90 border border-gray-200 rounded-full p-1 shadow">
                        <X size={14} className="text-gray-600" />
                      </button>
                    </div>
                  : <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
                        <Upload size={24} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Drop a product image or paper here</p>
                        <p className="text-xs text-gray-400 mt-0.5">or click to browse — JPG, PNG, WEBP</p>
                        <p className="text-xs text-teal-600 font-medium mt-2">llava reads Hindi, Tamil, Telugu, Kannada & more</p>
                      </div>
                    </div>
                }
              </div>

              {step === 'scanning' && (
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <RefreshCw size={18} className="text-teal-600 animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-teal-800">Analysing image…</p>
                    <p className="text-xs text-teal-600 mt-0.5">Google OCR reading → qwen2.5 translating</p>
                  </div>
                </div>
              )}
              {step === 'error' && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errMsg}</p>
                </div>
              )}

              <button onClick={handleScan} disabled={!file || step === 'scanning'}
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition">
                {step === 'scanning'
                  ? <><RefreshCw size={15} className="animate-spin" /> Scanning…</>
                  : <><Sparkles size={15} /> Scan &amp; Extract Details</>}
              </button>
            </>
          )}

          {/* Step 2: review */}
          {step === 'review' && (
            <>
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                <p className="text-xs font-semibold text-teal-800 flex-1">Details extracted — review and correct if needed</p>
                {engine && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${engineColor[engine] || 'bg-gray-100 text-gray-600'}`}>
                    via {engine}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* Image preview */}
                <div className="flex gap-3 items-start">
                  <div className="relative w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                    {form.imageUrl
                      ? <img src={form.imageUrl} alt="product" className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-gray-300" /></div>
                    }
                    {aiGenerated && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold bg-teal-600/80 text-white py-0.5">AI Generated</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Product Image URL</label>
                    <input value={form.imageUrl} onChange={e => setF('imageUrl', e.target.value)} className={inputCls} placeholder="Auto-fetched — paste a different URL to override" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Product Name *</label>
                  <input value={form.productName} onChange={e => setF('productName', e.target.value)} className={inputCls} placeholder="e.g. Basmati Rice 5kg" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">MRP (₹) *</label>
                    <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} className={inputCls} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Offer Price (₹)</label>
                    <input type="number" value={form.discountedPrice} onChange={e => setF('discountedPrice', e.target.value)} className={inputCls} placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                    <input value={form.category} onChange={e => setF('category', e.target.value)} className={inputCls} placeholder="e.g. Groceries" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Brand</label>
                    <input value={form.brand} onChange={e => setF('brand', e.target.value)} className={inputCls} placeholder="Brand name" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={3}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition placeholder-gray-400 resize-none"
                    placeholder="Product description…" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={reset}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                  ← Rescan
                </button>
                <button
                  onClick={() => onComplete({ ...form, price: Number(form.price), discountedPrice: Number(form.discountedPrice) })}
                  disabled={!form.productName || !form.price}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition">
                  <Plus size={14} /> Fill Product Form
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}