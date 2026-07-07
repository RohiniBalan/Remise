'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [exiting,  setExiting]  = useState(false);

  useEffect(() => {
    const DURATION = 2400; // ms total loading time
    const start    = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(p);

      if (p < 100) {
        requestAnimationFrame(tick);
      } else {
        // Small pause at 100% before fading out
        setTimeout(() => setExiting(true), 180);
      }
    };

    requestAnimationFrame(tick);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden"
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      onAnimationComplete={() => { if (exiting) onComplete(); }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-[#FF0000]/6 blur-[120px]" />
      </div>

      {/* Shopping bag icon */}
      <div className="relative mb-8">
        {/* Ping ring */}
        <motion.div
          animate={{ scale: [1, 1.7], opacity: [0.35, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 rounded-[28px] bg-[#FF0000]/25"
        />

        {/* Bag container — gentle float */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#FF0000] to-[#e00000] flex items-center justify-center shadow-[0_0_60px_rgba(255,0,0,0.45)]"
        >
          <ShoppingBag size={36} className="text-black" strokeWidth={2.5} />
        </motion.div>
      </div>

      {/* Brand name */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="text-4xl font-black tracking-tight mb-2"
      >
        <span className="text-white">R</span>
        <span className="text-[#FF0000]">E</span>
        <span className="text-white">mise</span>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="text-gray-500 text-[11px] font-medium tracking-[0.3em] uppercase mb-10"
      >
        Everything, Delivered
      </motion.p>

      {/* Progress bar */}
      <div className="w-44 h-[3px] bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#FF0000] via-[#ff6666] to-[#FF0000]"
          style={{ width: `${progress}%` }}
          transition={{ ease: 'linear' }}
        />
      </div>

      {/* Subtle dots below bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-1.5 mt-3"
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="w-1 h-1 rounded-full bg-[#FF0000]"
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
