'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // IMPORTED useRouter

// Define your backend API URL here
const API_URL = "https://wow-lifebackend.onrender.com/api";

// Define the Character type based on our database schema
interface Character {
  id: string | number;
  name: string;
  color: string;
  src: string;
}

// Optimized Character Slider
const CharacterSlider = memo(({ theme }: { theme: 'dark' | 'light' }) => {
  const router = useRouter(); // INITIALIZE ROUTER
  const sliderRef = useRef<HTMLDivElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dynamic characters from the backend
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        // Updated fetch URL using the constant
        const response = await fetch(`${API_URL}/characters`);
        const result = await response.json();
        
        if (result.success) {
          setCharacters(result.data);
        } else {
          console.error('Failed to load characters:', result.message);
        }
      } catch (error) {
        console.error('Error fetching characters:', error);
        // Optional fallback data if server is down
        setCharacters([
          { id: 1, name: "Avengers", color: "#E62429", src: "/chars/avengers.avif" },
          { id: 2, name: "Frozen", color: "#00B7FF", src: "/chars/frozen.avif" }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  // Click handler function
  const handleCharacterClick = () => {
    router.push('/category/collectors');
  };

  // Show a smooth loading state while fetching data
  if (isLoading) {
    return (
      <div className={`w-full py-20 flex justify-center items-center border-t ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/5 bg-[#080808]'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  // Don't render the section at all if there are no characters in the database
  if (characters.length === 0) {
    return null;
  }

  return (
    <div className={`w-full py-12 md:py-20 border-t ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/5 bg-[#080808]'}`}>
      
      {/* CSS to forcefully hide scrollbars across all browsers */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 mb-8 md:mb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-block mb-3">
          <span className="text-[#D4AF37] font-bold tracking-[0.3em] text-xs uppercase">Find Your Hero</span>
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className={`text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          Shop By Character
        </motion.h2>
      </div>

      <div className="relative w-full overflow-hidden group">
        {/* Fade Gradients */}
        <div className={`absolute left-0 top-0 bottom-0 w-8 md:w-12 lg:w-24 z-20 bg-gradient-to-r ${theme === 'light' ? 'from-gray-50' : 'from-[#080808]'} to-transparent pointer-events-none`} />
        <div className={`absolute right-0 top-0 bottom-0 w-8 md:w-12 lg:w-24 z-20 bg-gradient-to-l ${theme === 'light' ? 'from-gray-50' : 'from-[#080808]'} to-transparent pointer-events-none`} />
        
        {/* Slider Container with corrected no-scrollbar class */}
        <motion.div 
          ref={sliderRef} 
          className="flex gap-4 md:gap-6 px-4 md:px-12 cursor-grab active:cursor-grabbing pb-8 md:pb-12 overflow-x-auto no-scrollbar snap-x"
        >
          {characters.map((char, i) => (
            <motion.div 
              key={char.id} 
              initial={{ opacity: 0, x: 50 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: i * 0.05, duration: 0.5 }} 
              className="relative flex-shrink-0 snap-center"
            >
              {/* Added onClick to make the whole card clickable */}
              <div 
                onClick={handleCharacterClick}
                className="group/card relative w-36 h-48 md:w-48 md:h-64 lg:w-56 lg:h-72 rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 md:hover:-translate-y-3 will-change-transform cursor-pointer"
              >
                <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-xl" style={{ backgroundColor: char.color }} />
                <div className={`relative w-full h-full bg-gray-900 rounded-2xl md:rounded-[2rem] overflow-hidden border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} group-hover/card:border-white/30 transition-colors`}>
                  <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover/card:scale-110" style={{ backgroundImage: `url(${char.src})`, backgroundColor: '#1a1a1a' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col items-center">
                    <h3 className="text-white font-bold text-sm md:text-lg uppercase tracking-wider text-center drop-shadow-md translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">{char.name}</h3>
                    <div className="h-1 w-6 md:w-8 rounded-full mt-2 md:mt-3 transition-all duration-300 transform scale-x-0 group-hover/card:scale-x-100" style={{ backgroundColor: char.color }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
});

CharacterSlider.displayName = 'CharacterSlider';

interface CharacterSliderSectionProps {
  theme: 'dark' | 'light';
}

export default function CharacterSliderSection({ theme }: CharacterSliderSectionProps) {
  return <CharacterSlider theme={theme} />;
}