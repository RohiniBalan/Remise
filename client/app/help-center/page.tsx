"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Rocket,
  ScanLine,
  Store,
  Package,
  Truck,
  Home as HomeIcon,
  CreditCard,
  ShieldCheck,
  Headphones,
  Mic,
  QrCode,
  Banknote,
  Landmark,
  ShoppingBag,
  MapPin,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  SearchX,
} from "lucide-react";

// Adjust this import path to wherever NavbarHome actually lives in your project.
// It's the same navbar used across the rest of the site (Home, /services, etc.)
import NavbarHome from "@/app/components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";

// ─────────────────────────────────────────────────────────────────────────
// Brand tokens (lifted straight from NavbarHome so this page drops in
// seamlessly next to the rest of the site)
// ─────────────────────────────────────────────────────────────────────────
// red        #FF0000  |  red hover   #e00000  |  red deep (gradients) #b30000
// red tint   #FFE5E5  |  red border  #FFD1D1  |  dark-mode red accent #FF6B6B
// navy       #0f172a  |  navy border #2d3748  |  light surface        #F5F5F5

// Shared focus style so keyboard focus rings use the brand red instead of
// the browser's default blue outline.
const FOCUS_RING =
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0000]";

type FAQItem = { q: string; a: string };
type FAQSection = {
  id: string;
  title: string;
  blurb: string;
  icon: React.ElementType;
  items: FAQItem[];
};

const FAQ_SECTIONS: FAQSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    blurb: "Create your account and find your way around.",
    icon: Rocket,
    items: [
      {
        q: "What is Remise?",
        a: "Remise is an e-commerce and local shopping platform that connects customers with nearby stores, wholesalers, and home businesses. Search for products, compare prices from nearby sellers, choose a store, select a delivery method, and place an order.",
      },
      {
        q: "How do I create an account?",
        a: "Select Sign Up, enter your required details, verify your email or mobile number if requested, and complete your profile.",
      },
      {
        q: "What types of accounts are available?",
        a: "Customer, Store Owner, Wholesaler, and Home Business. Each account type has different features and pricing options.",
      },
    ],
  },
  {
    id: "finding-products",
    title: "Finding Products",
    blurb: "Search, speak, or scan — however you shop.",
    icon: Search,
    items: [
      {
        q: "How can I find a product?",
        a: "You can search for products using the search bar or browse categories.",
      },
      {
        q: "Can I search using my voice?",
        a: "Yes. Where voice search is available, tap the microphone icon and speak the product name or your requirements.",
      },
      {
        q: "Can I scan a product list?",
        a: "Yes. The product scanning feature allows you to scan or upload a list containing multiple products. Remise identifies the products and helps you add them to your order.",
      },
    ],
  },
  {
    id: "comparing-stores",
    title: "Comparing Nearby Stores",
    blurb: "Let Remise find the best price close to you.",
    icon: Store,
    items: [
      {
        q: "How does store comparison work?",
        a: "You provide your required products and select the distance within which Remise should search for stores. Remise then compares available nearby stores based on product availability and total price. You can select the store that best suits your requirements.",
      },
      {
        q: "Can I choose how far Remise searches?",
        a: "Yes. You can select the preferred search distance in kilometres before comparing stores.",
      },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    blurb: "From cart to confirmation.",
    icon: Package,
    items: [
      {
        q: "Can I cancel an order?",
        a: "Cancellation depends on the order status and the applicable store cancellation policy. If cancellation is available, the option will be displayed in your order details.",
      },
    ],
  },
  {
    id: "account-security",
    title: "Account & Security",
    blurb: "Keep your details up to date and protected.",
    icon: ShieldCheck,
    items: [
      {
        q: "What can I manage in my account?",
        a: "Profile information, addresses, password, email or mobile information, and account settings.",
      },
      {
        q: "Is it safe to share my password or OTP?",
        a: "Never share your password, OTP, or authentication credentials with anyone.",
      },
    ],
  },
];

