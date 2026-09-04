"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Zap, Package, Flame } from "lucide-react";
import { useCart } from "@/app/components-main/CartContext";
import { useWishlist } from "@/app/components-main/WishlistContext";
import NavbarHome from "@/app/components-main/NavbarHome";
import { isAuthenticated, redirectToLogin } from "@/app/utils/authGuard";

const API_URL = "http://localhost:3003/api";

export default function BestSellersPage() {
  const router = useRouter();
  const { addToCart, setBuyNowItem } = useCart() as any;
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const isDark = theme === "dark";
  const bg = isDark ? "#070707" : "#FFFFFF";
  const surface = isDark ? "#0D0D0D" : "#FFFFFF";
  const surface2 = isDark ? "#111111" : "#F9F9F9";
  const border = isDark ? "#1C1C1C" : "#EAEAEA";
  const textPri = isDark ? "#F0EAD6" : "#111827";
  const textSec = isDark ? "#9A8E7A" : "#6B7280";
  const gold = "#FF0000";
  const goldHi = "#FF4040";

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await fetch(
          `${API_URL}/products?ownerRole=store_owner&sort=bestselling&limit=10000`,
          { cache: "no-store" },
        );
        const data = await res.json();
        const arr = Array.isArray(data?.data) ? data.data : [];
        setProducts(arr);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBestSellers();
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail) setTheme(e.detail as "dark" | "light");
    };
    window.addEventListener("theme-change", handler as EventListener);
    const cur = document.documentElement.getAttribute("data-theme") as
      | "dark"
      | "light";
    if (cur) setTheme(cur);
    return () =>
      window.removeEventListener("theme-change", handler as EventListener);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
  };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (product.totalStock <= 0) return;
    if (!isAuthenticated()) {
      redirectToLogin("/bestsellers");
      return;
    }
    const img =
      product.images?.length > 0 ? product.images[0] : product.imageUrl;
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
      redirectToLogin("/bestsellers");
      return;
    }
    const img =
      product.images?.length > 0 ? product.images[0] : product.imageUrl;
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

  // Only real best sellers — products with at least one confirmed sale.
  const bestSellingProducts = useMemo(
    () => products.filter((p) => (p.soldCount || 0) > 0),
    [products],
  );

  return (
    <>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        .bs-root  { font-family: 'Inter', sans-serif; }
        .bs-serif { font-family: 'Playfair Display', Georgia, serif; }
        html, body, * { scrollbar-width: none; -ms-overflow-style: none; }
        ::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .card-img-wrap img { transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94); }
        .product-card:hover .card-img-wrap img { transform: scale(1.05); }
        .btn-cart-hover:hover { background: #C9A84C !important; color: #000 !important; border-color: #C9A84C !important; }
      `}</style>

      <div
        className="bs-root min-h-screen pt-[64px] sm:pt-[96px] lg:pt-[136px] transition-colors duration-300 pb-16"
        style={{ background: bg, color: textPri }}
      >
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px]"
          style={{
            background: `radial-gradient(ellipse, ${gold}, transparent 70%)`,
            filter: "blur(60px)",
            opacity: isDark ? 0.04 : 0.015,
          }}
        />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-6 pb-6" style={{ borderBottom: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={14} className={isDark ? "text-[#FF4040]" : "text-[#CC0000]"} fill="currentColor" />
              <p
                className="text-[10px] font-bold tracking-[0.35em] uppercase"
                style={{ color: gold }}
              >
                Customers Love
              </p>
            </div>
            <h1
              className="text-2xl md:text-3xl font-black"
              style={{ color: textPri }}
            >
              Best Sellers
            </h1>
            {!isLoading && (
              <p className="text-[11px] mt-2" style={{ color: textSec }}>
                <span style={{ color: gold, fontWeight: 600 }}>
                  {bestSellingProducts.length}
                </span>{" "}
                products ranked by units actually sold
              </p>
            )}
          </div>

          <div className="pt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="relative w-12 h-12 mb-5">
                  <div className="absolute inset-0 rounded-full border border-[#C9A84C]/20 border-t-[#C9A84C] animate-spin" />
                  <Package
                    size={18}
                    className="absolute inset-0 m-auto"
                    style={{ color: gold }}
                  />
                </div>
                <p
                  className="text-[10px] tracking-[0.4em] uppercase"
                  style={{ color: textSec }}
                >
                  Loading Best Sellers
                </p>
              </div>
            ) : bestSellingProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Flame size={36} className="mb-4 opacity-20" style={{ color: textSec }} />
                <h3 className="text-base font-semibold mb-1" style={{ color: textPri }}>
                  No best sellers yet
                </h3>
                <p className="text-xs" style={{ color: textSec }}>
                  Products will show up here once they've been sold.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {bestSellingProducts.map((product, index) => {
                  const productId = product._id || product.id;
                  const isWished = isWishlisted(productId);
                  const displayImg =
                    product.images?.length > 0
                      ? product.images[0]
                      : product.imageUrl;
                  const discount =
                    product.discountedPrice != null &&
                    product.discountedPrice < product.price
                      ? Math.round(
                          ((product.price - product.discountedPrice) /
                            product.price) *
                            100,
                        )
                      : 0;
                  const displayPrice =
                    discount > 0 ? product.discountedPrice : product.price;
                  const isOutOfStock = product.totalStock <= 0;

                  return (
                    <motion.div
                      key={productId}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      onClick={() => router.push(`/product/${productId}`)}
                      className="product-card group flex flex-col cursor-pointer relative overflow-hidden rounded-xl"
                      style={{ background: surface, border: `1px solid ${border}` }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = `${gold}60`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = border;
                      }}
                    >
                      <div
                        className="card-img-wrap relative overflow-hidden"
                        style={{ background: surface2, aspectRatio: "1/1" }}
                      >
                        <span
                          className="absolute top-2.5 left-2.5 z-10 px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] font-bold tracking-widest rounded-sm"
                          style={{ background: gold, color: "#fff" }}
                        >
                          #{index + 1} Best Seller
                        </span>

                        {discount > 0 && (
                          <div
                            className="absolute top-9 left-2.5 z-10 px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] font-bold tracking-widest rounded-sm"
                            style={{ background: "#D4AF37", color: "#000" }}
                          >
                            −{discount}%
                          </div>
                        )}

                        <img
                          src={displayImg}
                          alt={product.title}
                          className={`w-full h-full object-cover ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
                        />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center transition-all duration-200 rounded-full backdrop-blur-md"
                          style={{
                            background: isWished
                              ? "#FFE5E5"
                              : isDark
                              ? "rgba(13,13,13,0.5)"
                              : "rgba(255,255,255,0.8)",
                            border: `1px solid ${isWished ? "#FF0000" : border}`,
                          }}
                        >
                          <Heart
                            size={12}
                            style={{ color: isWished ? "#FF0000" : textSec }}
                            fill={isWished ? "#FF0000" : "none"}
                          />
                        </button>
                      </div>

                      <div className="flex flex-col" style={{ borderTop: `1px solid ${border}` }}>
                        <div className="px-3 pt-3 pb-2.5 flex flex-col gap-1">
                          <span
                            className="text-[9px] font-bold tracking-[0.3em] uppercase"
                            style={{ color: isDark ? gold : "#B8860B" }}
                          >
                            {product.brand || product.category}
                          </span>
                          <h3
                            className={`text-[12px] font-medium leading-snug line-clamp-2 ${isOutOfStock ? "opacity-50" : ""}`}
                            style={{ color: textPri }}
                          >
                            {product.title}
                          </h3>
                          <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="bs-serif text-[15px] font-semibold" style={{ color: textPri }}>
                              ₹{displayPrice?.toLocaleString()}
                            </span>
                            {discount > 0 && (
                              <span className="text-[11px] line-through font-medium" style={{ color: textSec }}>
                                ₹{product.price?.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row" style={{ borderTop: `1px solid ${border}` }}>
                          {isOutOfStock ? (
                            <button
                              disabled
                              className="w-full py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase cursor-not-allowed opacity-50"
                              style={{ color: textSec, background: "transparent" }}
                            >
                              Out of Stock
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => handleAddToCart(e, product)}
                                className="btn-cart-hover w-full lg:flex-1 flex items-center justify-center gap-1.5 py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-200 border-b lg:border-b-0 lg:border-r"
                                style={{ color: textSec, borderColor: border, background: "transparent" }}
                              >
                                <ShoppingCart size={11} />
                                Cart
                              </button>
                              <button
                                onClick={(e) => handleBuyNow(e, product)}
                                className="w-full lg:flex-1 flex items-center justify-center gap-1.5 py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase hover:opacity-85 transition-opacity"
                                style={{
                                  background: `linear-gradient(135deg, ${gold}, ${goldHi})`,
                                  color: "#000",
                                }}
                              >
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
    </>
  );
}