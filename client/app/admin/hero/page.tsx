'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, Car, Shield, Trophy, ArrowRight, CarFront, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import Layout from '../layout/layout';
import axios from 'axios';

// --- Types ---
interface BrandLogo {
  name: string;
  src: string;
}

interface HeroContent {
  badgeText: string;
  title: string;
  titleGradient: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  carImages: string[];
  brands: BrandLogo[];
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
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page if needed
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Preview Component ---
interface HeroSectionPreviewProps {
  content: HeroContent;
  theme: 'dark' | 'light';
}

function HeroSectionPreview({ content, theme }: HeroSectionPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  useEffect(() => { 
    if (content.carImages.length === 0) return;
    const interval = setInterval(() => { 
      setCurrentIndex((prev) => (prev + 1) % content.carImages.length); 
    }, 3500); 
    return () => clearInterval(interval); 
  }, [content.carImages]);

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const getTextColor = () => theme === 'light' ? 'text-gray-900' : 'text-white';
  const getSecondaryTextColor = () => theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const getBorderColor = () => theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const getGridColor = () => theme === 'light' ? 'bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]';
  const getBgColor = () => theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a]';
  
  const textVariants = { 
    hidden: { opacity: 0, y: 30 }, 
    visible: (delay: number) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay, 
        duration: 0.6, 
        ease: "easeOut" as const
      } 
    }) 
  };
  
  const getCarVariant = (index: number) => { 
    if (content.carImages.length === 0) return 'hidden';
    const total = content.carImages.length; 
    if (index === currentIndex) return 'active'; 
    if (index === (currentIndex + 1) % total) return 'next'; 
    if (index === (currentIndex - 1 + total) % total) return 'prev'; 
    return 'hidden'; 
  };
  
  const carVariants = {
    next: { 
      x: 240, y: -180, scale: 0.55, opacity: 0.5, zIndex: 5, 
      filter: 'blur(2px) grayscale(100%)', 
      transition: { duration: 0.8, ease: "easeInOut" as const }
    },
    active: { 
      x: 0, y: 0, scale: 1.15, opacity: 1, zIndex: 20, 
      filter: 'blur(0px) grayscale(0%)', 
      transition: { type: "spring" as const, stiffness: 180, damping: 14 } 
    },
    prev: { 
      x: 240, y: 180, scale: 0.55, opacity: 0.5, zIndex: 4, 
      filter: 'blur(2px) grayscale(100%)', 
      transition: { duration: 0.8, ease: "easeInOut" as const }
    },
    hidden: { x: 350, y: 0, scale: 0, opacity: 0 }
  };

  if (content.carImages.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-gray-500">Add car images to see preview</p>
      </div>
    );
  }

  return (
    // FIX: Added getBgColor() here to ensure the preview has its own solid background, avoiding white-on-white text
    <section className={`relative min-h-[600px] overflow-hidden flex flex-col justify-center rounded-xl border ${getBorderColor()} ${getBgColor()}`}>
      <div className="absolute right-[-20%] top-[20%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-[#D4AF37]/20 to-transparent blur-[80px] md:blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className={`absolute inset-0 ${getGridColor()} bg-[size:16px_16px] md:bg-[size:24px_24px] -z-20`}></div>
      
      <div className="flex-grow flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text Content */}
            <div className="flex flex-col justify-center text-center lg:text-left z-10 lg:order-1">
              <motion.div custom={0} initial="hidden" animate="visible" variants={textVariants} className="flex justify-center lg:justify-start mb-4 md:mb-6">
                <span className="px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/10 to-transparent text-[#D4AF37] text-xs md:text-sm font-bold tracking-wide flex items-center gap-2">
                  <Trophy size={14} className="md:size-[16px]" /> {content.badgeText}
                </span>
              </motion.div>
              
              <motion.h1 custom={0.2} initial="hidden" animate="visible" variants={textVariants} className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black ${getTextColor()} leading-tight mb-4 md:mb-6`}>
                {content.title} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FCEEAC] to-[#D4AF37]">
                  {content.titleGradient}
                </span>
              </motion.h1>
              
              <motion.p custom={0.4} initial="hidden" animate="visible" variants={textVariants} className={`${getSecondaryTextColor()} text-sm md:text-lg max-w-lg mx-auto lg:mx-0 mb-6 md:mb-10 leading-relaxed`}>
                {content.description}
              </motion.p>
              
              <motion.div custom={0.6} initial="hidden" animate="visible" variants={textVariants} className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <button className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC] text-black font-bold text-base md:text-lg rounded-lg md:rounded-xl hover:shadow-lg md:hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 group">
                  {content.primaryButtonText} <ArrowRight size={18} className="md:size-[20px] group-hover:translate-x-1 transition-transform" />
                </button>
                <button className={`px-6 py-3 md:px-8 md:py-4 ${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} border font-bold text-base md:text-lg rounded-lg md:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3`}>
                  {content.secondaryButtonText} <CarFront size={18} className="md:size-[20px]" />
                </button>
              </motion.div>
            </div>

            {/* Car Images */}
            <div className="relative h-[250px] md:h-[400px] lg:h-[500px] w-full flex items-center justify-center perspective-[800px] md:perspective-[1200px] lg:order-2">
              <div className="absolute z-0 w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl md:blur-3xl" />
              {content.carImages.map((imgSrc, index) => { 
                const variant = getCarVariant(index); 
                if (variant === 'hidden' || imageErrors.has(index)) return null; 
                return ( 
                  <motion.div key={index} variants={carVariants} initial="next" animate={variant} className="absolute w-full flex items-center justify-center origin-center will-change-transform" style={{ transformStyle: "preserve-3d" }}>
                    <motion.div className="relative" animate={variant === 'active' ? { y: [-8, 8, -8], transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const } } : {}}>
                      <img 
                        src={imgSrc} 
                        alt={`Vehicle ${index + 1}`} 
                        loading="eager" 
                        className="w-full max-w-[240px] md:max-w-[320px] lg:max-w-[450px] h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                        onError={() => handleImageError(index)}
                      />
                    </motion.div>
                  </motion.div> 
                ); 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Brand Logos */}
      {content.brands.length > 0 && (
        <div className={`relative w-full border-t ${getBorderColor()} ${theme === 'light' ? 'bg-white/60' : 'bg-black/60'} backdrop-blur-lg mt-8 py-4 md:py-6`}>
          <div className={`absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r ${theme === 'light' ? 'from-white' : 'from-[#0a0a0a]'} to-transparent z-10 pointer-events-none`} />
          <div className={`absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l ${theme === 'light' ? 'from-white' : 'from-[#0a0a0a]'} to-transparent z-10 pointer-events-none`} />
          <div className="flex overflow-hidden">
            <motion.div 
              className="flex items-center gap-8 md:gap-16 lg:gap-24 px-6 md:px-12" 
              animate={{ x: "-50%" }} 
              transition={{ duration: 30, ease: "linear", repeat: Infinity }}
            >
              {[...content.brands, ...content.brands].map((brand, i) => ( 
                <div key={`${brand.name}-${i}`} className="group relative flex-shrink-0 cursor-pointer">
                  <img 
                    src={brand.src} 
                    alt={brand.name} 
                    loading="lazy" 
                    className={`h-8 md:h-10 lg:h-12 w-auto object-contain transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 md:group-hover:scale-125 ${theme === 'light' ? 'grayscale opacity-50' : 'grayscale opacity-40'}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x50?text=Logo';
                    }}
                  />
                </div> 
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}

