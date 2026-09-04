"use client";

import React, { useState, useEffect, useMemo, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { useCart } from "@/app/components-main/CartContext";
import { useWishlist } from "@/app/components-main/WishlistContext";
import NavbarHome from "@/app/components-main/NavbarHome";
import { isAuthenticated, redirectToLogin } from "@/app/utils/authGuard";
import { AuthContext } from "@/app/context/AuthContext";

// Roles that see store-owner pricing instead of the direct-customer price
const STORE_OWNER_ROLES = ["store_owner", "whole_saler", "home_business"];

// Define your backend API URL here
const API_URL = "http://localhost:3003/api";

// Same default category list used on the Store Dashboard (Categories/Products
// tabs) — kept in sync so the pool of possible categories matches what an
// owner could pick there. Categories from this list are still only shown on
// this page once they have at least one real product (see visibleCategoryCards).
const DEFAULT_STORE_CATEGORIES = [
  "Food & Beverages",
  "Grocery",
  "Fashion",
  "Electronics",
  "Pharmacy",
  "Toys",
  "Home & Living",
  "Beauty",
  "Sports",
  "Other",
];

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
const FilterSection = ({
  title,
  children,
  isOpenDefault = true,
  theme,
  activeCount = 0,
}: any) => {
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
    <label
      className="flex items-center gap-2.5 cursor-pointer group py-1"
      onClick={onChange}
    >
      <div
        className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center transition-all duration-150"
        style={{
          border: `1px solid ${checked ? gold : border}`,
          background: checked ? gold : "transparent",
        }}
      >
        {checked && <CheckCircle size={9} style={{ color: "#000" }} />}
      </div>
      <span
        className="text-[12px] transition-colors leading-tight"
        style={{ color: checked ? textPri : textSec }}
      >
        {label}
        <span className="ml-1 text-[10px] opacity-60">({count})</span>
      </span>
    </label>
  );
};

