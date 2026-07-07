'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin, ArrowRight, Clock, Tag, ShoppingBag,
  Navigation, Loader2, WifiOff, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { offersApi } from '../api-services/offersApi';

// ── Types ────────────────────────────────────────────────────────────────────
interface Offer {
  _id: string;
  title: string;
  description: string;
  image: string;
  storeName: string;
  storeId: string;
  category: string;
  originalPrice: number;
  offerPrice: number;
  discountPercent: number;
  validUntil: string;
  distanceKm: number;
  orderCount: number;
}

interface Props {
  theme?: 'dark' | 'light';
}

// ── Offer Card ───────────────────────────────────────────────────────────────
const OfferCard = memo(({ offer, theme }: { offer: Offer; theme: 'dark' | 'light' }) => {
  const isLight   = theme === 'light';
  const timeLeft  = new Date(offer.validUntil).getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / 3_600_000));
  const isUrgent  = hoursLeft < 24;
  const discount  = offer.discountPercent > 0
    ? offer.discountPercent
    : offer.originalPrice > offer.offerPrice
      ? Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
      : 0;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className={`group relative flex-shrink-0 w-[200px] sm:w-[220px] rounded-2xl border overflow-hidden transition-all duration-300 ${
        isLight
          ? 'bg-white border-[#BBD5DA] hover:border-[#0FA3B1] hover:shadow-lg'
          : 'bg-gray-900 border-white/10 hover:border-white/25 hover:shadow-xl'
      }`}
    >
      {/* Image */}
      <div className={`relative aspect-[4/3] overflow-hidden ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-800'}`}>
        <img
          src={offer.image?.startsWith('http') ? offer.image : `${apiBase}${offer.image}`}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/300x200?text=Offer';
          }}
        />

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#FF0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
            {discount}% OFF
          </span>
        )}

        {/* Distance pill */}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          <MapPin size={9} /> {offer.distanceKm} km
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Store */}
        <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 truncate ${isLight ? 'text-teal-600' : 'text-[#D4AF37]'}`}>
          {offer.storeName}
        </p>

        {/* Title */}
        <h3 className={`text-xs font-bold leading-tight line-clamp-2 mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          {offer.title}
        </h3>

        {/* Price row */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`font-black text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
            ₹{offer.offerPrice}
          </span>
          {offer.originalPrice > offer.offerPrice && (
            <span className={`text-[10px] line-through ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
              ₹{offer.originalPrice}
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
            isUrgent
              ? 'bg-red-50 text-[#FF0000] border border-red-200'
              : isLight
                ? 'bg-[#F5F5F5] text-gray-500 border border-[#BBD5DA]'
                : 'bg-white/5 text-gray-400 border border-white/10'
          }`}>
            <Clock size={8} />
            {hoursLeft < 1 ? '< 1h left' : hoursLeft < 24 ? `${hoursLeft}h left` : `${Math.floor(hoursLeft / 24)}d left`}
          </span>

          <Link
            href={`/nearby?offer=${offer._id}`}
            className={`flex items-center gap-1 text-[10px] font-semibold transition group-hover:gap-1.5 ${
              isLight ? 'text-teal-600 hover:text-teal-700' : 'text-[#D4AF37]'
            }`}
          >
            Order <ArrowRight size={9} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
});
OfferCard.displayName = 'OfferCard';

// ── Location Prompt ──────────────────────────────────────────────────────────
const LocationPrompt = memo(({ onAllow, theme }: { onAllow: () => void; theme: 'dark' | 'light' }) => {
  const isLight = theme === 'light';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border p-5 ${
        isLight
          ? 'bg-[#DFF1F1] border-[#BBD5DA]'
          : 'bg-teal-900/20 border-teal-700/40'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isLight ? 'bg-white border border-[#BBD5DA]' : 'bg-white/10'}`}>
          <Navigation size={22} className="text-teal-600" />
        </div>
        <div>
          <p className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Discover deals near you
          </p>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            Allow location access to see exclusive offers from nearby stores.
          </p>
        </div>
      </div>
      <button
        onClick={onAllow}
        className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
      >
        <MapPin size={14} /> Enable Location
      </button>
    </motion.div>
  );
});
LocationPrompt.displayName = 'LocationPrompt';