const ORDER_STEPS = [
  { title: "Enter or scan your product list", icon: ScanLine },
  { title: "Select the search distance", icon: MapPin },
  { title: "Compare nearby stores", icon: Store },
  { title: "Select a store", icon: CheckCircle2 },
  { title: "Select your delivery method", icon: Truck },
  { title: "Select your payment method", icon: CreditCard },
  { title: "Confirm your order", icon: Package },
];

const DELIVERY_OPTIONS = [
  {
    title: "Self Pickup",
    icon: Store,
    desc: "Visit the selected store and collect your order.",
  },
  {
    title: "Home Delivery",
    icon: Truck,
    desc: "The selected store prepares and delivers the order to your specified address.",
  },
];

const PAYMENT_METHODS = [
  { title: "UPI / QR payment", icon: QrCode },
  { title: "Online payment gateway", icon: CreditCard },
  { title: "Cash", icon: Banknote },
];

const PAYMENT_NOTE =
  "Always verify the payment amount and recipient details before completing a payment. For QR payments, the applicable store's payment QR code may be displayed during checkout.";

const SELLER_FEATURES = [
  "Create and manage their store",
  "Add products manually",
  "Scan products",
  "Bulk scan product lists",
  "Manage stock",
  "Set product prices",
  "Manage customer / store-owner pricing where applicable",
  "Manage UPI / payment details",
  "Receive customer orders",
  "Manage order status",
];

const CATEGORIES = [
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "finding-products", label: "Finding Products", icon: Search },
  { id: "comparing-stores", label: "Comparing Stores", icon: Store },
  { id: "orders", label: "Orders", icon: Package },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "sellers", label: "For Sellers", icon: Landmark },
  { id: "account-security", label: "Account & Security", icon: ShieldCheck },
  { id: "support", label: "Contact Support", icon: Headphones },
];

// ─────────────────────────────────────────────────────────────────────────
// Small building blocks
// ─────────────────────────────────────────────────────────────────────────

