'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  RefreshCw, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Car,
  MapPin,
  Tag,
  FileText,
  Image as ImageIcon,
  Edit2
} from 'lucide-react';
import axios from 'axios';
import Layout from '../layout/layout';

// --- Toast Component ---
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${getBgColor()}`}
    >
      {getIcon()}
      <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
      <button
        onClick={onClose}
        className={`ml-4 p-1 rounded-full hover:bg-black/5 transition-colors ${getTextColor()}`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// --- Confirmation Dialog Component ---
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          button: 'bg-red-600 hover:bg-red-700',
          text: 'text-red-700'
        };
      case 'warning':
        return {
          icon: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          text: 'text-yellow-700'
        };
      case 'info':
        return {
          icon: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700',
          text: 'text-blue-700'
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 ${colors.bg} border-b ${colors.border}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-6 h-6 ${colors.icon}`} />
            <h3 className={`text-lg font-semibold ${colors.text}`}>{title}</h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Types ---
interface RalleyzItem {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  description: string;
  bg: string;
}

interface ApiResponse {
  success: boolean;
  data?: RalleyzItem[];
  message?: string;
  imageUrl?: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// API Configuration
const API_URL = "https://wow-lifebackend.onrender.com/api";

// Create axios instance with interceptors
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Preview Component ---
interface RalleyzPreviewProps {
  items: RalleyzItem[];
  theme: 'dark' | 'light';
  autoPlay: boolean;
  activeIndex: number;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (index: number) => void;
}

function RalleyzPreview({ 
  items, 
  theme, 
  autoPlay, 
  activeIndex, 
  progress, 
  onNext, 
  onPrev, 
  onSelect 
}: RalleyzPreviewProps) {
  const isDark = theme === 'dark';
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  if (items.length === 0) {
    return (
      <div className={`w-full h-96 flex items-center justify-center rounded-xl border ${
        isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-200'
      }`}>
        <p className={isDark ? 'text-zinc-400' : 'text-gray-500'}>
          Add items to see preview
        </p>
      </div>
    );
  }

  // Safety check to ensure we don't go out of bounds
  const activeItem = items[activeIndex] || items[0];

  const handleImageError = (itemId: number) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const getImageUrl = (item: RalleyzItem) => {
    if (imageErrors[item.id]) {
      return 'https://via.placeholder.com/1200x800?text=Image+Not+Found';
    }
    return item.bg;
  };

  const getThumbnailUrl = (item: RalleyzItem) => {
    if (imageErrors[item.id]) {
      return 'https://via.placeholder.com/200x200?text=No+Image';
    }
    return item.bg;
  };

  return (
    <section 
      className={`relative w-full min-h-[600px] overflow-hidden rounded-xl border transition-colors duration-700
        ${isDark ? 'bg-zinc-950 border-zinc-700' : 'bg-gray-200 border-gray-300'}
      `}
    >
      <div className="relative w-full h-[600px] bg-zinc-900">
        {/* Background Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`preview-bg-${activeItem.id}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <div className="w-full h-full transition-transform duration-[2000ms] group-hover:scale-110">
              <img
                src={getImageUrl(activeItem)}
                alt={activeItem.title}
                className="w-full h-full object-cover brightness-[0.6] md:brightness-[0.75]"
                onError={() => handleImageError(activeItem.id)}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        {autoPlay && (
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 z-20">
            <motion.div 
              className="h-full bg-[#D4AF37]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>
        )}

        {/* Giant Watermark */}
        <div className="absolute top-4 right-6 md:top-6 md:right-8 text-white/10 text-7xl md:text-9xl font-black leading-none pointer-events-none z-10 mix-blend-overlay">
          0{activeIndex + 1}
        </div>

        {/* Text Content */}
        <div className="absolute inset-x-0 top-12 md:top-1/2 md:-translate-y-1/2 md:left-16 z-30 px-6 md:px-0 max-w-sm md:max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`preview-content-${activeItem.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]" />
                <span className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
                  {activeItem.location}
                </span>
              </div>

              <h1 className="text-4xl md:text-7xl font-black text-white uppercase leading-none mb-4 md:mb-6 tracking-tighter drop-shadow-2xl">
                {activeItem.title}
              </h1>

              <p className="text-zinc-300 md:text-zinc-200 text-sm md:text-base leading-relaxed mb-6 md:mb-8 font-light max-w-md border-l-2 border-[#D4AF37]/50 pl-4 md:pl-5">
                {activeItem.description}
              </p>

              <div className="flex items-center gap-3">
                <span className="text-[#D4AF37] text-sm font-medium">
                  {activeItem.subtitle}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Thumbnails */}
        <div className="absolute bottom-6 left-0 right-0 md:left-auto md:right-8 z-40 flex justify-center md:justify-end gap-2 md:gap-3 h-24 md:h-32 items-end px-4">
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <motion.div
                key={`preview-thumb-${item.id}-${index}`}
                onClick={() => onSelect(index)}
                layout
                className={`relative overflow-hidden rounded-xl md:rounded-2xl cursor-pointer border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                  ${isActive 
                    ? 'w-32 md:w-52 h-full shadow-2xl border-[#D4AF37]' 
                    : 'w-8 md:w-12 h-16 md:h-20 grayscale opacity-50 border-white/20'}
                `}
              >
                <img 
                  src={getThumbnailUrl(item)} 
                  className="absolute inset-0 w-full h-full object-cover" 
                  alt={`${item.title} thumbnail`}
                  onError={() => handleImageError(item.id)}
                />
                <div className="absolute inset-0 bg-black/30" />
                
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="absolute bottom-0 left-0 w-full p-2 md:p-3 bg-gradient-to-t from-black/90 to-transparent"
                  >
                    <p className="text-[#D4AF37] text-[8px] md:text-[10px] uppercase font-bold tracking-wider truncate">{item.subtitle}</p>
                    <p className="text-white text-[10px] md:text-sm font-bold leading-none truncate">{item.title}</p>
                    
                    <div className="w-full h-[1.5px] md:h-[2px] bg-white/20 mt-1.5 md:mt-2 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[#D4AF37]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${isActive ? progress : 0}%` }}
                        transition={{ duration: 0.05, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Arrows (for preview mode) */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex justify-between z-30 pointer-events-none">
          <button
            onClick={onPrev}
            disabled={activeIndex === 0}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNext}
            disabled={activeIndex === items.length - 1}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

// --- Main Admin Component ---
export default function AdminRalleyzSection() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // State for Ralleyz Items
  const [items, setItems] = useState<RalleyzItem[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Toast Messages
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {}
  });

  // Preview States
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Editing States
  const [editingItem, setEditingItem] = useState<RalleyzItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);