// ── Main Section ─────────────────────────────────────────────────────────────
const ShopByOffersNearby = memo(({ theme = 'light' }: Props) => {
  const isLight = theme === 'light';

  const [offers,   setOffers]   = useState<Offer[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status,   setStatus]   = useState<'idle' | 'locating' | 'loading' | 'done' | 'denied' | 'error'>('idle');
  const [radius]                = useState(10);
  const [scrollX,  setScrollX]  = useState(0);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // ── Auto-detect on mount if permission already granted ─────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    // Only auto-detect if permission was previously granted (non-blocking check)
    navigator.permissions?.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted') {
        detectLocation();
      }
    }).catch(() => {
      // permissions API not available — skip auto-detect
    });
  }, []);

  // ── Location detection ─────────────────────────────────────────────────
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { setStatus('error'); return; }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        fetchOffers(loc);
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  // ── Fetch offers ───────────────────────────────────────────────────────
  const fetchOffers = useCallback(async (loc: { lat: number; lng: number }) => {
    setStatus('loading');
    try {
      const res = await offersApi.getNearby(loc.lat, loc.lng, radius);
      setOffers(res.data.data || []);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }, [radius]);

  // ── Scroll helpers ─────────────────────────────────────────────────────
  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 480;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (scrollRef.current) setScrollX(scrollRef.current.scrollLeft);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <section className={`py-12 md:py-16 ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-950'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} className="text-teal-500" />
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">
                Near You
              </span>
            </div>
            <h2 className={`text-2xl md:text-3xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Shop by Offers Nearby
            </h2>
            {location && status === 'done' && (
              <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                Showing deals within <span className="font-semibold">{radius} km</span> of your location
              </p>
            )}
          </div>

          {status === 'done' && offers.length > 0 && (
            <Link
              href="/nearby"
              className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold transition group ${
                isLight ? 'text-teal-600 hover:text-teal-700' : 'text-[#D4AF37] hover:text-yellow-300'
              }`}
            >
              View All Nearby <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* ── Content area ───────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* Idle — show location prompt */}
          {(status === 'idle') && (
            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LocationPrompt onAllow={detectLocation} theme={theme} />
            </motion.div>
          )}

          {/* Locating / Loading */}
          {(status === 'locating' || status === 'loading') && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-14 gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLight ? 'bg-[#DFF1F1] border border-[#BBD5DA]' : 'bg-teal-900/20 border border-teal-700/30'}`}>
                <Loader2 size={26} className="animate-spin text-teal-600" />
              </div>
              <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                {status === 'locating' ? 'Getting your location…' : 'Finding nearby deals…'}
              </p>
            </motion.div>
          )}

          {/* Location denied */}
          {status === 'denied' && (
            <motion.div key="denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border p-5 ${
                isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/10 border-amber-700/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLight ? 'bg-amber-100' : 'bg-amber-900/20'}`}>
                  <WifiOff size={22} className="text-amber-600" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>Location access denied</p>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    Enable location in your browser settings to see nearby offers.
                  </p>
                </div>
              </div>
              <Link href="/nearby"
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] hover:bg-[#e00000] text-white text-sm font-semibold rounded-xl transition">
                Browse All Offers <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}

          {/* Error */}
          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`flex items-center justify-between gap-4 rounded-2xl border p-5 ${
                isLight ? 'bg-red-50 border-red-200' : 'bg-red-900/10 border-red-700/30'
              }`}
            >
              <p className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Couldn't load nearby offers.
              </p>
              <button onClick={() => location ? fetchOffers(location) : detectLocation()}
                className="px-4 py-2 bg-[#FF0000] hover:bg-red-600 text-white text-xs font-bold rounded-xl transition">
                Retry
              </button>
            </motion.div>
          )}

          {/* Done — no offers */}
          {status === 'done' && offers.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`rounded-2xl border p-10 text-center ${isLight ? 'bg-white border-[#BBD5DA]' : 'bg-gray-900 border-white/10'}`}
            >
              <p className="text-3xl mb-3">🔍</p>
              <p className={`font-bold text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>No offers found nearby</p>
              <p className={`text-xs mt-1 mb-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                No deals within {radius} km of your location right now.
              </p>
              <Link href="/nearby"
                className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition">
                Explore All Offers <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}

          {/* Done — show offers */}
          {status === 'done' && offers.length > 0 && (
            <motion.div key="offers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative">

              {/* Left arrow */}
              {scrollX > 10 && (
                <button onClick={() => scroll('left')}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full shadow-lg flex items-center justify-center transition ${
                    isLight ? 'bg-white border border-[#BBD5DA] hover:border-teal-400' : 'bg-gray-800 border border-white/10 hover:bg-gray-700'
                  }`}>
                  <ChevronLeft size={17} className={isLight ? 'text-gray-700' : 'text-white'} />
                </button>
              )}

              {/* Right arrow */}
              <button onClick={() => scroll('right')}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full shadow-lg flex items-center justify-center transition ${
                  isLight ? 'bg-white border border-[#BBD5DA] hover:border-teal-400' : 'bg-gray-800 border border-white/10 hover:bg-gray-700'
                }`}>
                <ChevronRight size={17} className={isLight ? 'text-gray-700' : 'text-white'} />
              </button>

              {/* Scrollable offer cards */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {offers.map(offer => (
                  <OfferCard key={offer._id} offer={offer} theme={theme} />
                ))}

                {/* "View all" card at the end */}
                <Link href="/nearby"
                  className={`flex-shrink-0 w-[140px] rounded-2xl border flex flex-col items-center justify-center gap-3 text-center p-4 transition ${
                    isLight
                      ? 'bg-[#DFF1F1] border-[#BBD5DA] hover:border-teal-400'
                      : 'bg-teal-900/20 border-teal-700/30 hover:border-teal-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLight ? 'bg-white border border-[#BBD5DA]' : 'bg-white/10'}`}>
                    <ShoppingBag size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>View All</p>
                    <p className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Nearby Offers</p>
                  </div>
                  <ArrowRight size={14} className="text-teal-600" />
                </Link>
              </div>

              {/* Mobile "View All" button */}
              <div className="mt-5 flex justify-center sm:hidden">
                <Link href="/nearby"
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border font-semibold text-sm transition ${
                    isLight ? 'border-[#BBD5DA] text-gray-700 hover:bg-white' : 'border-white/10 text-white hover:bg-white/5'
                  }`}>
                  View All Nearby Offers <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
});
ShopByOffersNearby.displayName = 'ShopByOffersNearby';

export default function ShopByOffersNearbySection({ theme = 'light' }: Props) {
  return <ShopByOffersNearby theme={theme} />;
}
