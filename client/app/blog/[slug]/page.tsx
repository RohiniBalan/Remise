"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../components-main/NavbarHome";
import FooterComponent from "../../components-sections/Footer";
import {
    Clock,
    ArrowRight,
    ArrowLeft,
    Share2,
    Twitter,
    Linkedin,
    Link2,
    ShoppingBag,
    Building2,
    Cpu,
    Newspaper,
    Megaphone,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONTENT                                                            */
/*  Placeholder article bodies keyed by the same ids used on the       */
/*  Blogs & News page. Swap this map for real CMS content once each    */
/*  article has a proper source — the shape (title, category, body     */
/*  paragraphs, related ids) is what the page expects either way.      */
/* ------------------------------------------------------------------ */

type Category = "Shopping Tips" | "Business" | "Technology" | "Remise News" | "Offers";

const CATEGORY_ICON: Record<Category, React.ComponentType<{ className?: string }>> = {
    "Shopping Tips": ShoppingBag,
    Business: Building2,
    Technology: Cpu,
    "Remise News": Newspaper,
    Offers: Megaphone,
};

type ArticleContent = {
    id: string;
    category: Category;
    title: string;
    excerpt: string;
    readTime: string;
    date: string;
    author: string;
    body: string[];
};

const ARTICLE_CONTENT: Record<string, ArticleContent> = {
    "making-local-shopping-smarter": {
        id: "making-local-shopping-smarter",
        category: "Remise News",
        title: "Making Local Shopping Smarter",
        excerpt:
            "Discover how Remise brings customers and local businesses together, helping shoppers find products, compare options, and choose where to buy.",
        readTime: "5 min read",
        date: "September 2026",
        author: "Team Remise",
        body: [
            "Shopping for everyday products can be more complicated than it needs to be. Customers often check several stores, compare prices manually, and still aren't sure they found the best option nearby.",
            "Remise was built to close that gap. Instead of guessing which store has what you need, you can search or scan once and see what's actually available around you — along with pricing, so comparing options takes seconds instead of a trip across town.",
            "For the businesses on the other side of that search, the platform works the same way in reverse. A store owner, wholesaler, or home business can list what they carry, keep pricing current, and reach customers who are already looking for exactly that product in their area.",
            "That's the core idea behind Remise: less friction for the person trying to find something, and a simpler way for local businesses to be found. As more stores join and more categories fill out, the goal stays the same — make local commerce feel as easy as searching online, without losing what makes it local.",
        ],
    },
    "compare-prices-before-you-buy": {
        id: "compare-prices-before-you-buy",
        category: "Shopping Tips",
        title: "How to Compare Prices Before You Buy",
        excerpt: "Five practical habits that make it easier to spot a genuinely good deal nearby.",
        readTime: "4 min read",
        date: "August 2026",
        author: "Team Remise",
        body: [
            "A lower price isn't always a better deal once you factor in distance, stock, and how current the listing actually is. A few habits make comparison shopping faster and more reliable.",
            "Start with what you actually need, not the closest match. Searching for the specific product — brand, size, or spec — narrows results before you start comparing, instead of after.",
            "Check availability before price. A great price at a store that's out of stock isn't a deal at all. Prioritize listings that show current availability over ones that only show a number.",
            "Factor in pickup versus delivery. A slightly higher price with free pickup five minutes away can beat a lower price with a delivery fee attached.",
            "Revisit prices for anything you buy regularly. Local pricing shifts with stock and season more than people expect, so a store that wasn't cheapest last month might be this month.",
        ],
    },
    "ai-modern-shopping": {
        id: "ai-modern-shopping",
        category: "Technology",
        title: "How Technology Is Changing Local Shopping",
        excerpt: "A look at scanning, search, and discovery tools quietly reshaping how people shop nearby.",
        readTime: "6 min read",
        date: "August 2026",
        author: "Team Remise",
        body: [
            "The biggest shift in local shopping isn't a new store format — it's how people find what they're looking for before they ever walk in.",
            "Search has gotten more forgiving. You no longer need the exact product name to find what you want; describing it in plain language or scanning it is often enough.",
            "Voice-based search is following the same path, letting people search hands-free while doing something else — cooking, driving, or just multitasking at home.",
            "Scanning a product or an entire list turns a walk through the kitchen into a ready-to-compare shopping list, without retyping anything.",
            "None of this replaces the store — it just removes the guesswork of finding it in the first place.",
        ],
    },
    "grow-your-business-online": {
        id: "grow-your-business-online",
        category: "Business",
        title: "Growing Your Local Business Online",
        excerpt: "Simple, practical steps for store owners and home businesses building a digital presence.",
        readTime: "5 min read",
        date: "July 2026",
        author: "Team Remise",
        body: [
            "A digital presence doesn't have to mean a full online store. For many local businesses, it just means being visible where customers are already searching.",
            "Start with the basics: accurate hours, a clear list of what you sell, and pricing that's actually current. Customers lose trust fast when what they find online doesn't match what's in the store.",
            "Photos matter more than most owners expect — even simple, clear ones of your storefront or products help customers decide to visit before they've spoken to anyone.",
            "From there, keeping listings updated as stock and pricing change is what turns a one-time visitor into a repeat customer who checks your listing first.",
        ],
    },
    "whats-new-in-remise": {
        id: "whats-new-in-remise",
        category: "Remise News",
        title: "What's New in Remise",
        excerpt: "Recent additions to the platform, in plain language, with no changelog jargon.",
        readTime: "3 min read",
        date: "July 2026",
        author: "Team Remise",
        body: [
            "A short recap of what's changed recently, without the technical changelog format.",
            "Store comparison now shows total pricing at a glance, so you can weigh options without opening each listing separately.",
            "Product list scanning is live, letting you scan several items at once instead of searching for them one by one.",
            "More local businesses are joining every week, which means better coverage in more categories and areas over time.",
        ],
    },
    "product-scanning-explained": {
        id: "product-scanning-explained",
        category: "Technology",
        title: "Product Scanning, Explained",
        excerpt: "How scanning a product or list helps you find it at nearby stores in seconds.",
        readTime: "4 min read",
        date: "June 2026",
        author: "Team Remise",
        body: [
            "Scanning removes the step of typing out a product name you're already looking at. Point, scan, and see where it's available nearby.",
            "It works the same way for a written list — scan the whole thing and get a comparison across nearby stores instead of searching item by item.",
            "This is especially useful for products with long or inconsistent names, where a manual search might miss the exact match you need.",
        ],
    },
    "managing-inventory-digitally": {
        id: "managing-inventory-digitally",
        category: "Business",
        title: "Managing Products and Inventory Digitally",
        excerpt: "Why keeping stock and pricing current online matters more than it seems.",
        readTime: "5 min read",
        date: "June 2026",
        author: "Team Remise",
        body: [
            "An out-of-date listing costs more than a missed sale — it costs the trust that brings a customer back a second time.",
            "Keeping inventory and pricing current doesn't need to be a daily chore. Small, regular updates after restocking or a price change keep listings accurate without much extra effort.",
            "Businesses that do this consistently tend to see customers return to their listing first, simply because it's reliable.",
        ],
    },
    "finding-products-near-you": {
        id: "finding-products-near-you",
        category: "Shopping Tips",
        title: "Tips for Finding Products Near You",
        excerpt: "Search habits that narrow results fast when you know roughly what you want.",
        readTime: "3 min read",
        date: "May 2026",
        author: "Team Remise",
        body: [
            "Specific searches beat broad ones. Searching a category name returns everything; searching the actual product narrows it down immediately.",
            "If you're not sure of the exact name, describing it — size, color, or use — usually gets you closer than guessing at a brand.",
            "Setting your area correctly matters more than most people realize; a wider radius returns more results but often less relevant ones.",
        ],
    },
};

const FALLBACK_CATEGORY: Category = "Remise News";

function titleFromSlug(slug: string) {
    return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function ArticleMark({ variant, isDarkMode }: { variant: Category; isDarkMode: boolean }) {
    const bg = isDarkMode ? "#0a0a0a" : "#fff";
    const grad = (
        <defs>
            <linearGradient id={`art-mark-${variant}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF4D4D" />
                <stop offset="100%" stopColor="#B30000" />
            </linearGradient>
        </defs>
    );

    switch (variant) {
        case "Shopping Tips":
            return (
                <svg viewBox="0 0 480 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {grad}
                    <rect width="480" height="300" fill={bg} />
                    <circle cx="240" cy="150" r="110" fill={`url(#art-mark-${variant})`} opacity="0.1" />
                    <path d="M190 135h100l-10 80a12 12 0 0 1-12 11h-56a12 12 0 0 1-12-11Z" fill={`url(#art-mark-${variant})`} opacity="0.9" />
                    <path d="M210 135v-20a30 30 0 0 1 60 0v20" fill="none" stroke={`url(#art-mark-${variant})`} strokeWidth="7" strokeLinecap="round" />
                </svg>
            );
        case "Business":
            return (
                <svg viewBox="0 0 480 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {grad}
                    <rect width="480" height="300" fill={bg} />
                    <rect x="170" y="110" width="140" height="98" rx="8" fill={`url(#art-mark-${variant})`} opacity="0.85" />
                    <rect x="188" y="128" width="24" height="24" fill={bg} opacity="0.8" />
                    <rect x="222" y="128" width="24" height="24" fill={bg} opacity="0.5" />
                    <rect x="256" y="128" width="24" height="24" fill={bg} opacity="0.8" />
                    <rect x="188" y="160" width="24" height="24" fill={bg} opacity="0.5" />
                    <rect x="222" y="160" width="24" height="24" fill={bg} opacity="0.8" />
                    <rect x="256" y="160" width="24" height="24" fill={bg} opacity="0.5" />
                </svg>
            );
        case "Technology":
            return (
                <svg viewBox="0 0 480 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {grad}
                    <rect width="480" height="300" fill={bg} />
                    <rect x="178" y="100" width="124" height="88" rx="10" fill="none" stroke={`url(#art-mark-${variant})`} strokeWidth="5" />
                    <circle cx="240" cy="144" r="26" fill={`url(#art-mark-${variant})`} opacity="0.85" />
                    <path d="M240 118v-20M240 190v-20M204 144h-20M296 144h-20" stroke={`url(#art-mark-${variant})`} strokeWidth="5" strokeLinecap="round" />
                </svg>
            );
        case "Offers":
            return (
                <svg viewBox="0 0 480 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {grad}
                    <rect width="480" height="300" fill={bg} />
                    <path d="M170 150l45-45h90l45 45-45 45h-90Z" fill={`url(#art-mark-${variant})`} opacity="0.85" />
                    <circle cx="240" cy="150" r="14" fill={bg} />
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 480 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {grad}
                    <rect width="480" height="300" fill={bg} />
                    <rect x="160" y="96" width="160" height="108" rx="8" fill={`url(#art-mark-${variant})`} opacity="0.12" />
                    <rect x="180" y="118" width="90" height="12" rx="3" fill={`url(#art-mark-${variant})`} />
                    <rect x="180" y="140" width="120" height="7" rx="3" fill={`url(#art-mark-${variant})`} opacity="0.5" />
                    <rect x="180" y="156" width="120" height="7" rx="3" fill={`url(#art-mark-${variant})`} opacity="0.5" />
                    <rect x="180" y="172" width="80" height="7" rx="3" fill={`url(#art-mark-${variant})`} opacity="0.5" />
                </svg>
            );
    }
}

export default function ArticlePage() {
    const params = useParams();
    const slug = (params?.slug as string) ?? "";

    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const isDarkMode = theme === "dark";

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

    // Placeholder fallback: any article id not yet in ARTICLE_CONTENT still
    // renders a full page instead of a blank one, using a generic body.
    // Replace this whole map with real CMS content once articles are authored.
    const article: ArticleContent =
        ARTICLE_CONTENT[slug] ?? {
            id: slug || "untitled",
            category: FALLBACK_CATEGORY,
            title: slug ? titleFromSlug(slug) : "Article",
            excerpt: "This article is coming soon — check back shortly for the full story.",
            readTime: "3 min read",
            date: "2026",
            author: "Team Remise",
            body: [
                "This article hasn't been published yet, but the page is ready for it.",
                "Once the content team adds the full story here, it will appear in this same layout automatically.",
            ],
        };

    const CategoryIcon = CATEGORY_ICON[article.category] ?? Newspaper;

    const related = Object.values(ARTICLE_CONTENT)
        .filter((a) => a.id !== article.id && a.category === article.category)
        .slice(0, 2);

    const cardBase = isDarkMode
        ? "bg-neutral-950/80 border-[#FF0000]/20"
        : "bg-white border-[#FF3333]/30";
    const mutedText = isDarkMode ? "text-gray-400" : "text-slate-600";
    const eyebrowColor = isDarkMode ? "text-[#FF0000]/80" : "text-[#990000]";

    return (
        <div
            className={`relative min-h-screen flex flex-col transition-colors duration-500 overflow-x-hidden ${isDarkMode
                    ? "bg-black text-white selection:bg-[#FF0000]/30 selection:text-[#FF9999]"
                    : "bg-slate-50 text-slate-900 selection:bg-[#FF0000]/30 selection:text-[#660000]"
                }`}
        >
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
                <div className="max-w-3xl mx-auto">
                    {/* BACK LINK */}
                    <a
                        href="/blog"
                        className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-8 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                            }`}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Blogs & News
                    </a>

                    {/* META */}
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                            <CategoryIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                            {article.category}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
                        {article.title}
                    </h1>

                    <p className={`text-base sm:text-lg font-medium mb-6 ${mutedText}`}>{article.excerpt}</p>

                    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 mb-10 pb-6 border-b ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                        <span className="text-sm font-bold">{article.author}</span>
                        <span className={`inline-flex items-center gap-1.5 text-sm ${mutedText}`}>
                            <Clock className="w-4 h-4" />
                            {article.readTime}
                        </span>
                        <span className={`text-sm ${mutedText}`}>{article.date}</span>
                    </div>

                    {/* COVER IMAGE */}
                    <div className={`rounded-3xl overflow-hidden border mb-10 aspect-video ${cardBase}`}>
                        <ArticleMark variant={article.category} isDarkMode={isDarkMode} />
                    </div>

                    {/* BODY */}
                    <div className="space-y-5 mb-12">
                        {article.body.map((para, i) => (
                            <p key={i} className={`text-base leading-relaxed ${isDarkMode ? "text-gray-300" : "text-slate-700"}`}>
                                {para}
                            </p>
                        ))}
                    </div>

                    {/* SHARE */}
                    <div className={`flex items-center gap-4 mb-16 pt-6 border-t ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                        <span className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider ${mutedText}`}>
                            <Share2 className="w-4 h-4" />
                            Share
                        </span>
                        {[Twitter, Linkedin, Link2].map((Icon, i) => (
                            <button
                                key={i}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${isDarkMode
                                        ? "bg-[#FF0000]/10 border-[#FF0000]/20 text-[#FF3333] hover:bg-[#FF0000]/20"
                                        : "bg-[#FFCCCC] border-[#FF9999] text-[#990000] hover:bg-[#FFB3B3]"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>

                    {/* RELATED ARTICLES */}
                    {related.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg sm:text-xl font-black tracking-widest uppercase mb-6">Related Articles</h2>
                            <div className="grid sm:grid-cols-2 gap-5">
                                {related.map((r) => (
                                    <a
                                        key={r.id}
                                        href={`/blog/${r.id}`}
                                        className={`rounded-2xl overflow-hidden border backdrop-blur-xl transition-all duration-300 block ${isDarkMode
                                                ? "bg-neutral-950/80 border-[#FF0000]/20 hover:border-[#FF0000]/50"
                                                : "bg-white border-[#FF3333]/30 hover:border-[#FF0000]"
                                            }`}
                                    >
                                        <div className="aspect-video">
                                            <ArticleMark variant={r.category} isDarkMode={isDarkMode} />
                                        </div>
                                        <div className="p-5">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`}>
                                                {r.category}
                                            </span>
                                            <h3 className="font-bold text-base mt-2 mb-2">{r.title}</h3>
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`}>
                                                Read
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <FooterComponent theme={theme} />
        </div>
    );
}