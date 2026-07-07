'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Save, Video, Play, Pause, Volume2, VolumeX,
  Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, LogOut,
  ArrowUp, ArrowDown, Move, Grid, Settings, X
} from 'lucide-react';
import Layout from '../layout/layout';
import axios from 'axios';
import TrendingSection from '../../components-sections/TrendingSection';

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
  (error) => Promise.reject(error)
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

interface Video {
  _id: string;
  title: string;
  category: string;
  views: string;
  duration: string;
  src: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TrendingConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  badgeText: string;
  buttonText: string;
  isActive: boolean;
}

// Confirmation Modal Props
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

// Confirmation Modal Component
const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  isProcessing = false 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 z-10"
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          </div>

          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const CATEGORIES = ['Premium', 'Limited', 'Exclusive', 'Elite', 'Collector\'s', 'Tech', 'Sport', 'Luxury'];

export default function TrendingAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // State for videos
  const [videos, setVideos] = useState<Video[]>([]);
  const [config, setConfig] = useState<TrendingConfig>({
    sectionTitle: 'Hot Drops',
    sectionSubtitle: 'Discover the most coveted R/C and scale models dominating the community this week.',
    badgeText: 'Trending Now',
    buttonText: 'EXPLORE ALL',
    isActive: true
  });

  // UI States
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

  // Modal states
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    videoId: string | null;
    videoTitle: string;
  }>({
    isOpen: false,
    videoId: null,
    videoTitle: ''
  });

  const [resetModal, setResetModal] = useState<{
    isOpen: boolean;
    isProcessing: boolean;
  }>({
    isOpen: false,
    isProcessing: false
  });

  // Form states
  const [newVideo, setNewVideo] = useState({
    title: '',
    category: 'Premium',
    views: '',
    duration: '',
    src: ''
  });

  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  useEffect(() => {
    checkAuth();
    fetchTrendingData();
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
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  const fetchTrendingData = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

      const [videosRes, configRes] = await Promise.all([
        axios.get(`${API_URL}/trending`),
        axios.get(`${API_URL}/trending/config`)
      ]);

      if (videosRes.data.success) {
        setVideos(videosRes.data.data);
      }

      if (configRes.data.success) {
        setConfig(configRes.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setFetchError(error.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!isAuthenticated) {
      setSaveStatus({ type: 'error', message: 'Please login to save changes' });
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus({ type: '', message: '' });

      const response = await axiosInstance.put('/trending/config/update', config);

      if (response.data.success) {
        setSaveStatus({ type: 'success', message: 'Configuration saved!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      setSaveStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to save configuration' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setSaveStatus({ type: 'error', message: 'Please login to add videos' });
      return;
    }

    if (!newVideo.title || !newVideo.src) {
      setSaveStatus({ type: 'error', message: 'Title and video URL are required' });
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus({ type: '', message: '' });

      const response = await axiosInstance.post('/trending', {
        ...newVideo,
        views: newVideo.views || '0',
        duration: newVideo.duration || '0:00'
      });

      if (response.data.success) {
        setVideos(prev => [...prev, response.data.data].sort((a, b) => a.order - b.order));
        setNewVideo({ title: '', category: 'Premium', views: '', duration: '', src: '' });
        setSaveStatus({ type: 'success', message: 'Video added successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      console.error('Error adding video:', error);
      setSaveStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to add video' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateVideo = async (video: Video) => {
    if (!isAuthenticated) return;

    try {
      setIsSaving(true);
      setSaveStatus({ type: '', message: '' });

      const response = await axiosInstance.put(`/trending/${video._id}`, video);

      if (response.data.success) {
        setVideos(prev => prev.map(v => v._id === video._id ? response.data.data : v));
        setEditingVideo(null);
        setSaveStatus({ type: 'success', message: 'Video updated!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      console.error('Error updating video:', error);
      setSaveStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to update video' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (videoId: string, videoTitle: string) => {
    setDeleteModal({
      isOpen: true,
      videoId,
      videoTitle
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.videoId) return;

    try {
      setIsSaving(true);
      
      const response = await axiosInstance.delete(`/trending/${deleteModal.videoId}`);

      if (response.data.success) {
        setVideos(prev => prev.filter(v => v._id !== deleteModal.videoId));
        setSaveStatus({ type: 'success', message: 'Video deleted successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      console.error('Error deleting video:', error);
      setSaveStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to delete video' 
      });
    } finally {
      setIsSaving(false);
      setDeleteModal({ isOpen: false, videoId: null, videoTitle: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, videoId: null, videoTitle: '' });
  };

  const handleResetClick = () => {
    setResetModal({ isOpen: true, isProcessing: false });
  };

  const handleResetConfirm = async () => {
    try {
      setResetModal(prev => ({ ...prev, isProcessing: true }));
      
      const response = await axiosInstance.post('/trending/config/reset');
      
      if (response.data.success) {
        setConfig(response.data.data);
        setSaveStatus({ type: 'success', message: 'Configuration reset successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      console.error('Error resetting:', error);
      setSaveStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to reset configuration' 
      });
    } finally {
      setResetModal({ isOpen: false, isProcessing: false });
    }
  };

  const handleResetCancel = () => {
    setResetModal({ isOpen: false, isProcessing: false });
  };

  const handleReorder = async (videoId: string, direction: 'up' | 'down') => {
    const index = videos.findIndex(v => v._id === videoId);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === videos.length - 1)
    ) return;

    const newVideos = [...videos];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap orders
    const tempOrder = newVideos[index].order;
    newVideos[index].order = newVideos[swapIndex].order;
    newVideos[swapIndex].order = tempOrder;

    // Sort by new order
    newVideos.sort((a, b) => a.order - b.order);

    try {
      setIsSaving(true);
      
      const response = await axiosInstance.post('/trending/reorder', {
        orders: [
          { id: newVideos[index]._id, order: newVideos[index].order },
          { id: newVideos[swapIndex]._id, order: newVideos[swapIndex].order }
        ]
      });

      if (response.data.success) {
        setVideos(newVideos);
      }
    } catch (error) {
      console.error('Error reordering:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading trending content...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (fetchError) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load</h2>
            <p className="text-gray-600 mb-4">{fetchError}</p>
            <button 
              onClick={fetchTrendingData}
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
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Video"
        message={`Are you sure you want to delete "${deleteModal.videoTitle}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isProcessing={isSaving}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModal.isOpen}
        title="Reset Configuration"
        message="Are you sure you want to reset all videos to default? This will delete all your custom videos and cannot be undone."
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
        isProcessing={resetModal.isProcessing}
      />

      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Section Manager</h1>
            <p className="text-sm md:text-base text-gray-500">
              {isAuthenticated ? (
                <>Logged in as <span className="font-semibold text-gray-700">{user?.name || 'Admin'}</span></>
              ) : (
                'Read-only mode. Login to make changes.'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                <Edit2 size={16} /> Edit
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'preview' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                <Eye size={16} /> Preview
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <button 
                  onClick={handleResetClick}
                  disabled={isResetting}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm disabled:opacity-50"
                >
                  {isResetting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  Reset
                </button>

                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm md:text-base disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Config
                </button>
              </>
            ) : (
              <a href="/login" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm">
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
              Read-only mode. <a href="/login" className="font-semibold underline">Login</a> to edit.
            </p>
          </div>
        )}

        {/* Main Content */}
        {activeTab === 'preview' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Preview</h2>
            <TrendingSection theme={theme} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Config */}
            <div className="lg:col-span-1 space-y-6">
              {/* Section Config Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <Settings size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Section Configuration</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={config.badgeText}
                      onChange={(e) => setConfig({...config, badgeText: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={config.sectionTitle}
                      onChange={(e) => setConfig({...config, sectionTitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <textarea
                      value={config.sectionSubtitle}
                      onChange={(e) => setConfig({...config, sectionSubtitle: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={config.buttonText}
                      onChange={(e) => setConfig({...config, buttonText: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      disabled={!isAuthenticated}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Videos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add Video Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                  <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                    <Video size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Add New Video</h3>
                </div>

                <form onSubmit={handleAddVideo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        value={newVideo.title}
                        onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        disabled={!isAuthenticated}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newVideo.category}
                        onChange={(e) => setNewVideo({...newVideo, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        disabled={!isAuthenticated}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Views (e.g., "2.4M")</label>
                      <input
                        type="text"
                        value={newVideo.views}
                        onChange={(e) => setNewVideo({...newVideo, views: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        disabled={!isAuthenticated}
                        placeholder="2.4M"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (e.g., "0:45")</label>
                      <input
                        type="text"
                        value={newVideo.duration}
                        onChange={(e) => setNewVideo({...newVideo, duration: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        disabled={!isAuthenticated}
                        placeholder="0:45"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                    <input
                      type="url"
                      value={newVideo.src}
                      onChange={(e) => setNewVideo({...newVideo, src: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      disabled={!isAuthenticated}
                      placeholder="https://res.cloudinary.com/..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isAuthenticated || isSaving}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Add Video
                  </button>
                </form>
              </div>

              {/* Videos List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Grid size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Videos ({videos.length})</h3>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {videos.map((video, index) => (
                    <div key={video._id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      {editingVideo?._id === video._id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingVideo.title}
                            onChange={(e) => setEditingVideo({...editingVideo, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <select
                            value={editingVideo.category}
                            onChange={(e) => setEditingVideo({...editingVideo, category: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editingVideo.views}
                              onChange={(e) => setEditingVideo({...editingVideo, views: e.target.value})}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Views"
                            />
                            <input
                              type="text"
                              value={editingVideo.duration}
                              onChange={(e) => setEditingVideo({...editingVideo, duration: e.target.value})}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Duration"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateVideo(editingVideo)}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingVideo(null)}
                              className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleReorder(video._id, 'up')}
                              disabled={index === 0 || !isAuthenticated}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => handleReorder(video._id, 'down')}
                              disabled={index === videos.length - 1 || !isAuthenticated}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{video.title}</span>
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                {video.category}
                              </span>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span>{video.views} views</span>
                              <span>{video.duration}</span>
                            </div>
                          </div>

                          {isAuthenticated && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingVideo(video)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(video._id, video.title)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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