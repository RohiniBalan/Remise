'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // IMPORT ROUTER
import { Star, Baby, Zap, Trophy, Sparkles, Building2, Wand2, Gauge, Loader2 } from 'lucide-react';

// Define your backend API URL here
const API_URL = "https://wow-lifebackend.onrender.com/api";

// Map string names from DB to actual Icon components
const ICON_MAP: Record<string, React.ElementType> = {
  Star, Baby, Zap, Trophy, Sparkles, Building2, Wand2, Gauge
};

export interface AgeGroupItem {
  id: string | number;
  label: string;
  sub: string;
  img: string;
  gradient: string;
  icon: string;
}

interface ShopByAgeSectionProps {
  theme: 'dark' | 'light';
  isPreview?: boolean;
  previewData?: AgeGroupItem[];
}

const ShopByAge = memo(({ theme, isPreview = false, previewData = [] }: ShopByAgeSectionProps) => {
  const router = useRouter(); // INITIALIZE ROUTER
  const [items, setItems] = useState<AgeGroupItem[]>(previewData);
  const [isLoading, setIsLoading] = useState(!isPreview);

  useEffect(() => {
    if (isPreview) {
      setItems(previewData);
      return;
    }

    const fetchItems = async () => {
      try {
        // Updated fetch URL
        const response = await fetch(`${API_URL}/shopbyage`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          setItems(result.data);
        }
      } catch (error) {
        console.error('Error fetching shop by age data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [isPreview, previewData]);

  // Click handler function for routing
  const handleCardClick = () => {
    router.push('/category');
  };

  if (isLoading) {
    return (
      <div className={`w-full py-24 flex justify-center items-center border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/5 bg-black'}`}>
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className={`py-12 md:py-16 relative overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-end justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} className="text-[#D4AF37]" fill="#D4AF37" />
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Shop by Age Group</span>
            </div>
            <h2 className={`text-2xl md:text-3xl font-black ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Shop by Age
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap justify-start gap-4 pb-4">
          {items.map((age, i) => {
            const IconComponent = ICON_MAP[age.icon] || Star; // Fallback to Star if string doesn't match
            
            return (
              <motion.div
                key={age.id}
                onClick={handleCardClick} // ADDED CLICK HANDLER
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -10 }}
                className="relative flex-shrink-0 w-[160px] md:w-[220px] aspect-[4/5] rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl will-change-transform"
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${age.gradient} opacity-90 transition-opacity duration-300`} />
                
                <div className="absolute inset-0 flex flex-col p-4">
                  <div className="relative w-full aspect-square bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden mb-4 shadow-inner border border-white/10 group-hover:bg-white/30 transition-colors">
                    <motion.img 
                      src={age.img} 
                      alt={age.label} 
                      loading="lazy"
                      className="w-4/5 h-4/5 object-contain drop-shadow-md" 
                      whileHover={{ scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-end pb-2">
                    <div className="text-white mb-2 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                      <IconComponent size={20} />
                    </div>
                    <h3 className="text-white font-black text-lg md:text-xl uppercase leading-tight text-center drop-shadow-sm tracking-wide">{age.label}</h3>
                    <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 text-center">{age.sub}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

ShopByAge.displayName = 'ShopByAge';

export default function ShopByAgeSection({ theme = 'dark', isPreview, previewData }: ShopByAgeSectionProps) {
  return <ShopByAge theme={theme} isPreview={isPreview} previewData={previewData} />;
}