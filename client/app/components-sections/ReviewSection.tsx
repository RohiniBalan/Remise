'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Maximize2, User, Loader2 } from 'lucide-react';

export interface ReviewItem {
  id: string | number;
  name: string;
  rating: number;
  text: string;
  date: string;
  avatar: string;
}

export interface PhotoItem {
  id: string | number;
  url: string;
}

export interface ReviewConfigData {
  reviews: ReviewItem[];
  photos: PhotoItem[];
}

interface ReviewSectionProps {
  theme?: 'dark' | 'light';
  isPreview?: boolean;
  previewData?: ReviewConfigData;
}

const ReviewSection = memo(({ theme = 'dark', isPreview = false, previewData }: ReviewSectionProps) => {
  const [data, setData] = useState<ReviewConfigData>(previewData || { reviews: [], photos: [] });
  const [isLoading, setIsLoading] = useState(!isPreview);

  useEffect(() => {
    if (isPreview && previewData) {
      setData(previewData);
      return;
    }

    const fetchData = async () => {
      try {
        const API_URL = "https://wow-lifebackend.onrender.com/api";
        const response = await fetch(`${API_URL}/reviews`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isPreview, previewData]);

  if (isLoading) {
    return (
      <div className={`w-full py-32 flex justify-center items-center border-t ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-[#080808]'}`}>
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  // Calculate average rating dynamically
  const avgRating = data.reviews.length > 0 
    ? (data.reviews.reduce((acc, curr) => acc + curr.rating, 0) / data.reviews.length).toFixed(2)
    : "5.00";

  return (
    <section className={`py-12 md:py-32 relative overflow-hidden ${theme === 'light' ? 'bg-gray-50' : 'bg-[#080808]'} border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
      <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-gradient-to-bl from-[#D4AF37]/10 to-transparent blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header & Rating Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center mb-12 md:mb-20">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-2 mb-4">
              <MessageSquare size={14} className="md:size-[16px] text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold tracking-[0.2em] text-xs uppercase">Community Voices</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none mb-4 md:mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Loved By <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC]">Collectors</span>
            </motion.h2>
            <p className={`text-sm md:text-lg max-w-md ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Join thousands of happy customers discovering the rarest collectibles.
            </p>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`p-6 md:p-8 rounded-2xl md:rounded-[2rem] border backdrop-blur-xl ${theme === 'light' ? 'bg-white/80 border-gray-200 shadow-lg md:shadow-xl' : 'bg-white/5 border-white/10 shadow-lg md:shadow-2xl'}`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-6 md:mb-8">
              <div className="flex flex-col text-center md:text-left">
                <span className={`text-5xl md:text-6xl font-black ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{avgRating}</span>
                <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="md:size-[16px] text-[#D4AF37]" fill="#D4AF37" />)}
                </div>
                <span className={`text-xs md:text-sm mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Based on {data.reviews.length} reviews</span>
              </div>
              <div className="hidden md:block h-16 w-px bg-current opacity-10" />
              <div className="flex-1 w-full md:w-auto space-y-2">
                {[5,4,3,2,1].map((num, i) => (
                  <div key={num} className="flex items-center gap-3 text-xs font-bold">
                    <span className={`w-3 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>{num}</span>
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-gray-100' : 'bg-white/10'}`}>
                      <motion.div 
                        initial={{ width: 0 }} 
                        whileInView={{ width: i === 0 ? '85%' : i === 1 ? '10%' : '2%' }} 
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-[#D4AF37]" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className={`w-full py-3 md:py-4 rounded-lg md:rounded-xl font-bold tracking-wide transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm md:text-base ${theme === 'light' ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/30' : 'bg-[#D4AF37] text-black shadow-[0_0_20px_#D4AF37]'}`}>
              Write a Review
            </button>
          </motion.div>
        </div>

        {/* Marquee Reviews (Requires at least a few items to loop smoothly) */}
        {data.reviews.length > 0 && (
          <div className="relative mb-12 md:mb-20">
            <div className={`absolute left-0 top-0 bottom-0 w-8 md:w-16 lg:w-32 z-10 bg-gradient-to-r ${theme === 'light' ? 'from-gray-50' : 'from-[#080808]'} to-transparent`} />
            <div className={`absolute right-0 top-0 bottom-0 w-8 md:w-16 lg:w-32 z-10 bg-gradient-to-l ${theme === 'light' ? 'from-gray-50' : 'from-[#080808]'} to-transparent`} />
            <div className="flex gap-4 md:gap-6 overflow-hidden mask-linear-fade pb-6 md:pb-8">
              <motion.div 
                animate={{ x: "-50%" }} 
                transition={{ duration: 60, ease: "linear", repeat: Infinity }}
                className="flex gap-4 md:gap-6 flex-shrink-0 will-change-transform"
              >
                {/* Tripled to create infinite seamless loop effect */}
                {[...data.reviews, ...data.reviews, ...data.reviews].map((review, i) => (
                  <div key={`${review.id}-${i}`} className={`w-64 md:w-80 p-4 md:p-6 rounded-xl md:rounded-2xl flex-shrink-0 border ${theme === 'light' ? 'bg-white border-gray-100 shadow-sm' : 'bg-[#111] border-white/5'}`}>
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 overflow-hidden">
                        {review.avatar ? (
                          <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                        ) : null}
                        <User className={`w-full h-full p-2 text-gray-500 ${review.avatar ? 'hidden' : ''}`} /> 
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-xs md:text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{review.name}</h4>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, r) => <Star key={r} size={10} className="md:size-[10px] text-[#D4AF37]" fill="#D4AF37" />)}
                        </div>
                      </div>
                      <span className={`text-[8px] md:text-[10px] ${theme === 'light' ? 'text-gray-400' : 'text-gray-600'}`}>{review.date}</span>
                    </div>
                    <p className={`text-xs md:text-sm leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>"{review.text}"</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        )}

        {/* Customer Gallery */}
        {data.photos.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-3">
              <h3 className={`text-xl md:text-2xl font-bold uppercase tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Customer Gallery</h3>
              <a href="#" className={`text-xs md:text-sm font-bold border-b hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors ${theme === 'light' ? 'text-gray-900 border-gray-300' : 'text-white border-white/30'}`}>View All Photos</a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {data.photos.map((photo, i) => (
                <motion.div 
                  key={photo.id || i} 
                  whileHover={{ y: -5 }}
                  className={`aspect-square rounded-xl md:rounded-2xl overflow-hidden cursor-pointer relative group ${theme === 'light' ? 'bg-gray-200' : 'bg-[#111]'}`}
                >
                  <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${photo.url})` }} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="text-white md:size-[24px]" size={18} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </section>
  );
});

ReviewSection.displayName = 'ReviewSection';

export default function ReviewSectionComponent({ theme = 'dark', isPreview, previewData }: ReviewSectionProps) {
  return <ReviewSection theme={theme} isPreview={isPreview} previewData={previewData} />;
}