"use client";

import React, { useState, useEffect, useMemo, useContext } from "react";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Filter,
    ShoppingCart,
    CheckCircle,
    Heart,
    ChevronDown,
    ChevronRight,
    X,
    Zap,
    Package,
    Tag,
    Sparkles, Loader2
} from "lucide-react";
import { useCart } from "@/app/components-main/CartContext";
import { useWishlist } from "@/app/components-main/WishlistContext";
import NavbarHome from "@/app/components-main/NavbarHome";
import { isAuthenticated, redirectToLogin } from "@/app/utils/authGuard";
import { AuthContext } from "@/app/context/AuthContext";

const STORE_OWNER_ROLES = ["store_owner", "whole_saler", "home_business"];
const API_URL = "http://localhost:3003/api";
const NEW_ARRIVAL_WINDOW_DAYS = 14;

const FilterSection = ({ title, children, isOpenDefault = true, theme, activeCount = 0 }: any) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);
    const isDark = theme === "dark";
    const gold = "#C9A84C";
    const border = isDark ? "#1C1C1C" : "#EAEAEA";
    const textGold = isDark ? gold : "#CC0000";
    const textSec = isDark ? "#7A7060" : "#6B7280";

    return (
        <div className="pb-4 mb-4" style={{ borderBottom: `1px solid ${border}` }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between text-left mb-3 transition-opacity hover:opacity-70"
                style={{ color: textGold }}
            >
                <span className="text-[10px] font-bold tracking-[0.35em] uppercase">
                    {title}
                    {activeCount > 0 ? ` (${activeCount})` : ""}
                </span>
                <ChevronDown
                    size={13}
                    className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: textSec }}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FilterCheckbox = ({ label, count, checked, onChange, theme }: any) => {
    const isDark = theme === "dark";
    const gold = "#C9A84C";
    const textPri = isDark ? "#F0EAD6" : "#111827";
    const textSec = isDark ? "#9A8E7A" : "#6B7280";
    const border = isDark ? "#2E2E2E" : "#D1D5DB";

    return (
        <label className="flex items-center gap-2.5 cursor-pointer group py-1" onClick={onChange}>
            <div
                className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center transition-all duration-150"
                style={{
                    border: `1px solid ${checked ? gold : border}`,
                    background: checked ? gold : "transparent",
                }}
            >
                {checked && <CheckCircle size={9} style={{ color: "#000" }} />}
            </div>
            <span className="text-[12px] transition-colors leading-tight" style={{ color: checked ? textPri : textSec }}>
                {label}
                <span className="ml-1 text-[10px] opacity-60">({count})</span>
            </span>
        </label>
    );
};

const CategoryCardMini = ({ item, active, theme, onClick }: any) => {
    const isDark = theme === "dark";
    const gold = "#FF0000";
    const textPri = isDark ? "#F0EAD6" : "#111827";
    const textSec = isDark ? "#9A8E7A" : "#6B7280";

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all duration-150"
            style={{
                background: active ? (isDark ? `${gold}18` : `${gold}12`) : "transparent",
                border: `1px solid ${active ? gold : "transparent"}`,
            }}
        >
            <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: isDark ? "#1A1A1A" : "#F0F0F0", color: active ? gold : textSec }}>
                {item.img ? (
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                    <Tag size={15} />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold truncate" style={{ color: active ? gold : textPri }}>
                    {item.name}
                </p>
                <p className="text-[10px]" style={{ color: textSec }}>
                    {item.count} items
                </p>
            </div>
        </button>
    );
};

function NewArrivalsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search")?.trim() || "";

    const { addToCart, setBuyNowItem } = useCart() as any;
    const { isWishlisted, toggleWishlist } = useWishlist();

    const ctx = useContext(AuthContext) as any;
    const isStoreOwner = STORE_OWNER_ROLES.includes(ctx?.user?.role);

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [sortBy, setSortBy] = useState("Newest");
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>([]);
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    const isDark = theme === "dark";
    const bg = isDark ? "#070707" : "#FFFFFF";
    const surface = isDark ? "#0D0D0D" : "#FFFFFF";
    const surface2 = isDark ? "#111111" : "#F9F9F9";
    const border = isDark ? "#1C1C1C" : "#EAEAEA";
    const textPri = isDark ? "#F0EAD6" : "#111827";
    const textSec = isDark ? "#9A8E7A" : "#6B7280";
    const textMid = isDark ? "#C8BCA8" : "#374151";
    const gold = "#FF0000";
    const goldHi = "#FF4040";

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const rawToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                const token = rawToken ? rawToken.replace(/['"]+/g, "") : null;
                const ts = new Date().getTime();

                const res = await fetch(`${API_URL}/products?t=${ts}&ownerRole=store_owner&limit=10000`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    cache: "no-store",
                });
                const data = await res.json();
                const arr = Array.isArray(data) ? data : data.products || data.data || [];
                setProducts(arr);
                if (arr.length > 0) {
                    const hi = Math.max(...arr.map((p: any) => p.price || 0));
                    setPriceRange({ min: 0, max: hi + 500 });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const handler = (e: CustomEvent) => { if (e.detail) setTheme(e.detail as "dark" | "light"); };
        window.addEventListener("theme-change", handler as EventListener);
        const cur = document.documentElement.getAttribute("data-theme") as "dark" | "light";
        if (cur) setTheme(cur);
        return () => window.removeEventListener("theme-change", handler as EventListener);
    }, []);

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        document.documentElement.setAttribute("data-theme", next);
        window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
    };

    const newArrivalProducts = useMemo(() => {
        const cutoff = Date.now() - NEW_ARRIVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        return products.filter((p) => {
            const created = new Date(p.createdAt || p.updatedAt || 0).getTime();
            return created >= cutoff;
        });
    }, [products]);

    const handleAddToCart = (e: React.MouseEvent, product: any) => {
        e.stopPropagation();
        if (product.totalStock <= 0) return;
        if (!isAuthenticated()) {
            redirectToLogin(`/new-arrivals`);
            return;
        }
        const img = product.images?.length > 0 ? product.images[0] : product.imageUrl;
        addToCart({
            ...product,
            id: product._id || product.id,
            image: img,
            totalStock: product.totalStock,
        });
    };

    const handleBuyNow = (e: React.MouseEvent, product: any) => {
        e.stopPropagation();
        if (product.totalStock <= 0) return;
        if (!isAuthenticated()) {
            redirectToLogin(`/new-arrivals`);
            return;
        }
        const img = product.images?.length > 0 ? product.images[0] : product.imageUrl;
        setBuyNowItem({
            id: product._id || product.id,
            title: product.title,
            price: product.price,
            image: img,
            quantity: 1,
            brand: product.brand,
            category: product.category,
            totalStock: product.totalStock,
        });
        router.push("/checkout");
    };

    const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, value: string) =>
        setState((prev) => prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]);

    const clearAllFilters = () => {
        setActiveCategory(null);
        setSelectedBrands([]);
        setSelectedAvailabilities([]);
        setPriceRange({ min: 0, max: 10000 });
    };

    const getUnique = (key: string, dataset: any[]) =>
        Array.from(new Set(dataset.map((p) => p[key]).filter(Boolean)));
    const getCount = (key: string, val: string, dataset: any[]) =>
        dataset.filter((p) => p[key] === val).length;

    const categoryCards = useMemo(() => {
        const names = getUnique("category", newArrivalProducts) as string[];
        return names
            .map((name) => {
                const catProducts = newArrivalProducts.filter(
                    (p) => (p.category || "").toLowerCase() === name.toLowerCase(),
                );
                const withImage = catProducts.find((p) => (p.images && p.images[0]) || p.imageUrl);
                const img = withImage ? (withImage.images?.[0] || withImage.imageUrl) : "";
                return { _id: name, name, count: catProducts.length, img };
            })
            .filter((c) => c.count > 0);
    }, [newArrivalProducts]);

    const categoryScopedProducts = activeCategory
        ? newArrivalProducts.filter((p) => p.category === activeCategory)
        : newArrivalProducts;

    const BRANDS = getUnique("brand", categoryScopedProducts).map((v) => ({
        label: String(v),
        count: getCount("brand", String(v), categoryScopedProducts),
    }));
    const AVAILABILITIES = getUnique("availability", categoryScopedProducts).map((v) => ({
        label: String(v),
        count: getCount("availability", String(v), categoryScopedProducts),
    }));

    const displayProducts = useMemo(() => {
        if (!isStoreOwner) return newArrivalProducts;
        return newArrivalProducts.map((p) => ({
            ...p,
            price: p.storePrice ?? p.price,
            discountedPrice: p.storeDiscountedPrice ?? p.discountedPrice,
        }));
    }, [newArrivalProducts, isStoreOwner]);

    const filteredProducts = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return displayProducts
            .filter((p) => {
                if (q && !`${p.title || ""} ${p.brand || ""} ${p.category || ""}`.toLowerCase().includes(q))
                    return false;
                if (activeCategory && p.category !== activeCategory) return false;
                if (p.price < priceRange.min || p.price > priceRange.max) return false;
                if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
                if (selectedAvailabilities.length > 0 && !selectedAvailabilities.includes(p.availability))
                    return false;
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "Price: Low to High") return a.price - b.price;
                if (sortBy === "Price: High to Low") return b.price - a.price;
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
    }, [displayProducts, activeCategory, priceRange, selectedBrands, selectedAvailabilities, sortBy, searchQuery]);

    const hasActiveFilters =
        activeCategory !== null ||
        selectedBrands.length > 0 ||
        selectedAvailabilities.length > 0 ||
        priceRange.min > 0;

    const SidebarContent = () => (
        <div>
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pb-4 mb-4 overflow-hidden"
                        style={{ borderBottom: `1px solid ${border}` }}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold tracking-[0.35em] uppercase" style={{ color: textPri }}>
                                Active Filters
                            </span>
                            <button onClick={clearAllFilters} className="text-[10px] tracking-wider uppercase hover:opacity-60 transition-opacity" style={{ color: gold }}>
                                Clear All
                            </button>
                        </div>
                        <p className="text-[11px] mb-3" style={{ color: textSec }}>
                            {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {activeCategory && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-wide"
                                    style={{ background: isDark ? `${gold}22` : `${gold}15`, border: `1px solid ${gold}60`, color: isDark ? gold : "#B8860B" }}>
                                    {activeCategory}
                                    <button onClick={() => setActiveCategory(null)} className="hover:opacity-60">
                                        <X size={9} />
                                    </button>
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <FilterSection title="Categories" theme={theme} activeCount={activeCategory ? 1 : 0}>
                <div className="flex flex-col gap-1.5">
                    {categoryCards.map((item) => {
                        const isActive = activeCategory === item.name;
                        return (
                            <CategoryCardMini
                                key={item._id}
                                item={item}
                                active={isActive}
                                theme={theme}
                                onClick={() => setActiveCategory(isActive ? null : item.name)}
                            />
                        );
                    })}
                    {categoryCards.length === 0 && (
                        <p className="text-[11px]" style={{ color: textSec }}>
                            No new arrivals right now.
                        </p>
                    )}
                </div>
            </FilterSection>

            <FilterSection title="Brand" theme={theme} activeCount={selectedBrands.length}>
                <div className="flex flex-col gap-0.5">
                    {BRANDS.map((brand, i) => (
                        <FilterCheckbox
                            key={i}
                            label={brand.label}
                            count={brand.count}
                            checked={selectedBrands.includes(brand.label)}
                            onChange={() => toggleFilter(setSelectedBrands, brand.label)}
                            theme={theme}
                        />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Price Range" theme={theme}>
                <div className="space-y-4 pt-1">
                    <input
                        type="range"
                        min="0"
                        max={10000}
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                        className="w-full h-[2px] appearance-none outline-none cursor-pointer"
                        style={{ accentColor: gold }}
                    />
                </div>
            </FilterSection>

            {AVAILABILITIES.length > 0 && (
                <FilterSection title="Availability" theme={theme} activeCount={selectedAvailabilities.length}>
                    <div className="flex flex-col gap-0.5">
                        {AVAILABILITIES.map((avail, i) => (
                            <FilterCheckbox
                                key={i}
                                label={avail.label}
                                count={avail.count}
                                checked={selectedAvailabilities.includes(avail.label)}
                                onChange={() => toggleFilter(setSelectedAvailabilities, avail.label)}
                                theme={theme}
                            />
                        ))}
                    </div>
                </FilterSection>
            )}
        </div>
    );

    return (
        <>
            <NavbarHome theme={theme} toggleTheme={toggleTheme} />
            <div className="cat-root min-h-screen pt-[64px] sm:pt-[96px] lg:pt-[136px] transition-colors duration-300 pb-16"
                style={{ background: bg, color: textPri }}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    <div className="pt-6 pb-2">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.35em] uppercase mb-1" style={{ color: gold }}>
                            <Sparkles size={11} />
                            Just In
                        </p>
                        <h1 className="text-2xl md:text-3xl font-black capitalize" style={{ color: textPri }}>
                            {activeCategory ? activeCategory : "New Arrivals"}
                        </h1>
                    </div>

                    <div className="flex gap-6 lg:gap-10">
                        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-[100px] self-start max-h-[calc(100vh-120px)] overflow-y-auto">
                            <SidebarContent />
                        </aside>

                        <div className="flex-1 min-w-0">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-24">
                                    <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <h3 className="text-base font-semibold mb-1" style={{ color: textPri }}>
                                        No new arrivals
                                    </h3>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {filteredProducts.map((product, index) => {
                                        const productId = product._id || product.id;
                                        const isWished = isWishlisted(productId);
                                        const displayImg = product.images?.length > 0 ? product.images[0] : product.imageUrl;
                                        const discount = product.originalPrice > product.price
                                            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                                            : 0;
                                        const isOutOfStock = product.totalStock <= 0;

                                        return (
                                            <motion.div
                                                key={productId}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04, duration: 0.3 }}
                                                onClick={() => router.push(`/product/${productId}`)}
                                                className="product-card group flex flex-col cursor-pointer relative overflow-hidden rounded-xl"
                                                style={{ background: surface, border: `1px solid ${border}` }}
                                            >
                                                <div className="card-img-wrap relative overflow-hidden" style={{ background: surface2, aspectRatio: "1/1" }}>
                                                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] font-bold tracking-widest rounded-sm"
                                                        style={{ background: gold, color: "#fff" }}>
                                                        <Sparkles size={9} />
                                                        NEW
                                                    </div>
                                                    {discount > 0 && (
                                                        <div className="absolute top-2.5 left-[52px] md:left-[58px] z-10 px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] font-bold tracking-widest rounded-sm"
                                                            style={{ background: isDark ? `${gold}22` : `${gold}15`, border: `1px solid ${gold}60`, color: isDark ? gold : "#B8860B" }}>
                                                            −{discount}%
                                                        </div>
                                                    )}
                                                    <img src={displayImg} alt={product.title} className={`w-full h-full object-cover ${isOutOfStock ? "opacity-50 grayscale" : ""}`} />
                                                    <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                                                        className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center transition-all duration-200 rounded-full backdrop-blur-md"
                                                        style={{ background: isWished ? "#FFE5E5" : isDark ? "rgba(13,13,13,0.5)" : "rgba(255,255,255,0.8)", border: `1px solid ${isWished ? "#FF0000" : border}` }}>
                                                        <Heart size={12} style={{ color: isWished ? "#FF0000" : textSec }} fill={isWished ? "#FF0000" : "none"} />
                                                    </button>
                                                </div>

                                                <div className="flex flex-col" style={{ borderTop: `1px solid ${border}` }}>
                                                    <div className="px-3 pt-3 pb-2.5 flex flex-col gap-1">
                                                        <span className="text-[9px] font-bold tracking-[0.3em] uppercase" style={{ color: isDark ? gold : "#B8860B" }}>
                                                            {product.brand}
                                                        </span>
                                                        <h3 className={`text-[12px] font-medium leading-snug line-clamp-2 ${isOutOfStock ? "opacity-50" : ""}`} style={{ color: textPri }}>
                                                            {product.title}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                                                            <span className="text-[15px] font-semibold" style={{ color: textPri }}>
                                                                ₹{product.price?.toLocaleString()}
                                                            </span>
                                                            {product.originalPrice > product.price && (
                                                                <span className="text-[11px] line-through font-medium" style={{ color: textSec }}>
                                                                    ₹{product.originalPrice?.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col lg:flex-row" style={{ borderTop: `1px solid ${border}` }}>
                                                        {isOutOfStock ? (
                                                            <button disabled className="w-full py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase cursor-not-allowed opacity-50"
                                                                style={{ color: textSec, background: "transparent" }}>
                                                                Out of Stock
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button onClick={(e) => handleAddToCart(e, product)}
                                                                    className="btn-cart-hover w-full lg:flex-1 flex items-center justify-center gap-1.5 py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-200 border-b lg:border-b-0 lg:border-r"
                                                                    style={{ color: textSec, borderColor: border, background: "transparent" }}>
                                                                    <ShoppingCart size={11} />
                                                                    Cart
                                                                </button>
                                                                <button onClick={(e) => handleBuyNow(e, product)}
                                                                    className="w-full lg:flex-1 flex items-center justify-center gap-1.5 py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase hover:opacity-85 transition-opacity"
                                                                    style={{ background: `linear-gradient(135deg, ${gold}, ${goldHi})`, color: "#000" }}>
                                                                    <Zap size={11} />
                                                                    Buy Now
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default NewArrivalsContent;