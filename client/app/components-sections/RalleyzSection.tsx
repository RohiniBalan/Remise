'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_URL = "https://wow-lifebackend.onrender.com/api";

interface RalleyzItem {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  description: string;
  bg: string;
}

interface RalleyzSectionProps {
  theme: 'dark' | 'light';
}

const RalleyzSection = memo(({ theme }: RalleyzSectionProps) => {
  const [items, setItems] = useState<RalleyzItem[]>([]);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  // Fetch data from API
  useEffect(() => {
    fetchRalleyzItems();
  }, []);

  const fetchRalleyzItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/ralleyz`);
      
      if (response.data.success && response.data.data) {
        setItems(response.data.data);
        setImageErrors({});
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching ralleyz items:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // Auto-play tracking effect
  useEffect(() => {
    if (items.length === 0) return;

    const step = 50;
    const duration = 4000;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + (step / duration) * 100;
        return nextProgress >= 100 ? 100 : nextProgress;
      });
    }, step);

    return () => clearInterval(interval);
  }, [active, items.length]);

  // Handle slide transition when progress completes
  useEffect(() => {
    if (progress >= 100) {
      setActive((current) => (current + 1) % items.length);
      setProgress(0);
    }
  }, [progress, items.length]);

  const handleCardClick = (index: number) => {
    setActive(index);
    setProgress(0);
  };

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

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <section className={`w-full min-h-screen py-8 px-4 flex justify-center items-center ${isDark ? 'bg-zinc-950' : 'bg-gray-200'}`}>
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDark ? 'text-zinc-400' : 'text-gray-600'}>Loading amazing vehicles...</p>
        </div>
      </section>
    );
  }

  if (error || items.length === 0) {
    return (
      <section className={`w-full min-h-screen py-8 px-4 flex justify-center items-center ${isDark ? 'bg-zinc-950' : 'bg-gray-200'}`}>
        <div className="text-center">
          <p className={isDark ? 'text-zinc-400' : 'text-gray-600'}>No vehicles available at the moment.</p>
        </div>
      </section>
    );
  }

  const activeItem = items[active];

  return (
    <section 
      className={`w-full min-h-screen py-8 px-4 md:py-12 md:px-8 flex justify-center items-center transition-colors duration-700
        ${isDark ? 'bg-zinc-950' : 'bg-gray-200'}
      `}
    >
      <div className="relative w-full max-w-6xl h-[700px] md:h-[600px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-black/5 group select-none bg-zinc-900">
        
        {/* Background Layer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${activeItem.id}`}
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
                loading="eager"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Giant Watermark */}
        <div className="absolute top-4 right-6 md:top-6 md:right-8 text-white/10 text-7xl md:text-9xl font-black leading-none pointer-events-none z-10 mix-blend-overlay">
          0{active + 1}
        </div>

        {/* Text Content */}
        <div className="absolute inset-x-0 top-12 md:top-1/2 md:-translate-y-1/2 md:left-16 z-30 px-6 md:px-0 max-w-sm md:max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${activeItem.id}`}
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

              <button className="flex items-center gap-4 text-white text-xs md:text-sm font-bold uppercase tracking-widest group/btn hover:text-[#D4AF37] transition-colors">
                View Specs
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/30 flex items-center justify-center group-hover/btn:bg-[#D4AF37] group-hover/btn:border-[#D4AF37] group-hover/btn:text-black transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Compact Interactive Carousel */}
        <div className="absolute bottom-6 left-0 right-0 md:left-auto md:right-8 z-40 flex justify-center md:justify-end gap-2 md:gap-3 h-24 md:h-32 items-end px-4">
          {items.map((item, index) => {
            const isActive = index === active;
            return (
              <motion.div
                key={`thumb-${item.id}-${index}`}
                onClick={() => handleCardClick(index)}
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
                  loading="lazy"
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
      </div>
    </section>
  );
});

RalleyzSection.displayName = 'RalleyzSection';

export default function RalleyzSectionComponent() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const resolveTheme = () => {
      const docTheme = document.documentElement.getAttribute('data-theme');
      const hasDarkClass = document.documentElement.classList.contains('dark');
      return (docTheme === 'light' || (!hasDarkClass && docTheme !== 'dark')) ? 'light' : 'dark';
    };

    setTheme(resolveTheme());
    const observer = new MutationObserver(() => setTheme(resolveTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    
    return () => observer.disconnect();
  }, []);

  return <RalleyzSection theme={theme} />;
}