  // New Item Form
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Track image errors
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Toast functions
  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Confirmation dialog functions
  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'danger'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      }
    });
  };

  const hideConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Check Authentication on Mount
  useEffect(() => {
    checkAuth();
    fetchRalleyzConfig();
  }, []);

  // Auto-play for preview tracking
  useEffect(() => {
    if (activeTab !== 'preview' || !autoPlay || items.length === 0) return;

    const step = 50;
    const duration = 4000;
    
    const interval = setInterval(() => {
      setPreviewProgress((prev) => {
        const next = prev + (step / duration) * 100;
        return next >= 100 ? 100 : next;
      });
    }, step);

    return () => clearInterval(interval);
  }, [activeTab, autoPlay, activePreviewIndex, items.length]);

  // Handle slide transition when preview progress completes
  useEffect(() => {
    if (previewProgress >= 100) {
      setActivePreviewIndex((current) => (current + 1) % items.length);
      setPreviewProgress(0);
    }
  }, [previewProgress, items.length]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        handleLogout();
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  // API Functions
  const fetchRalleyzConfig = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get<ApiResponse>(`${API_URL}/ralleyz`);
      
      if (response.data.success && response.data.data) {
        setItems(response.data.data);
        setImageErrors({});
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error('Error fetching ralleyz config:', err);
      addToast(err.response?.data?.message || 'Failed to load configuration', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      addToast('You must be logged in to save changes', 'error');
      return;
    }

    try {
      setSaving(true);
      
      const response = await axiosInstance.put('/ralleyz', { items });
      
      if (response.data.success) {
        addToast('Configuration saved successfully!', 'success');
        await fetchRalleyzConfig();
      }
    } catch (err: any) {
      console.error('Error saving:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        addToast('Authentication failed. Please log in again.', 'error');
      } else {
        addToast(err.response?.data?.message || 'Failed to save configuration', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!isAuthenticated) {
      addToast('You must be logged in to reset configuration', 'error');
      return;
    }

    showConfirmDialog(
      'Reset Configuration',
      'Are you sure you want to reset to default configuration? This action cannot be undone.',
      async () => {
        try {
          setResetting(true);
          
          const response = await axiosInstance.post('/ralleyz/reset');
          
          if (response.data.success && response.data.data) {
            setItems(response.data.data);
            setImageErrors({});
            addToast('Reset to default successfully!', 'success');
          }
        } catch (err: any) {
          console.error('Error resetting:', err);
          
          if (err.response?.status === 401 || err.response?.status === 403) {
            addToast('Authentication failed. Please log in again.', 'error');
          } else {
            addToast(err.response?.data?.message || 'Failed to reset configuration', 'error');
          }
        } finally {
          setResetting(false);
        }
      },
      'warning'
    );
  };

  const handleImageUpload = async (file: File, itemId: number) => {
    if (!isAuthenticated) {
      addToast('You must be logged in to upload images', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingImage(itemId);

      const response = await axiosInstance.post('/ralleyz/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const imageUrl = response.data.imageUrl;
        
        const updatedItems = items.map(item => 
          item.id === itemId ? { ...item, bg: imageUrl } : item
        );
        
        setItems(updatedItems);
        setImageErrors(prev => ({ ...prev, [itemId]: false }));
        
        addToast('Image uploaded successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      addToast(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(null);
    }
  };

  // Item Management Functions
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle.trim() || !newSubtitle.trim() || !newLocation.trim() || !newDescription.trim() || !newImageUrl.trim()) {
      addToast('Please fill in all fields', 'warning');
      return;
    }

    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    
    const newItem: RalleyzItem = {
      id: newId,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim(),
      location: newLocation.trim(),
      description: newDescription.trim(),
      bg: newImageUrl.trim()
    };

    setItems([...items, newItem]);
    
    // Reset form
    setNewTitle('');
    setNewSubtitle('');
    setNewLocation('');
    setNewDescription('');
    setNewImageUrl('');

    addToast('Item added successfully!', 'success');
  };

  const handleDeleteItem = (id: number) => {
    if (!isAuthenticated) {
      addToast('You must be logged in to delete items', 'error');
      return;
    }

    const itemToDelete = items.find(item => item.id === id);
    
    showConfirmDialog(
      'Delete Item',
      `Are you sure you want to delete "${itemToDelete?.title || 'this item'}"? This action cannot be undone.`,
      () => {
        const updatedItems = items.filter(item => item.id !== id);
        
        setItems(updatedItems);
        
        if (activePreviewIndex >= updatedItems.length) {
          setActivePreviewIndex(Math.max(0, updatedItems.length - 1));
        }
        
        setImageErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
        
        addToast('Item deleted successfully!', 'success');
      },
      'danger'
    );
  };

  const handleEditItem = (item: RalleyzItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    if (!editingItem.title.trim() || !editingItem.subtitle.trim() || 
        !editingItem.location.trim() || !editingItem.description.trim() || !editingItem.bg.trim()) {
      addToast('All fields are required', 'warning');
      return;
    }

    const updatedItems = items.map(item => 
      item.id === editingItem.id ? editingItem : item
    );
    
    setItems(updatedItems);
    setIsModalOpen(false);
    setEditingItem(null);
    
    addToast('Item updated successfully!', 'success');
  };

  const handleMoveItem = (id: number, direction: 'up' | 'down') => {
    if (!isAuthenticated) {
      addToast('You must be logged in to reorder items', 'error');
      return;
    }

    const currentIndex = items.findIndex(item => item.id === id);
    
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === items.length - 1)
    ) return;

    const newItems = [...items];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap the items
    [newItems[currentIndex], newItems[swapIndex]] = [newItems[swapIndex], newItems[currentIndex]];
    
    setItems(newItems);
    
    // Update active preview index if needed
    if (activePreviewIndex === currentIndex) {
      setActivePreviewIndex(swapIndex);
    } else if (activePreviewIndex === swapIndex) {
      setActivePreviewIndex(currentIndex);
    }
  };

  // Preview Navigation
  const handlePrevPreview = () => {
    setActivePreviewIndex(Math.max(0, activePreviewIndex - 1));
    setPreviewProgress(0);
  };

  const handleNextPreview = () => {
    setActivePreviewIndex(Math.min(items.length - 1, activePreviewIndex + 1));
    setPreviewProgress(0);
  };

  const handleSelectPreview = (index: number) => {
    setActivePreviewIndex(index);
    setPreviewProgress(0);
  };

  const handleImageError = (itemId: number) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const getImageUrl = (item: RalleyzItem) => {
    if (imageErrors[item.id]) {
      return 'https://via.placeholder.com/200x200?text=No+Image';
    }
    return item.bg;
  };

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading Ralleyz configuration...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        {/* Toast Messages */}
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {confirmDialog.isOpen && (
            <ConfirmDialog
              isOpen={confirmDialog.isOpen}
              title={confirmDialog.title}
              message={confirmDialog.message}
              type={confirmDialog.type}
              onConfirm={confirmDialog.onConfirm}
              onCancel={hideConfirmDialog}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ralleyz Section Manager</h1>
            <p className="text-sm md:text-base text-gray-500">
              {isAuthenticated ? (
                <>Logged in as <span className="font-semibold text-gray-700">{user?.name || 'Admin'}</span></>
              ) : (
                'You are in read-only mode. Login to make changes.'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Tab Toggle */}
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('edit')}
                disabled={saving || resetting}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-600'
                } ${saving || resetting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Edit2 size={16} /> Edit
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                disabled={saving || resetting}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'preview' ? 'bg-white shadow' : 'text-gray-600'
                } ${saving || resetting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Eye size={16} /> Preview
              </button>
            </div>

            {/* Authentication Status and Actions */}
            {isAuthenticated ? (
              <>
                {/* Reset Button */}
                <button 
                  onClick={handleReset}
                  disabled={saving || resetting}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCw size={18} />
                  )}
                  Reset
                </button>

                {/* Save Button */}
                <button 
                  onClick={handleSave}
                  disabled={saving || resetting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save
                    </>
                  )}
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm"
              >
                Login to Edit
              </a>
            )}
          </div>
        </div>

        {/* Read-only warning */}
        {!isAuthenticated && activeTab === 'edit' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              You are in read-only mode. Changes you make will not be saved. Please <a href="/login" className="font-semibold underline">login</a> to edit the Ralleyz section.
            </p>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Live Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                    autoPlay 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {autoPlay ? 'Auto-play On' : 'Auto-play Off'}
                </button>
                <span className="text-sm text-gray-500">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <RalleyzPreview 
              items={items}
              theme={theme}
              autoPlay={autoPlay}
              activeIndex={activePreviewIndex}
              progress={previewProgress}
              onPrev={handlePrevPreview}
              onNext={handleNextPreview}
              onSelect={handleSelectPreview}
            />
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Add New Item Form */}
            <div className="lg:col-span-1 space-y-6">
              {/* Add New Item Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                  <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                    <Car size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Add New Item</h3>
                </div>

                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Tag size={14} /> Title
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm"
                      placeholder="Big Volt Rover"
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Tag size={14} /> Subtitle
                    </label>
                    <input
                      type="text"
                      value={newSubtitle}
                      onChange={(e) => setNewSubtitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm"
                      placeholder="Remote Control Car"
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <MapPin size={14} /> Location
                    </label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm"
                      placeholder="Off-Road Series"
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <FileText size={14} /> Description
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm resize-none"
                      placeholder="Enter description..."
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <ImageIcon size={14} /> Image URL
                    </label>
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm"
                      placeholder="/chars/bg1.avif"
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving || !isAuthenticated}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                    Add Item
                  </button>
                </form>
              </div>

              {/* Quick Tips */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">💡 Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use high-quality images for best results</li>
                  <li>• Keep titles short and impactful</li>
                  <li>• Descriptions should be 1-2 sentences</li>
                  <li>• Items appear in the exact order shown here</li>
                  <li>• {isAuthenticated ? 'Changes are saved to database when you click Save' : 'Login to save changes to database'}</li>
                </ul>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h4 className="font-medium text-gray-800 mb-3">Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-semibold text-gray-900">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">With Images:</span>
                    <span className="font-semibold text-gray-900">{items.filter(i => i.bg).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next ID:</span>
                    <span className="font-semibold text-gray-900">
                      {items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Items List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items List Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Car size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Ralleyz Items ({items.length})</h3>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <Car size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-2">No items found</p>
                    <p className="text-sm text-gray-400">Add your first Ralleyz item using the form</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {items.map((item, index) => (
                      <motion.div
                        key={`item-${item.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-yellow-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-4">
                          {/* Thumbnail */}
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                            <img 
                              src={getImageUrl(item)} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(item.id)}
                            />
                            {uploadingImage === item.id && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h4 className="font-semibold text-gray-800">{item.title}</h4>
                                <p className="text-xs text-gray-500">{item.subtitle}</p>
                              </div>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                ID: {item.id}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin size={10} className="text-gray-400" />
                                <span className="text-gray-600">{item.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ImageIcon size={10} className="text-gray-400" />
                                <span className="text-gray-600 truncate">
                                  {item.bg.split('/').pop() || 'image.jpg'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {item.description}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                disabled={!isAuthenticated}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Edit
                              </button>

                              {/* Image Upload */}
                              <label className={`px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors cursor-pointer ${!isAuthenticated || uploadingImage === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, item.id);
                                  }}
                                  disabled={!isAuthenticated}
                                />
                                {uploadingImage === item.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                                    Uploading
                                  </>
                                ) : (
                                  <>
                                    <Upload size={12} className="inline mr-1" />
                                    Change Image
                                  </>
                                )}
                              </label>

                              {/* Move Up */}
                              <button
                                onClick={() => handleMoveItem(item.id, 'up')}
                                disabled={index === 0 || !isAuthenticated}
                                className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Move Up"
                              >
                                <ChevronLeft size={14} className="rotate-90" />
                              </button>

                              {/* Move Down */}
                              <button
                                onClick={() => handleMoveItem(item.id, 'down')}
                                disabled={index === items.length - 1 || !isAuthenticated}
                                className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Move Down"
                              >
                                <ChevronRight size={14} className="rotate-90" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={!isAuthenticated}
                                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {isModalOpen && editingItem && (
            <motion.div
              key="edit-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Edit Item #{editingItem.id}</h2>
                    <p className="text-sm text-gray-500">Update the details for this item below.</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Title Field */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editingItem.title}
                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter title"
                      />
                    </div>

                    {/* Subtitle Field */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={editingItem.subtitle}
                        onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter subtitle"
                      />
                    </div>

                    {/* Location Field */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editingItem.location}
                        onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter location"
                      />
                    </div>

                     {/* Image URL Field */}
                     <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={editingItem.bg}
                        onChange={(e) => setEditingItem({ ...editingItem, bg: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                        placeholder="/path/to/image.jpg"
                      />
                    </div>

                    {/* Description Field (Full Width) */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editingItem.description}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Enter description"
                      />
                    </div>

                    {/* Image Preview (Full Width) */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Preview
                      </label>
                      <div className="relative h-48 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <img 
                          src={editingItem.bg || 'https://via.placeholder.com/800x400?text=No+Image'} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-white">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}