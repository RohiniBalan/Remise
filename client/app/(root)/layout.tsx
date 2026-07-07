'use client';

import React, { useState, useEffect } from 'react';
import Navbar from "../components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";
import { CartProvider } from '../components-main/CartContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [theme,   setTheme]   = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved  = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const active: 'dark' | 'light' = saved ?? (prefer ? 'dark' : 'light');
    setTheme(active);
    applyTheme(active);
    setMounted(true);
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('theme', next);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
  };

  if (!mounted) return <div style={{ opacity: 0 }}>{children}</div>;

  return (
    <CartProvider>
      <div className={`min-h-screen w-full transition-colors duration-300 ${theme === 'light' ? 'bg-[#F5F5F5] text-gray-900' : 'bg-gray-950 text-white'}`}>
        <Navbar theme={theme} toggleTheme={handleThemeToggle} />
        <main className="flex-grow">{children}</main>
        <FooterComponent theme={theme} />
      </div>
    </CartProvider>
  );
}
