'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Plus, Trash2, AlertCircle, CheckCircle2, Tag, Layers, AlertTriangle, Loader2
} from 'lucide-react';
import Layout from '../layout/layout'; // Importing your centralized Admin Layout

// Define your backend API URL here
const API_URL = "https://wow-lifebackend.onrender.com/api";

export default function DynamicContentPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{_id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;
      
      // Updated fetch URL
      const response = await fetch(`${API_URL}/admin/categories`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setIsSubmitting(true);

    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;

      // Updated fetch URL
      const response = await fetch(`${API_URL}/admin/categories`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to add category');
      
      showNotification('Category added successfully!', 'success');
      setNewCategory('');
      fetchCategories();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Delete Confirmation Modal
  const initiateDelete = (cat: {_id: string, name: string}) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  // Execute actual deletion
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;

      // Updated fetch URL
      const response = await fetch(`${API_URL}/admin/categories/${categoryToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to delete category');
      
      showNotification('Category deleted successfully!', 'success');
      fetchCategories();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 sm:px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModalOpen(false)} className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5"><AlertTriangle size={32} /></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Category?</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-800">"{categoryToDelete?.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">Cancel</button>
                <button onClick={confirmDeleteCategory} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-8 max-w-[1200px] mx-auto relative">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dynamic Content</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global categories used across the storefront and admin panel.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Layers size={20} className="text-indigo-600" /> Manage Categories
          </h2>
          
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3 mb-8">
            <input 
              type="text" 
              placeholder="e.g. Cars & Vehicle Playsets" 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50"
            />
            <button 
              type="submit" 
              disabled={isSubmitting || !newCategory.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50 min-w-[160px]"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {isSubmitting ? 'Adding...' : 'Add Category'}
            </button>
          </form>

          {isLoading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <span>Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <Tag size={40} className="opacity-30 mb-3" />
              <p>No categories found. Add your first category above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-sm transition-all group">
                  <span className="font-semibold text-gray-800">{cat.name}</span>
                  <button 
                    onClick={() => initiateDelete(cat)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}