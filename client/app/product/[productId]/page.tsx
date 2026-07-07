'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingCart, Zap, Truck,
  Heart, CheckCircle, ArrowLeft, HelpCircle, Package, AlertTriangle
} from 'lucide-react';
import { useCart } from '@/app/components-main/CartContext';
import NavbarHome from '@/app/components-main/NavbarHome';

// Define your backend API URL here
const API_URL = "https://wow-lifebackend.onrender.com/api";

const TABS = ['About', 'Specs', 'Ideal For', 'Shipping'];

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState(TABS[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // EXTRACTED setBuyNowItem from CartContext
  const { addToCart, setBuyNowItem } = useCart() as any;

  const [showZoom, setShowZoom] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let productId: string | string[] | undefined = params?.id || params?.productId || params?.slug;
    if (!productId && typeof window !== 'undefined') {
      productId = window.location.pathname.split('/').pop() || undefined;
    }
    if (!productId) { setIsLoading(false); return; }

    const fetchProduct = async () => {
      try {
        const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;
        const timestamp = new Date().getTime();
        
        // Updated fetch URL
        const response = await fetch(`${API_URL}/admin/products?t=${timestamp}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          cache: 'no-store'
        });
        const data = await response.json();
        const arr = Array.isArray(data) ? data : data.products || data.data || [];
        const foundProduct = arr.find((p: any) =>
          String(p._id) === String(productId) || String(p.id) === String(productId)
        );
        if (foundProduct) {
          setProduct(foundProduct);
          const defaultImage =
            foundProduct.images && foundProduct.images.length > 0
              ? foundProduct.images[0]
              : foundProduct.imageUrl;
          setActiveImage(defaultImage);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [params]);

  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail as 'dark' | 'light';
      if (newTheme) setTheme(newTheme);
    };
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (currentTheme) setTheme(currentTheme);
    return () => window.removeEventListener('theme-change', handleThemeChange as EventListener);
  }, []);

  const handleAddToCart = () => {
    if (!product || product.totalStock <= 0) return;
    const displayImg =
      product.images && product.images.length > 0 ? product.images[0] : product.imageUrl;
    
    for (let i = 0; i < quantity; i++) {
      addToCart({ 
        ...product, 
        id: product._id || product.id, 
        image: displayImg,
        totalStock: product.totalStock 
      });
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleBuyNow = () => {
    if (!product || product.totalStock <= 0) return;
    const displayImg =
      product.images && product.images.length > 0 ? product.images[0] : product.imageUrl;
    
    setBuyNowItem({
      id: product._id || product.id,
      title: product.title,
      price: product.price,
      image: displayImg,
      quantity: quantity,
      brand: product.brand,
      category: product.category,
      totalStock: product.totalStock // Pass total stock to checkout
    });
    
    router.push('/checkout');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      backgroundImage: `url("${activeImage}")`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '260%',
      backgroundRepeat: 'no-repeat',
    });
  };

  /* ─── Loading ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#070707]' : 'bg-[#FFFFFF]'}`}>
        <NavbarHome theme={theme} toggleTheme={toggleTheme} />
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-[#C9A84C]/20 border-t-[#C9A84C] animate-spin" />
          <Package size={20} className="absolute inset-0 m-auto text-[#C9A84C]" />
        </div>
        <p className="mt-5 text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-bold">Loading</p>
      </div>
    );
  }

  /* ─── Not Found ───────────────────────────────────────────────────── */
  if (!product) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#070707]' : 'bg-[#FFFFFF]'}`}>
        <NavbarHome theme={theme} toggleTheme={toggleTheme} />
        <AlertTriangle size={44} className="text-[#C9A84C] mb-4" />
        <h2 className={`text-xl font-semibold mb-2 tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Product Not Found</h2>
        <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-500'}`}>This item no longer exists.</p>
        <button
          onClick={() => router.back()}
          className="px-8 py-2.5 bg-[#C9A84C] text-black text-xs font-bold tracking-[0.3em] uppercase hover:bg-[#E2BE6A] transition-colors"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  /* ─── Data prep ───────────────────────────────────────────────────── */
  let galleryImages: string[] = [];
  if (Array.isArray(product.images) && product.images.length > 0) galleryImages = product.images;
  else if (product.imageUrl) galleryImages = [product.imageUrl];

  const dbFeatures =
    Array.isArray(product.aboutFeatures) && product.aboutFeatures.length > 0
      ? product.aboutFeatures : [];
  const dbIdealFor =
    Array.isArray(product.idealFor) && product.idealFor.length > 0 ? product.idealFor : [];
  let dbSpecs =
    Array.isArray(product.specifications) && product.specifications.length > 0
      ? [...product.specifications] : [];
  if (product.totalStock !== undefined)
    dbSpecs.push({ label: 'Total Stock', value: `${product.totalStock} Units` });

  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const isOutOfStock = product.totalStock <= 0;

  /* ─── EXACT THEME TOKENS ──────────────────────────────────────────── */
  const isDark   = theme === 'dark';
  const bg       = isDark ? '#070707' : '#FFFFFF'; 
  const surface2 = isDark ? '#111111' : '#F9F9F9'; 
  const border   = isDark ? '#1C1C1C' : '#EAEAEA';
  const textPri  = isDark ? '#F0EAD6' : '#111827';
  const textSec  = isDark ? '#7A7060' : '#6B7280';
  const gold     = '#C9A84C';
  const goldHi   = '#E2BE6A';

  return (
    <>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap');

        .pdp-root  { font-family: 'Inter', sans-serif; }
        .pdp-serif { font-family: 'Playfair Display', Georgia, serif; }

        html, body {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
          width: 0;
        }
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        *::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        .pdp-gold-divider {
          height: 1px;
          background: linear-gradient(90deg, ${gold}80, ${gold}20, transparent);
        }
        .pdp-qty-btn:hover:not(:disabled) { background: ${gold}; color: #000 !important; }
        .pdp-thumb-active  { outline: 1.5px solid ${gold}; outline-offset: 2px; }
        .pdp-tab-bar {
          position: absolute; bottom: -1px; left: 0; right: 0;
          height: 1.5px; background: ${gold};
        }
        .pdp-spec-row:hover  { background: ${isDark ? `${gold}09` : `${gold}15`} !important; }
        .pdp-ideal-card:hover { border-color: ${gold} !important; color: ${textPri} !important; }
        .pdp-cta-outline:hover:not(:disabled) { background: ${isDark ? `${gold}18` : `${gold}15`} !important; }
        
        .noise-overlay {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: ${isDark ? 0.4 : 0.15};
        }
      `}</style>

      <div
        className="pdp-root min-h-screen pt-[64px] sm:pt-[96px] lg:pt-[136px] pb-14 transition-colors duration-300"
        style={{ background: bg, color: textPri }}
      >
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[220px] transition-opacity duration-300"
          style={{ 
            background: `radial-gradient(ellipse at center, ${gold}, transparent 70%)`, 
            filter: 'blur(50px)',
            opacity: isDark ? 0.035 : 0.01
          }}
        />

        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 60, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-8 right-8 z-[300] flex items-center gap-3 px-5 py-3.5 shadow-2xl rounded-xl"
              style={{ background: gold, color: '#000', boxShadow: `0 8px 32px ${gold}55` }}
            >
              <CheckCircle size={16} strokeWidth={2.5} />
              <div>
                <p className="font-semibold text-xs leading-none mb-0.5 tracking-wide">Added to Cart</p>
                <p className="text-[10px] opacity-80 font-medium">{quantity} item{quantity > 1 ? 's' : ''}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.button
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-7 group transition-colors text-xs tracking-[0.3em] uppercase font-bold"
            style={{ color: textSec }}
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" style={{ color: gold }} />
            <span className="group-hover:opacity-60 transition-opacity" style={{ color: textPri }}>
              Back to Shop
            </span>
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            <div className="space-y-2.5 lg:sticky lg:top-24">
              <motion.div
                ref={imageContainerRef}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onMouseEnter={() => !isOutOfStock && setShowZoom(true)}
                onMouseLeave={() => setShowZoom(false)}
                onMouseMove={!isOutOfStock ? handleMouseMove : undefined}
                className="relative overflow-hidden cursor-crosshair transition-colors duration-300 rounded-xl w-full aspect-square md:aspect-[4/3] lg:aspect-square"
                style={{ background: surface2, border: `1px solid ${border}` }}
              >
                <div className="noise-overlay" />

                {discount > 0 && !isOutOfStock && (
                  <div
                    className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase shadow-md rounded-sm"
                    style={{ background: gold, color: '#000' }}
                  >
                    −{discount}% OFF
                  </div>
                )}
                
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    src={activeImage} alt={product.title}
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                  />
                </AnimatePresence>

                <button 
                  onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
                  className="absolute top-3 right-3 p-2.5 rounded-full z-20 backdrop-blur-md border transition-all duration-300"
                  style={{
                    background: isWishlisted ? gold : (isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)'),
                    border: `1px solid ${isWishlisted ? gold : border}`
                  }}
                >
                  <Heart size={16} style={{ color: isWishlisted ? '#000' : textSec }} fill={isWishlisted ? '#000' : 'none'} />
                </button>
              </motion.div>

              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                  {galleryImages.map((img: string, idx: number) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                      onClick={() => setActiveImage(img)}
                      className={`flex-shrink-0 w-[68px] h-[68px] overflow-hidden rounded-lg transition-all duration-300 ${activeImage === img ? 'pdp-thumb-active' : ''}`}
                      style={{ border: `1px solid ${activeImage === img ? gold : border}`, background: surface2 }}
                    >
                      <img src={img} className={`w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity p-1 ${isOutOfStock ? 'grayscale' : ''}`} alt={`Thumbnail ${idx + 1}`} />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <AnimatePresence>
                {showZoom && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="absolute inset-0 z-50 hidden lg:block overflow-hidden shadow-2xl rounded-xl"
                    style={{ ...zoomStyle as React.CSSProperties, border: `1px solid ${border}`, backgroundColor: surface2 }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`transition-opacity duration-150 ${showZoom ? 'lg:opacity-0 lg:pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-[9px] tracking-[0.4em] uppercase font-bold" style={{ color: gold }}>
                    {product.brand}
                  </span>
                  <span className="w-px h-3" style={{ background: border }} />
                  <span className="text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: textSec }}>
                    {product.category}
                  </span>
                  {product.badge && !isOutOfStock && (
                    <span
                      className="ml-auto text-[9px] px-2.5 py-0.5 tracking-widest uppercase font-bold rounded-sm shadow-sm"
                      style={{ background: isDark ? `${gold}15` : `${gold}20`, border: `1px solid ${gold}40`, color: isDark ? gold : '#997B21' }}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>

                <h1 className={`pdp-serif text-[1.95rem] font-semibold leading-[1.2] mb-4 ${isOutOfStock ? 'opacity-60' : ''}`} style={{ color: textPri }}>
                  {product.title}
                </h1>

                <div className="pdp-gold-divider mb-5" />

                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <span className="text-[9px] font-bold tracking-[0.4em] uppercase block mb-1" style={{ color: textSec }}>
                      MRP Incl. of all taxes
                    </span>
                    <span className="pdp-serif text-[2.6rem] font-semibold leading-none" style={{ color: textPri }}>
                      ₹{product.price?.toLocaleString()}
                    </span>
                  </div>
                  {product.originalPrice > product.price && !isOutOfStock && (
                    <div className="mb-1 flex flex-col gap-1">
                      <span className="text-sm line-through font-medium" style={{ color: textSec }}>
                        ₹{product.originalPrice?.toLocaleString()}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 tracking-wide shadow-sm rounded-sm"
                        style={{ background: isDark ? `${gold}18` : `${gold}20`, color: isDark ? gold : '#997B21' }}
                      >
                        Save ₹{(product.originalPrice - product.price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta Stock Information */}
                <div className="flex gap-6 mb-6 pb-5 text-xs" style={{ borderBottom: `1px solid ${border}` }}>
                  <div>
                    <span className="block text-[9px] font-bold tracking-[0.3em] uppercase mb-0.5" style={{ color: textSec }}>Stock</span>
                    <span className="font-semibold" style={{ color: isOutOfStock ? '#ef4444' : textPri }}>
                      {isOutOfStock ? 'Out of Stock' : `${product.totalStock} units`}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold tracking-[0.3em] uppercase mb-0.5" style={{ color: textSec }}>Delivery</span>
                    <span className="font-semibold" style={{ color: textPri }}>{product.deliveryTime || '3–8 days'}</span>
                  </div>
                </div>

                {/* Qty + Wishlist */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[9px] font-bold tracking-[0.4em] uppercase mr-1" style={{ color: textSec }}>Qty</span>
                  <div className="flex items-center h-9 transition-colors rounded-lg" style={{ border: `1px solid ${border}`, background: surface2 }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock}
                      className="pdp-qty-btn w-9 h-full flex items-center justify-center text-base transition-colors rounded-l-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ color: textSec, borderRight: `1px solid ${border}` }}
                    >−</button>
                    <span className="w-9 text-center text-sm font-bold" style={{ color: isDark ? gold : '#B8860B' }}>
                      {isOutOfStock ? 0 : quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.totalStock, quantity + 1))}
                      disabled={isOutOfStock || quantity >= product.totalStock}
                      className="pdp-qty-btn w-9 h-full flex items-center justify-center text-base transition-colors rounded-r-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ color: textSec, borderLeft: `1px solid ${border}` }}
                    >+</button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="w-9 h-9 flex items-center justify-center transition-all shadow-sm rounded-lg"
                    style={{
                      border: `1px solid ${isWishlisted ? gold : border}`,
                      background: isWishlisted ? (isDark ? `${gold}15` : `${gold}25`) : surface2,
                    }}
                  >
                    <Heart size={14} style={{ color: isWishlisted ? (isDark ? gold : '#B8860B') : textSec }} fill={isWishlisted ? (isDark ? gold : '#B8860B') : 'none'} />
                  </motion.button>
                </div>

                {/* CTAs */}
                <div className="flex gap-3 mb-5">
                  {isOutOfStock ? (
                    <button 
                      disabled 
                      className="flex-1 h-11 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase rounded-lg opacity-50 cursor-not-allowed" 
                      style={{ background: surface2, color: textSec, border: `1px solid ${border}` }}
                    >
                      Out of Stock
                    </button>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                        onClick={handleAddToCart}
                        className="pdp-cta-outline flex-1 h-11 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm rounded-lg"
                        style={{ border: `1px solid ${gold}`, color: isDark ? gold : '#B8860B', background: surface2 }}
                      >
                        <ShoppingCart size={13} />
                        Add to Cart
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                        onClick={handleBuyNow}
                        className="flex-1 h-11 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase transition-all rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${gold} 0%, ${goldHi} 100%)`,
                          color: '#000',
                          boxShadow: `0 4px 20px ${gold}40`,
                        }}
                      >
                        <Zap size={13} />
                        Buy Now
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Shipping note */}
                <div
                  className="flex items-center gap-2.5 py-3 px-4 text-[11px] rounded-xl shadow-sm"
                  style={{ border: `1px solid ${border}`, color: textSec, background: surface2 }}
                >
                  <Truck size={13} style={{ color: gold, flexShrink: 0 }} />
                  <span>
                    Free shipping on prepaid orders · Est. delivery{' '}
                    <strong style={{ color: textPri }}>{product.deliveryTime || '3–8 days'}</strong>
                  </span>
                  <HelpCircle size={12} className="ml-auto flex-shrink-0 cursor-pointer opacity-50 hover:opacity-80 transition-opacity" />
                </div>

              </motion.div>
            </div>
          </div>

          <div className="mt-14">
            <div className="flex border-b overflow-x-auto scrollbar-hide" style={{ borderColor: border }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className="relative px-5 py-3 text-[10px] font-bold tracking-[0.3em] uppercase whitespace-nowrap transition-colors flex-shrink-0"
                  style={{ color: selectedTab === tab ? (isDark ? gold : '#B8860B') : textSec }}
                >
                  {tab}
                  {selectedTab === tab && <motion.div layoutId="tab-indicator" className="pdp-tab-bar" />}
                </button>
              ))}
            </div>

            <div className="mt-7 min-h-[200px]">
              <AnimatePresence mode="wait">
                {/* ABOUT */}
                {selectedTab === 'About' && (
                  <motion.div key="about" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                    {dbFeatures.length > 0 && (
                      <div>
                        <h3 className="pdp-serif text-lg font-semibold mb-4 pb-3" style={{ color: isDark ? gold : '#B8860B', borderBottom: `1px solid ${border}` }}>
                          Key Features
                        </h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {dbFeatures.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-[13px] font-medium leading-relaxed" style={{ color: textPri }}>
                              <span className="w-1 h-1 rounded-full mt-[7px] flex-shrink-0" style={{ background: gold }} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h3 className="pdp-serif text-lg font-semibold mb-4 pb-3" style={{ color: isDark ? gold : '#B8860B', borderBottom: `1px solid ${border}` }}>
                        Description
                      </h3>
                      <p className="text-[13px] font-medium leading-[1.8]" style={{ color: textSec }}>
                        {product.aboutDescription || product.description || 'No description available.'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* SPECS */}
                {selectedTab === 'Specs' && (
                  <motion.div key="specs" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {dbSpecs.length > 0 ? (
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
                        {dbSpecs.map((spec: any, idx: number) => (
                          <div
                            key={idx}
                            className="pdp-spec-row flex items-stretch transition-colors"
                            style={{
                              background: idx % 2 === 0 ? surface2 : 'transparent',
                              borderBottom: idx < dbSpecs.length - 1 ? `1px solid ${border}` : 'none',
                            }}
                          >
                            <div className="w-[40%] md:w-[38%] px-5 py-3 text-[10px] font-bold tracking-[0.25em] uppercase flex items-center" style={{ color: textSec }}>
                              {spec.label}
                            </div>
                            <div className="flex-1 px-5 py-3 text-[13px] font-semibold flex items-center border-l" style={{ color: textPri, borderColor: border }}>
                              {spec.value || '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium py-8 text-center" style={{ color: textSec }}>No specifications available.</p>
                    )}
                  </motion.div>
                )}

                {/* IDEAL FOR */}
                {selectedTab === 'Ideal For' && (
                  <motion.div key="ideal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {dbIdealFor.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {dbIdealFor.map((item: string, idx: number) => (
                          <div
                            key={idx}
                            className="pdp-ideal-card flex items-center gap-3 px-4 py-3 text-[13px] font-bold transition-all cursor-default shadow-sm rounded-xl"
                            style={{ background: surface2, border: `1px solid ${border}`, color: textSec }}
                          >
                            <CheckCircle size={13} style={{ color: gold, flexShrink: 0 }} strokeWidth={2.5} />
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium py-8 text-center" style={{ color: textSec }}>No tags available.</p>
                    )}
                  </motion.div>
                )}

                {/* SHIPPING */}
                {selectedTab === 'Shipping' && (
                  <motion.div key="shipping" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                    {[
                      {
                        title: 'Incorrect Product',
                        body: 'If the delivered item does not match your order confirmation, you are eligible for a full return or replacement at no additional cost.',
                      },
                      {
                        title: 'Manufacturing Defect',
                        body: 'Photograph the defect immediately after unboxing and share with our support team. We will arrange a replacement or full refund promptly.',
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-5 p-5 shadow-sm rounded-xl" style={{ background: surface2, border: `1px solid ${border}` }}>
                        <div className="flex-shrink-0 w-[2px] self-stretch" style={{ background: `linear-gradient(180deg, ${gold}, ${gold}30)` }} />
                        <div>
                          <h5 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: isDark ? gold : '#B8860B' }}>{item.title}</h5>
                          <p className="text-[13px] font-medium leading-relaxed" style={{ color: textSec }}>{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}