// --- Main Admin Component ---
export default function HeroAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // --- State for Custom Popup Modal ---
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  // --- State for Hero Content ---
  const [content, setContent] = useState<HeroContent>({
    badgeText: '',
    title: '',
    titleGradient: '',
    description: '',
    primaryButtonText: '',
    secondaryButtonText: '',
    carImages: [],
    brands: []
  });

  // --- UI States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: ''
  });
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- Local States for Forms ---
  const [newCarUrl, setNewCarUrl] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandUrl, setNewBrandUrl] = useState('');

  // --- Check Authentication on Mount ---
  useEffect(() => {
    checkAuth();
    fetchHeroConfig();
  }, []);

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

  // --- API Functions ---
  const fetchHeroConfig = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      const response = await axios.get(`${API_URL}/hero`);
      
      if (response.data.success) {
        setContent(response.data.data);
      } else {
        setFetchError('Failed to load configuration');
      }
    } catch (error: any) {
      console.error('Error fetching hero config:', error);
      setFetchError(error.response?.data?.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveStatus({ type: 'error', message: 'You must be logged in to save changes' });
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus({ type: '', message: '' });
      
      const response = await axiosInstance.put('/hero', content);
      
      if (response.data.success) {
        setSaveStatus({ type: 'success', message: 'Configuration saved successfully!' });
        setContent(response.data.data);
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      if (error.response?.status === 401) {
        setSaveStatus({ type: 'error', message: 'Session expired. Please login again.' });
        handleLogout();
      } else if (error.response?.status === 403) {
        setSaveStatus({ type: 'error', message: 'You do not have permission to perform this action' });
      } else {
        setSaveStatus({ type: 'error', message: error.response?.data?.message || 'Failed to save configuration' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const executeReset = async () => {
    try {
      setIsResetting(true);
      setSaveStatus({ type: '', message: '' });
      
      const response = await axiosInstance.post('/hero/reset');
      
      if (response.data.success) {
        setContent(response.data.data);
        setSaveStatus({ type: 'success', message: 'Configuration reset to defaults!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      console.error('Error resetting config:', error);
      if (error.response?.status === 401) {
        setSaveStatus({ type: 'error', message: 'Session expired. Please login again.' });
        handleLogout();
      } else if (error.response?.status === 403) {
        setSaveStatus({ type: 'error', message: 'You do not have permission to perform this action' });
      } else {
        setSaveStatus({ type: 'error', message: error.response?.data?.message || 'Failed to reset configuration' });
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetClick = () => {
    if (!isAuthenticated) {
      setSaveStatus({ type: 'error', message: 'You must be logged in to reset configuration' });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Configuration',
      message: 'Are you sure you want to restore the default Hero configuration? This action cannot be undone and will overwrite your database.',
      action: executeReset
    });
  };

  // --- Handlers for Text Content ---
  const handleContentChange = (field: keyof HeroContent, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  // --- Handlers for Car Images ---
  const handleAddCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarUrl.trim()) return;
    
    setContent(prev => ({
      ...prev,
      carImages: [...prev.carImages, newCarUrl.trim()]
    }));
    setNewCarUrl('');
  };

  const executeDeleteCar = (index: number) => {
    setContent(prev => ({
      ...prev,
      carImages: prev.carImages.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteCarClick = (index: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Car Image',
      message: 'Are you sure you want to remove this car image? Note: You must click "Save Changes" to update the database.',
      action: () => executeDeleteCar(index)
    });
  };

  // --- Handlers for Brands ---
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || !newBrandUrl.trim()) return;
    
    setContent(prev => ({
      ...prev,
      brands: [...prev.brands, { 
        name: newBrandName.trim(), 
        src: newBrandUrl.trim() 
      }]
    }));
    setNewBrandName('');
    setNewBrandUrl('');
  };

  const executeDeleteBrand = (index: number) => {
    setContent(prev => ({
      ...prev,
      brands: prev.brands.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteBrandClick = (index: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Brand Logo',
      message: 'Are you sure you want to remove this brand logo? Note: You must click "Save Changes" to update the database.',
      action: () => executeDeleteBrand(index)
    });
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading hero configuration...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Error State ---
  if (fetchError) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load</h2>
            <p className="text-gray-600 mb-4">{fetchError}</p>
            <button 
              onClick={fetchHeroConfig}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

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

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hero Section Manager</h1>
            <p className="text-sm md:text-base text-gray-500">
              {isAuthenticated ? (
                <>Logged in as <span className="font-semibold text-gray-700">{user?.name || 'Admin'}</span></>
              ) : (
                'You are in read-only mode. Login to make changes.'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Theme Toggle - ADDED THIS BACK */}
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value as 'dark'|'light')} 
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none text-gray-700 font-medium"
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>

            {/* Tab Toggle */}
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('edit')}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Edit2 size={16} /> Edit
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'preview' ? 'bg-white shadow' : 'text-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Eye size={16} /> Preview
              </button>
            </div>

            {/* Authentication Status and Actions */}
            {isAuthenticated ? (
              <>
                <button 
                  onClick={handleResetClick}
                  disabled={isSaving || isResetting}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  Reset
                </button>

                <button 
                  onClick={handleSave}
                  disabled={isSaving || isResetting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <><Loader2 size={18} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={18} /> Save</>
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

        {/* Status Messages */}
        {saveStatus.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            saveStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveStatus.type === 'success' ? <CheckCircle size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-red-600" />}
            <p className="text-sm font-medium">{saveStatus.message}</p>
          </div>
        )}

        {/* Read-only warning */}
        {!isAuthenticated && activeTab === 'edit' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-700">
              You are in read-only mode. Changes you make will not be saved. Please <a href="/login" className="font-semibold underline">login</a> to edit the hero section.
            </p>
          </div>
        )}

        {/* Main Content */}
        {activeTab === 'preview' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Preview</h2>
            <HeroSectionPreview content={content} theme={theme} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Text Content */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Text Content</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={content.badgeText}
                      onChange={(e) => handleContentChange('badgeText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      disabled={isSaving || !isAuthenticated}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (first part)</label>
                    <input
                      type="text"
                      value={content.title}
                      onChange={(e) => handleContentChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      disabled={isSaving || !isAuthenticated}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title Gradient Part</label>
                    <input
                      type="text"
                      value={content.titleGradient}
                      onChange={(e) => handleContentChange('titleGradient', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      disabled={isSaving || !isAuthenticated}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={content.description}
                      onChange={(e) => handleContentChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      disabled={isSaving || !isAuthenticated}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button</label>
                      <input
                        type="text"
                        value={content.primaryButtonText}
                        onChange={(e) => handleContentChange('primaryButtonText', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        disabled={isSaving || !isAuthenticated}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
                      <input
                        type="text"
                        value={content.secondaryButtonText}
                        onChange={(e) => handleContentChange('secondaryButtonText', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        disabled={isSaving || !isAuthenticated}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Images and Brands */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Car Images Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                  <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                    <Car size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Carousel Images ({content.carImages.length}/10)</h3>
                </div>

                <form onSubmit={handleAddCar} className="flex gap-3 mb-6">
                  <input 
                    type="text" 
                    placeholder="Enter image URL (e.g., https://... or /local/path.png)" 
                    value={newCarUrl}
                    onChange={(e) => setNewCarUrl(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    disabled={isSaving || !isAuthenticated || content.carImages.length >= 10}
                  />
                  <button 
                    type="submit"
                    className="bg-gray-900 text-white p-2.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving || !isAuthenticated || !newCarUrl.trim() || content.carImages.length >= 10}
                  >
                    <Plus size={20} />
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {content.carImages.map((img, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-bold text-gray-500 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden border flex-shrink-0">
                          <img 
                            src={img} 
                            alt="preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/50?text=Err')} 
                          />
                        </div>
                        <span className="text-sm text-gray-600 truncate">{img}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteCarClick(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 flex-shrink-0 disabled:opacity-50"
                        disabled={isSaving || !isAuthenticated}
                        title="Delete Image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Logos Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Brand Logos ({content.brands.length})</h3>
                </div>

                <form onSubmit={handleAddBrand} className="flex flex-col gap-3 mb-6">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Brand Name" 
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      disabled={isSaving || !isAuthenticated}
                    />
                    <input 
                      type="text" 
                      placeholder="Logo URL" 
                      value={newBrandUrl}
                      onChange={(e) => setNewBrandUrl(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      disabled={isSaving || !isAuthenticated}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving || !isAuthenticated || !newBrandName.trim() || !newBrandUrl.trim()}
                  >
                    <Plus size={18} /> Add Brand
                  </button>
                </form>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {content.brands.map((brand, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center border shadow-sm p-1 flex-shrink-0">
                          <img 
                            src={brand.src} 
                            alt={brand.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/50?text=?')} 
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-gray-700 truncate">{brand.name}</span>
                          <span className="text-xs text-gray-400 truncate">{brand.src}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteBrandClick(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 flex-shrink-0 disabled:opacity-50"
                        disabled={isSaving || !isAuthenticated}
                        title="Delete Brand"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}