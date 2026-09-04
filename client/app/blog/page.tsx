"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";
import {
    Search,
    Bell,
    Sparkles,
    ShoppingBag,
    Building2,
    Cpu,
    Lightbulb,
    Megaphone,
    Newspaper,
    ArrowRight,
    Clock,
    Mail,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONTENT                                                            */
/*  Data-driven so copy/articles can be swapped for real CMS content   */
/*  without touching markup. Replace ARTICLES with live posts, and     */
/*  make sure "featured" always reflects the actual latest/pinned      */
/*  post rather than a hardcoded one.                                  */
/* ------------------------------------------------------------------ */

type Category =
    | "All"
    | "Shopping Tips"
    | "Business"
    | "Technology"
    | "Remise News"
    | "Offers";

const CATEGORIES: Category[] = [
    "All",
    "Shopping Tips",
    "Business",
    "Technology",
    "Remise News",
    "Offers",
];

const CATEGORY_ICON: Record<Category, React.ComponentType<{ className?: string }>> = {
    All: Sparkles,
    "Shopping Tips": ShoppingBag,
    Business: Building2,
    Technology: Cpu,
    "Remise News": Newspaper,
    Offers: Megaphone,
};

type Article = {
    id: string;
    category: Category;
    title: string;
    excerpt: string;
    readTime: string;
    date: string;
    featured?: boolean;
};

const ARTICLES: Article[] = [
    {
        id: "making-local-shopping-smarter",
        category: "Remise News",
        title: "Making Local Shopping Smarter",
        excerpt:
            "Discover how Remise brings customers and local businesses together, helping shoppers find products, compare options, and choose where to buy.",
        readTime: "5 min read",
        date: "September 2026",
        featured: true,
    },
    {
        id: "compare-prices-before-you-buy",
        category: "Shopping Tips",
        title: "How to Compare Prices Before You Buy",
        excerpt: "Five practical habits that make it easier to spot a genuinely good deal nearby.",
        readTime: "4 min read",
        date: "August 2026",
    },
    {
        id: "ai-modern-shopping",
        category: "Technology",
        title: "How Technology Is Changing Local Shopping",
        excerpt: "A look at scanning, search, and discovery tools quietly reshaping how people shop nearby.",
        readTime: "6 min read",
        date: "August 2026",
    },
    {
        id: "grow-your-business-online",
        category: "Business",
        title: "Growing Your Local Business Online",
        excerpt: "Simple, practical steps for store owners and home businesses building a digital presence.",
        readTime: "5 min read",
        date: "July 2026",
    },
    {
        id: "whats-new-in-remise",
        category: "Remise News",
        title: "What's New in Remise",
        excerpt: "Recent additions to the platform, in plain language, with no changelog jargon.",
        readTime: "3 min read",
        date: "July 2026",
    },
    {
        id: "product-scanning-explained",
        category: "Technology",
        title: "Product Scanning, Explained",
        excerpt: "How scanning a product or list helps you find it at nearby stores in seconds.",
        readTime: "4 min read",
        date: "June 2026",
    },
    {
        id: "managing-inventory-digitally",
        category: "Business",
        title: "Managing Products and Inventory Digitally",
        excerpt: "Why keeping stock and pricing current online matters more than it seems.",
        readTime: "5 min read",
        date: "June 2026",
    },
    {
        id: "finding-products-near-you",
        category: "Shopping Tips",
        title: "Tips for Finding Products Near You",
        excerpt: "Search habits that narrow results fast when you know roughly what you want.",
        readTime: "3 min read",
        date: "May 2026",
    },
];

const UPDATES = [
    {
        icon: Sparkles,
        tag: "New feature",
        text: "Product list scanning is now available.",
    },
    {
        icon: Bell,
        tag: "Update",
        text: "Store comparison now shows total pricing at a glance.",
    },
    {
        icon: Megaphone,
        tag: "Announcement",
        text: "New businesses are joining Remise every week.",
    },
];

const BUSINESS_TOPICS = [
    { icon: Building2, title: "Grow Your Business", desc: "Reach more customers with a clear digital storefront." },
    { icon: Cpu, title: "Manage Your Products", desc: "Keep listings, pricing, and stock accurate with less effort." },
    { icon: Megaphone, title: "Reach Local Customers", desc: "Show up for the shoppers already searching nearby." },
];

/* ------------------------------------------------------------------ */
/*  SMALL VISUAL PIECES                                                */
/*  Custom flat SVG marks, in the same red/black gradient language as  */
/*  the About page — kept consistent instead of stock photography.     */
/* ------------------------------------------------------------------ */

function ArticleMark({
    variant,
    isDarkMode,
}: {
    variant: Category;
    isDarkMode: boolean;
}) {
    const bg = isDarkMode ? "#0a0a0a" : "#fff";
    const common = (
        <>
            <defs>
                <linearGradient id={`mark-${variant}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <rect width="320" height="200" fill={bg} />
        </>
    );

    switch (variant) {
        case "Shopping Tips":
            return (
                <svg viewBox="0 0 320 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {common}
                    <circle cx="160" cy="100" r="70" fill={`url(#mark-${variant})`} opacity="0.1" />
                    <path d="M120 90h80l-8 60a10 10 0 0 1-10 9h-44a10 10 0 0 1-10-9Z" fill={`url(#mark-${variant})`} opacity="0.9" />
                    <path d="M136 90v-14a24 24 0 0 1 48 0v14" fill="none" stroke={`url(#mark-${variant})`} strokeWidth="6" strokeLinecap="round" />
                    <circle cx="150" cy="112" r="4" fill={bg} />
                    <circle cx="170" cy="112" r="4" fill={bg} />
                </svg>
            );
        case "Business":
            return (
                <svg viewBox="0 0 320 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {common}
                    <rect x="110" y="70" width="100" height="70" rx="6" fill={`url(#mark-${variant})`} opacity="0.85" />
                    <rect x="122" y="82" width="18" height="18" fill={bg} opacity="0.8" />
                    <rect x="151" y="82" width="18" height="18" fill={bg} opacity="0.5" />
                    <rect x="180" y="82" width="18" height="18" fill={bg} opacity="0.8" />
                    <rect x="122" y="108" width="18" height="18" fill={bg} opacity="0.5" />
                    <rect x="151" y="108" width="18" height="18" fill={bg} opacity="0.8" />
                    <rect x="180" y="108" width="18" height="18" fill={bg} opacity="0.5" />
                    <rect x="140" y="46" width="40" height="24" rx="3" fill={`url(#mark-${variant})`} opacity="0.5" />
                </svg>
            );
        case "Technology":
            return (
                <svg viewBox="0 0 320 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {common}
                    <rect x="118" y="66" width="84" height="60" rx="8" fill="none" stroke={`url(#mark-${variant})`} strokeWidth="4" />
                    <circle cx="160" cy="96" r="18" fill={`url(#mark-${variant})`} opacity="0.85" />
                    <path d="M160 78v-14M160 128v-14M138 96h-14M196 96h-14" stroke={`url(#mark-${variant})`} strokeWidth="4" strokeLinecap="round" />
                </svg>
            );
        case "Remise News":
            return (
                <svg viewBox="0 0 320 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {common}
                    <rect x="104" y="64" width="112" height="76" rx="6" fill={`url(#mark-${variant})`} opacity="0.12" />
                    <rect x="118" y="80" width="60" height="8" rx="2" fill={`url(#mark-${variant})`} />
                    <rect x="118" y="96" width="84" height="5" rx="2" fill={`url(#mark-${variant})`} opacity="0.5" />
                    <rect x="118" y="108" width="84" height="5" rx="2" fill={`url(#mark-${variant})`} opacity="0.5" />
                    <rect x="118" y="120" width="56" height="5" rx="2" fill={`url(#mark-${variant})`} opacity="0.5" />
                    <circle cx="196" cy="84" r="6" fill={`url(#mark-${variant})`} />
                </svg>
            );
        case "Offers":
            return (
                <svg viewBox="0 0 320 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {common}
                    <path d="M112 100l30-30h56l30 30-30 30h-56Z" fill={`url(#mark-${variant})`} opacity="0.85" />
                    <circle cx="160" cy="100" r="10" fill={bg} />
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 320 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {common}
                    <circle cx="160" cy="100" r="46" fill={`url(#mark-${variant})`} opacity="0.85" />
                </svg>
            );
    }
}

function FeaturedMark({ isDarkMode }: { isDarkMode: boolean }) {
    const bg = isDarkMode ? "#0a0a0a" : "#fff";
    return (
        <svg viewBox="0 0 480 340" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="featGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <rect width="480" height="340" fill={bg} />
            <circle cx="240" cy="170" r="150" fill="url(#featGrad)" opacity="0.1" />
            <path d="M150 210 L240 130 L330 210 Z" fill="url(#featGrad)" opacity="0.9" />
            <rect x="168" y="210" width="144" height="86" rx="6" fill="url(#featGrad)" />
            <rect x="184" y="234" width="40" height="62" rx="3" fill={bg} opacity="0.85" />
            <rect x="236" y="234" width="76" height="26" rx="3" fill={bg} opacity="0.5" />
            <circle cx="336" cy="118" r="26" fill="none" stroke="url(#featGrad)" strokeWidth="4" />
            <path d="M336 104v14l10 8" stroke="url(#featGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
    );
}

function NewsletterMark() {
    return (
        <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="nlGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <rect x="35" y="60" width="130" height="90" rx="8" fill="none" stroke="url(#nlGrad)" strokeWidth="5" />
            <path d="M35 66l65 46 65-46" fill="none" stroke="url(#nlGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  BLOGS & NEWS PAGE                                                  */
/* ------------------------------------------------------------------ */

export default function BlogsNewsPage() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const isDarkMode = theme === "dark";
    const [activeCategory, setActiveCategory] = useState<Category>("All");
    const [query, setQuery] = useState("");
    const [visibleCount, setVisibleCount] = useState(4);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        window.dispatchEvent(new CustomEvent("themeChange", { detail: { theme: newTheme } }));
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "dark" | "light";
        if (savedTheme) setTheme(savedTheme);
        const handleThemeChange = (e: CustomEvent) => {
            if (e.detail?.theme) setTheme(e.detail.theme);
        };
        window.addEventListener("themeChange" as any, handleThemeChange);
        return () => window.removeEventListener("themeChange" as any, handleThemeChange);
    }, []);

    const cardBase = isDarkMode
        ? "bg-neutral-950/80 border-[#FF0000]/20"
        : "bg-white border-[#FF3333]/30";

    const eyebrowColor = isDarkMode ? "text-[#FF0000]/80" : "text-[#990000]";
    const mutedText = isDarkMode ? "text-gray-400" : "text-slate-600";

    const featured = useMemo(() => ARTICLES.find((a) => a.featured) ?? ARTICLES[0], []);

    const filtered = useMemo(() => {
        return ARTICLES.filter((a) => {
            if (a.id === featured.id) return false;
            const matchesCategory = activeCategory === "All" || a.category === activeCategory;
            const matchesQuery =
                query.trim() === "" ||
                a.title.toLowerCase().includes(query.toLowerCase()) ||
                a.excerpt.toLowerCase().includes(query.toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [activeCategory, query, featured]);

    const shoppingHighlight = ARTICLES.find((a) => a.id === "compare-prices-before-you-buy")!;

    return (
        <div
            className={`relative min-h-screen flex flex-col transition-colors duration-500 overflow-x-hidden ${isDarkMode
                    ? "bg-black text-white selection:bg-[#FF0000]/30 selection:text-[#FF9999]"
                    : "bg-slate-50 text-slate-900 selection:bg-[#FF0000]/30 selection:text-[#660000]"
                }`}
        >
            {/* Ambient glow, consistent with the rest of the site */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div
                    className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl ${isDarkMode
                            ? "bg-[radial-gradient(circle,rgba(255,0,0,0.10)_0%,transparent_70%)]"
                            : "bg-[radial-gradient(circle,rgba(255,0,0,0.15)_0%,transparent_70%)]"
                        }`}
                />
                <div
                    className={`absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full blur-3xl ${isDarkMode
                            ? "bg-[radial-gradient(circle,rgba(178,0,0,0.08)_0%,transparent_70%)]"
                            : "bg-[radial-gradient(circle,rgba(178,0,0,0.15)_0%,transparent_70%)]"
                        }`}
                />
            </div>

            <Navbar theme={theme} toggleTheme={toggleTheme} />

            <div className="relative z-10 flex-grow pt-[80px] sm:pt-[112px] lg:pt-[152px] pb-16 px-4 md:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* PAGE TITLE + SEARCH */}
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                                    <Newspaper className="w-4 h-4 text-white" />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                    Blogs & News
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
                                Stories from Remise
                            </h1>
                            <p className={`text-sm sm:text-base font-medium max-w-xl ${mutedText}`}>
                                Shopping tips, product updates, and news from the local businesses
                                building on Remise.
                            </p>
                        </div>
                        <div className="w-full lg:w-72">
                            <div
                                className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${isDarkMode ? "bg-neutral-950/80 border-[#FF0000]/20" : "bg-white border-[#FF3333]/30"
                                    }`}
                            >
                                <Search className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search articles..."
                                    className={`w-full bg-transparent outline-none text-sm ${isDarkMode ? "placeholder:text-gray-600" : "placeholder:text-slate-400"
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* CATEGORY NAV */}
                    <div className="flex flex-wrap gap-2.5 mb-14">
                        {CATEGORIES.map((cat) => {
                            const Icon = CATEGORY_ICON[cat];
                            const active = activeCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all duration-300 ${active
                                            ? "bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] text-black border-transparent shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                                            : isDarkMode
                                                ? "border-[#FF0000]/20 text-gray-300 hover:border-[#FF0000]/50"
                                                : "border-[#FF3333]/30 text-slate-700 hover:border-[#FF0000]"
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    {/* FEATURED STORY */}
                    <div className={`rounded-3xl overflow-hidden border backdrop-blur-xl mb-20 sm:mb-24 grid lg:grid-cols-2 ${cardBase}`}>
                        <div className="aspect-video lg:aspect-auto lg:h-full min-h-[220px]">
                            <FeaturedMark isDarkMode={isDarkMode} />
                        </div>
                        <div className="p-8 sm:p-10 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-4">
                                <span
                                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full ${isDarkMode ? "bg-[#FF0000]/10 text-[#FF3333]" : "bg-[#FFCCCC] text-[#990000]"
                                        }`}
                                >
                                    Featured
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${mutedText}`}>
                                    {featured.category}
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">{featured.title}</h2>
                            <p className={`text-sm sm:text-base leading-relaxed mb-6 ${mutedText}`}>{featured.excerpt}</p>
                            <div className="flex items-center gap-4 mb-6">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${mutedText}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {featured.readTime}
                                </span>
                                <span className={`text-xs font-bold ${mutedText}`}>{featured.date}</span>
                            </div>
                            <a
                                href={`/blog/${featured.id}`}
                                className="inline-flex items-center gap-2 self-start px-6 py-3 rounded-xl font-black tracking-widest uppercase text-sm transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                            >
                                Read Article
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* LATEST ARTICLES */}
                    <div className="mb-20 sm:mb-24">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Latest from Remise</h2>
                        </div>

                        {filtered.length === 0 ? (
                            <p className={`text-sm ${mutedText}`}>No articles match that search yet — try another term or category.</p>
                        ) : (
                            <>
                                <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                                    <AnimatePresence mode="popLayout">
                                        {filtered.slice(0, visibleCount).map((article) => (
                                            <motion.div
                                                key={article.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className={`rounded-2xl overflow-hidden border backdrop-blur-xl transition-all duration-300 ${isDarkMode
                                                        ? "bg-neutral-950/80 border-[#FF0000]/20 hover:border-[#FF0000]/50"
                                                        : "bg-white border-[#FF3333]/30 hover:border-[#FF0000]"
                                                    }`}
                                            >
                                                <div className="aspect-[16/10]">
                                                    <ArticleMark variant={article.category} isDarkMode={isDarkMode} />
                                                </div>
                                                <div className="p-5 sm:p-6">
                                                    <span
                                                        className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                                            }`}
                                                    >
                                                        {article.category}
                                                    </span>
                                                    <h3 className="font-bold text-base sm:text-lg mt-2 mb-2">{article.title}</h3>
                                                    <p className={`text-sm leading-relaxed mb-4 ${mutedText}`}>{article.excerpt}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${mutedText}`}>
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {article.readTime}
                                                        </span>
                                                        <a
                                                            href={`/blog/${article.id}`}
                                                            className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                                                }`}
                                                        >
                                                            Read
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {visibleCount < filtered.length && (
                                    <div className="text-center mt-10">
                                        <button
                                            onClick={() => setVisibleCount((c) => c + 4)}
                                            className={`px-8 py-3.5 rounded-xl font-black tracking-widest uppercase text-sm transition-all duration-300 border ${isDarkMode
                                                    ? "border-[#FF0000]/40 text-[#FF3333] hover:bg-[#FF0000]/10"
                                                    : "border-[#FF0000] text-[#990000] hover:bg-[#FFF0F0]"
                                                }`}
                                        >
                                            Load More Articles
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* REMISE UPDATES STRIP */}
                    <div className={`rounded-3xl border backdrop-blur-xl p-6 sm:p-8 mb-20 sm:mb-24 ${cardBase}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Bell className={`w-5 h-5 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                            <h2 className="text-lg sm:text-xl font-black tracking-widest uppercase">Remise Updates</h2>
                        </div>
                        <div className="space-y-4">
                            {UPDATES.map((u, i) => {
                                const Icon = u.icon;
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-4 pb-4 ${i < UPDATES.length - 1 ? `border-b ${isDarkMode ? "border-white/10" : "border-slate-100"}` : ""
                                            }`}
                                    >
                                        <div
                                            className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center border ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                        </div>
                                        <span
                                            className={`text-[10px] font-black uppercase tracking-[0.15em] flex-shrink-0 w-28 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                                }`}
                                        >
                                            {u.tag}
                                        </span>
                                        <span className={`text-sm ${mutedText}`}>{u.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-right mt-2">
                            <a
                                href="/blog?category=Remise+News"
                                className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                    }`}
                            >
                                View All News
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* SMART SHOPPING TIPS HIGHLIGHT */}
                    <div className={`rounded-3xl overflow-hidden border backdrop-blur-xl mb-20 sm:mb-24 grid lg:grid-cols-2 ${cardBase}`}>
                        <div className="p-8 sm:p-10 flex flex-col justify-center order-2 lg:order-1">
                            <div className="flex items-center gap-3 mb-4">
                                <Lightbulb className={`w-5 h-5 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                    Smart Shopping Tips
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">{shoppingHighlight.title}</h2>
                            <p className={`text-sm sm:text-base leading-relaxed mb-6 ${mutedText}`}>{shoppingHighlight.excerpt}</p>
                            <a
                                href={`/blog/${shoppingHighlight.id}`}
                                className="inline-flex items-center gap-2 self-start px-6 py-3 rounded-xl font-black tracking-widest uppercase text-sm transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                            >
                                Read Article
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="aspect-video lg:aspect-auto order-1 lg:order-2">
                            <ArticleMark variant="Shopping Tips" isDarkMode={isDarkMode} />
                        </div>
                    </div>

                    {/* FOR LOCAL BUSINESSES */}
                    <div className="mb-20 sm:mb-24">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <div className="flex justify-center items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                                    <Building2 className="w-4 h-4 text-white" />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                    For Local Businesses
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">Business Insights</h2>
                            <p className={`text-sm sm:text-base font-medium ${mutedText}`}>
                                Practical ideas for store owners, wholesalers, and home businesses building on
                                Remise.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
                            {BUSINESS_TOPICS.map((t, i) => {
                                const Icon = t.icon;
                                return (
                                    <div key={i} className={`rounded-2xl overflow-hidden border backdrop-blur-xl ${cardBase}`}>
                                        <div className="aspect-video">
                                            <ArticleMark variant="Business" isDarkMode={isDarkMode} />
                                        </div>
                                        <div className="p-5 sm:p-6">
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center border mb-3 ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                    }`}
                                            >
                                                <Icon className={`w-4 h-4 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                            </div>
                                            <h3 className="font-bold text-base mb-1.5">{t.title}</h3>
                                            <p className={`text-sm leading-relaxed ${mutedText}`}>{t.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* STAY UPDATED */}
                    <div
                        className={`rounded-3xl p-8 sm:p-12 border relative overflow-hidden ${isDarkMode
                                ? "bg-neutral-950 border-[#FF0000]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                : "bg-white border-[#FF3333]/50 shadow-[0_20px_50px_rgba(255,0,0,0.15)]"
                            }`}
                    >
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] ${isDarkMode ? "bg-[#FF0000]/10" : "bg-[#FF6666]/30"}`} />
                        <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-widest mb-3">Stay Updated</h3>
                                <p className={`text-sm sm:text-base max-w-xl mb-6 font-medium ${mutedText}`}>
                                    Get the latest Remise news, shopping tips, and business insights — sent
                                    occasionally, never spammed.
                                </p>
                                <form
                                    onSubmit={(e) => e.preventDefault()}
                                    className="flex flex-col sm:flex-row gap-3 max-w-lg"
                                >
                                    <div
                                        className={`flex items-center gap-2 flex-1 rounded-xl border px-4 py-3 ${isDarkMode ? "bg-black/40 border-[#FF0000]/20" : "bg-slate-50 border-[#FF3333]/30"
                                            }`}
                                    >
                                        <Mail className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                        <input
                                            type="email"
                                            required
                                            placeholder="Enter your email address"
                                            className={`w-full bg-transparent outline-none text-sm ${isDarkMode ? "placeholder:text-gray-600" : "placeholder:text-slate-400"
                                                }`}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 rounded-xl font-black tracking-widest uppercase text-sm transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                                    >
                                        Subscribe
                                    </button>
                                </form>
                            </div>
                            <div className="hidden lg:flex justify-center opacity-90">
                                <div className="w-40 h-40">
                                    <NewsletterMark />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FooterComponent theme={theme} />
        </div>
    );
}