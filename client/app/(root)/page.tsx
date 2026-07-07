'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Tag, MapPin, Clock, ArrowRight, Percent, ShoppingBasket } from 'lucide-react';

import NavbarHome from '@/app/components-main/NavbarHome';
import Preloader from '../components-main/Preloader';
import HeroSection from '../components-sections/HeroSection';
import BestSellersSection from '../components-sections/BestSellersSection';
import ShopByCategorySection from '../components-sections/ShopByCategorySection';
import ShopByOffersNearbySection from '../components-sections/ShopByOffersNearbySection';

// ── Promotional Banner Strip ─────────────────────────────────────────────────
function DealStrip({ theme }: { theme: 'dark' | 'light' }) {
  const isLight = theme === 'light';

  const DEALS = [
    { icon: <Percent size={16} />,        title: 'Up to 50% Off',       sub: 'On select products',      color: 'bg-[#FF0000]',   link: '/category' },
    { icon: <MapPin size={16} />,         title: 'Nearby Offers',       sub: 'Deals around you',        color: 'bg-[#0FA3B1]',   link: '/nearby' },
    { icon: <ShoppingBasket size={16} />, title: 'Monthly / Bulk Buy',  sub: 'Scan your purchase list', color: 'bg-teal-600',    link: '/bulk-purchase' },
    { icon: <Clock size={16} />,          title: 'Flash Sales',         sub: 'Limited time deals',      color: 'bg-purple-600',  link: '/category' },
  ];

  return (
    <section className={`py-6 ${isLight ? 'bg-white border-y border-[#BBD5DA]' : 'bg-gray-900 border-y border-white/10'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DEALS.map((deal, i) => (
            <Link key={i} href={deal.link}>
              <motion.div
                whileHover={{ y: -2 }}
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isLight ? 'border-[#BBD5DA] hover:border-[#0FA3B1] hover:shadow-md bg-[#F5F5F5]' : 'border-white/10 hover:border-white/20 bg-gray-800'}`}
              >
                <div className={`w-10 h-10 rounded-xl ${deal.color} text-white flex items-center justify-center shrink-0`}>
                  {deal.icon}
                </div>
                <div>
                  <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{deal.title}</p>
                  <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{deal.sub}</p>
                </div>
                <ArrowRight size={14} className={`ml-auto ${isLight ? 'text-gray-300' : 'text-gray-600'}`} />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section Divider ──────────────────────────────────────────────────────────
function SectionDivider({ theme }: { theme: 'dark' | 'light' }) {
  return <div className={`h-3 ${theme === 'light' ? 'bg-[#F5F5F5]' : 'bg-gray-950'}`} />;
}

// ── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [isLoading,    setIsLoading]    = useState(true);
  const [theme,        setTheme]        = useState<'dark' | 'light'>('light');
  const [isMobile,     setIsMobile]     = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const mainRef          = useRef<HTMLDivElement>(null);
  const shopByCategoryRef = useRef<HTMLDivElement>(null);

  const phoneNumber    = '+919677710045';
  const whatsappNumber = '9677710045';

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    document.documentElement.style.scrollBehavior = 'auto';
    setTimeout(() => { document.documentElement.style.scrollBehavior = 'smooth'; }, 100);

    const timer = setTimeout(() => {
      setIsLoading(false);
      document.documentElement.style.scrollBehavior = 'smooth';
    }, 2800);

    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleHash = () => {
      if (window.location.hash === '#shop-by-category' && shopByCategoryRef.current) {
        setTimeout(() => shopByCategoryRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };
    setTimeout(handleHash, 500);
    window.addEventListener('hashchange', handleHash);

    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);
    const doc = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (doc) setTheme(doc);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) setTheme(e.detail as 'dark' | 'light'); };
    window.addEventListener('theme-change', handler as EventListener);
    return () => window.removeEventListener('theme-change', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!isLoading && mainRef.current) void mainRef.current.offsetHeight;
  }, [isLoading]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
  };

  const isLight = theme === 'light';

  return (
    <>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      <main ref={mainRef} className={`min-h-screen w-full transition-colors duration-300 overflow-x-hidden ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-950'}`}>
        <AnimatePresence mode="wait">
          {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
        </AnimatePresence>

        {!isLoading && (
          <>
            {/* ── Hero Banner ─────────────────────────────────────────── */}
            <HeroSection theme={theme} isMobile={isMobile} />

            {/* ── Deals Strip ─────────────────────────────────────────── */}
            <DealStrip theme={theme} />

            {/* ── Shop by Offers Nearby ───────────────────────────────── */}
            <SectionDivider theme={theme} />
            <ShopByOffersNearbySection theme={theme} />

            {/* ── Shop by Category ────────────────────────────────────── */}
            <SectionDivider theme={theme} />
            <div id="shop-by-category" ref={shopByCategoryRef}>
              <ShopByCategorySection theme={theme} />
            </div>

            {/* ── Best Sellers ────────────────────────────────────────── */}
            <SectionDivider theme={theme} />
            <BestSellersSection theme={theme} />

            {/* ── Floating Contact Button ─────────────────────────────── */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
              <AnimatePresence>
                {isContactOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-col gap-3 mb-1"
                  >
                    {/* WhatsApp */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3">
                      <span className="text-sm font-medium bg-black/70 backdrop-blur text-white px-3 py-1.5 rounded-lg whitespace-nowrap">
                        WhatsApp Us
                      </span>
                      <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                        className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                    </motion.div>

                    {/* Call */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.05 } }} exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3">
                      <span className="text-sm font-medium bg-black/70 backdrop-blur text-white px-3 py-1.5 rounded-lg whitespace-nowrap">
                        Call Us
                      </span>
                      <a href={`tel:${phoneNumber}`}
                        className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle button */}
              <motion.button
                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
                onClick={() => setIsContactOpen(v => !v)}
                animate={{ boxShadow: isContactOpen ? '0 0 16px rgba(212,175,55,0.3)' : ['0 0 0 rgba(212,175,55,0.4)', '0 0 22px rgba(212,175,55,0.6)', '0 0 0 rgba(212,175,55,0.4)'] }}
                transition={{ boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
                className="w-14 h-14 bg-[#FF0000] hover:bg-[#e00000] rounded-full flex items-center justify-center shadow-xl border-2 border-red-300/40 z-50 transition"
              >
                <motion.svg
                  animate={{ rotate: isContactOpen ? 135 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="w-7 h-7 text-black"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </motion.svg>
              </motion.button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
