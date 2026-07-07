'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = "https://wow-lifebackend.onrender.com/api";

export interface BestSellerItem {
  id: string | number;
  name: string;
  img: string;
  color: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  badge?: string;
}

interface BestSellersSectionProps {
  theme?: 'dark' | 'light';
  isPreview?: boolean;
  previewData?: BestSellerItem[];
}

const FALLBACK: BestSellerItem[] = [
  { id: 1, name: 'Organic Face Moisturizer',  img: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=300&h=300&auto=format&fit=crop&q=80', color: '#831843', price: 799,  originalPrice: 1199, rating: 4.6, reviews: 312, badge: 'Best Seller' },
  { id: 2, name: 'Fresh Fruit Combo Pack',    img: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=300&h=300&auto=format&fit=crop&q=80', color: '#14532d', price: 349,  originalPrice: 499,  rating: 4.4, reviews: 198, badge: 'Daily Deal' },
  { id: 3, name: 'Marvel Avengers Toy Set',   img: 'https://images.unsplash.com/photo-1587654780291-39c59be1b31c?w=300&h=300&auto=format&fit=crop&q=80', color: '#7f1d1d', price: 1299, originalPrice: 1799, rating: 4.7, reviews: 213, badge: 'Top Rated' },
  { id: 4, name: 'Wireless Earbuds Pro',      img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&auto=format&fit=crop&q=80', color: '#1e3a8a', price: 1499, originalPrice: 2499, rating: 4.5, reviews: 521, badge: 'Hot' },
  { id: 5, name: 'Vitamin C Serum 30ml',      img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=300&auto=format&fit=crop&q=80', color: '#78350f', price: 599,  originalPrice: 899,  rating: 4.8, reviews: 447, badge: 'Sale' },
];

const ProductCard = memo(({ item, theme }: { item: BestSellerItem; theme: 'dark' | 'light' }) => {
  const router     = useRouter();
  const [liked, setLiked] = useState(false);
  const isLight = theme === 'light';

  const price    = item.price         ?? 999;
  const original = item.originalPrice ?? price;
  const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;
  const rating   = item.rating   ?? 4.0;
  const reviews  = item.reviews  ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${isLight ? 'bg-white border-[#BBD5DA] hover:border-[#0FA3B1] hover:shadow-lg' : 'bg-gray-900 border-white/10 hover:border-white/20 hover:shadow-xl'}`}
      onClick={() => router.push(`/product/${item.id}`)}
    >
      {/* Badge */}
      {item.badge && (
        <span className="absolute top-3 left-3 z-10 bg-[#FF0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
          {item.badge}
        </span>
      )}

      {/* Discount */}
      {discount > 0 && (
        <span className="absolute top-3 right-10 z-10 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-md">
          -{discount}%
        </span>
      )}

      {/* Wishlist */}
      <button
        onClick={e => { e.stopPropagation(); setLiked(v => !v); }}
        className={`absolute top-3 right-3 z-10 p-1.5 rounded-full shadow transition ${liked ? 'bg-red-50' : `${isLight ? 'bg-white' : 'bg-gray-800'}`}`}
      >
        <Heart size={14} className={liked ? 'text-[#FF0000] fill-[#FF0000]' : isLight ? 'text-gray-400' : 'text-gray-500'} />
      </button>

      {/* Image */}
      <div className={`aspect-square overflow-hidden ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-800'}`}>
        <img
          src={item.img}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className={`text-xs font-medium mb-0.5 truncate ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Remise</p>
        <h3 className={`text-sm font-semibold leading-tight mb-2 line-clamp-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-600 rounded text-white text-[10px] font-bold">
            {rating.toFixed(1)} <Star size={9} fill="white" />
          </div>
          <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>({reviews.toLocaleString()})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`font-bold text-base ${isLight ? 'text-gray-900' : 'text-white'}`}>₹{price.toLocaleString()}</span>
          {discount > 0 && <span className={`text-xs line-through ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>₹{original.toLocaleString()}</span>}
        </div>

        {/* Add to cart */}
        <button
          onClick={e => { e.stopPropagation(); /* cart logic already in product page */ }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#DFF1F1] hover:bg-teal-100 border border-[#BBD5DA] text-teal-700 text-xs font-semibold transition"
        >
          <ShoppingCart size={13} /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = 'ProductCard';

const BestSellers = memo(({ theme = 'dark', isPreview = false, previewData = [] }: BestSellersSectionProps) => {
  const router   = useRouter();
  const [items,  setItems]   = useState<BestSellerItem[]>(previewData);
  const [loading, setLoading] = useState(!isPreview);
  const isLight = theme === 'light';

  useEffect(() => {
    if (isPreview) { setItems(previewData); return; }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/bestsellers`);
        const r   = await res.json();
        if (r.success && r.data.length > 0) setItems(r.data);
        else setItems(FALLBACK);
      } catch { setItems(FALLBACK); }
      finally   { setLoading(false); }
    })();
  }, [isPreview, previewData]);

  if (loading) return (
    <div className={`py-20 flex justify-center ${isLight ? 'bg-white' : 'bg-gray-950'}`}>
      <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
    </div>
  );
  if (!items.length) return null;

  return (
    <section className={`py-12 md:py-16 ${isLight ? 'bg-white' : 'bg-gray-950'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-[#D4AF37]" fill="#D4AF37" />
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Customers Love</span>
            </div>
            <h2 className={`text-2xl md:text-3xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Best Sellers
            </h2>
          </div>
          <button
            onClick={() => router.push('/category')}
            className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold transition group ${isLight ? 'text-teal-600 hover:text-teal-700' : 'text-[#D4AF37] hover:text-yellow-300'}`}
          >
            View All <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {items.map((item, i) => (
            <ProductCard key={item.id} item={item} theme={theme} />
          ))}
        </div>

        {/* Mobile "view all" */}
        <div className="mt-6 flex justify-center sm:hidden">
          <button onClick={() => router.push('/category')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border font-semibold text-sm transition ${isLight ? 'border-[#BBD5DA] text-gray-700 hover:bg-[#F5F5F5]' : 'border-white/10 text-white hover:bg-white/5'}`}>
            View All Best Sellers <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
});
BestSellers.displayName = 'BestSellers';

export default function BestSellersSection({ theme = 'dark', isPreview, previewData }: BestSellersSectionProps) {
  return <BestSellers theme={theme} isPreview={isPreview} previewData={previewData} />;
}
