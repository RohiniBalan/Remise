'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_URL = "https://wow-lifebackend.onrender.com/api";

interface Video {
  _id: string;
  title: string;
  description?: string;
  videoId: number;
  src: string;
  color: string;
  rating: string;
  category: string;
  order: number;
  isActive: boolean;
}

interface Config {
  title: string;
  subtitle: string;
  badgeText: string;
  highlightText: string;
  buttonText: string;
  isActive: boolean;
  autoCycleDuration: number;
  theme: 'dark' | 'light';
}

// Optimized Studio Showcase Component
const StudioShowcase = memo(({ videos, config, theme }: { videos: Video[], config: Config, theme: 'dark' | 'light' }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const activeVideo = videos[activeIndex] || videos[0];
  const CYCLE_DURATION = config.autoCycleDuration || 5000;
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { margin: "0px 0px -100px 0px" });

  const handleNext = () => { 
    setActiveIndex((prev) => (prev + 1) % videos.length); 
    setTimer(0); 
  };
  
  const handlePrev = () => { 
    setActiveIndex((prev) => (prev - 1 + videos.length) % videos.length); 
    setTimer(0); 
  };

  useEffect(() => {
    if (!isInView || videos.length === 0) return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= CYCLE_DURATION) handleNext();
      else setTimer((elapsed / CYCLE_DURATION) * 100);
    }, 50);
    return () => clearInterval(interval);
  }, [activeIndex, isInView, videos.length, CYCLE_DURATION]);

  if (!activeVideo || videos.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8 md:py-10 text-center">
        <p className="text-gray-500">No videos available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-7xl mx-auto perspective-[800px] md:perspective-[1200px] py-8 md:py-10 group">
      <div className={`relative w-full aspect-[4/3] md:aspect-[16/9] lg:aspect-[2.35/1] rounded-xl md:rounded-2xl lg:rounded-[2rem] shadow-lg md:shadow-2xl overflow-hidden ${theme === 'light' ? 'bg-gray-100 shadow-gray-300' : 'bg-[#0a0a0a] shadow-black'} border border-white/5`}>
        <div className="absolute -inset-2 md:-inset-4 blur-[40px] md:blur-[80px] opacity-20 transition-colors duration-1000 -z-10" style={{ backgroundColor: activeVideo.color }} />
        <div className="absolute inset-0 bg-black">
          <AnimatePresence mode='wait'>
            <motion.div key={activeVideo.videoId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="w-full h-full">
              {isInView && (
                <video src={activeVideo.src} className="w-full h-full object-cover" autoPlay muted playsInline loop crossOrigin="anonymous" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none opacity-80" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute top-4 md:top-8 left-4 md:left-8 z-20">
          <div className="flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-medium text-white uppercase tracking-widest">{config.badgeText}</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 p-4 md:p-8 z-20 flex flex-col gap-1 transition-transform duration-500 group-hover:translate-x-2">
          <h3 className="text-white text-lg md:text-3xl font-light tracking-wide flex items-center gap-2 md:gap-4">
            <span className="font-bold">No. {activeVideo.videoId.toString().padStart(2, '0')}</span>
            <span className="text-white/30 text-sm md:text-xl font-thin">|</span>
            <span className="text-white/80 text-sm md:text-xl font-light tracking-widest uppercase">{activeVideo.category}</span>
          </h3>
          <p className="text-white/40 text-[10px] md:text-xs tracking-widest uppercase mt-1">{activeVideo.title} • {activeVideo.rating} Rating</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
          <button onClick={handlePrev} className="pointer-events-auto p-2 md:p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-black transition-all transform hover:scale-110">
            <ChevronLeft size={18} className="md:size-[24px]" />
          </button>
          <button onClick={handleNext} className="pointer-events-auto p-2 md:p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-black transition-all transform hover:scale-110">
            <ChevronRight size={18} className="md:size-[24px]" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-30">
          <motion.div className="h-full bg-[#D4AF37] shadow-[0_0_5px_#D4AF37] md:shadow-[0_0_10px_#D4AF37]" style={{ width: `${timer}%` }} />
        </div>
      </div>
    </div>
  );
});

StudioShowcase.displayName = 'StudioShowcase';

interface StudioShowcaseSectionProps {
  theme: 'dark' | 'light';
}

export default function StudioShowcaseSection({ theme }: StudioShowcaseSectionProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [videosRes, configRes] = await Promise.all([
        axios.get(`${API_URL}/studio/videos`),
        axios.get(`${API_URL}/studio/config`)
      ]);

      if (videosRes.data.success) {
        setVideos(videosRes.data.data.filter((v: Video) => v.isActive));
      }

      if (configRes.data.success) {
        setConfig(configRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching studio data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !config || !config.isActive || videos.length === 0) {
    return null;
  }

  return (
    <section className={`relative py-12 md:py-32 ${theme === 'light' ? 'bg-gray-50' : 'bg-black'} overflow-hidden border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] md:h-[500px] ${theme === 'light' ? 'bg-gradient-to-b from-white to-transparent' : 'bg-gradient-to-b from-[#111] to-transparent'}`} />
      </div>
      <div className="container mx-auto px-4 relative z-20">
        <div className="text-center mb-8 md:mb-16">
          <h2 className={`text-2xl md:text-4xl lg:text-5xl xl:text-7xl font-black tracking-tighter leading-none mb-3 md:mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            {config.title.split(config.highlightText).map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="text-[#D4AF37]">{config.highlightText}</span>}
              </React.Fragment>
            ))}
          </h2>
          <p className={`max-w-2xl mx-auto text-sm md:text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            {config.subtitle}
          </p>
        </div>
        
        <StudioShowcase videos={videos} config={config} theme={theme} />
      </div>
    </section>
  );
}