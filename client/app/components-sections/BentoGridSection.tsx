'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Star, Gift, Rocket, Brain, Music, Palette, Bot, Gamepad2, Zap, Loader2 } from 'lucide-react';
import { useInView } from 'framer-motion';

// Icon Map for dynamic rendering
const ICON_MAP: Record<string, React.ElementType> = {
  Star, Gift, Brain, Music, Rocket, Zap, Palette, Bot, Gamepad2
};

export interface BentoItemType {
  id: string | number;
  title: string;
  subtitle: string;
  className: string;
  img: string;
  isVideo: boolean;
  icon: string;
  iconColor: string;
  color: string;
}

interface BentoGridSectionProps {
  theme?: 'dark' | 'light';
  isPreview?: boolean;
  previewData?: BentoItemType[];
}

const BentoItem = memo(({ item, theme, index }: { item: BentoItemType, theme: string, index: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { margin: "0px 0px -100px 0px" });

  useEffect(() => {
    if (item.isVideo && videoRef.current) {
      if (isInView) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [isInView, item.isVideo]);

  const IconComponent = ICON_MAP[item.icon] || Star;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className={`group relative rounded-2xl md:rounded-[2.5rem] overflow-hidden cursor-pointer ${item.className} ${theme === 'light' ? 'bg-gray-100' : 'bg-[#0f0f0f]'} border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} will-change-transform`}
    >
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
        {item.isVideo ? (
          <video 
            ref={videoRef}
            src={item.img} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            muted loop playsInline preload="none" crossOrigin="anonymous" 
          />
        ) : (
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.img})` }} />
        )}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 mix-blend-overlay" style={{ backgroundColor: item.color }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      <div className="absolute inset-0 p-4 md:p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className={`p-2 md:p-3 rounded-full backdrop-blur-md ${theme === 'light' ? 'bg-white/90 text-black' : 'bg-black/40 text-white border border-white/20'}`}>
            <IconComponent size={14} className={`md:size-[20px] ${item.iconColor}`} />
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <ArrowRight size={16} className="md:size-[20px] text-white -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
          </div>
        </div>
        <div>
          <span className="text-[#D4AF37] font-bold tracking-widest text-[8px] md:text-[10px] uppercase mb-1 md:mb-2 block opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75">{item.subtitle}</span>
          <h3 className="text-white text-lg md:text-2xl lg:text-3xl font-black uppercase leading-tight tracking-tight drop-shadow-lg">{item.title}</h3>
        </div>
      </div>
    </motion.div>
  );
});

BentoItem.displayName = 'BentoItem';

const BentoGrid = memo(({ theme, isPreview = false, previewData = [] }: BentoGridSectionProps) => {
  const [items, setItems] = useState<BentoItemType[]>(previewData);
  const [isLoading, setIsLoading] = useState(!isPreview);

  useEffect(() => {
    if (isPreview) {
      setItems(previewData);
      return;
    }

    const fetchItems = async () => {
      try {
        const API_URL = "https://wow-lifebackend.onrender.com/api";
        const response = await fetch(`${API_URL}/bentogrid`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          setItems(result.data);
        }
      } catch (error) {
        console.error('Error fetching bento grid:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [isPreview, previewData]);

  if (isLoading) {
    return (
      <div className={`w-full py-24 flex justify-center items-center border-t ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-black'}`}>
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className={`py-12 md:py-24 relative ${theme === 'light' ? 'bg-white' : 'bg-black'} border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="md:size-[16px] text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold tracking-[0.2em] text-xs uppercase">Curated Collections</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`text-3xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Best of <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC]">WOW Lifestyle</span>
            </motion.h2>
          </div>
          <motion.button initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={`px-6 py-3 md:px-8 md:py-4 rounded-full border ${theme === 'light' ? 'border-gray-200 hover:bg-gray-100 text-black' : 'border-white/20 hover:bg-white/10 text-white'} font-bold tracking-wide transition-all flex items-center gap-2 group`}>
            Explore All Categories <ArrowRight size={16} className="md:size-[18px] group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[180px] md:auto-rows-[280px]">
          {items.map((item, i) => (
            <BentoItem key={item.id} item={item} theme={theme || 'dark'} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
});

BentoGrid.displayName = 'BentoGrid';

export default function BentoGridSection({ theme = 'dark', isPreview, previewData }: BentoGridSectionProps) {
  return <BentoGrid theme={theme} isPreview={isPreview} previewData={previewData} />;
}