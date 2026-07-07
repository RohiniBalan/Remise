'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Settings, SlidersHorizontal, Package,
  Store, ChevronDown, CheckCircle, AlertCircle, Mail,
} from 'lucide-react';

interface UserData {
  _id?: string;
  fullname?: string;
  name?: string;
  email?: string;
  role?: string;
  isEmailVerified?: boolean;
}

interface Props {
  theme?: 'dark' | 'light';
  /** compact = icon-only avatar (no name text), used in slim headers */
  compact?: boolean;
}

export default function UserAvatarMenu({ theme = 'light', compact = false }: Props) {
  const [isOpen,      setIsOpen]      = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);
  const [userData,    setUserData]    = useState<UserData | null>(null);
  const ref    = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isLight = theme === 'light';

  /* ── sync with localStorage ────────────────────────────────────────── */
  const sync = useCallback(() => {
    try {
      const raw = localStorage.getItem('user');
      setUserData(raw ? JSON.parse(raw) : null);
    } catch { setUserData(null); }
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('authChange', sync);
    window.addEventListener('storage',   sync);
    return () => {
      window.removeEventListener('authChange', sync);
      window.removeEventListener('storage',   sync);
    };
  }, [sync]);

  /* ── close on outside click ────────────────────────────────────────── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── helpers ────────────────────────────────────────────────────────── */
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('authChange'));
    setIsOpen(false);
    setShowLogout(false);
    router.push('/');
  };

  const getInitials = () => {
    const n = userData?.fullname || userData?.name || '';
    return n ? n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  /* ── not logged in ─────────────────────────────────────────────────── */
  if (!userData) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold text-sm transition shadow-sm"
      >
        <User size={15} /> Login
      </Link>
    );
  }

  const displayName  = userData.fullname || userData.name || 'User';
  const isStoreOwner = userData.role === 'store_owner';
  // treat `undefined` as verified (legacy accounts without the field)
  const isVerified   = userData.isEmailVerified !== false;

  return (
    <>
      {/* ── Logout confirm modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogout(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white border border-[#BBD5DA] p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">Sign out?</h3>
              <p className="text-gray-500 text-sm mb-6">You'll need to log in again to access your account.</p>
              <div className="flex gap-3">
                <button onClick={handleLogout}
                  className="flex-1 py-2.5 bg-[#FF0000] hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition">
                  Sign Out
                </button>
                <button onClick={() => setShowLogout(false)}
                  className="flex-1 py-2.5 border border-[#BBD5DA] text-gray-700 hover:bg-[#F5F5F5] rounded-xl font-semibold text-sm transition">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Avatar button ────────────────────────────────────────────── */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(v => !v)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
            isLight
              ? 'border-[#BBD5DA] hover:border-[#FF0000]/40 hover:bg-red-50'
              : 'border-white/15 hover:border-[#FF0000]/40 hover:bg-white/5'
          }`}
        >
          {/* Avatar circle with verification dot */}
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-[#FF0000] flex items-center justify-center text-xs font-bold text-white select-none">
              {getInitials()}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
              isVerified ? 'bg-green-500' : 'bg-amber-400'
            }`} />
          </div>

          {!compact && (
            <>
              <span className={`hidden md:block text-sm font-medium max-w-[90px] truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>
                {displayName}
              </span>
              <ChevronDown size={13} className={`hidden md:block transition-transform ${isOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
            </>
          )}
        </button>

        {/* ── Dropdown ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[#BBD5DA] shadow-xl overflow-hidden z-[500]"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-[#DFF1F1] border-b border-[#BBD5DA]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                  </div>
                  {isVerified ? (
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle size={9} /> Verified
                    </span>
                  ) : (
                    <Link
                      href="/verify-email"
                      onClick={() => setIsOpen(false)}
                      className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full transition"
                    >
                      <AlertCircle size={9} /> Verify
                    </Link>
                  )}
                </div>
                {isStoreOwner && (
                  <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wide text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                    Store Owner
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="py-1">
                <Link href="/profile" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F5F5] transition">
                  <User size={15} className="text-gray-400 shrink-0" /> My Profile
                </Link>
                <Link href="/orders" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F5F5] transition">
                  <Package size={15} className="text-gray-400 shrink-0" /> My Orders
                </Link>
                {isStoreOwner && (
                  <Link href="/store/dashboard" onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F5F5] transition">
                    <Store size={15} className="text-gray-400 shrink-0" /> My Store
                  </Link>
                )}

                <div className="my-1 border-t border-[#BBD5DA]" />

                <Link href="/settings" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F5F5] transition">
                  <Settings size={15} className="text-gray-400 shrink-0" /> Settings
                </Link>
                <Link href="/settings?tab=preferences" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F5F5] transition">
                  <SlidersHorizontal size={15} className="text-gray-400 shrink-0" /> Preferences
                </Link>
                {!isVerified && (
                  <Link href="/verify-email" onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition">
                    <Mail size={15} className="text-amber-500 shrink-0" /> Verify Email
                  </Link>
                )}

                <div className="my-1 border-t border-[#BBD5DA]" />

                <button
                  onClick={() => { setIsOpen(false); setShowLogout(true); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#FF0000] hover:bg-red-50 transition"
                >
                  <LogOut size={15} className="shrink-0" /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
