"use client";

import React, { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Loader2, Heart } from "lucide-react";
import { useWishlist } from "@/app/components-main/WishlistContext";

export interface NewArrivalProduct {
    _id?: string;
    id?: string;
    title: string;
    price: number;
    originalPrice?: number;
    discountedPrice?: number;
    category?: string;
    brand?: string;
    images?: string[];
    imageUrl?: string;
    createdAt?: string;
}

interface NewArrivalsSectionProps {
    theme?: "dark" | "light";
}

// ── Real-data source (product-service — same one the Category /
// New Arrivals page uses) ──
const API_URL = "http://localhost:3003/api";

// Keep this in sync with the standalone /new-arrivals page — a product
// only counts as a "new arrival" for this many days after creation.
const NEW_ARRIVAL_WINDOW_DAYS = 14;

// How many cards to show in this homepage strip before "View All".
const PREVIEW_COUNT = 10;

const NewArrivalCard = memo(
    ({
        item,
        theme,
        index,
    }: {
        item: NewArrivalProduct;
        theme: "dark" | "light";
        index: number;
    }) => {
        const router = useRouter();
        const { isWishlisted, toggleWishlist } = useWishlist();
        const isLight = theme === "light";

        const productId = item._id || item.id || "";
        const isWished = isWishlisted(productId);
        const displayImg =
            item.images && item.images.length > 0 ? item.images[0] : item.imageUrl;
        const effectivePrice = item.discountedPrice ?? item.price;
        const discount =
            item.originalPrice && item.originalPrice > effectivePrice
                ? Math.round(
                    ((item.originalPrice - effectivePrice) / item.originalPrice) *
                    100,
                )
                : 0;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/product/${productId}`)}
                className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 ${isLight ? "bg-white border-[#BBD5DA] hover:border-[#0FA3B1] hover:shadow-lg" : "bg-gray-900 border-white/10 hover:border-white/20 hover:shadow-xl"}`}
            >
                {/* Image */}
                <div
                    className={`relative aspect-[4/3] overflow-hidden ${isLight ? "bg-[#F5F5F5]" : "bg-gray-800"}`}
                >
                    {displayImg ? (
                        <img
                            src={displayImg}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-400 to-rose-600">
                            <Sparkles size={28} className="text-white/70" />
                        </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* NEW badge */}
                    <span className="absolute top-3 left-3 flex items-center gap-1 bg-[#FF0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        <Sparkles size={10} />
                        NEW
                    </span>

                    {/* Discount badge */}
                    {discount > 0 && (
                        <span className="absolute top-3 right-11 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                            −{discount}%
                        </span>
                    )}

                    {/* Wishlist */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(item);
                        }}
                        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-md transition-colors"
                        style={{
                            background: isWished
                                ? "#FFE5E5"
                                : "rgba(0,0,0,0.35)",
                        }}
                    >
                        <Heart
                            size={12}
                            style={{ color: isWished ? "#FF0000" : "#fff" }}
                            fill={isWished ? "#FF0000" : "none"}
                        />
                    </button>
                </div>

                {/* Info */}
                <div className="p-3.5">
                    {item.category && (
                        <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? "text-teal-600" : "text-[#D4AF37]"}`}
                        >
                            {item.category}
                        </span>
                    )}
                    <h3
                        className={`font-bold text-sm mt-0.5 mb-1.5 truncate ${isLight ? "text-gray-900" : "text-white"}`}
                    >
                        {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`text-sm font-semibold ${isLight ? "text-gray-900" : "text-white"}`}
                        >
                            ₹{effectivePrice?.toLocaleString()}
                        </span>
                        {discount > 0 && (
                            <span
                                className={`text-xs line-through ${isLight ? "text-gray-400" : "text-gray-500"}`}
                            >
                                ₹{item.originalPrice?.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    },
);
NewArrivalCard.displayName = "NewArrivalCard";

const NewArrivalsSection = memo(({ theme = "dark" }: NewArrivalsSectionProps) => {
    const router = useRouter();
    const [items, setItems] = useState<NewArrivalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const isLight = theme === "light";

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(
                    `${API_URL}/products?limit=10000&ownerRole=store_owner`,
                    { cache: "no-store" },
                );
                const data = await res.json();
                const products: any[] = Array.isArray(data)
                    ? data
                    : data.products || data.data || [];

                const cutoff =
                    Date.now() - NEW_ARRIVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
                const fresh = products
                    .filter((p) => {
                        const created = new Date(p.createdAt || p.updatedAt || 0).getTime();
                        return created >= cutoff;
                    })
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt || 0).getTime() -
                            new Date(a.createdAt || 0).getTime(),
                    )
                    .slice(0, PREVIEW_COUNT);

                setItems(fresh);
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading)
        return (
            <div
                className={`py-20 flex justify-center ${isLight ? "bg-[#F5F5F5]" : "bg-gray-950"}`}
            >
                <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
            </div>
        );

    // No recent products — quietly skip the section rather than show an
    // empty strip on the homepage.
    if (!items.length) return null;

    return (
        <section
            className={`py-12 md:py-16 ${isLight ? "bg-[#F5F5F5]" : "bg-gray-950"}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-end justify-between mb-7">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={14} className="text-[#D4AF37]" />
                            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                                Just In
                            </span>
                        </div>
                        <h2
                            className={`text-2xl md:text-3xl font-black ${isLight ? "text-gray-900" : "text-white"}`}
                        >
                            New Arrivals
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push("/new-arrivals")}
                        className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold transition group ${isLight ? "text-teal-600 hover:text-teal-700" : "text-[#D4AF37] hover:text-yellow-300"}`}
                    >
                        View All{" "}
                        <ArrowRight
                            size={15}
                            className="group-hover:translate-x-1 transition-transform"
                        />
                    </button>
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {items.map((item, i) => (
                        <NewArrivalCard
                            key={item._id || item.id}
                            item={item}
                            theme={theme}
                            index={i}
                        />
                    ))}
                </div>

                {/* Mobile view all */}
                <div className="mt-6 flex justify-center sm:hidden">
                    <button
                        onClick={() => router.push("/new-arrivals")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border font-semibold text-sm transition ${isLight ? "border-[#BBD5DA] text-gray-700 hover:bg-white" : "border-white/10 text-white hover:bg-white/5"}`}
                    >
                        View All New Arrivals <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </section>
    );
});
NewArrivalsSection.displayName = "NewArrivalsSection";

export default NewArrivalsSection;