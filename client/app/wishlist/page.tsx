"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/app/components-main/CartContext";
import { useWishlist } from "@/app/components-main/WishlistContext";
import NavbarHome from "@/app/components-main/NavbarHome";
import { isAuthenticated, redirectToLogin } from "@/app/utils/authGuard";

export default function WishlistPage() {
  const router = useRouter();
  const { addToCart, setBuyNowItem } = useCart() as any;
  const { wishlist, removeFromWishlist } = useWishlist();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  const isDark = theme === "dark";
  const bg = isDark ? "#070707" : "#FFFFFF";
  const surface = isDark ? "#0D0D0D" : "#FFFFFF";
  const surface2 = isDark ? "#111111" : "#F9F9F9";
  const border = isDark ? "#1C1C1C" : "#EAEAEA";
  const textPri = isDark ? "#F0EAD6" : "#111827";
  const textSec = isDark ? "#9A8E7A" : "#6B7280";
  const gold = "#C9A84C";
  const goldHi = "#E2BE6A";

  const handleAddToCart = (item: any) => {
    if ((item.totalStock ?? 0) <= 0) return;
    if (!isAuthenticated()) {
      redirectToLogin("/wishlist");
      return;
    }
    addToCart({
      ...item,
      id: item.id,
      image: item.image,
      totalStock: item.totalStock,
    });
  };

  const handleBuyNow = (item: any) => {
    if ((item.totalStock ?? 0) <= 0) return;
    if (!isAuthenticated()) {
      redirectToLogin("/wishlist");
      return;
    }
    setBuyNowItem({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      quantity: 1,
      brand: item.brand,
      category: item.category,
      totalStock: item.totalStock,
    });
    router.push("/checkout");
  };

  return (
    <>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      <div
        className="min-h-screen pt-[64px] sm:pt-[96px] lg:pt-[136px] transition-colors duration-300 pb-16"
        style={{ background: bg, color: textPri }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-6 pb-6">
            <p
              className="text-[10px] font-bold tracking-[0.35em] uppercase mb-1"
              style={{ color: gold }}
            >
              Saved Items
            </p>
            <h1
              className="text-2xl md:text-3xl font-black"
              style={{ color: textPri }}
            >
              My Wishlist
            </h1>
          </div>

          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Heart
                size={36}
                className="mb-4 opacity-20"
                style={{ color: textSec }}
              />
              <h3
                className="text-base font-semibold mb-1"
                style={{ color: textPri }}
              >
                Your wishlist is empty
              </h3>
              <p className="text-xs mb-6" style={{ color: textSec }}>
                Tap the heart icon on any product to save it here.
              </p>
              <button
                onClick={() => router.push("/category/all")}
                className="px-6 py-2 text-[10px] font-bold tracking-[0.3em] uppercase transition-opacity hover:opacity-70 rounded-md"
                style={{ border: `1px solid ${gold}`, color: gold }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              <AnimatePresence>
                {wishlist.map((item) => {
                  const isOutOfStock = (item.totalStock ?? 0) <= 0;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="group flex flex-col cursor-pointer relative overflow-hidden rounded-xl"
                      style={{
                        background: surface,
                        border: `1px solid ${border}`,
                      }}
                    >
                      <div
                        className="relative overflow-hidden"
                        style={{ background: surface2, aspectRatio: "1/1" }}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className={`w-full h-full object-cover ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWishlist(item.id);
                          }}
                          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center transition-all duration-200 rounded-full backdrop-blur-md"
                          style={{
                            background: "#FFE5E5",
                            border: "1px solid #FF0000",
                          }}
                        >
                          <Heart
                            size={13}
                            style={{ color: "#FF0000" }}
                            fill="#FF0000"
                          />
                        </button>
                      </div>

                      <div
                        className="flex flex-col"
                        style={{ borderTop: `1px solid ${border}` }}
                      >
                        <div className="px-3 pt-3 pb-2.5 flex flex-col gap-1">
                          <span
                            className="text-[9px] font-bold tracking-[0.3em] uppercase"
                            style={{ color: isDark ? gold : "#B8860B" }}
                          >
                            {item.brand}
                          </span>
                          <h3
                            className={`text-[12px] font-medium leading-snug line-clamp-2 ${isOutOfStock ? "opacity-50" : ""}`}
                            style={{ color: textPri }}
                          >
                            {item.title}
                          </h3>
                          <span
                            className="text-[15px] font-semibold mt-0.5"
                            style={{ color: textPri }}
                          >
                            ₹{item.price?.toLocaleString()}
                          </span>
                        </div>

                        <div
                          className="flex flex-col lg:flex-row"
                          style={{ borderTop: `1px solid ${border}` }}
                        >
                          {isOutOfStock ? (
                            <button
                              disabled
                              className="w-full py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase cursor-not-allowed opacity-50"
                              style={{
                                color: textSec,
                                background: "transparent",
                              }}
                            >
                              Out of Stock
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(item);
                                }}
                                className="w-full lg:flex-1 flex items-center justify-center gap-1.5 py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-200 border-b lg:border-b-0 lg:border-r hover:bg-[#C9A84C] hover:text-black"
                                style={{
                                  color: textSec,
                                  borderColor: border,
                                  background: "transparent",
                                }}
                              >
                                <ShoppingCart size={11} />
                                Cart
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuyNow(item);
                                }}
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
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
