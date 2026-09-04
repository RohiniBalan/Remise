'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/app/components-main/WishlistContext';

const API_URL = "http://localhost:3003/api";

export interface BestSellerItem {
  id: string;
  name: string;
  img: string;
  category?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  soldCount?: number;
  // Raw product document as returned by the product-service — kept around so
  // wishlist toggling gets the same shape CategoryPage passes (_id, images,
  // title, price, brand, totalStock, etc.), not the trimmed display fields.
  raw: any;
}

interface BestSellersSectionProps {
  theme?: 'dark' | 'light';
  isPreview?: boolean;
  previewData?: BestSellerItem[];
}

// Maps a raw product document from the product-service into what this card needs.
function mapProduct(p: any): BestSellerItem {
  const img = p.images?.length > 0 ? p.images[0] : p.imageUrl;
  const hasDiscount =
    p.discountedPrice != null && p.discountedPrice < p.price;
  return {
    id: p._id || p.id,
    name: p.title,
    img,
    category: p.category,
    price: hasDiscount ? p.discountedPrice : p.price,
    originalPrice: hasDiscount ? p.price : undefined,
    rating: typeof p.rating === 'number' ? p.rating : undefined,
    reviews: typeof p.reviews === 'number' ? p.reviews : undefined,
    soldCount: p.soldCount,
    raw: p,
  };
}

const ProductCard = memo(({ item, theme }: { item: BestSellerItem; theme: 'dark' | 'light' }) => {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const isLight = theme === 'light';
  const liked = isWishlisted(item.id);

  const discount =
    item.originalPrice && item.originalPrice > item.price
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${isLight ? 'bg-white border-[#BBD5DA] hover:border-[#0FA3B1] hover:shadow-lg' : 'bg-gray-900 border-white/10 hover:border-white/20 hover:shadow-xl'}`}
      onClick={() => router.push(`/product/${item.id}`)}
    >
      <span className="absolute top-3 left-3 z-10 bg-[#FF0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
        Best Seller
      </span>

      {discount > 0 && (
        <span className="absolute top-3 right-10 z-10 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-md">
          -{discount}%
        </span>
      )}

      <button
        onClick={e => { e.stopPropagation(); toggleWishlist(item.raw); }}
        className={`absolute top-3 right-3 z-10 p-1.5 rounded-full shadow transition ${liked ? 'bg-red-50' : `${isLight ? 'bg-white' : 'bg-gray-800'}`}`}
      >
        <Heart size={14} className={liked ? 'text-[#FF0000] fill-[#FF0000]' : isLight ? 'text-gray-400' : 'text-gray-500'} />
      </button>

      <div className={`aspect-square overflow-hidden ${isLight ? 'bg-[#F5F5F5]' : 'bg-gray-800'}`}>
        <img
          src={item.img}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.jpeg'; }}
        />
      </div>

      <div className="p-3.5">
        {item.category && (
          <p className={`text-xs font-medium mb-0.5 truncate ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            {item.category}
          </p>
        )}
        <h3 className={`text-sm font-semibold leading-tight mb-2 line-clamp-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.name}</h3>

        {item.rating != null && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-600 rounded text-white text-[10px] font-bold">
              {item.rating.toFixed(1)} <Star size={9} fill="white" />
            </div>
            {item.reviews != null && (
              <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>({item.reviews.toLocaleString()})</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className={`font-bold text-base ${isLight ? 'text-gray-900' : 'text-white'}`}>₹{item.price?.toLocaleString()}</span>
          {discount > 0 && <span className={`text-xs line-through ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>₹{item.originalPrice?.toLocaleString()}</span>}
        </div>

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
  const router = useRouter();
  const [items, setItems] = useState<BestSellerItem[]>(previewData);
  const [loading, setLoading] = useState(!isPreview);
  const isLight = theme === 'light';

  useEffect(() => {
    if (isPreview) { setItems(previewData); return; }
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/products?ownerRole=store_owner&sort=bestselling&limit=5`,
          { cache: 'no-store' },
        );
        const r = await res.json();
        const raw = Array.isArray(r?.data) ? r.data : [];
        setItems(raw.map(mapProduct));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
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
            onClick={() => router.push('/bestsellers')}
            className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold transition group ${isLight ? 'text-teal-600 hover:text-teal-700' : 'text-[#D4AF37] hover:text-yellow-300'}`}
          >
            View All <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} theme={theme} />
          ))}
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
          <button onClick={() => router.push('/bestsellers')}
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