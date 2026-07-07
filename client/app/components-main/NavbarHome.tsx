'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Menu, X, Search, Sun, Moon,
  User, LogOut, CheckCircle, AlertCircle, Package,
  MapPin, Headphones, Store, MailWarning,
} from 'lucide-react';
import { useCart } from '@/app/components-main/CartContext';
import CartDrawer from '@/app/components-main/CartDrawer';
import NotificationBell from '@/app/components-main/NotificationBell';
import UserAvatarMenu from '@/app/components-main/UserAvatarMenu';

// ── Types ───────────────────────────────────────────────────────────────────
interface NavbarProps { theme: 'dark' | 'light'; toggleTheme: () => void; }
interface UserData { name?: string; fullname?: string; email?: string; role?: string; }

// ── Nav links ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { name: 'Home',                path: '/' },
  { name: 'Monthly / Bulk Buy',  path: '/bulk-purchase' },
  { name: 'Nearby Offers',       path: '/nearby' },
  { name: 'Our Services',        path: '/services' },
  { name: 'About Us',            path: '/about' },
  { name: 'Testimonials',        path: '/testimonials' },
];

// ── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
    >
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      {message}
    </motion.div>
  );
};

// ── Navbar ──────────────────────────────────────────────────────────────────
export default function NavbarHome({ theme, toggleTheme }: NavbarProps) {
  const [isMobileMenuOpen,  setIsMobileMenuOpen]  = useState(false);
  const [isLoggedIn,        setIsLoggedIn]        = useState(false);
  const [userData,          setUserData]          = useState<UserData | null>(null);
  const [toast,             setToast]             = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [isScrolled,        setIsScrolled]        = useState(false);
  const [verifyBanner,      setVerifyBanner]      = useState(false);

  const pathname = usePathname();
  const router   = useRouter();
  const { cartCount, openCart, closeCart } = useCart();

  // ── auth sync (for mobile menu only) ───────────────────────────────────
  const checkAuth = useCallback(() => {
    try {
      const raw   = localStorage.getItem('user');
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (raw && token) {
        const parsed = JSON.parse(raw);
        setUserData(parsed);
        setIsLoggedIn(true);
        // show banner if email unverified (only if banner was never dismissed this session)
        setVerifyBanner(parsed.isEmailVerified === false);
        return;
      }
    } catch {}
    setIsLoggedIn(false); setUserData(null); setVerifyBanner(false);
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener('storage',    checkAuth);
    window.addEventListener('authChange', checkAuth);
    return () => {
      window.removeEventListener('storage',    checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, [checkAuth]);

  // ── scroll shadow ───────────────────────────────────────────────────────
  const onScroll = useCallback(() => setIsScrolled(window.scrollY > 4), []);
  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  // ── close drawers on route change ───────────────────────────────────────
  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (closeCart) closeCart();
  }, [pathname]);

  // ── mobile logout ───────────────────────────────────────────────────────
  const handleMobileLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    window.dispatchEvent(new CustomEvent('authChange'));
    setIsMobileMenuOpen(false);
    setToast({ message: 'Logged out successfully!', type: 'success' });
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const displayName = userData?.fullname || userData?.name || 'User';
  const isLight     = theme === 'light';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <CartDrawer theme={theme} />

      <div className={`fixed top-0 left-0 right-0 z-[100] ${isScrolled ? 'shadow-md' : ''} transition-shadow duration-300`}>

        {/* ── Email verification banner ──────────────────────────────────── */}
        <AnimatePresence>
          {verifyBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-amber-50 border-b border-amber-200 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 text-xs text-amber-800">
                <MailWarning size={13} className="text-amber-500 shrink-0" />
                <span className="flex-1">Please verify your email to unlock all features.</span>
                <Link href="/verify-email" onClick={() => setVerifyBanner(false)}
                  className="font-bold underline hover:text-amber-900 transition shrink-0">
                  Verify Now
                </Link>
                <button onClick={() => setVerifyBanner(false)} className="ml-2 text-amber-400 hover:text-amber-700 transition shrink-0">
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Announcement Strip ─────────────────────────────────────────── */}
        <div className="bg-[#0FA3B1] text-white text-xs py-2 px-4 text-center font-medium tracking-wide hidden sm:block">
          🎉 Free delivery on prepaid orders above ₹499 &nbsp;|&nbsp; Use code <span className="font-bold underline">REMISE10</span> for 10% off
        </div>

        {/* ── Main Header ────────────────────────────────────────────────── */}
        <header className={`${isLight ? 'bg-white border-b border-[#BBD5DA]' : 'bg-gray-950 border-b border-white/10'} transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center gap-3 lg:gap-5">

            {/* Mobile menu btn */}
            <button
              onClick={() => setIsMobileMenuOpen(v => !v)}
              className={`lg:hidden p-2 rounded-lg ${isLight ? 'text-gray-700 hover:bg-[#F5F5F5]' : 'text-gray-200 hover:bg-white/10'} transition`}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#FF0000]/70 shadow-sm">
                <Image src="/remise-logo.svg" alt="Remise" fill unoptimized className="object-cover" />
              </div>
              <div className="hidden sm:block">
                <span className={`text-xl font-black tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  R<span className="text-[#FF0000]">E</span>mise
                </span>
              </div>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:flex items-center">
              <div className={`flex items-center w-full rounded-xl border-2 overflow-hidden transition-all ${isLight ? 'border-[#BBD5DA] focus-within:border-[#0FA3B1] bg-[#F5F5F5]' : 'border-white/10 focus-within:border-[#0FA3B1] bg-white/5'}`}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands, categories…"
                  className={`flex-1 px-4 py-2.5 text-sm bg-transparent outline-none ${isLight ? 'text-gray-800 placeholder-gray-400' : 'text-white placeholder-gray-500'}`}
                />
                <button type="submit" className="px-4 py-2.5 bg-[#FF0000] hover:bg-[#e00000] text-white transition shrink-0">
                  <Search size={18} />
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0">

              {/* Theme toggle */}
              <button
                onClick={() => { toggleTheme(); window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: theme === 'dark' ? 'light' : 'dark' } })); }}
                className={`hidden sm:flex p-2 rounded-lg transition ${isLight ? 'text-gray-600 hover:bg-[#F5F5F5]' : 'text-yellow-400 hover:bg-white/10'}`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Avatar menu (handles login/logout/profile internally) */}
              <UserAvatarMenu theme={theme} />

              {/* Notifications (only when logged in) */}
              {isLoggedIn && <NotificationBell />}

              {/* Cart */}
              <button
                onClick={() => { if (openCart) openCart('cart'); }}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${isLight ? 'border-[#BBD5DA] hover:border-[#0FA3B1] hover:bg-[#DFF1F1] text-gray-700' : 'border-white/10 hover:border-[#0FA3B1] text-white'}`}
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF0000] text-white text-[10px] min-w-[18px] min-h-[18px] font-bold rounded-full flex items-center justify-center shadow px-0.5">
                    {cartCount}
                  </span>
                )}
                <span className="hidden sm:block text-sm font-semibold">Cart</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Category Nav Strip ─────────────────────────────────────────── */}
        <nav className={`hidden lg:block border-b ${isLight ? 'bg-white border-[#BBD5DA]' : 'bg-gray-950 border-white/10'} transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-0 h-10">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`px-4 h-full flex items-center text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                    pathname === link.path
                      ? `border-[#FF0000] ${isLight ? 'text-gray-900' : 'text-white'}`
                      : `border-transparent ${isLight ? 'text-gray-600 hover:text-gray-900 hover:border-[#BBD5DA]' : 'text-gray-400 hover:text-white hover:border-white/20'}`
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Right side extras */}
              <div className="ml-auto flex items-center gap-4 text-xs">
                <span className={`flex items-center gap-1 ${isLight ? 'text-gray-400' : 'text-gray-600'}`}>
                  <MapPin size={11} /> India
                </span>
                <Link href="/services"
                  className={`flex items-center gap-1 ${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-600 hover:text-gray-400'} transition`}>
                  <Headphones size={11} /> Customer Support
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Mobile menu ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className={`lg:hidden overflow-hidden border-b ${isLight ? 'bg-white border-[#BBD5DA]' : 'bg-gray-950 border-white/10'}`}
            >
              {/* Mobile search */}
              <div className="px-4 pt-4 pb-2">
                <form onSubmit={handleSearch} className={`flex items-center rounded-xl border overflow-hidden ${isLight ? 'border-[#BBD5DA] bg-[#F5F5F5]' : 'border-white/10 bg-white/5'}`}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products…"
                    className={`flex-1 px-4 py-3 text-sm bg-transparent outline-none ${isLight ? 'text-gray-800 placeholder-gray-400' : 'text-white placeholder-gray-500'}`}
                  />
                  <button type="submit" className="px-4 py-3 bg-[#FF0000] text-white">
                    <Search size={17} />
                  </button>
                </form>
              </div>

              {/* User info */}
              {isLoggedIn && (
                <div className={`mx-4 mb-2 px-4 py-3 rounded-xl ${isLight ? 'bg-[#DFF1F1]' : 'bg-white/5'}`}>
                  <p className={`font-semibold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>{displayName}</p>
                  <p className="text-xs text-gray-500">{userData?.email}</p>
                </div>
              )}

              {/* Nav links */}
              <div className="px-4 pb-2 space-y-0.5">
                {NAV_LINKS.map(link => (
                  <Link key={link.name} href={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition ${
                      pathname === link.path
                        ? `${isLight ? 'bg-[#DFF1F1] text-teal-700' : 'bg-white/10 text-[#FF0000]'}`
                        : `${isLight ? 'text-gray-700 hover:bg-[#F5F5F5]' : 'text-gray-300 hover:bg-white/5'}`
                    }`}>
                    {link.name}
                  </Link>
                ))}
                {isLoggedIn && (
                  <>
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${isLight ? 'text-gray-700 hover:bg-[#F5F5F5]' : 'text-gray-300 hover:bg-white/5'}`}>
                      <User size={15} /> My Profile
                    </Link>
                    <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${isLight ? 'text-gray-700 hover:bg-[#F5F5F5]' : 'text-gray-300 hover:bg-white/5'}`}>
                      <Package size={15} /> My Orders
                    </Link>
                    {userData?.role === 'store_owner' && (
                      <Link href="/store/dashboard" onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${isLight ? 'text-gray-700 hover:bg-[#F5F5F5]' : 'text-gray-300 hover:bg-white/5'}`}>
                        <Store size={15} /> My Store
                      </Link>
                    )}
                  </>
                )}
              </div>

              {/* Bottom actions */}
              <div className="px-4 pb-4 pt-2 flex gap-2">
                {isLoggedIn ? (
                  <button onClick={handleMobileLogout}
                    className="flex-1 py-2.5 bg-[#FF0000] hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
                    <LogOut size={15} /> Sign Out
                  </button>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-2.5 bg-[#FF0000] hover:bg-[#e00000] text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
                    <User size={15} /> Login / Register
                  </Link>
                )}
                <button onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                  className={`px-4 py-2.5 rounded-xl border font-semibold text-sm transition ${isLight ? 'border-[#BBD5DA] text-gray-700' : 'border-white/10 text-gray-300'}`}>
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