const CategoryItem = ({ label, active, theme, onClick }: any) => {
  const isDark = theme === "dark";
  const gold = "#C9A84C";
  const textSec = isDark ? "#9A8E7A" : "#6B7280";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between text-left group transition-colors py-1.5"
      style={{ color: active ? gold : textSec }}
    >
      <span className="text-[11px] tracking-[0.25em] uppercase">{label}</span>
      <ChevronRight
        size={12}
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translateX(2px)" : "translateX(-4px)",
          color: gold,
          transition: "all 0.2s",
        }}
      />
    </button>
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
        background: active
          ? isDark
            ? `${gold}18`
            : `${gold}12`
          : "transparent",
        border: `1px solid ${active ? gold : "transparent"}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{
          background: isDark ? "#1A1A1A" : "#F0F0F0",
          color: active ? gold : textSec,
        }}
      >
        {item.img ? (
          <img
            src={item.img}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Tag size={15} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[11px] font-semibold truncate"
          style={{ color: active ? gold : textPri }}
        >
          {item.name}
        </p>
        <p className="text-[10px]" style={{ color: textSec }}>
          {item.count} items
        </p>
      </div>
    </button>
  );
};

const CategoryBrowseCard = ({ item, theme, onClick }: any) => {
  const isDark = theme === "dark";
  const gold = "#C9A84C";
  const goldHi = "#E2BE6A";
  const surface = isDark ? "#0D0D0D" : "#FFFFFF";
  const border = isDark ? "#1C1C1C" : "#EAEAEA";
  const textPri = isDark ? "#F0EAD6" : "#111827";
  const textSec = isDark ? "#9A8E7A" : "#6B7280";

  return (
    <motion.button
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl text-center transition-colors"
      style={{ background: surface, border: `1px solid ${border}` }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gold}, ${goldHi})`,
          color: "#000",
        }}
      >
        {item.img ? (
          <img
            src={item.img}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Tag size={22} />
        )}
      </div>
      <div>
        <p className="text-[13px] font-semibold" style={{ color: textPri }}>
          {item.name}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: textSec }}>
          {item.count} product{item.count !== 1 ? "s" : ""}
        </p>
      </div>
    </motion.button>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const urlCategoryId = params?.categoryId as string | undefined;
  const searchQuery = searchParams.get("search")?.trim() || "";

  const { addToCart, setBuyNowItem } = useCart() as any;
  const { isWishlisted, toggleWishlist } = useWishlist();

  const ctx = useContext(AuthContext) as any;
  const isStoreOwner = STORE_OWNER_ROLES.includes(ctx?.user?.role);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [sortBy, setSortBy] = useState("Best selling");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<
    string[]
  >([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [categoryCards, setCategoryCards] = useState<any[]>([]);

  /* ── Design tokens ── */
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

  /* ── Data fetch ── */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const rawToken =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const token = rawToken ? rawToken.replace(/['"]+/g, "") : null;
        const ts = new Date().getTime();

        // Updated fetch URL — explicit high limit so we get every product,
        // not just the backend's default page size of 50 (which was
        // silently truncating category counts/listings).
        const res = await fetch(
          `${API_URL}/products?t=${ts}&ownerRole=store_owner&limit=10000`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: "no-store",
          },
        );
        const data = await res.json();
        const arr = Array.isArray(data)
          ? data
          : data.products || data.data || [];
        setProducts(arr);
        if (arr.length > 0) {
          const hi = Math.max(...arr.map((p: any) => p.price || 0));
          setPriceRange({ min: 0, max: hi + 500 });

          // Pre-filter by the URL categoryId (case-insensitive match against product categories)
          if (urlCategoryId && urlCategoryId !== "all") {
            const slug = urlCategoryId.toLowerCase();
            const match = Array.from(
              new Set(arr.map((p: any) => p.category).filter(Boolean)),
            ).find(
              (cat: any) =>
                String(cat).toLowerCase() === slug ||
                String(cat).toLowerCase().includes(slug),
            );
            if (match) setActiveCategory(String(match));
            else setActiveCategory(urlCategoryId); // fall back to the raw slug
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* ── Category cards fetch ── */
  useEffect(() => {
    const fetchCategoryCards = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`);
        const r = await res.json();
        if (r.success && r.data?.length > 0) setCategoryCards(r.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategoryCards();
  }, []);

  /* ── Theme listener ── */
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

  /* ── Cart / buy handlers ── */
    const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (product.totalStock <= 0) return; // Prevent adding if out of stock
    if (!isAuthenticated()) {
      redirectToLogin(`/category/${urlCategoryId || "all"}`);
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
    if (product.totalStock <= 0) return; // Prevent buying if out of stock
    if (!isAuthenticated()) {
      redirectToLogin(`/category/${urlCategoryId || "all"}`);
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

  const toggleFilter = (
    setState: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) =>
    setState((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );

  const clearAllFilters = () => {
    setActiveCategory(null);
    setSelectedTypes([]);
    setSelectedCats([]);
    setSelectedBrands([]);
    setSelectedAvailabilities([]);
    setPriceRange({ min: 0, max: 10000 });
  };

  /* ── Derived data ── */
  const getUnique = (key: string, dataset: any[] = products) =>
    Array.from(new Set(dataset.map((p) => p[key]).filter(Boolean)));
  const getCount = (key: string, val: string, dataset: any[] = products) =>
    dataset.filter((p) => p[key] === val).length;

  // Products scoped to the selected category (falls back to all products
  // when no category is active), so Brand/Availability only list what's
  // actually available within the chosen category.
  const categoryScopedProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  const CATEGORIES = getUnique("category");

  // Build the full candidate list — admin-added categories (/api/categories),
  // the fixed default list also used on the Store Dashboard, and any
  // category that only exists on a product — then attach a real product
  // count and a real product photo to each. Categories with zero products
  // are filtered out below (visibleCategoryCards) so only categories that
  // actually have inventory are ever shown on this page.
  const mergedCategoryCards = useMemo(() => {
    const seen = new Set<string>();
    const names: { name: string; id: string }[] = [];

    const addIfNew = (name: string, id: string) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      names.push({ name, id });
    };

    categoryCards.forEach((c) => addIfNew(c.name, c._id));
    DEFAULT_STORE_CATEGORIES.forEach((name) =>
      addIfNew(name, `default-${name}`),
    );
    CATEGORIES.forEach((name: string) => addIfNew(name, `derived-${name}`));

    return names.map(({ name, id }) => {
      const catProducts = products.filter(
        (p) => (p.category || "").toLowerCase() === name.toLowerCase(),
      );
      // Real photo from one of this category's own products.
      const withImage = catProducts.find(
        (p) => (p.images && p.images[0]) || p.imageUrl,
      );
      const img = withImage
        ? withImage.images?.[0] || withImage.imageUrl
        : "";
      return { _id: id, name, count: catProducts.length, img };
    });
  }, [categoryCards, DEFAULT_STORE_CATEGORIES, CATEGORIES, products]);

  // Only show categories that actually have at least one product.
  const visibleCategoryCards = useMemo(
    () => mergedCategoryCards.filter((c) => c.count > 0),
    [mergedCategoryCards],
  );

  const BRANDS = getUnique("brand", categoryScopedProducts).map((v) => ({
    label: String(v),
    count: getCount("brand", String(v), categoryScopedProducts),
  }));
  const AVAILABILITIES = getUnique("availability", categoryScopedProducts).map(
    (v) => ({
      label: String(v),
      count: getCount("availability", String(v), categoryScopedProducts),
    }),
  );

  // Store-owner buyers see storePrice/storeDiscountedPrice (falling back to
  // the regular customer price if the seller didn't set a store price).
  // Recomputes whenever isStoreOwner changes (e.g. AuthContext finishes
  // loading the user from localStorage after this page's initial render).
  const displayProducts = useMemo(() => {
    if (!isStoreOwner) return products;
    return products.map((p) => ({
      ...p,
      price: p.storePrice ?? p.price,
      discountedPrice: p.storeDiscountedPrice ?? p.discountedPrice,
    }));
  }, [products, isStoreOwner]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return displayProducts
      .filter((p) => {
        if (
          q &&
          !`${p.title || ""} ${p.brand || ""} ${p.category || ""}`
            .toLowerCase()
            .includes(q)
        )
          return false;
        if (activeCategory && p.category !== activeCategory) return false;
        if (p.price < priceRange.min || p.price > priceRange.max) return false;
        if (selectedTypes.length > 0 && !selectedTypes.includes(p.type))
          return false;
        if (selectedCats.length > 0 && !selectedCats.includes(p.category))
          return false;
        if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand))
          return false;
        if (
          selectedAvailabilities.length > 0 &&
          !selectedAvailabilities.includes(p.availability)
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "Price: Low to High") return a.price - b.price;
        if (sortBy === "Price: High to Low") return b.price - a.price;
        return 0;
      });
  }, [
    products,
    activeCategory,
    priceRange,
    selectedTypes,
    selectedCats,
    selectedBrands,
    selectedAvailabilities,
    sortBy,
    searchQuery,
  ]);

  const hasActiveFilters =
    activeCategory !== null ||
    selectedTypes.length > 0 ||
    selectedCats.length > 0 ||
    selectedBrands.length > 0 ||
    selectedAvailabilities.length > 0 ||
    priceRange.min > 0;

  const isBrowseAll =
    urlCategoryId === "all" && !activeCategory && !searchQuery;

  /* ── Sidebar ── */
  const SidebarContent = () => (
    <div>
      {/* Active filters */}
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
              <span
                className="text-[10px] font-bold tracking-[0.35em] uppercase"
                style={{ color: textPri }}
              >
                Active Filters
              </span>
              <button
                onClick={clearAllFilters}
                className="text-[10px] tracking-wider uppercase hover:opacity-60 transition-opacity"
                style={{ color: gold }}
              >
                Clear All
              </button>
            </div>
            <p className="text-[11px] mb-3" style={{ color: textSec }}>
              {filteredProducts.length} result
              {filteredProducts.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeCategory && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-wide"
                  style={{
                    background: isDark ? `${gold}22` : `${gold}15`,
                    border: `1px solid ${gold}60`,
                    color: isDark ? gold : "#B8860B",
                  }}
                >
                  {activeCategory}
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="hover:opacity-60"
                  >
                    <X size={9} />
                  </button>
                </span>
              )}
              {[
                ...selectedBrands.map((v) => ({
                  val: v,
                  setter: setSelectedBrands,
                })),
                ...selectedAvailabilities.map((v) => ({
                  val: v,
                  setter: setSelectedAvailabilities,
                })),
              ].map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium"
                  style={{
                    background: surface2,
                    border: `1px solid ${border}`,
                    color: textMid,
                  }}
                >
                  {item.val}
                  <button
                    onClick={() => toggleFilter(item.setter, item.val)}
                    className="hover:opacity-60"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FilterSection
        title="Categories"
        theme={theme}
        activeCount={activeCategory ? 1 : 0}
      >
        <div className="flex flex-col gap-1.5">
          {visibleCategoryCards.map((item) => {
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
        </div>
      </FilterSection>

      <FilterSection
        title="Brand"
        theme={theme}
        activeCount={selectedBrands.length}
      >
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
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: parseInt(e.target.value) })
            }
            className="w-full h-[2px] appearance-none outline-none cursor-pointer"
            style={{ accentColor: gold }}
          />
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-1 px-2.5 py-1.5 text-[11px]"
              style={{
                border: `1px solid ${border}`,
                color: textSec,
                background: surface,
              }}
            >
              <span>₹</span>
              <input
                type="number"
                value={priceRange.min}
                readOnly
                className="w-full bg-transparent focus:outline-none"
                style={{ color: isDark ? gold : "#B8860B" }}
              />
            </div>
            <span
              className="text-[9px] tracking-widest"
              style={{ color: textSec }}
            >
              TO
            </span>
            <div
              className="flex-1 flex items-center gap-1 px-2.5 py-1.5 text-[11px]"
              style={{
                border: `1px solid ${border}`,
                color: textSec,
                background: surface,
              }}
            >
              <span>₹</span>
              <input
                type="number"
                value={priceRange.max}
                readOnly
                className="w-full bg-transparent focus:outline-none"
                style={{ color: isDark ? gold : "#B8860B" }}
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {AVAILABILITIES.length > 0 && (
        <FilterSection
          title="Availability"
          theme={theme}
          activeCount={selectedAvailabilities.length}
        >
          <div className="flex flex-col gap-0.5">
            {AVAILABILITIES.map((avail, i) => (
              <FilterCheckbox
                key={i}
                label={avail.label}
                count={avail.count}
                checked={selectedAvailabilities.includes(avail.label)}
                onChange={() =>
                  toggleFilter(setSelectedAvailabilities, avail.label)
                }
                theme={theme}
              />
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        .cat-root  { font-family: 'Inter', sans-serif; }
        .cat-serif { font-family: 'Playfair Display', Georgia, serif; }
        html, body, * { scrollbar-width: none; -ms-overflow-style: none; }
        ::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .card-img-wrap img { transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94); }
        .product-card:hover .card-img-wrap img { transform: scale(1.05); }
        .btn-cart-hover:hover { background: #C9A84C !important; color: #000 !important; border-color: #C9A84C !important; }
      `}</style>

      <div
        className="cat-root min-h-screen pt-[64px] sm:pt-[96px] lg:pt-[136px] transition-colors duration-300 pb-16"
        style={{ background: bg, color: textPri }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px]"
          style={{
            background: `radial-gradient(ellipse, ${gold}, transparent 70%)`,
            filter: "blur(60px)",
            opacity: isDark ? 0.04 : 0.015,
          }}
        />

        {/* Mobile drawer */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto p-6 lg:hidden"
                style={{
                  background: surface,
                  borderRight: `1px solid ${border}`,
                }}
              >
                <div
                  className="flex justify-between items-center mb-6"
                  style={{
                    borderBottom: `1px solid ${border}`,
                    paddingBottom: "16px",
                  }}
                >
                  <span
                    className="text-[10px] font-bold tracking-[0.4em] uppercase"
                    style={{ color: gold }}
                  >
                    Filters
                  </span>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="hover:opacity-60 transition-opacity"
                    style={{ color: textSec }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* ── Page heading ── */}
          {(activeCategory || urlCategoryId) && urlCategoryId !== "all" && (
            <div className="pt-6 pb-2">
              <p
                className="text-[10px] font-bold tracking-[0.35em] uppercase mb-1"
                style={{ color: gold }}
              >
                Browse Category
              </p>
              <h1
                className="text-2xl md:text-3xl font-black capitalize"
                style={{ color: textPri }}
              >
                {activeCategory || urlCategoryId?.replace(/-/g, " ")}
              </h1>
            </div>
          )}

          {/* ── Top bar ── */}
          <div
            className="flex items-center justify-between py-4 mb-6"
            style={{ borderBottom: `1px solid ${border}` }}
          >
            {/* LEFT: mobile filter + sort */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.3em] uppercase transition-opacity hover:opacity-60"
                style={{ color: gold }}
              >
                <Filter size={13} />
                Filters
                {hasActiveFilters &&
                  ` (${[activeCategory, ...selectedBrands, ...selectedAvailabilities].filter(Boolean).length})`}
              </button>

              <div className="flex items-center gap-2.5">
                <span
                  className="text-[10px] tracking-[0.3em] uppercase hidden sm:block"
                  style={{ color: textSec }}
                >
                  Sort By
                </span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-[11px] font-medium focus:outline-none cursor-pointer transition-colors"
                    style={{
                      background: surface2,
                      border: `1px solid ${border}`,
                      color: textPri,
                    }}
                  >
                    <option value="Best selling">Best Selling</option>
                    <option value="Price: Low to High">
                      Price: Low → High
                    </option>
                    <option value="Price: High to Low">
                      Price: High → Low
                    </option>
                  </select>
                  <ChevronDown
                    size={11}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: gold }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: count */}
            <p
              className="text-[11px] hidden sm:block"
              style={{ color: textSec }}
            >
              <span style={{ color: gold, fontWeight: 600 }}>
                {filteredProducts.length}
              </span>{" "}
              products
              {activeCategory && (
                <span style={{ color: textSec }}>
                  {" "}
                  in <span style={{ color: textPri }}>{activeCategory}</span>
                </span>
              )}
              {searchQuery && (
                <span style={{ color: textSec }}>
                  {" "}
                  for <span style={{ color: textPri }}>"{searchQuery}"</span>
                </span>
              )}
            </p>
          </div>

          {/* ── Main layout ── */}
          {isBrowseAll ? (
            <div className="pt-2">
              <div className="mb-6">
                <p
                  className="text-[10px] font-bold tracking-[0.35em] uppercase mb-1"
                  style={{ color: gold }}
                >
                  Browse
                </p>
                <h1
                  className="text-2xl md:text-3xl font-black"
                  style={{ color: textPri }}
                >
                  Shop by Category
                </h1>
              </div>

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
                    Loading Categories
                  </p>
                </div>
              ) : visibleCategoryCards.length === 0 ? (
                <p
                  className="text-sm py-16 text-center"
                  style={{ color: textSec }}
                >
                  No categories found.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visibleCategoryCards.map((item) => (
                    <CategoryBrowseCard
                      key={item._id}
                      item={item}
                      theme={theme}
                      onClick={() => setActiveCategory(item.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-6 lg:gap-10">
              {/* Desktop sidebar */}
              <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-[100px] self-start max-h-[calc(100vh-120px)] overflow-y-auto">
                <SidebarContent />
              </aside>

              {/* Product grid */}
              <div className="flex-1 min-w-0">
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
                      Loading Products
                    </p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Filter
                      size={36}
                      className="mb-4 opacity-20"
                      style={{ color: textSec }}
                    />
                    <h3
                      className="text-base font-semibold mb-1"
                      style={{ color: textPri }}
                    >
                      No products found
                    </h3>
                    <p className="text-xs mb-6" style={{ color: textSec }}>
                      Try adjusting your filters.
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="px-6 py-2 text-[10px] font-bold tracking-[0.3em] uppercase transition-opacity hover:opacity-70 rounded-md"
                      style={{ border: `1px solid ${gold}`, color: gold }}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {filteredProducts.map((product, index) => {
                      const productId = product._id || product.id;
                      const isWished = isWishlisted(productId);
                      const displayImg =
                        product.images?.length > 0
                          ? product.images[0]
                          : product.imageUrl;
                      const discount =
                        product.originalPrice > product.price
                          ? Math.round(
                              ((product.originalPrice - product.price) /
                                product.originalPrice) *
                                100,
                            )
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
                          style={{
                            background: surface,
                            border: `1px solid ${border}`,
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.borderColor = `${gold}60`;
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.borderColor = border;
                          }}
                        >
                          {/* Image block */}
                          <div
                            className="card-img-wrap relative overflow-hidden"
                            style={{ background: surface2, aspectRatio: "1/1" }}
                          >
                            {/* Discount badge */}
                            {discount > 0 && (
                              <div
                                className="absolute top-2.5 left-2.5 z-10 px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] font-bold tracking-widest rounded-sm"
                                style={{ background: gold, color: "#000" }}
                              >
                                −{discount}%
                              </div>
                            )}

                            {/* Product badge */}
                            {product.badge && !isWished && (
                              <div
                                className="absolute top-2.5 right-2.5 z-10 px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] font-bold tracking-wider rounded-sm"
                                style={{
                                  background: isDark
                                    ? `${gold}22`
                                    : `${gold}15`,
                                  border: `1px solid ${gold}60`,
                                  color: isDark ? gold : "#B8860B",
                                }}
                              >
                                {product.badge}
                              </div>
                            )}

                            {/* Edge to Edge Image */}
                            <img
                              src={displayImg}
                              alt={product.title}
                              className={`w-full h-full object-cover ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
                            />

                            {/* Wishlist btn */}
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
                                style={{
                                  color: isWished ? "#FF0000" : textSec,
                                }}
                                fill={isWished ? "#FF0000" : "none"}
                              />
                            </button>
                          </div>

                          {/* Info + action buttons */}
                          <div
                            className="flex flex-col"
                            style={{ borderTop: `1px solid ${border}` }}
                          >
                            {/* Text */}
                            <div className="px-3 pt-3 pb-2.5 flex flex-col gap-1">
                              <span
                                className="text-[9px] font-bold tracking-[0.3em] uppercase"
                                style={{ color: isDark ? gold : "#B8860B" }}
                              >
                                {product.brand}
                              </span>
                              <h3
                                className={`text-[12px] font-medium leading-snug line-clamp-2 ${isOutOfStock ? "opacity-50" : ""}`}
                                style={{ color: textPri }}
                              >
                                {product.title}
                              </h3>
                              <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                                <span
                                  className="cat-serif text-[15px] font-semibold"
                                  style={{ color: textPri }}
                                >
                                  ₹{product.price?.toLocaleString()}
                                </span>
                                {product.originalPrice > product.price && (
                                  <span
                                    className="text-[11px] line-through font-medium"
                                    style={{ color: textSec }}
                                  >
                                    ₹{product.originalPrice?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* CTA buttons */}
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
                                    onClick={(e) => handleAddToCart(e, product)}
                                    className="btn-cart-hover w-full lg:flex-1 flex items-center justify-center gap-1.5 py-2.5 lg:py-3 text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-200 border-b lg:border-b-0 lg:border-r"
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
          )}
        </div>
      </div>
    </>
  );
}