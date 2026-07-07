'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CarFront, Trophy, Gift, Brain, Palette, Gamepad2,
  ArrowRight, Sparkles, Zap, Loader2,
  ShoppingBasket, Star, Shirt, Home, Smartphone, Heart
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  CarFront, Trophy, Gift, Brain, Palette, Gamepad2, Sparkles, Zap,
  ShoppingBasket, Star, Shirt, Home, Smartphone, Heart,
};

export interface CategoryItem {
  id: string; title: string; img: string; color: string; accent: string;
  icon: string; count: number; description: string; badge: string;
}

interface ShopByCategorySectionProps {
  theme?: 'dark' | 'light';
  isPreview?: boolean;
  previewData?: CategoryItem[];
}

const FALLBACK: CategoryItem[] = [
  { id: 'groceries',   title: 'Groceries & Fresh',   img: 'https://images.unsplash.com/photo-1542838132-29423eda0ea4?w=400&h=300&auto=format&fit=crop&q=80', color: 'from-green-400 to-emerald-600', accent: 'text-green-600',   icon: 'ShoppingBasket', count: 120, description: 'Daily essentials & fresh produce',  badge: 'Daily' },
  { id: 'beauty',      title: 'Beauty & Cosmetics',  img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&auto=format&fit=crop&q=80', color: 'from-pink-400 to-rose-600',     accent: 'text-pink-500',    icon: 'Heart',          count: 85,  description: 'Skincare, makeup & wellness',       badge: 'Trending' },
  { id: 'toys',        title: 'Toys & Games',        img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&auto=format&fit=crop&q=80',  color: 'from-yellow-400 to-orange-500', accent: 'text-orange-500',  icon: 'Gamepad2',       count: 74,  description: 'Fun for kids of all ages',          badge: 'Popular' },
  { id: 'fashion',     title: 'Fashion & Apparel',   img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&auto=format&fit=crop&q=80', color: 'from-purple-400 to-indigo-600', accent: 'text-purple-500',  icon: 'Shirt',          count: 96,  description: 'Clothing, footwear & accessories',  badge: 'New' },
  { id: 'home',        title: 'Home & Living',       img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&auto=format&fit=crop&q=80',  color: 'from-teal-400 to-cyan-600',     accent: 'text-teal-600',    icon: 'Home',           count: 58,  description: 'Décor, kitchen & household items',  badge: 'Top Pick' },
  { id: 'electronics', title: 'Electronics',         img: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=400&h=300&auto=format&fit=crop&q=80', color: 'from-blue-400 to-sky-600',      accent: 'text-blue-500',    icon: 'Smartphone',     count: 43,  description: 'Gadgets, accessories & more',       badge: 'Hot' },
];

const CategoryCard = memo(({ item, theme, index }: { item: CategoryItem; theme: 'dark' | 'light'; index: number }) => {
  const router   = useRouter();
  const isLight  = theme === 'light';
  const IconComp = ICON_MAP[item.icon] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      onClick={() => router.push(`/category/${item.id}`)}
      className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 ${isLight ? 'bg-white border-[#BBD5DA] hover:border-[#0FA3B1] hover:shadow-lg' : 'bg-gray-900 border-white/10 hover:border-white/20 hover:shadow-xl'}`}
    >
      {/* Image */}
      <div className={`relative aspect-[4/3] overflow-hidden ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-800'}`}>
        <img
          src={item.img}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badge */}
        <span className="absolute top-3 right-3 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
          {item.badge}
        </span>

        {/* Icon */}
        <div className={`absolute bottom-3 left-3 p-2.5 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
          <IconComp size={16} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className={`font-bold text-sm mb-0.5 truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.title}</h3>
        <p className={`text-xs mb-2 truncate ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{item.description}</p>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${item.accent}`}>{item.count} items</span>
          <span className={`flex items-center gap-1 text-xs font-semibold transition group-hover:gap-2 ${isLight ? 'text-teal-600' : 'text-[#D4AF37]'}`}>
            Explore <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </motion.div>
  );
});
CategoryCard.displayName = 'CategoryCard';

const ShopByCategory = memo(({ theme = 'dark', isPreview = false, previewData = [] }: ShopByCategorySectionProps) => {
  const router   = useRouter();
  const [items,  setItems]   = useState<CategoryItem[]>(previewData);
  const [loading, setLoading] = useState(!isPreview);
  const isLight  = theme === 'light';

  useEffect(() => {
    if (isPreview) { setItems(previewData); return; }
    (async () => {
      try {
        const res = await fetch(`https://wow-lifebackend.onrender.com/api/shopbycategory`);
        const r   = await res.json();
        if (r.success && r.data.length > 0) setItems(r.data);
        else setItems(FALLBACK);
      } catch { setItems(FALLBACK); }
      finally   { setLoading(false); }
    })();
  }, [isPreview, previewData]);

  if (loading) return (
    <div className={`py-20 flex justify-center ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-950'}`}>
      <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
    </div>
  );
  if (!items.length) return null;

  return (
    <section className={`py-12 md:py-16 ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-950'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">All Categories</span>
            </div>
            <h2 className={`text-2xl md:text-3xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Shop by Category
            </h2>
          </div>
          <button
            onClick={() => router.push('/category')}
            className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold transition group ${isLight ? 'text-teal-600 hover:text-teal-700' : 'text-[#D4AF37] hover:text-yellow-300'}`}
          >
            View All <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {items.map((item, i) => (
            <CategoryCard key={item.id} item={item} theme={theme} index={i} />
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-6 flex justify-center sm:hidden">
          <button onClick={() => router.push('/category')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border font-semibold text-sm transition ${isLight ? 'border-[#BBD5DA] text-gray-700 hover:bg-white' : 'border-white/10 text-white hover:bg-white/5'}`}>
            View All Categories <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
});
ShopByCategory.displayName = 'ShopByCategory';

export default function ShopByCategorySection({ theme = 'dark', isPreview, previewData }: ShopByCategorySectionProps) {
  return <ShopByCategory theme={theme} isPreview={isPreview} previewData={previewData} />;
}
