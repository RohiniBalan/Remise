'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, User, ArrowRight, Eye, Edit2, Loader2, RefreshCw, AlertCircle, CheckCircle, Palette, Image as ImageIcon } from 'lucide-react';
import Layout from '../layout/layout';
import axios from 'axios';

// --- Types ---
interface Character {
  id: number | string;
  name: string;
  color: string;
  src: string;
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
const CharacterSliderPreview = memo(({ characters, theme }: { characters: Character[], theme: 'dark' | 'light' }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  if (characters.length === 0) {
    return (
      <div className={`w-full h-96 flex items-center justify-center rounded-xl ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-[#080808] text-gray-400'}`}>
        <p>Add characters to see the slider preview</p>
      </div>
    );
  }

  return (
    <div className={`w-full py-12 md:py-20 border-t rounded-xl overflow-hidden ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/5 bg-[#080808]'}`}>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 mb-8 md:mb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-block mb-3">
          <span className="text-[#D4AF37] font-bold tracking-[0.3em] text-xs uppercase">Find Your Hero</span>
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          Shop By Character
        </motion.h2>
      </div>

      <div className="relative w-full overflow-hidden group">
        <div className={`absolute left-0 top-0 bottom-0 w-8 md:w-12 lg:w-24 z-20 bg-gradient-to-r ${theme === 'light' ? 'from-gray-50' : 'from-[#080808]'} to-transparent pointer-events-none`} />
        <div className={`absolute right-0 top-0 bottom-0 w-8 md:w-12 lg:w-24 z-20 bg-gradient-to-l ${theme === 'light' ? 'from-gray-50' : 'from-[#080808]'} to-transparent pointer-events-none`} />
        
        <motion.div 
          ref={sliderRef} 
          className="flex gap-4 md:gap-6 px-4 md:px-12 cursor-grab active:cursor-grabbing pb-8 md:pb-12 overflow-x-auto no-scrollbar snap-x"
        >
          {characters.map((char, i) => (
            <motion.div key={char.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.5 }} className="relative flex-shrink-0 snap-center">
              <div className="group/card relative w-36 h-48 md:w-48 md:h-64 lg:w-56 lg:h-72 rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 md:hover:-translate-y-3 will-change-transform">
                <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-xl" style={{ backgroundColor: char.color }} />
                <div className={`relative w-full h-full bg-gray-900 rounded-2xl md:rounded-[2rem] overflow-hidden border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} group-hover/card:border-white/30 transition-colors`}>
                  <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover/card:scale-110" style={{ backgroundImage: `url(${char.src})`, backgroundColor: '#1a1a1a' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col items-center">
                    <h3 className="text-white font-bold text-sm md:text-lg uppercase tracking-wider text-center drop-shadow-md translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">{char.name}</h3>
                    <div className="h-1 w-6 md:w-8 rounded-full mt-2 md:mt-3 transition-all duration-300 transform scale-x-0 group-hover/card:scale-x-100" style={{ backgroundColor: char.color }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
});
CharacterSliderPreview.displayName = 'CharacterSliderPreview';

// --- Main Admin Component ---
export default function CharacterAdminPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // --- State for Custom Popup Modal ---
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  // --- State for Characters Content ---
  const [characters, setCharacters] = useState<Character[]>([]);

  // --- UI States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- Local States for Form ---
  const [newCharName, setNewCharName] = useState('');
  const [newCharColor, setNewCharColor] = useState('#E62429');
  const [newCharUrl, setNewCharUrl] = useState('');

  // --- Authentication ---
  useEffect(() => {
    checkAuth();
    fetchCharactersConfig();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
        setIsAuthenticated(true);
      } catch (error) {
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
  const fetchCharactersConfig = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await axios.get(`${API_URL}/characters`);
      
      if (response.data.success) {
        setCharacters(response.data.data);
      } else {
        setFetchError('Failed to load configuration');
      }
    } catch (error: any) {
      console.error('Error fetching characters:', error);
      // Fallback data for previewing without backend
      setCharacters([
        { id: 1, name: "Avengers", color: "#E62429", src: "/chars/avengers.avif" },
        { id: 2, name: "Frozen", color: "#00B7FF", src: "/chars/frozen.avif" },
      ]);
      setFetchError(error.response?.data?.message || 'Failed to connect to server. Loaded fallback data.');
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
      const response = await axiosInstance.put('/characters', { characters });
      
      if (response.data.success) {
        setSaveStatus({ type: 'success', message: 'Character roster saved successfully!' });
        setCharacters(response.data.data);
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setSaveStatus({ type: 'error', message: 'Session expired. Please login again.' });
        handleLogout();
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
      const response = await axiosInstance.post('/characters/reset');
      
      if (response.data.success) {
        setCharacters(response.data.data);
        setSaveStatus({ type: 'success', message: 'Configuration reset to defaults!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error: any) {
      setSaveStatus({ type: 'error', message: error.response?.data?.message || 'Failed to reset configuration' });
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
      message: 'Are you sure you want to restore default characters? This action cannot be undone and will overwrite your database.',
      action: executeReset
    });
  };

  // --- Handlers for Characters ---
  const handleAddCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim() || !newCharUrl.trim()) return;
    
    setCharacters(prev => [...prev, { 
      id: Date.now(), 
      name: newCharName.trim(), 
      color: newCharColor,
      src: newCharUrl.trim() 
    }]);
    
    setNewCharName('');
    setNewCharUrl('');
  };

  const executeDeleteCharacter = (idToRemove: string | number) => {
    setCharacters(prev => prev.filter(char => char.id !== idToRemove));
  };

  const handleDeleteCharacterClick = (idToRemove: string | number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Character',
      message: 'Are you sure you want to remove this character? Note: You must click "Save Changes" to update the database.',
      action: () => executeDeleteCharacter(idToRemove)
    });
  };

  // --- Loading & Error States ---
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading characters configuration...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Character Slider Manager</h1>
            <p className="text-sm md:text-base text-gray-500">
              {isAuthenticated ? (
                <>Logged in as <span className="font-semibold text-gray-700">{user?.name || 'Admin'}</span></>
              ) : (
                'You are in read-only mode. Login to make changes.'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Theme Toggle */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              disabled={isSaving}
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

            {/* Actions */}
            {isAuthenticated ? (
              <>
                <button onClick={handleResetClick} disabled={isSaving || isResetting} className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm disabled:opacity-50">
                  {isResetting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />} Reset
                </button>
                <button onClick={handleSave} disabled={isSaving || isResetting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm disabled:opacity-50">
                  {isSaving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save</>}
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
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${saveStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {saveStatus.type === 'success' ? <CheckCircle size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-red-600" />}
            <p className="text-sm font-medium">{saveStatus.message}</p>
          </div>
        )}
        {fetchError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-700">{fetchError}</p>
          </div>
        )}
        {!isAuthenticated && activeTab === 'edit' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-700">You are in read-only mode. Changes you make will not be saved. Please <a href="/login" className="font-semibold underline">login</a> to edit.</p>
          </div>
        )}

        {/* Main Content */}
        {activeTab === 'preview' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Preview</h2>
            <CharacterSliderPreview characters={characters} theme={theme} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Left Column - Add New Character */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">
                  <Plus size={18} className="text-blue-600" /> Add New Character
                </h3>
                
                <form onSubmit={handleAddCharacter} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><User size={14}/> Name</label>
                    <input
                      type="text"
                      value={newCharName}
                      onChange={(e) => setNewCharName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., Avengers"
                      disabled={isSaving || !isAuthenticated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Palette size={14}/> Brand Color</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={newCharColor}
                        onChange={(e) => setNewCharColor(e.target.value)}
                        className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                        disabled={isSaving || !isAuthenticated}
                      />
                      <input 
                        type="text"
                        value={newCharColor}
                        onChange={(e) => setNewCharColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><ImageIcon size={14}/> Image Source URL</label>
                    <input
                      type="text"
                      value={newCharUrl}
                      onChange={(e) => setNewCharUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="/chars/avengers.avif"
                      disabled={isSaving || !isAuthenticated}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-4 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSaving || !isAuthenticated || !newCharName.trim() || !newCharUrl.trim()}
                  >
                    Add to Roster
                  </button>
                </form>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">💡 Design Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use matching brand colors for the hover gradient effect</li>
                  <li>• Portrait images work best for these cards</li>
                  <li>• Use WebP or AVIF formats for faster loading</li>
                </ul>
              </div>
            </div>

            {/* Right Column - Manage Existing */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4 border-b pb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <User size={20} className="text-blue-600" /> Active Roster ({characters.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                  {characters.map((char, idx) => (
                    <div key={char.id} className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden group">
                      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-2 font-medium text-gray-800">
                          <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: char.color }}></span>
                          {char.name}
                        </div>
                        <button 
                          onClick={() => handleDeleteCharacterClick(char.id)}
                          className="text-gray-400 hover:bg-red-50 hover:text-red-500 rounded p-1.5 transition-colors disabled:opacity-50"
                          disabled={isSaving || !isAuthenticated}
                          title="Delete Character"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center p-3 gap-3">
                         <div className="w-16 h-20 bg-gray-200 rounded-md overflow-hidden border border-gray-200 flex-shrink-0 relative">
                           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${char.src})`, backgroundColor: '#1a1a1a' }} />
                         </div>
                         <div className="text-xs text-gray-500 break-all bg-gray-100 p-2 rounded w-full border border-gray-200">
                           <span className="block font-semibold mb-1 text-gray-600">Image Path:</span>
                           {char.src}
                         </div>
                      </div>
                    </div>
                  ))}
                  {characters.length === 0 && (
                    <div className="col-span-1 sm:col-span-2 text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      No characters added yet. Use the form to add your first!
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </Layout>
  );
}