function AccordionRow({
  item,
  isOpen,
  onToggle,
  isLight,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  isLight: boolean;
}) {
  return (
    <div
      className={`border-b last:border-b-0 ${isLight ? "border-[#FFD1D1]/60" : "border-white/10"}`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-4 text-left py-4 px-1 sm:px-2 transition-colors rounded-md ${FOCUS_RING} ${isLight ? "text-gray-800 hover:text-[#FF0000]" : "text-gray-200 hover:text-[#FF6B6B]"
          }`}
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-[15px] font-semibold leading-snug">{item.q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#FF0000]" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p
              className={`px-1 sm:px-2 pb-4 text-sm leading-relaxed ${isLight ? "text-gray-600" : "text-gray-400"}`}
            >
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionShell({
  id,
  title,
  blurb,
  icon: Icon,
  isLight,
  children,
  sectionRef,
}: {
  id: string;
  title: string;
  blurb: string;
  icon: React.ElementType;
  isLight: boolean;
  children: React.ReactNode;
  sectionRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div id={id} ref={sectionRef} className="scroll-mt-48">
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"
            }`}
        >
          <Icon size={20} />
        </div>
        <div>
          <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>
            {title}
          </h2>
          <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? "text-gray-500" : "text-gray-400"}`}>{blurb}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hero illustration — a small self-contained scene (store, phone + pin,
// delivery scooter) built from primitive shapes so no external image
// assets are required. One orchestrated entrance, then a single gentle
// idle loop on the scooter — not a fade-up-everything effect.
// ─────────────────────────────────────────────────────────────────────────
function HeroIllustration() {
  return (
    <motion.svg
      viewBox="0 0 480 360"
      className="w-full max-w-md mx-auto"
      initial="hidden"
      animate="show"
    >
      <defs>
        <linearGradient id="hc-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF0000" />
          <stop offset="100%" stopColor="#b30000" />
        </linearGradient>
      </defs>

      {/* ground */}
      <motion.ellipse
        cx="240" cy="300" rx="190" ry="16"
        fill="#ffffff" opacity="0.06"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* store */}
      <motion.g
        variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <rect x="60" y="150" width="150" height="110" rx="8" fill="url(#hc-red)" />
        <rect x="60" y="150" width="150" height="26" rx="8" fill="#FF0000" />
        <rect x="90" y="196" width="34" height="34" rx="4" fill="#ffffff" opacity="0.9" />
        <rect x="146" y="196" width="34" height="34" rx="4" fill="#ffffff" opacity="0.9" />
        <rect x="118" y="240" width="34" height="20" rx="2" fill="#0f172a" opacity="0.4" />
      </motion.g>

      {/* phone with pin (search / find nearby) */}
      <motion.g
        variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <rect x="250" y="90" width="90" height="150" rx="16" fill="#ffffff" opacity="0.08" />
        <rect x="262" y="106" width="66" height="118" rx="6" fill="#0f172a" opacity="0.5" />
        <circle cx="295" cy="150" r="16" fill="#FF0000" />
        <path d="M295 138 a12 12 0 0 1 12 12 c0 8 -12 22 -12 22 s-12 -14 -12 -22 a12 12 0 0 1 12 -12z" fill="#FF0000" />
        <circle cx="295" cy="150" r="5" fill="#ffffff" />
      </motion.g>

      {/* delivery scooter — idle float loop */}
      <motion.g
        variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="330" y="210" width="70" height="30" rx="10" fill="#ffffff" opacity="0.9" />
          <rect x="345" y="188" width="26" height="26" rx="6" fill="#FF0000" />
          <circle cx="345" cy="252" r="12" fill="#0f172a" opacity="0.6" />
          <circle cx="405" cy="252" r="12" fill="#0f172a" opacity="0.6" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────
export default function HelpCenterPage() {
  // This page owns its own theme state and feeds it to NavbarHome, the same
  // way every other page in the site does.
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const isLight = theme === "light";

  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("getting-started-0");

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const normalizedQuery = query.trim().toLowerCase();
  const matches = (texts: string[]) =>
    !normalizedQuery || texts.some((t) => t.toLowerCase().includes(normalizedQuery));

  // FAQ-style sections: narrow down to matching Q&A pairs
  const filteredFaqSections = useMemo(() => {
    if (!normalizedQuery) return FAQ_SECTIONS;
    return FAQ_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => matches([item.q, item.a])),
    })).filter((section) => section.items.length > 0);
  }, [normalizedQuery]);

  // Card / list sections: narrow down to matching cards, same query
  const deliveryFiltered = useMemo(
    () => DELIVERY_OPTIONS.filter((o) => matches([o.title, o.desc])),
    [normalizedQuery],
  );
  const paymentMethodsFiltered = useMemo(
    () => PAYMENT_METHODS.filter((m) => matches([m.title])),
    [normalizedQuery],
  );
  const paymentNoteVisible = matches([PAYMENT_NOTE]);
  const sellerFeaturesFiltered = useMemo(
    () => SELLER_FEATURES.filter((f) => matches([f])),
    [normalizedQuery],
  );
  const orderStepsFiltered = useMemo(
    () => ORDER_STEPS.filter((s) => matches([s.title])),
    [normalizedQuery],
  );

  const gettingStartedSection = filteredFaqSections.find((s) => s.id === "getting-started");
  const findingProductsSection = filteredFaqSections.find((s) => s.id === "finding-products");
  const comparingStoresSection = filteredFaqSections.find((s) => s.id === "comparing-stores");
  const ordersFaqSection = filteredFaqSections.find((s) => s.id === "orders");
  const accountSection = filteredFaqSections.find((s) => s.id === "account-security");

  const ordersVisible = orderStepsFiltered.length > 0 || Boolean(ordersFaqSection);
  const deliveryVisible = deliveryFiltered.length > 0;
  const paymentsVisible = paymentMethodsFiltered.length > 0 || paymentNoteVisible;
  const sellersVisible = sellerFeaturesFiltered.length > 0;

  const anyVisible =
    Boolean(gettingStartedSection) ||
    Boolean(findingProductsSection) ||
    Boolean(comparingStoresSection) ||
    ordersVisible ||
    deliveryVisible ||
    paymentsVisible ||
    sellersVisible ||
    Boolean(accountSection);

  const noResults = normalizedQuery.length > 0 && !anyVisible;

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={isLight ? "bg-white" : "bg-[#0f172a]"}>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      {/* Spacer for the fixed navbar (announcement strip + header + category strip) */}
      <div className="pt-16 sm:pt-28 lg:pt-36" />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0f172a]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 15% 20%, rgba(255,0,0,0.35), transparent 60%), radial-gradient(500px circle at 85% 80%, rgba(255,0,0,0.18), transparent 55%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-14 sm:pb-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#FF6B6B] bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-5">
              <Headphones size={13} /> We're here to help
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
              Help Center
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-300 max-w-md leading-relaxed">
              Answers on shopping, stores, products, orders, payments, delivery, and your
              account — all in one place.
            </p>

            {/* Search — same red-button pattern as the navbar's product search */}
            <div className="mt-7 max-w-md">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex items-center w-full rounded-xl border-2 border-white/10 focus-within:border-[#FF0000] bg-white/5 overflow-hidden transition-colors"
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search for a topic, e.g. “cancel order”"
                  className="flex-1 px-4 py-3 text-sm bg-transparent outline-none text-white placeholder-gray-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className={`px-3 text-xs font-semibold text-gray-400 hover:text-white transition rounded-md ${FOCUS_RING}`}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Search"
                  className={`px-4 py-3 bg-[#FF0000] hover:bg-[#e00000] text-white transition shrink-0 ${FOCUS_RING}`}
                >
                  <Search size={18} />
                </button>
              </form>
              {normalizedQuery && !noResults && (
                <p className="mt-2 text-xs text-gray-400">
                  Showing results for “{query.trim()}”
                </p>
              )}
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      {/* ── Category chips ──────────────────────────────────────────── */}
      <div
        className={`sticky top-16 sm:top-28 lg:top-36 z-20 border-b backdrop-blur ${isLight ? "bg-white/90 border-[#FFD1D1]" : "bg-[#0f172a]/90 border-white/10"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${FOCUS_RING} ${isLight
                  ? "border-[#FFD1D1] text-gray-600 hover:border-[#FF0000] hover:text-[#FF0000] hover:bg-[#FFE5E5]"
                  : "border-white/10 text-gray-300 hover:border-[#FF0000] hover:text-[#FF6B6B] hover:bg-white/5"
                  }`}
              >
                <cat.icon size={13} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* No-results state */}
        {noResults && (
          <div className="text-center py-10">
            <SearchX size={34} className={`mx-auto mb-3 ${isLight ? "text-gray-300" : "text-gray-600"}`} />
            <p className={`font-semibold ${isLight ? "text-gray-700" : "text-gray-300"}`}>
              No results for “{query}”
            </p>
            <p className={`text-sm mt-1 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
              Try a different word, or browse a topic below.
            </p>
          </div>
        )}

        {/* Getting Started */}
        {gettingStartedSection && (
          <SectionShell
            id="getting-started"
            sectionRef={(el) => { sectionRefs.current["getting-started"] = el; }}
            title="Getting Started"
            blurb="Create your account and find your way around."
            icon={Rocket}
            isLight={isLight}
          >
            {!normalizedQuery && (
              <div className="grid sm:grid-cols-4 gap-2.5 mb-5">
                {[
                  { label: "Customer", icon: ShoppingBag },
                  { label: "Store Owner", icon: Store },
                  { label: "Wholesaler", icon: Landmark },
                  { label: "Home Business", icon: HomeIcon },
                ].map((t) => (
                  <div
                    key={t.label}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border py-4 text-center ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"
                      }`}
                  >
                    <t.icon size={18} className="text-[#FF0000]" />
                    <span className={`text-xs font-semibold ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className={`rounded-2xl border px-3 sm:px-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
              {gettingStartedSection.items.map((item, i) => (
                <AccordionRow
                  key={item.q}
                  item={item}
                  isLight={isLight}
                  isOpen={openId === `getting-started-${i}`}
                  onToggle={() => setOpenId((cur) => (cur === `getting-started-${i}` ? null : `getting-started-${i}`))}
                />
              ))}
            </div>
          </SectionShell>
        )}

        {/* Finding Products */}
        {findingProductsSection && (
          <SectionShell
            id="finding-products"
            sectionRef={(el) => { sectionRefs.current["finding-products"] = el; }}
            title="Finding Products"
            blurb="Search, speak, or scan — however you shop."
            icon={Search}
            isLight={isLight}
          >
            {!normalizedQuery && (
              <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"}`}>
                  <Mic size={17} className="text-[#FF0000] shrink-0" />
                  <span className={`text-xs font-medium ${isLight ? "text-gray-600" : "text-gray-300"}`}>
                    Tap the mic to search by voice
                  </span>
                </div>
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"}`}>
                  <ScanLine size={17} className="text-[#FF0000] shrink-0" />
                  <span className={`text-xs font-medium ${isLight ? "text-gray-600" : "text-gray-300"}`}>
                    Scan or upload a product list
                  </span>
                </div>
              </div>
            )}
            <div className={`rounded-2xl border px-3 sm:px-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
              {findingProductsSection.items.map((item, i) => (
                <AccordionRow
                  key={item.q}
                  item={item}
                  isLight={isLight}
                  isOpen={openId === `finding-products-${i}`}
                  onToggle={() => setOpenId((cur) => (cur === `finding-products-${i}` ? null : `finding-products-${i}`))}
                />
              ))}
            </div>
          </SectionShell>
        )}

        {/* Comparing Nearby Stores */}
        {comparingStoresSection && (
          <SectionShell
            id="comparing-stores"
            sectionRef={(el) => { sectionRefs.current["comparing-stores"] = el; }}
            title="Comparing Nearby Stores"
            blurb="Let Remise find the best price close to you."
            icon={Store}
            isLight={isLight}
          >
            <div className={`rounded-2xl border px-3 sm:px-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
              {comparingStoresSection.items.map((item, i) => (
                <AccordionRow
                  key={item.q}
                  item={item}
                  isLight={isLight}
                  isOpen={openId === `comparing-stores-${i}`}
                  onToggle={() => setOpenId((cur) => (cur === `comparing-stores-${i}` ? null : `comparing-stores-${i}`))}
                />
              ))}
            </div>
          </SectionShell>
        )}

        {/* Orders — includes the numbered process, a genuine sequence */}
        {ordersVisible && (
          <SectionShell
            id="orders"
            sectionRef={(el) => { sectionRefs.current["orders"] = el; }}
            title="Orders"
            blurb="From cart to confirmation."
            icon={Package}
            isLight={isLight}
          >
            {orderStepsFiltered.length > 0 && (
              <div className="mb-6">
                <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                  How do I place an order?
                </p>
                <ol className="grid sm:grid-cols-2 gap-2.5">
                  {orderStepsFiltered.map((step) => {
                    const stepNumber = ORDER_STEPS.indexOf(step) + 1;
                    return (
                      <li
                        key={step.title}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"
                          }`}
                      >
                        <span className="shrink-0 w-7 h-7 rounded-full bg-[#FF0000] text-white text-xs font-bold flex items-center justify-center">
                          {stepNumber}
                        </span>
                        <span className={`text-sm font-medium ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                          {step.title}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            {ordersFaqSection && (
              <div className={`rounded-2xl border px-3 sm:px-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
                {ordersFaqSection.items.map((item, i) => (
                  <AccordionRow
                    key={item.q}
                    item={item}
                    isLight={isLight}
                    isOpen={openId === `orders-${i}`}
                    onToggle={() => setOpenId((cur) => (cur === `orders-${i}` ? null : `orders-${i}`))}
                  />
                ))}
              </div>
            )}
          </SectionShell>
        )}

        {/* Delivery */}
        {deliveryVisible && (
          <SectionShell
            id="delivery"
            sectionRef={(el) => { sectionRefs.current["delivery"] = el; }}
            title="Delivery"
            blurb="Pick up yourself, or have it brought to you."
            icon={Truck}
            isLight={isLight}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {deliveryFiltered.map((opt) => (
                <div
                  key={opt.title}
                  className={`rounded-2xl border p-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"}`}>
                    <opt.icon size={18} />
                  </div>
                  <p className={`font-bold text-sm mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>{opt.title}</p>
                  <p className={`text-xs leading-relaxed ${isLight ? "text-gray-500" : "text-gray-400"}`}>{opt.desc}</p>
                </div>
              ))}
            </div>
            {!normalizedQuery && (
              <p className={`text-xs mt-3 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                Delivery availability, charges, and estimated delivery time may vary by store and location.
              </p>
            )}
          </SectionShell>
        )}

        {/* Payments */}
        {paymentsVisible && (
          <SectionShell
            id="payments"
            sectionRef={(el) => { sectionRefs.current["payments"] = el; }}
            title="Payments"
            blurb="Pay the way that suits you."
            icon={CreditCard}
            isLight={isLight}
          >
            {paymentMethodsFiltered.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {paymentMethodsFiltered.map((m) => (
                  <div
                    key={m.title}
                    className={`flex flex-col items-center text-center gap-2 rounded-2xl border p-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"}`}>
                      <m.icon size={18} />
                    </div>
                    <p className={`text-xs font-semibold ${isLight ? "text-gray-700" : "text-gray-300"}`}>{m.title}</p>
                  </div>
                ))}
              </div>
            )}
            {paymentNoteVisible && (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#FF0000]/25 bg-[#FF0000]/[0.06] px-4 py-3">
                <Lock size={15} className="text-[#FF0000] mt-0.5 shrink-0" />
                <p className={`text-xs leading-relaxed ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                  <span className="font-bold">Important:</span> {PAYMENT_NOTE}
                </p>
              </div>
            )}
          </SectionShell>
        )}

        {/* For Sellers */}
        {sellersVisible && (
          <SectionShell
            id="sellers"
            sectionRef={(el) => { sectionRefs.current["sellers"] = el; }}
            title="Store Owner / Seller Help"
            blurb="Everything store owners, wholesalers, and home businesses can do."
            icon={Landmark}
            isLight={isLight}
          >
            <div className={`rounded-2xl border p-5 sm:p-6 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {sellerFeaturesFiltered.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-[#FF0000] mt-0.5 shrink-0" />
                    <span className={`text-sm ${isLight ? "text-gray-700" : "text-gray-300"}`}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {/* Account & Security */}
        {accountSection && (
          <SectionShell
            id="account-security"
            sectionRef={(el) => { sectionRefs.current["account-security"] = el; }}
            title="Account & Security"
            blurb="Keep your details up to date and protected."
            icon={ShieldCheck}
            isLight={isLight}
          >
            <div className={`rounded-2xl border px-3 sm:px-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
              {accountSection.items.map((item, i) => (
                <AccordionRow
                  key={item.q}
                  item={item}
                  isLight={isLight}
                  isOpen={openId === `account-security-${i}`}
                  onToggle={() => setOpenId((cur) => (cur === `account-security-${i}` ? null : `account-security-${i}`))}
                />
              ))}
            </div>
          </SectionShell>
        )}

        {/* Contact Support CTA — always shown, even mid-search */}
        <div
          id="support"
          ref={(el) => { sectionRefs.current["support"] = el; }}
          className="scroll-mt-48 relative overflow-hidden rounded-3xl border border-white/10"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #FF0000 0%, #b30000 55%, #0f172a 100%)",
            }}
          />
          <div className="relative px-6 sm:px-10 py-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/80 mb-3">
                <Headphones size={13} /> Still need help?
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-snug max-w-md">
                Contact support with your order ID and we'll take it from there.
              </h3>
              <p className="text-sm text-white/80 mt-2 max-w-md">
                Reach us through the support channel inside the app — include your order ID or
                relevant details whenever possible.
              </p>
            </div>
            <Link
              href="/services"
              className={`shrink-0 inline-flex items-center gap-2 bg-white text-[#0f172a] font-bold text-sm px-5 py-3 rounded-xl hover:bg-white/90 transition ${FOCUS_RING}`}
            >
              <Mail size={16} /> Get in touch <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Hide the category-chip scrollbar without needing a Tailwind plugin */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <FooterComponent theme={theme} />
    </div>
  );
}