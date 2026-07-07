'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components-main/NavbarHome';
import FooterComponent from '../components-sections/Footer';
import ContactPage from './ContactPage'; 
import { ShoppingBag, Building2, CheckCircle, ArrowRight, Package, TrendingUp, Sparkles, Gift, Crown, Truck, Shield, Headphones, Users, Clock, Zap, Phone, Loader2 } from 'lucide-react';

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

export default function ServicesPage(props: any) {
  const isPreview = props.isPreview || false;
  const previewData = props.previewData || null;

  const [viewMode, setViewMode] = useState<'retail' | 'wholesale'>('retail');
  const [selectedProduct, setSelectedProduct] = useState<number>(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showContact, setShowContact] = useState(false);

  const [retailProducts, setRetailProducts] = useState<any[]>([]);
  const [wholesaleProducts, setWholesaleProducts] = useState<any[]>([]);
  const [retailOffer, setRetailOffer] = useState(DEFAULT_RETAIL_OFFER);
  const [wholesaleOffer, setWholesaleOffer] = useState(DEFAULT_WHOLESALE_OFFER);
  const [isLoading, setIsLoading] = useState(!isPreview);

  const isDarkMode = theme === 'dark';
  const currentProducts = viewMode === 'retail' ? retailProducts : wholesaleProducts;
  const currentOffer = viewMode === 'retail' ? retailOffer : wholesaleOffer;

  useEffect(() => {
    if (isPreview && previewData) {
      setRetailProducts(previewData.retailProducts || []);
      setWholesaleProducts(previewData.wholesaleProducts || []);
      if (previewData.retailOffer) setRetailOffer(previewData.retailOffer);
      if (previewData.wholesaleOffer) setWholesaleOffer(previewData.wholesaleOffer);
      return;
    }

    const fetchData = async () => {
      try {
        const API_URL = "https://wow-lifebackend.onrender.com/api";
        const response = await fetch(`${API_URL}/services`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setRetailProducts(result.data.retailProducts || []);
          setWholesaleProducts(result.data.wholesaleProducts || []);
          if (result.data.retailOffer) setRetailOffer(result.data.retailOffer);
          if (result.data.wholesaleOffer) setWholesaleOffer(result.data.wholesaleOffer);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isPreview, previewData]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
    const handleThemeChange = (e: CustomEvent) => { if (e.detail?.theme) setTheme(e.detail.theme); };
    window.addEventListener('themeChange' as any, handleThemeChange);
    return () => window.removeEventListener('themeChange' as any, handleThemeChange);
  }, []);

  useEffect(() => {
    if (showContact) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showContact]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${isDarkMode ? 'bg-black' : 'bg-slate-50'}`}>
        <Loader2 className="animate-spin text-yellow-500 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen flex flex-col transition-colors duration-500 overflow-x-hidden ${
      isDarkMode 
        ? 'bg-black text-white selection:bg-yellow-500/30 selection:text-yellow-200' 
        : 'bg-slate-50 text-slate-900 selection:bg-yellow-500/30 selection:text-yellow-900'
    }`}>
      
      {/* Dynamic Gold Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl ${isDarkMode ? 'bg-[radial-gradient(circle,rgba(234,179,8,0.1)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle,rgba(234,179,8,0.15)_0%,transparent_70%)]'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full blur-3xl ${isDarkMode ? 'bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)]'}`}></div>
      </div>

      {!isPreview && <Navbar theme={theme} toggleTheme={toggleTheme} />}

      <div className={`relative z-10 flex-grow ${isPreview ? 'py-12' : 'pt-24 pb-12'} px-4 md:px-8`}>
        <div className="max-w-7xl mx-auto mb-12">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
            <div className="space-y-4 w-full lg:w-auto">
              <div className="relative">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2 relative leading-tight">
                  <span className="relative z-10 block sm:inline">
                    <span className={isDarkMode ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-slate-900 drop-shadow-sm'}>WOW</span>
                    <span className={`bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] bg-clip-text text-transparent animate-gradient sm:ml-3 ${isDarkMode ? 'drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]' : ''}`}>LIFESTYLE</span>
                  </span>
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-pulse flex-shrink-0" />
                  <p className={`text-base sm:text-lg md:text-xl font-semibold italic tracking-wide ${isDarkMode ? 'text-yellow-400/90' : 'text-yellow-600'}`}>
                    Just Looking Like a "WOW"
                  </p>
                </div>
              </div>
              <p className={`text-base sm:text-lg max-w-2xl font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                {viewMode === 'retail' ? "Premium luxury toys for families and exclusive collectors" : "High-margin bulk acquisitions for business partners"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
              {!isPreview && (
                <button onClick={() => setShowContact(true)} className="px-6 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] group w-full sm:w-auto">
                  <Phone size={18} className="group-hover:animate-bounce" /> 
                  <span>Contact Us</span>
                </button>
              )}

              <div className={`flex w-full sm:w-auto p-1.5 backdrop-blur-md rounded-xl shadow-2xl border ${
                isDarkMode ? 'bg-neutral-950/80 border-yellow-500/30' : 'bg-white/80 border-yellow-400/50'
              }`}>
                <button onClick={() => { setViewMode('retail'); setSelectedProduct(0); }} className={`flex-1 sm:flex-none justify-center relative px-4 sm:px-8 py-3 rounded-lg text-sm font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-2 sm:gap-3 ${
                  viewMode === 'retail' 
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                    : isDarkMode ? 'text-yellow-500/70 hover:text-yellow-400 hover:bg-white/5' : 'text-yellow-700/70 hover:text-yellow-600 hover:bg-black/5'
                }`}>
                  <ShoppingBag size={18} /> <span>Retail</span>
                </button>
                <button onClick={() => { setViewMode('wholesale'); setSelectedProduct(0); }} className={`flex-1 sm:flex-none justify-center relative px-4 sm:px-8 py-3 rounded-lg text-sm font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-2 sm:gap-3 ${
                  viewMode === 'wholesale' 
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                    : isDarkMode ? 'text-yellow-500/70 hover:text-yellow-400 hover:bg-white/5' : 'text-yellow-700/70 hover:text-yellow-600 hover:bg-black/5'
                }`}>
                  <Building2 size={18} /> <span>Wholesale</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* PRODUCT LIST (Left Column) */}
            <div className="lg:col-span-2">
              <div className={`backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)] border ${
                isDarkMode ? 'bg-neutral-950/80 border-yellow-500/20' : 'bg-white border-yellow-400/30'
              }`}>
                <div className={`p-5 sm:p-8 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDarkMode ? 'bg-gradient-to-r from-neutral-900/50 to-neutral-950/50 border-yellow-500/20' : 'bg-gradient-to-r from-yellow-50 to-white border-yellow-400/30'
                }`}>
                  <div>
                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                      <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)] flex-shrink-0" />
                      <h2 className={`text-xl sm:text-2xl font-black tracking-widest uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {viewMode === 'retail' ? 'Retail Collection' : 'Wholesale Vault'}
                      </h2>
                    </div>
                    <p className={`text-xs sm:text-sm pl-4 sm:pl-6 font-medium ${isDarkMode ? 'text-yellow-500/60' : 'text-yellow-700/70'}`}>
                      {viewMode === 'retail' ? 'Curated selections with exclusive pricing' : 'Bulk acquisition catalog with maximum margins'}
                    </p>
                  </div>
                  <div className={`self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-full border shadow-inner ${
                    isDarkMode ? 'bg-neutral-900 border-yellow-500/30' : 'bg-yellow-50/50 border-yellow-300'
                  }`}>
                    <span className={`text-xs font-black tracking-widest whitespace-nowrap ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>{currentProducts.length} PRODUCTS</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className={`border-b ${isDarkMode ? 'bg-neutral-900/40 border-yellow-500/20' : 'bg-yellow-50/50 border-yellow-200'}`}>
                      <tr>
                        <th className={`text-left p-4 sm:p-5 text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-600/80' : 'text-yellow-700'}`}>Product</th>
                        <th className={`text-left p-4 sm:p-5 text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-600/80' : 'text-yellow-700'}`}>Category</th>
                        <th className={`text-left p-4 sm:p-5 text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-600/80' : 'text-yellow-700'}`}>Price</th>
                        {viewMode === 'retail' ? (
                          <>
                            <th className={`text-left p-4 sm:p-5 text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-600/80' : 'text-yellow-700'}`}>Discount</th>
                            <th className={`text-left p-4 sm:p-5 text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-600/80' : 'text-yellow-700'}`}>Status</th>
                          </>
                        ) : (
                          <>
                            <th className={`text-left p-4 sm:p-5 text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-600/80' : 'text-yellow-700'}`}>MOQ</th>
                            <th className={`text-left p-4 sm:p-5 text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-600/80' : 'text-yellow-700'}`}>Margin</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                      {currentProducts.map((product, index) => (
                        <tr 
                          key={product.id} 
                          className={`cursor-pointer transition-all duration-300 border-l-4 ${
                            selectedProduct === index 
                              ? `bg-gradient-to-r from-yellow-500/10 to-transparent ${isDarkMode ? 'border-l-yellow-400' : 'border-l-yellow-500'}`
                              : `border-l-transparent ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-yellow-50/50'}`
                          }`} 
                          onClick={() => setSelectedProduct(index)}
                        >
                          <td className="p-4 sm:p-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-xl sm:text-2xl border shadow-lg group-hover:scale-110 transition-transform ${
                                isDarkMode ? 'bg-neutral-900 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
                              }`}>
                                {product.icon}
                              </div>
                              <div>
                                <div className={`font-bold text-base sm:text-lg tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{product.name}</div>
                                <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
                                  <span className={`text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-bold border ${
                                    isDarkMode ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }`}>⭐ {product.rating}</span>
                                  <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                                    {viewMode === 'retail' ? `${product.sales || '0'} sold` : `${product.orders || '0'} orders`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 sm:p-5">
                            <span className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border whitespace-nowrap ${
                              isDarkMode ? 'text-yellow-500/80 bg-neutral-900 border-white/10' : 'text-yellow-700 bg-yellow-50 border-yellow-200'
                            }`}>
                              {product.category}
                            </span>
                          </td>
                          <td className="p-4 sm:p-5">
                            <div className="flex flex-col">
                              <span className={`font-black text-lg sm:text-xl whitespace-nowrap ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{product.price}</span>
                              {viewMode === 'retail' && product.originalPrice && <span className={`text-[10px] sm:text-xs line-through font-medium ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>{product.originalPrice}</span>}
                            </div>
                          </td>
                          {viewMode === 'retail' ? (
                            <>
                              <td className="p-4 sm:p-5"><span className="text-sm sm:text-base font-black text-green-500">{product.discount}</span></td>
                              <td className="p-4 sm:p-5"><span className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase whitespace-nowrap ${product.stock === 'In Stock' ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : 'text-red-500'}`}>{product.stock}</span></td>
                            </>
                          ) : (
                            <>
                              <td className="p-4 sm:p-5"><span className={`text-xs sm:text-sm font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-lg whitespace-nowrap ${isDarkMode ? 'text-white bg-neutral-800' : 'text-slate-800 bg-slate-100'}`}>{product.moq}</span></td>
                              <td className="p-4 sm:p-5"><span className="text-sm font-bold text-green-500">{product.margin}</span></td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {currentProducts.length === 0 && (
                    <div className={`p-10 sm:p-16 text-center font-medium border-t ${isDarkMode ? 'text-gray-500 border-white/5' : 'text-slate-400 border-slate-100'}`}>
                      No exclusive products available in this category yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GOLD THEMED OFFER CARD (Right Column) */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                <motion.div key={viewMode} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="h-full">
                  <div className={`rounded-3xl p-6 sm:p-8 h-full border relative overflow-hidden flex flex-col group ${
                    isDarkMode ? 'bg-neutral-950 border-yellow-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-white border-yellow-400/50 shadow-[0_20px_50px_rgba(234,179,8,0.15)]'
                  }`}>
                    
                    {/* Background Accents */}
                    <div className={`absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-[60px] sm:blur-[80px] transition-colors duration-700 ${isDarkMode ? 'bg-yellow-500/10 group-hover:bg-yellow-500/20' : 'bg-yellow-300/30 group-hover:bg-yellow-400/30'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-32 sm:w-40 h-32 sm:h-40 rounded-full blur-[40px] sm:blur-[60px] ${isDarkMode ? 'bg-amber-600/10' : 'bg-amber-500/20'}`}></div>

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Badge */}
                      <div className="flex items-center gap-3 mb-6 sm:mb-8">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)] flex-shrink-0">
                          {viewMode === 'retail' ? <Crown className="w-4 h-4 text-black" /> : <TrendingUp className="w-4 h-4 text-black" />}
                        </div>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-yellow-600">{currentOffer.badgeText}</span>
                      </div>
                      
                      {/* Main Offer Title */}
                      <div className="mb-8 sm:mb-10 text-center">
                        <div className="relative inline-block">
                          <div className={`text-6xl sm:text-7xl font-black mb-2 leading-none text-transparent bg-clip-text drop-shadow-lg ${
                            isDarkMode ? 'bg-gradient-to-b from-white to-gray-400' : 'bg-gradient-to-b from-slate-900 to-slate-500'
                          }`}>
                            {currentOffer.discountPercentage}<span className="text-3xl sm:text-4xl text-yellow-500">%</span>
                          </div>
                          <div className="absolute -top-4 -right-4 sm:-right-6 animate-pulse">
                            {viewMode === 'retail' ? <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" /> : <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />}
                          </div>
                        </div>
                        <div className={`text-lg sm:text-xl font-black mb-2 sm:mb-3 tracking-widest uppercase mt-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentOffer.title}</div>
                        <p className={`text-xs sm:text-sm font-medium px-2 sm:px-4 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>{currentOffer.description}</p>
                      </div>

                      {/* Dynamic Perks */}
                      <div className="space-y-3 mb-6 sm:mb-8">
                        <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-colors border ${
                          isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-yellow-50/50 border-yellow-100 hover:bg-yellow-100'
                        }`}>
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl border flex items-center justify-center ${
                            isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-100 border-yellow-200'
                          }`}><CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`} /></div>
                          <div><div className={`font-bold text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentOffer.perk1?.title}</div><div className={`text-[10px] sm:text-xs font-medium mt-0.5 ${isDarkMode ? 'text-yellow-500/80' : 'text-yellow-700'}`}>{currentOffer.perk1?.desc}</div></div>
                        </div>
                        <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-colors border ${
                          isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-yellow-50/50 border-yellow-100 hover:bg-yellow-100'
                        }`}>
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl border flex items-center justify-center ${
                            isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-100 border-yellow-200'
                          }`}>
                            {viewMode === 'retail' ? <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`} /> : <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`} />}
                          </div>
                          <div><div className={`font-bold text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentOffer.perk2?.title}</div><div className={`text-[10px] sm:text-xs font-medium mt-0.5 ${isDarkMode ? 'text-yellow-500/80' : 'text-yellow-700'}`}>{currentOffer.perk2?.desc}</div></div>
                        </div>
                        <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-colors border ${
                          isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-yellow-50/50 border-yellow-100 hover:bg-yellow-100'
                        }`}>
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl border flex items-center justify-center ${
                            isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-100 border-yellow-200'
                          }`}>
                            {viewMode === 'retail' ? <Gift className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`} /> : <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`} />}
                          </div>
                          <div><div className={`font-bold text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentOffer.perk3?.title}</div><div className={`text-[10px] sm:text-xs font-medium mt-0.5 ${isDarkMode ? 'text-yellow-500/80' : 'text-yellow-700'}`}>{currentOffer.perk3?.desc}</div></div>
                        </div>
                      </div>

                      {/* Selected Product Info */}
                      {currentProducts[selectedProduct] && (
                        <div className={`mt-2 p-4 sm:p-5 rounded-2xl border mb-6 sm:mb-8 ${
                          isDarkMode ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20' : 'bg-gradient-to-br from-yellow-50 to-white border-yellow-300 shadow-inner'
                        }`}>
                          <div className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-yellow-500/80' : 'text-yellow-600'}`}>Selected Artifact</div>
                          <div className={`flex items-center justify-between gap-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm sm:text-base truncate">{currentProducts[selectedProduct].name}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className={`text-lg sm:text-xl font-black ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{currentProducts[selectedProduct].price}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CTA Button */}
                      <button className="mt-auto w-full py-3.5 sm:py-4 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-black tracking-widest uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base">
                        {viewMode === 'retail' ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> : <Zap className="w-4 h-4 sm:w-5 sm:h-5" />} 
                        {currentOffer.buttonText} 
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <div className={`text-[9px] sm:text-[10px] text-center mt-3 sm:mt-4 font-medium uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                        {currentOffer.terms}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {!isPreview && <ContactPage isOpen={showContact} onClose={() => setShowContact(false)} isDarkMode={isDarkMode} />}
      </div>

      <style jsx global>{`
        @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient { background-size: 200% 200%; animation: gradient 3s ease infinite; }
      `}</style>

      {/* FOOTER */}
      {!isPreview && <FooterComponent theme={theme} />}
    </div>
  );
}