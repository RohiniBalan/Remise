'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, MapPin, Send, User, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export interface ContactData {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
}

interface ContactPageProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean; 
  isPreview?: boolean;
  previewData?: ContactData;
}

const API_URL = "https://wow-lifebackend.onrender.com/api";

export default function ContactPage({ isOpen, onClose, isDarkMode, isPreview = false, previewData }: ContactPageProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [data, setData] = useState<ContactData>({
    title: "Get in Touch", subtitle: "We'd love to hear from you. Contact us for any queries.",
    email: "contact@wowlifestyle.com", phone: "+91 98765 43210", address: "123 Lifestyle Street, Mumbai, India 400001",
    hoursWeekday: "9:00 AM - 8:00 PM", hoursSaturday: "10:00 AM - 6:00 PM", hoursSunday: "Closed"
  });

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (notification) {
      timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notification]);

  useEffect(() => {
    if (isPreview && previewData) {
      setData(previewData);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/contact`);
        if (!response.ok) throw new Error('Failed to fetch from server');
        const result = await response.json();
        if (result.success && result.data) setData(result.data);
      } catch (error) {
        console.error('Error fetching contact info:', error);
      }
    };
    if (isOpen) fetchData();
  }, [isOpen, isPreview, previewData]);

  useEffect(() => {
    if (isPreview) return; 
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null); 
    
    try {
      const response = await fetch(`${API_URL}/contact/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}. Make sure the backend is running locally!`);
      }

      const result = await response.json();

      if (result.success) {
        setNotification({ type: 'success', message: 'Message sent successfully!' });
        setFormData({ name: '', email: '', phone: '', message: '' });
        
        if (!isPreview) {
          setTimeout(() => {
            onClose();
            setNotification(null);
          }, 3000);
        }
      } else {
        setNotification({ type: 'error', message: result.message || 'Failed to send message.' });
      }
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to connect to server.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!mounted || (!isOpen && !isPreview)) return null;

  const CustomToast = (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={`fixed top-4 md:top-8 left-1/2 z-[10005] w-[90vw] md:min-w-[320px] md:max-w-[400px] flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.15)] backdrop-blur-xl border ${
            isDarkMode 
              ? 'bg-black/90 border-yellow-500/40 text-yellow-400' 
              : 'bg-white/95 border-yellow-400/60 text-yellow-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle size={22} className={`flex-shrink-0 ${isDarkMode ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "text-yellow-600"}`} />
          ) : (
            <AlertCircle size={22} className={`flex-shrink-0 ${isDarkMode ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-red-600"}`} />
          )}
          
          <span className="text-xs md:text-sm font-bold flex-1 leading-tight tracking-wide">
            {notification.message}
          </span>
          
          <button 
            onClick={() => setNotification(null)} 
            className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
              isDarkMode ? 'hover:bg-yellow-500/20 text-yellow-500/70 hover:text-yellow-400' : 'hover:bg-yellow-100 text-yellow-600/70 hover:text-yellow-800'
            }`}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ModalContent = (
    <>
      {CustomToast}
      <motion.div
        initial={isPreview ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
        animate={isPreview ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        exit={isPreview ? {} : { opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
        transition={{ type: "spring", duration: 0.5 }}
        className={`${isPreview ? 'relative w-full' : 'fixed left-1/2 top-1/2 w-[95%] sm:w-[90%]'} max-w-4xl max-h-[90vh] md:max-h-[85vh] rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.1)] z-[10000] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row border ring-1 ${
          isDarkMode ? 'bg-black border-yellow-500/30 ring-white/5' : 'bg-white border-yellow-400/50 ring-black/5'
        }`}
      >
        {!isPreview && (
          <button
            onClick={onClose}
            className={`fixed md:absolute right-4 top-4 md:right-4 md:top-4 p-2 rounded-full z-50 transition-all hover:scale-110 shadow-lg border backdrop-blur-md ${
              isDarkMode ? 'bg-neutral-900/80 hover:bg-neutral-800 text-yellow-500 border-yellow-500/30' : 'bg-white/80 hover:bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}
          >
            <X size={20} />
          </button>
        )}

        {/* Left side - Contact Info */}
        <div className={`md:w-2/5 p-5 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r md:overflow-y-auto no-scrollbar relative ${
          isDarkMode ? 'bg-gradient-to-br from-neutral-950 to-neutral-900 border-yellow-500/10 text-white' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 text-slate-900'
        }`}>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.05),transparent_50%)] pointer-events-none"></div>

          <div className="space-y-6 md:space-y-8 relative z-10 pt-8 md:pt-0">
            <div>
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black mb-2 sm:mb-3 text-transparent bg-clip-text drop-shadow-sm ${
                isDarkMode ? 'bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-700'
              }`}>
                {data.title}
              </h2>
              <p className={`text-xs sm:text-sm md:text-base font-medium ${isDarkMode ? 'text-yellow-500/70' : 'text-yellow-700/80'}`}>{data.subtitle}</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl backdrop-blur-md transition-transform hover:scale-[1.02] group border ${
                isDarkMode ? 'bg-yellow-500/5 border-yellow-500/10 hover:bg-yellow-500/10' : 'bg-white/60 border-yellow-400/20 hover:bg-white'
              }`}>
                <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center transition-colors ${
                  isDarkMode ? 'bg-yellow-500/10 group-hover:bg-yellow-500/20' : 'bg-yellow-100 group-hover:bg-yellow-200'
                }`}>
                  <Mail size={18} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-yellow-600' : 'text-yellow-700'}`}>Email</p>
                  <p className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`}>{data.email}</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl backdrop-blur-md transition-transform hover:scale-[1.02] group border ${
                isDarkMode ? 'bg-yellow-500/5 border-yellow-500/10 hover:bg-yellow-500/10' : 'bg-white/60 border-yellow-400/20 hover:bg-white'
              }`}>
                <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center transition-colors ${
                  isDarkMode ? 'bg-yellow-500/10 group-hover:bg-yellow-500/20' : 'bg-yellow-100 group-hover:bg-yellow-200'
                }`}>
                  <Phone size={18} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-yellow-600' : 'text-yellow-700'}`}>Phone</p>
                  <p className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`}>{data.phone}</p>
                </div>
              </div>
            </div>

            <div className={`mt-6 p-4 sm:p-5 rounded-xl backdrop-blur-md border ${
              isDarkMode ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-white/60 border-yellow-400/20'
            }`}>
              <h3 className={`font-black text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                <span className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span>
                Business Hours
              </h3>
              <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                <p className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-yellow-500/10' : 'border-yellow-200/50'}`}>
                  <span className={`font-medium ${isDarkMode ? 'text-yellow-500/60' : 'text-slate-500'}`}>Mon - Fri:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`}>{data.hoursWeekday}</span>
                </p>
                <p className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-yellow-500/10' : 'border-yellow-200/50'}`}>
                  <span className={`font-medium ${isDarkMode ? 'text-yellow-500/60' : 'text-slate-500'}`}>Saturday:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`}>{data.hoursSaturday}</span>
                </p>
                <p className="flex justify-between items-center">
                  <span className={`font-medium ${isDarkMode ? 'text-yellow-500/60' : 'text-slate-500'}`}>Sunday:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>{data.hoursSunday}</span>
                </p>
              </div>
            </div>

            <div className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl backdrop-blur-md transition-colors group border ${
              isDarkMode ? 'bg-yellow-500/5 border-yellow-500/10 hover:bg-yellow-500/10' : 'bg-white/60 border-yellow-400/20 hover:bg-white'
            }`}>
              <MapPin size={20} className={`flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <p className={`font-bold text-xs sm:text-sm mb-1 tracking-wide ${isDarkMode ? 'text-yellow-500' : 'text-yellow-700'}`}>VISIT US</p>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>{data.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Contact Form */}
        <div className={`md:w-3/5 p-5 sm:p-6 md:p-8 md:overflow-y-auto no-scrollbar relative ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 relative z-10">
            <div>
              <label className={`block text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${isDarkMode ? 'text-yellow-600' : 'text-yellow-700'}`}>Your Name</label>
              <div className="relative group">
                <User className={`absolute left-3.5 top-3.5 transition-colors ${isDarkMode ? 'text-yellow-600/50 group-focus-within:text-yellow-400' : 'text-yellow-600/40 group-focus-within:text-yellow-600'}`} size={18} />
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter your full name"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all border outline-none ${
                    isDarkMode 
                      ? 'bg-neutral-900 border-yellow-500/20 text-white placeholder:text-neutral-600 focus:bg-black focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50' 
                      : 'bg-slate-50 border-yellow-400/40 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className={`block text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${isDarkMode ? 'text-yellow-600' : 'text-yellow-700'}`}>Email Address</label>
                <div className="relative group">
                  <Mail className={`absolute left-3.5 top-3.5 transition-colors ${isDarkMode ? 'text-yellow-600/50 group-focus-within:text-yellow-400' : 'text-yellow-600/40 group-focus-within:text-yellow-600'}`} size={18} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="VIP@email.com"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all border outline-none ${
                      isDarkMode 
                        ? 'bg-neutral-900 border-yellow-500/20 text-white placeholder:text-neutral-600 focus:bg-black focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50' 
                        : 'bg-slate-50 border-yellow-400/40 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${isDarkMode ? 'text-yellow-600' : 'text-yellow-700'}`}>Phone Number</label>
                <div className="relative group">
                  <Phone className={`absolute left-3.5 top-3.5 transition-colors ${isDarkMode ? 'text-yellow-600/50 group-focus-within:text-yellow-400' : 'text-yellow-600/40 group-focus-within:text-yellow-600'}`} size={18} />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all border outline-none ${
                      isDarkMode 
                        ? 'bg-neutral-900 border-yellow-500/20 text-white placeholder:text-neutral-600 focus:bg-black focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50' 
                        : 'bg-slate-50 border-yellow-400/40 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${isDarkMode ? 'text-yellow-600' : 'text-yellow-700'}`}>Your Message</label>
              <div className="relative group">
                <MessageSquare className={`absolute left-3.5 top-3.5 transition-colors ${isDarkMode ? 'text-yellow-600/50 group-focus-within:text-yellow-400' : 'text-yellow-600/40 group-focus-within:text-yellow-600'}`} size={18} />
                <textarea name="message" value={formData.message} onChange={handleChange} required rows={4} placeholder="How can we assist you today?"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all border outline-none resize-none ${
                    isDarkMode 
                      ? 'bg-neutral-900 border-yellow-500/20 text-white placeholder:text-neutral-600 focus:bg-black focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50' 
                      : 'bg-slate-50 border-yellow-400/40 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30'
                  }`}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-4 mt-2 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-black tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm shadow-[0_0_20px_rgba(234,179,8,0.25)] disabled:opacity-70 disabled:hover:scale-100 uppercase"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} 
              {isSubmitting ? 'Transmitting...' : 'Send Message'}
            </button>
            <p className={`text-[10px] sm:text-xs text-center font-medium tracking-wide ${isDarkMode ? 'text-yellow-600/50' : 'text-slate-500'}`}>Our concierge will contact you within 24 hours.</p>
          </form>
        </div>
      </motion.div>
    </>
  );

  if (isPreview) return ModalContent;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999]" />
          {ModalContent}
          <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}