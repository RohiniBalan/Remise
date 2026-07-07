'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Tag, Truck, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = "https://wow-lifebackend.onrender.com/api";

interface BrandLogo { name: string; src: string; }
interface HeroContent {
  badgeText: string; title: string; titleGradient: string;
  description: string; primaryButtonText: string; secondaryButtonText: string;
  carImages: string[]; brands: BrandLogo[];
}
interface HeroSectionProps { theme: 'dark' | 'light'; isMobile: boolean; }

// ── Trust badges ─────────────────────────────────────────────────────────────
const TRUST = [
  { icon: <Truck size={18} />,        label: 'Free Delivery',     sub: 'On orders ₹499+' },
  { icon: <ShieldCheck size={18} />,  label: 'Secure Payments',   sub: '100% protected' },
  { icon: <RefreshCw size={18} />,    label: 'Easy Returns',      sub: '7-day return policy' },
  { icon: <Tag size={18} />,          label: 'Best Prices',       sub: 'Lowest guaranteed' },
];

export default function HeroSection({ theme, isMobile }: HeroSectionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [content,      setContent]      = useState<HeroContent | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [imageErrors,  setImageErrors]  = useState<Set<number>>(new Set());
  const [direction,    setDirection]    = useState(1);

  const isLight = theme === 'light';

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => { fetchContent(); }, []);

  const fetchContent = async () => {
    try {
      const res = await axios.get(`${API_URL}/hero`);
      if (res.data.success) { setContent(res.data.data); return; }
    } catch {}
    // fallback
    setContent({
      badgeText: 'YOUR EVERYDAY LIFESTYLE STORE',
      title: 'Everything You',
      titleGradient: 'Need, Delivered.',
      description: 'From fresh groceries and beauty essentials to toys, fashion & home — all in one place, right at your doorstep.',
      primaryButtonText: 'Shop Now',
      secondaryButtonText: 'Browse Categories',
      carImages: [
        'https://images.unsplash.com/photo-1542838132-29423eda0ea4?w=600&h=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&auto=format&fit=crop&q=80',
      ],
      brands: [
        { name: 'Nestlé',      src: '' },
        { name: 'Nivea',       src: '' },
        { name: 'Samsung',     src: '' },
        { name: "Levi's",      src: '' },
        { name: 'IKEA',        src: '' },
        { name: "L'Oréal",     src: '' },
        { name: 'Philips',     src: '' },
        { name: 'Nike',        src: '' },
        { name: 'Unilever',    src: '' },
        { name: 'Hamleys',     src: '' },
        { name: 'Puma',        src: '' },
        { name: 'Bosch',       src: '' },
      ],
    });
    setIsLoading(false);
  };

  useEffect(() => { if (content) setIsLoading(false); }, [content]);

  // ── Carousel auto-play ───────────────────────────────────────────────────
  useEffect(() => {
    if (!content?.carImages?.length) return;
    const id = setInterval(() => {
      setDirection(1);
      setCurrentIndex(p => (p + 1) % content.carImages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [content?.carImages]);

  const go = useCallback((dir: 1 | -1) => {
    if (!content?.carImages?.length) return;
    setDirection(dir);
    setCurrentIndex(p => (p + dir + content.carImages.length) % content.carImages.length);
  }, [content?.carImages]);

  // ── Gradient backgrounds for each slide ──────────────────────────────────
  const SLIDE_BG = [
    'from-amber-50 via-yellow-50 to-orange-50',
    'from-blue-50 via-sky-50 to-cyan-50',
    'from-purple-50 via-violet-50 to-indigo-50',
    'from-rose-50 via-pink-50 to-red-50',
    'from-green-50 via-emerald-50 to-teal-50',
  ];
  const DARK_SLIDE_BG = [
    'from-amber-950/50 via-yellow-950/30 to-gray-950',
    'from-blue-950/50 via-sky-950/30 to-gray-950',
    'from-purple-950/50 via-violet-950/30 to-gray-950',
    'from-rose-950/50 via-pink-950/30 to-gray-950',
    'from-green-950/50 via-emerald-950/30 to-gray-950',
  ];

  if (isLoading) return (
    <section className={`min-h-[520px] flex items-center justify-center ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-950'} pt-[64px] sm:pt-[96px] lg:pt-[136px]`}>
      <Loader2 size={36} className="animate-spin text-[#D4AF37]" />
    </section>
  );
  if (!content) return null;

  const validImages = content.carImages.filter((_, i) => !imageErrors.has(i));
  const safeIndex   = validImages.length ? currentIndex % validImages.length : 0;
  const bgSet       = isLight ? SLIDE_BG : DARK_SLIDE_BG;
  const curBg       = bgSet[safeIndex % bgSet.length];

  return (
    <section className={`pt-[64px] sm:pt-[96px] lg:pt-[136px] ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-950'}`}>

      {/* ── Main Banner ─────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${curBg} transition-all duration-700`}>

        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-[#0FA3B1]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* ── Text side ─────────────────────────────────────────────── */}
            <div className="order-2 lg:order-1 text-center lg:text-left space-y-4 lg:space-y-6">

              {/* Badge */}
              <motion.div
                key={`badge-${safeIndex}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40"
              >
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-xs font-bold text-[#9a7d20] uppercase tracking-widest">{content.badgeText}</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                key={`title-${safeIndex}`}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}
              >
                {content.title}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#f0cc60] to-[#D4AF37]">
                  {content.titleGradient}
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                key={`desc-${safeIndex}`}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className={`text-sm md:text-base leading-relaxed max-w-md mx-auto lg:mx-0 ${isLight ? 'text-gray-600' : 'text-gray-300'}`}
              >
                {content.description}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                <button
                  onClick={() => router.push('/category')}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FF0000] hover:bg-[#e00000] text-white font-bold rounded-xl shadow-lg shadow-[#FF0000]/20 transition group text-sm"
                >
                  {content.primaryButtonText}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => router.push('/#shop-by-category')}
                  className={`flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm border transition ${isLight ? 'border-[#BBD5DA] text-gray-700 hover:bg-[#DFF1F1]' : 'border-white/15 text-white hover:bg-white/5'}`}
                >
                  {content.secondaryButtonText}
                </button>
              </motion.div>

              {/* Slide dots */}
              {validImages.length > 1 && (
                <div className="flex items-center gap-2 justify-center lg:justify-start pt-2">
                  {validImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setDirection(i > safeIndex ? 1 : -1); setCurrentIndex(i); }}
                      className={`rounded-full transition-all duration-300 ${i === safeIndex ? 'w-6 h-2.5 bg-[#D4AF37]' : 'w-2.5 h-2.5 bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Image side ────────────────────────────────────────────── */}
            <div className="order-1 lg:order-2 relative h-[220px] sm:h-[280px] md:h-[340px] lg:h-[420px] flex items-center justify-center">
              <AnimatePresence mode="wait" custom={direction}>
                {validImages[safeIndex] && (
                  <motion.div
                    key={safeIndex}
                    custom={direction}
                    variants={{
                      enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0, scale: 0.95 }),
                      center: { x: 0, opacity: 1, scale: 1 },
                      exit:   (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0, scale: 0.95 }),
                    }}
                    initial="enter" animate="center" exit="exit"
                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                    className="absolute w-full flex items-center justify-center"
                  >
                    {/* Glow under image */}
                    <div className="absolute bottom-0 w-[70%] h-16 bg-[#D4AF37]/20 blur-2xl rounded-full mx-auto" />
                    <motion.img
                      src={validImages[safeIndex]}
                      alt={`Product ${safeIndex + 1}`}
                      animate={{ y: [-6, 6, -6] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      onError={() => setImageErrors(prev => new Set(prev).add(safeIndex))}
                      className="relative max-h-[200px] sm:max-h-[260px] md:max-h-[320px] lg:max-h-[400px] w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Prev / Next arrows */}
              {validImages.length > 1 && (
                <>
                  <button onClick={() => go(-1)}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-md transition z-20 ${isLight ? 'bg-white border border-[#BBD5DA] hover:border-[#0FA3B1]' : 'bg-white/10 border border-white/10 hover:bg-white/20'}`}>
                    <ChevronLeft size={18} className={isLight ? 'text-gray-700' : 'text-white'} />
                  </button>
                  <button onClick={() => go(1)}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-md transition z-20 ${isLight ? 'bg-white border border-[#BBD5DA] hover:border-[#0FA3B1]' : 'bg-white/10 border border-white/10 hover:bg-white/20'}`}>
                    <ChevronRight size={18} className={isLight ? 'text-gray-700' : 'text-white'} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust Strip ─────────────────────────────────────────────────────── */}
      <div className={`border-y ${isLight ? 'bg-white border-[#BBD5DA]' : 'bg-gray-900 border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {TRUST.map((t, i) => (
              <div key={i} className={`flex items-center gap-3 py-4 px-4 ${i < 3 ? `border-r ${isLight ? 'border-[#BBD5DA]' : 'border-white/10'}` : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-[#DFF1F1] flex items-center justify-center text-teal-600 shrink-0">
                  {t.icon}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-xs font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{t.label}</p>
                  <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{t.sub}</p>
                </div>
                <div className="sm:hidden">
                  <p className={`text-xs font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{t.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Brand Marquee ────────────────────────────────────────────────────── */}
      {content.brands.length > 0 && (
        <div className={`py-4 overflow-hidden relative ${isLight ? 'bg-[#F5F5F5] border-b border-[#BBD5DA]' : 'bg-gray-950 border-b border-white/10'}`}>
          <div className={`absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r ${isLight ? 'from-[#F5F5F5]' : 'from-gray-950'} to-transparent z-10`} />
          <div className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l ${isLight ? 'from-[#F5F5F5]' : 'from-gray-950'} to-transparent z-10`} />
          <motion.div
            className="flex items-center gap-8 min-w-max"
            animate={{ x: '-50%' }}
            transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
          >
            {[...content.brands, ...content.brands].map((brand, i) =>
              brand.src ? (
                <img
                  key={i}
                  src={brand.src}
                  alt={brand.name}
                  loading="lazy"
                  className={`h-7 w-auto object-contain ${isLight ? 'grayscale opacity-40 hover:grayscale-0 hover:opacity-100' : 'grayscale opacity-30 hover:grayscale-0 hover:opacity-80'} transition-all duration-300 cursor-pointer`}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span
                  key={i}
                  className={`text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all duration-300 cursor-default select-none ${
                    isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {brand.name}
                </span>
              )
            )}
          </motion.div>
        </div>
      )}
    </section>
  );
}
