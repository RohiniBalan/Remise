"use client";

import React, { useState, useEffect, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Zap,
  Truck,
  Heart,
  CheckCircle,
  ArrowLeft,
  Package,
  AlertTriangle,
  Store,
  ShieldCheck,
  Tag,
  Star,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/app/components-main/CartContext";
import NavbarHome from "@/app/components-main/NavbarHome";
import { isAuthenticated, redirectToLogin } from "@/app/utils/authGuard";
import { AuthContext } from "@/app/context/AuthContext";
import { normalizeSpecifications } from "@/app/utils/categoryAttributes";

// Roles that see store-owner pricing instead of the direct-customer price
const STORE_OWNER_ROLES = ["store_owner", "whole_saler", "home_business"];

const TABS = ["About & Details", "Specifications", "Highlights", "Shipping & Returns"];

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState(TABS[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addToCart, setBuyNowItem } = useCart() as any;

  const ctx = useContext(AuthContext) as any;
  const isStoreOwner = STORE_OWNER_ROLES.includes(ctx?.user?.role);

  useEffect(() => {
    let productId: string | string[] | undefined =
      params?.id || params?.productId || params?.slug;
    if (!productId && typeof window !== "undefined") {
      productId = window.location.pathname.split("/").pop() || undefined;
    }
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const rawToken =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const token = rawToken ? rawToken.replace(/['"]+/g, "") : null;
        const timestamp = new Date().getTime();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const baseGateway = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const candidateUrls = [
          `http://localhost:3003/api/products/${productId}`,
          `http://localhost:3003/api/products?t=${timestamp}&limit=10000`,
          `${baseGateway}/api/products/${productId}`,
          `${baseGateway}/api/products?t=${timestamp}&limit=10000`,
          `${baseGateway}/api/admin/products?t=${timestamp}`,
          `https://wow-lifebackend.onrender.com/api/admin/products?t=${timestamp}`,
        ];

        let foundProduct: any = null;
        let allItems: any[] = [];

        for (const url of candidateUrls) {
          try {
            const response = await fetch(url, {
              headers,
              cache: "no-store",
              signal: AbortSignal.timeout(4000),
            });
            if (!response.ok) continue;
            const data = await response.json();

            if (
              data &&
              (data.product || data.data) &&
              !Array.isArray(data.data) &&
              !Array.isArray(data.product)
            ) {
              const item = data.product || data.data;
              if (
                item &&
                (String(item._id) === String(productId) ||
                  String(item.id) === String(productId))
              ) {
                foundProduct = item;
                break;
              }
            }

            const arr = Array.isArray(data)
              ? data
              : data.products || data.data || [];
            if (Array.isArray(arr) && arr.length > 0) {
              if (allItems.length === 0) allItems = arr;
              const match = arr.find(
                (p: any) =>
                  String(p._id) === String(productId) ||
                  String(p.id) === String(productId),
              );
              if (match) {
                foundProduct = match;
                break;
              }
            }
          } catch {
            // try next candidate
          }
        }

        if (allItems.length > 0) {
          setAllProducts(allItems);
        }

        if (foundProduct) {
          setProduct(foundProduct);
          const defaultImage =
            foundProduct.images && foundProduct.images.length > 0
              ? foundProduct.images[0]
              : foundProduct.imageUrl;
          setActiveImage(defaultImage || "");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [params]);

  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail as "dark" | "light";
      if (newTheme) setTheme(newTheme);
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

  // Compute specifications with dynamic attributes normalization
  const normalizedSpecs = useMemo(() => {
    if (!product) return [];
    const specs = normalizeSpecifications(
      product.attributes,
      product.specifications,
      product.category,
      product.subcategory,
    );
    if (product.totalStock !== undefined) {
      specs.push({
        label: "Total Stock",
        value: `${product.totalStock} Units`,
      });
    }
    if (product.moq && Number(product.moq) > 1) {
      specs.push({
        label: "Minimum Order Qty",
        value: `${product.moq} Units`,
      });
    }
    return specs;
  }, [product]);

  // Similar products from same category
  const similarProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    return allProducts
      .filter(
        (p) =>
          (p._id || p.id) !== (product._id || product.id) &&
          (p.category?.toLowerCase() === product.category?.toLowerCase() ||
            p.subcategory?.toLowerCase() === product.subcategory?.toLowerCase()),
      )
      .slice(0, 4);
  }, [product, allProducts]);

  const handleAddToCart = () => {
    if (!product || product.totalStock <= 0) return;
    if (!isAuthenticated()) {
      redirectToLogin(`/product/${product._id || product.id}`);
      return;
    }

    const displayImg =
      product.images && product.images.length > 0
        ? product.images[0]
        : product.imageUrl;

    for (let i = 0; i < quantity; i++) {
      addToCart({
        ...product,
        price: displayProduct.price,
        id: product._id || product.id,
        image: displayImg,
        totalStock: product.totalStock,
      });
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleBuyNow = () => {
    if (!product || product.totalStock <= 0) return;
    if (!isAuthenticated()) {
      redirectToLogin(`/product/${product._id || product.id}`);
      return;
    }

    const displayImg =
      product.images && product.images.length > 0
        ? product.images[0]
        : product.imageUrl;

    setBuyNowItem({
      id: product._id || product.id,
      title: product.title,
      price: displayProduct.price,
      image: displayImg,
      quantity: quantity,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      totalStock: product.totalStock,
    });

    router.push("/checkout");
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: newTheme }));
  };

  /* ─── Loading State ─────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <NavbarHome theme={theme} toggleTheme={toggleTheme} />
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-3 border-teal-200 border-t-[#0D9488] animate-spin" />
          <Package size={20} className="absolute inset-0 m-auto text-[#0D9488]" />
        </div>
        <p className="mt-4 text-slate-600 text-xs tracking-wider uppercase font-bold">
          Loading Product…
        </p>
      </div>
    );
  }

  /* ─── Not Found State ───────────────────────────────────────────────── */
  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center pt-36 px-4">
        <NavbarHome theme={theme} toggleTheme={toggleTheme} />
        <AlertTriangle size={48} className="text-[#FF0000] mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-900">
          Product Not Found
        </h2>
        <p className="text-sm mb-6 text-slate-500 text-center max-w-md">
          This product is either unavailable or has been removed from the store.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-[#FF0000] hover:bg-[#DC2626] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xl shadow-sm"
        >
          Return to Products
        </button>
      </div>
    );
  }

  /* ─── Data Prep ─────────────────────────────────────────────────────── */
  const displayProduct = isStoreOwner
    ? {
        ...product,
        price: product.storePrice ?? product.price,
        discountedPrice: product.storeDiscountedPrice ?? product.discountedPrice,
      }
    : product;

  let galleryImages: string[] = [];
  if (Array.isArray(product.images) && product.images.length > 0)
    galleryImages = product.images.filter(Boolean);
  else if (product.imageUrl) galleryImages = [product.imageUrl];

  const dbFeatures =
    Array.isArray(product.aboutFeatures) && product.aboutFeatures.length > 0
      ? product.aboutFeatures.filter(Boolean)
      : [];
  const dbIdealFor =
    Array.isArray(product.idealFor) && product.idealFor.length > 0
      ? product.idealFor.filter(Boolean)
      : [];

  const originalPriceVal = displayProduct.originalPrice || displayProduct.price * 1.25;
  const currentPriceVal = displayProduct.price;
  const discount =
    originalPriceVal > currentPriceVal
      ? Math.round(((originalPriceVal - currentPriceVal) / originalPriceVal) * 100)
      : 0;

  const isOutOfStock = product.totalStock <= 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      {/* Main Container with generous top clearance for fixed navbar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 lg:pt-44 pb-16">
        {/* Floating Cart Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-8 right-8 z-[300] flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white shadow-2xl rounded-2xl border border-slate-700"
            >
              <CheckCircle size={18} className="text-teal-400 shrink-0" />
              <div>
                <p className="font-bold text-xs leading-none mb-0.5">
                  Added to Cart!
                </p>
                <p className="text-[11px] text-slate-400">
                  {quantity} item{quantity > 1 ? "s" : ""} added to your bag
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Navigation Link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft
            size={14}
            className="text-slate-500 group-hover:-translate-x-1 transition-transform"
          />
          <span>Back to Products</span>
        </button>

        {/* TOP SECTION: IMAGE GALLERY + CORE DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          {/* LEFT: IMAGE GALLERY (NO HOVER ZOOM) */}
          <div className="lg:col-span-6 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[440px] scrollbar-none shrink-0">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-slate-50 ${
                      activeImage === img
                        ? "border-[#0D9488] shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`thumb-${i}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage (Clean view, No zoom lens) */}
            <div className="relative flex-1 aspect-square rounded-2xl border border-slate-100 bg-[#FAFAFA] flex items-center justify-center p-6 overflow-hidden">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                <Package size={48} className="text-slate-300" />
              )}

              {/* Stock Status Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isOutOfStock
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : product.totalStock < 5
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {isOutOfStock
                    ? "Out of Stock"
                    : product.totalStock < 5
                    ? `Only ${product.totalStock} Left`
                    : "In Stock"}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: CORE PRODUCT DETAILS */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Category & Subcategory & Brand Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {product.brand && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                    {product.brand}
                  </span>
                )}
                {product.category && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-[#0D9488] border border-teal-200">
                    {product.category}
                  </span>
                )}
                {product.subcategory && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {product.subcategory}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-3">
                {product.title}
              </h1>

              {/* Ratings Summary */}
              <div className="flex items-center gap-3 mb-5 text-xs font-semibold">
                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Star size={14} fill="currentColor" />
                  <span>4.8</span>
                </div>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">128 Verified Ratings</span>
                <span className="text-slate-300">·</span>
                <span className="text-[#0D9488] flex items-center gap-1 font-bold">
                  <ShieldCheck size={14} /> Verified Genuine
                </span>
              </div>

              {/* Price Banner */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-5 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                  ₹{currentPriceVal?.toLocaleString("en-IN")}
                </span>
                {originalPriceVal > currentPriceVal && (
                  <>
                    <span className="text-base font-medium line-through text-slate-400">
                      ₹{originalPriceVal?.toLocaleString("en-IN")}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-red-50 text-[#FF0000] border border-red-200">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Store & Seller Info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold">
                    <Store size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Sold by {product.storeId ? "Verified Partner Store" : "Remise Direct Official"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Fast Door Dispatch · 100% Quality Checked
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-teal-50 text-[#0D9488] border border-teal-200">
                  Top Seller
                </span>
              </div>

              {/* Coupon / Discount Code Offer Banner */}
              <div className="mb-6 p-3.5 rounded-2xl border border-dashed border-[#0D9488]/40 bg-teal-50/40 flex items-center gap-3">
                <Tag size={16} className="text-[#0D9488] shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-teal-900">
                    Use Code <span className="underline tracking-wider font-extrabold text-[#FF0000]">REMISE10</span> for 10% Extra Off
                  </p>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    Free door delivery on all prepaid orders above ₹499
                  </p>
                </div>
              </div>

              {/* Quantity Stepper & Wishlist */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden h-11">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="w-10 h-full flex items-center justify-center text-base font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900">
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.totalStock || 99, quantity + 1))
                    }
                    disabled={isOutOfStock || quantity >= (product.totalStock || 99)}
                    className="w-10 h-full flex items-center justify-center text-base font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-l border-slate-200"
                  >
                    +
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${
                    isWishlisted
                      ? "border-red-300 bg-red-50 text-[#FF0000]"
                      : "border-slate-300 bg-white text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Heart
                    size={18}
                    fill={isWishlisted ? "#FF0000" : "none"}
                    className={isWishlisted ? "text-[#FF0000]" : "currentColor"}
                  />
                </motion.button>
              </div>

              {/* ACTION BUTTONS (REMISE BRAND RED & TEAL) */}
              <div className="flex gap-3 mb-5">
                {isOutOfStock ? (
                  <button
                    disabled
                    className="flex-1 h-12 flex items-center justify-center text-xs font-bold tracking-wider uppercase rounded-xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  >
                    Currently Out of Stock
                  </button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      className="flex-1 h-12 flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase rounded-xl transition-all border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-sm"
                    >
                      <ShoppingCart size={15} />
                      Add to Cart
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBuyNow}
                      className="flex-1 h-12 flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase rounded-xl transition-all bg-[#FF0000] hover:bg-[#DC2626] active:bg-[#B91C1C] text-white shadow-md"
                    >
                      <Zap size={15} />
                      Buy Now
                    </motion.button>
                  </>
                )}
              </div>

              {/* Delivery Note */}
              <div className="flex items-center gap-2.5 p-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                <Truck size={15} className="text-[#0D9488] shrink-0" />
                <span>
                  Free door delivery on orders above ₹499 · Est. delivery{" "}
                  <strong className="text-slate-900">
                    {product.deliveryTime || "3–7 Business Days"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TABBED SPECIFICATIONS & HIGHLIGHTS SECTION */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`relative px-5 py-3 text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${
                  selectedTab === tab
                    ? "text-[#0D9488]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
                {selectedTab === tab && (
                  <motion.div
                    layoutId="pdp-active-tab-bar"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D9488]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 min-h-[160px]">
            <AnimatePresence mode="wait">
              {/* ABOUT & DETAILS */}
              {selectedTab === "About & Details" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 max-w-4xl"
                >
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      Product Overview
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {product.aboutDescription ||
                        product.description ||
                        "No detailed description provided for this item."}
                    </p>
                  </div>

                  {dbFeatures.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                        Key Features
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {dbFeatures.map((f: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-xs text-slate-700 font-medium"
                          >
                            <CheckCircle
                              size={14}
                              className="text-[#0D9488] shrink-0 mt-0.5"
                            />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {/* DYNAMIC SPECIFICATIONS TABLE (ONLY DISPLAY NON-EMPTY VALUES) */}
              {selectedTab === "Specifications" && (
                <motion.div
                  key="specs"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-4xl"
                >
                  {normalizedSpecs.length > 0 ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                      {normalizedSpecs.map((spec, idx) => (
                        <div
                          key={idx}
                          className={`flex items-stretch transition-colors ${
                            idx % 2 === 0 ? "bg-slate-50/60" : "bg-white"
                          } ${
                            idx < normalizedSpecs.length - 1
                              ? "border-b border-slate-200"
                              : ""
                          }`}
                        >
                          <div className="w-2/5 sm:w-1/3 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                            {spec.label}
                          </div>
                          <div className="flex-1 px-5 py-3 text-xs font-semibold text-slate-900 flex items-center border-l border-slate-200">
                            {spec.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-medium py-8 text-center text-slate-400">
                      No specifications available for this product.
                    </p>
                  )}
                </motion.div>
              )}

              {/* HIGHLIGHTS */}
              {selectedTab === "Highlights" && (
                <motion.div
                  key="highlights"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-4xl"
                >
                  {dbIdealFor.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {dbIdealFor.map((item: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                        >
                          <Sparkles size={14} className="text-[#0D9488] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-medium py-8 text-center text-slate-400">
                      Standard item highlights apply.
                    </p>
                  )}
                </motion.div>
              )}

              {/* SHIPPING & RETURNS */}
              {selectedTab === "Shipping & Returns" && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 max-w-4xl"
                >
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                      Delivery Policy
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Dispatched within 24 hours of order confirmation. Track your parcel live with real-time updates.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                      7 Days Replacement Guarantee
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      If the item arrives damaged, defective, or incorrect, request a hassle-free pickup and replacement within 7 days.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SIMILAR PRODUCTS RECOMMENDATIONS */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Similar Products in {product.subcategory || product.category}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Handpicked recommendations from our catalog
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {similarProducts.map((p) => {
                const pImg = p.images?.[0] || p.imageUrl;
                return (
                  <div
                    key={p._id || p.id}
                    onClick={() => router.push(`/product/${p._id || p.id}`)}
                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:shadow-md hover:border-slate-300 flex flex-col justify-between"
                  >
                    <div className="aspect-square p-4 flex items-center justify-center overflow-hidden bg-slate-50">
                      {pImg ? (
                        <img
                          src={pImg}
                          alt={p.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package size={32} className="text-slate-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-[#0D9488]">
                        {p.brand || p.category}
                      </p>
                      <h4 className="text-xs font-bold line-clamp-1 mb-2 text-slate-900 group-hover:text-[#FF0000] transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-sm font-extrabold text-slate-900">
                        ₹{p.price?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}