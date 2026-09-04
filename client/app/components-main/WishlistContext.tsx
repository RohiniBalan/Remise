"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X as XIcon } from "lucide-react";

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image: string;
  brand?: string;
  category?: string;
  totalStock?: number;
}

export interface WishlistContextType {
  wishlist: WishlistItem[];
  wishlistCount: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: any) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "wishlist";

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "added" | "removed";
  }>({ show: false, message: "", type: "added" });

  const showNotification = (message: string, type: "added" | "removed") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2500);
  };

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWishlist(JSON.parse(saved));
    } catch {}

    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail) setTheme(event.detail as "dark" | "light");
    };
    window.addEventListener("theme-change", handleThemeChange as EventListener);
    const currentTheme = document.documentElement.getAttribute("data-theme") as
      | "dark"
      | "light";
    if (currentTheme) setTheme(currentTheme);

    return () =>
      window.removeEventListener(
        "theme-change",
        handleThemeChange as EventListener,
      );
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  const isWishlisted = (productId: string) =>
    wishlist.some((item) => item.id === productId);

  const toggleWishlist = (product: any) => {
    const productId = product._id || product.id;
    setWishlist((prev) => {
      if (prev.some((item) => item.id === productId)) {
        showNotification("Removed from wishlist", "removed");
        return prev.filter((item) => item.id !== productId);
      }
      const img =
        product.images?.length > 0
          ? product.images[0]
          : product.imageUrl || product.image;
      showNotification("Added to wishlist", "added");
      return [
        ...prev,
        {
          id: productId,
          title: product.title,
          price: product.price,
          image: img,
          brand: product.brand,
          category: product.category,
          totalStock: product.totalStock,
        },
      ];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    showNotification("Removed from wishlist", "removed");
  };

  const clearWishlist = () => setWishlist([]);

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            style={{
              position: "fixed",
              top: "2rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md font-semibold tracking-wide border ${
              theme === "light"
                ? "bg-black/80 border-[#333] text-white shadow-black/20"
                : "bg-white/90 border-gray-200 text-gray-900 shadow-[#D4AF37]/10"
            }`}
          >
            {toast.type === "added" ? (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/10 text-red-500">
                <CheckCircle size={16} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-500/10 text-gray-500">
                <XIcon size={16} strokeWidth={2.5} />
              </div>
            )}
            <span className="text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
