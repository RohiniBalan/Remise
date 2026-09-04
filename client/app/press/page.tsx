"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";
import {
    Newspaper,
    Megaphone,
    Rss,
    Image as ImageIcon,
    Palette,
    Download,
    Mail,
    ArrowRight,
    Building2,
    Users,
    Globe,
    Compass,
    Calendar,
    ExternalLink,
    Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONTENT                                                            */
/*  Kept honest and data-driven on purpose: press releases and media   */
/*  coverage are real content types, not filler. Don't add fabricated  */
/*  coverage or placeholder statistics here — leave arrays empty and   */
/*  the page shows an honest "building our story" state instead, per   */
/*  the brief. Swap in real entries as they exist.                     */
/* ------------------------------------------------------------------ */

type PressRelease = {
    id: string;
    date: string;
    title: string;
    excerpt: string;
    featured?: boolean;
};

const PRESS_RELEASES: PressRelease[] = [
    {
        id: "smarter-local-discovery",
        date: "September 2026",
        title: "Remise introduces a smarter way to discover local products",
        excerpt:
            "Remise continues to improve product discovery and local shopping by connecting customers with nearby businesses.",
        featured: true,
    },
    {
        id: "product-scanning-launch",
        date: "August 2026",
        title: "Remise launches product list scanning",
        excerpt: "A faster way to compare an entire shopping list across nearby stores in one pass.",
    },
    {
        id: "store-comparison-update",
        date: "July 2026",
        title: "Remise improves store comparison with total pricing",
        excerpt: "Customers can now see full pricing across stores at a glance, before choosing where to buy.",
    },
];

const AT_A_GLANCE = [
    { icon: Globe, label: "Web & Mobile", sub: "Platform" },
    { icon: Building2, label: "Local Commerce", sub: "Platform" },
    { icon: Users, label: "Business", sub: "Partners" },
];

// Populate as real coverage exists. Left empty intentionally — see note above.
const MEDIA_COVERAGE: { publication: string; date: string; title: string; url: string }[] = [];

const MEDIA_KIT = [
    { icon: ImageIcon, title: "Logo", desc: "PNG / SVG" },
    { icon: Palette, title: "Screenshots", desc: "Product images" },
    { icon: Compass, title: "Brand Kit", desc: "Guidelines" },
];

/* ------------------------------------------------------------------ */
/*  SMALL VISUAL PIECES                                                */
/*  Custom flat SVG marks, same red/black gradient language as the     */
/*  rest of the site — kept consistent instead of stock photography.   */
/* ------------------------------------------------------------------ */

function FeaturedAnnouncementMark({ isDarkMode }: { isDarkMode: boolean }) {
    const bg = isDarkMode ? "#0a0a0a" : "#fff";
    return (
        <svg viewBox="0 0 480 340" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="pressFeatGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <rect width="480" height="340" fill={bg} />
            <circle cx="240" cy="170" r="150" fill="url(#pressFeatGrad)" opacity="0.1" />
            {/* megaphone */}
            <path d="M170 150l90-36v112l-90-36Z" fill="url(#pressFeatGrad)" opacity="0.9" />
            <rect x="150" y="132" width="20" height="52" rx="4" fill="url(#pressFeatGrad)" opacity="0.9" />
            <path d="M260 114v112" stroke="url(#pressFeatGrad)" strokeWidth="8" strokeLinecap="round" />
            <path d="M175 190l10 36a12 12 0 0 0 23-6l-6-24" fill="url(#pressFeatGrad)" opacity="0.85" />
            {/* broadcast rings */}
            <path d="M292 138a40 40 0 0 1 0 64" fill="none" stroke="url(#pressFeatGrad)" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
            <path d="M308 122a64 64 0 0 1 0 96" fill="none" stroke="url(#pressFeatGrad)" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
        </svg>
    );
}

function TimelineDotMark() {
    return (
        <svg viewBox="0 0 40 40" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="dotGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="url(#dotGrad)" opacity="0.15" />
            <circle cx="20" cy="20" r="8" fill="url(#dotGrad)" />
        </svg>
    );
}

function GlanceMark({ isDarkMode }: { isDarkMode: boolean }) {
    const bg = isDarkMode ? "#0a0a0a" : "#fff";
    return (
        <svg viewBox="0 0 320 160" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="glanceGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <rect width="320" height="160" fill={bg} />
            <circle cx="160" cy="80" r="60" fill="url(#glanceGrad)" opacity="0.08" />
            <path d="M100 100L140 60L180 90L220 50" fill="none" stroke="url(#glanceGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="220" cy="50" r="6" fill="url(#glanceGrad)" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  PRESS PAGE                                                         */
/* ------------------------------------------------------------------ */

export default function PressPage() {
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

    const cardBase = isDarkMode
        ? "bg-neutral-950/80 border-[#FF0000]/20"
        : "bg-white border-[#FF3333]/30";
    const eyebrowColor = isDarkMode ? "text-[#FF0000]/80" : "text-[#990000]";
    const mutedText = isDarkMode ? "text-gray-400" : "text-slate-600";

    const featured = PRESS_RELEASES.find((r) => r.featured) ?? PRESS_RELEASES[0];
    const timelineReleases = PRESS_RELEASES.filter((r) => r.id !== featured.id);

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
                <div className="max-w-5xl mx-auto">
                    {/* NEWSROOM HEADER */}
                    <div className="mb-16 sm:mb-20">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                                <Newspaper className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                Remise Newsroom
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 max-w-2xl">
                            News, announcements, and official information from Remise
                        </h1>
                        <p className={`text-sm sm:text-base font-medium max-w-xl mb-8 ${mutedText}`}>
                            Everything a journalist, partner, or curious reader needs to know about
                            what we're building.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "Press Releases", href: "#press-releases", icon: Rss },
                                { label: "Media Coverage", href: "#media-coverage", icon: Megaphone },
                                { label: "Media Kit", href: "#media-kit", icon: Palette },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all duration-300 hover:scale-105 ${isDarkMode
                                                ? "border-[#FF0000]/20 text-gray-300 hover:border-[#FF0000]/50 hover:bg-[#FF0000]/5"
                                                : "border-[#FF3333]/30 text-slate-700 hover:border-[#FF0000] hover:bg-[#FFF5F5]"
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {item.label}
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* FEATURED ANNOUNCEMENT */}
                    <div className="mb-20 sm:mb-24">
                        <div className="flex items-center gap-3 mb-4">
                            <span
                                className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full ${isDarkMode ? "bg-[#FF0000]/10 text-[#FF3333]" : "bg-[#FFCCCC] text-[#990000]"
                                    }`}
                            >
                                Featured
                            </span>
                        </div>
                        <div
                            className={`rounded-3xl overflow-hidden border backdrop-blur-xl grid lg:grid-cols-2 transition-all duration-300 hover:border-[#FF0000]/50 ${cardBase}`}
                        >
                            <div className="aspect-video lg:aspect-auto lg:h-full min-h-[220px]">
                                <FeaturedAnnouncementMark isDarkMode={isDarkMode} />
                            </div>
                            <div className="p-8 sm:p-10 flex flex-col justify-center">
                                <span className={`text-xs font-bold mb-3 ${mutedText}`}>{featured.date}</span>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">{featured.title}</h2>
                                <p className={`text-sm sm:text-base leading-relaxed mb-6 ${mutedText}`}>{featured.excerpt}</p>
                                <a
                                    href={`/press/${featured.id}`}
                                    className="inline-flex items-center gap-2 self-start px-6 py-3 rounded-xl font-black tracking-widest uppercase text-sm transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                                >
                                    Read Announcement
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* PRESS RELEASES TIMELINE */}
                    <div id="press-releases" className="mb-20 sm:mb-24 scroll-mt-32">
                        <div className="flex items-center gap-3 sm:gap-4 mb-10">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Press Releases</h2>
                        </div>
                        <div className="relative pl-10 sm:pl-12">
                            <div
                                className={`absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-px ${isDarkMode ? "bg-[#FF0000]/20" : "bg-[#FF3333]/25"
                                    }`}
                            />
                            <div className="space-y-10">
                                {[{ ...featured }, ...timelineReleases].map((release) => (
                                    <div key={release.id} className="relative group">
                                        <div className="absolute -left-10 sm:-left-12 top-0 w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-125">
                                            <TimelineDotMark />
                                        </div>
                                        <div
                                            className={`rounded-2xl p-5 sm:p-6 border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode
                                                    ? "bg-neutral-950/80 border-[#FF0000]/20 hover:border-[#FF0000]/50"
                                                    : "bg-white border-[#FF3333]/30 hover:border-[#FF0000]"
                                                }`}
                                        >
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold mb-2 ${mutedText}`}>
                                                <Calendar className="w-3.5 h-3.5" />
                                                {release.date}
                                            </span>
                                            <h3 className="font-bold text-base sm:text-lg mb-2">{release.title}</h3>
                                            <p className={`text-sm leading-relaxed mb-3 ${mutedText}`}>{release.excerpt}</p>
                                            <a
                                                href={`/press/${release.id}`}
                                                className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                                    }`}
                                            >
                                                Read Full Release
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* REMISE AT A GLANCE */}
                    <div className="mb-20 sm:mb-24">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Remise at a Glance</h2>
                        </div>
                        <div className={`rounded-3xl border backdrop-blur-xl overflow-hidden ${cardBase}`}>
                            <div className="aspect-[3/1] hidden sm:block">
                                <GlanceMark isDarkMode={isDarkMode} />
                            </div>
                            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#FF0000]/10">
                                {AT_A_GLANCE.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-4 p-6 sm:p-8 transition-all duration-300 hover:scale-[1.03]"
                                        >
                                            <div
                                                className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm sm:text-base leading-tight">{item.label}</p>
                                                <p className={`text-xs sm:text-sm ${mutedText}`}>{item.sub}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* MEDIA COVERAGE */}
                    <div id="media-coverage" className="mb-20 sm:mb-24 scroll-mt-32">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">In the News</h2>
                        </div>

                        {MEDIA_COVERAGE.length === 0 ? (
                            <div className={`rounded-3xl border backdrop-blur-xl p-8 sm:p-12 text-center ${cardBase}`}>
                                <Sparkles className={`w-6 h-6 mx-auto mb-4 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                <p className={`text-sm sm:text-base font-medium max-w-md mx-auto ${mutedText}`}>
                                    Remise is building its story. Media coverage will appear here as we
                                    continue to grow.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {MEDIA_COVERAGE.map((item, i) => (
                                    <a
                                        key={i}
                                        href={item.url}
                                        className={`block rounded-2xl p-5 sm:p-6 border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode
                                                ? "bg-neutral-950/80 border-[#FF0000]/20 hover:border-[#FF0000]/50"
                                                : "bg-white border-[#FF3333]/30 hover:border-[#FF0000]"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-4 mb-2">
                                            <span className="font-bold text-sm">{item.publication}</span>
                                            <span className={`text-xs font-bold ${mutedText}`}>{item.date}</span>
                                        </div>
                                        <p className="font-bold text-base mb-2">{item.title}</p>
                                        <span
                                            className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                                }`}
                                        >
                                            Read Coverage
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* MEDIA KIT */}
                    <div id="media-kit" className="mb-20 sm:mb-24 scroll-mt-32">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Media Resources</h2>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
                            {MEDIA_KIT.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={i}
                                        className={`rounded-2xl p-6 border backdrop-blur-xl text-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${cardBase} ${isDarkMode ? "hover:border-[#FF0000]/50" : "hover:border-[#FF0000]"
                                            }`}
                                    >
                                        <div
                                            className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center border mb-4 ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                }`}
                                        >
                                            <Icon className={`w-6 h-6 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                        </div>
                                        <h3 className="font-bold text-base mb-1">{item.title}</h3>
                                        <p className={`text-sm mb-5 ${mutedText}`}>{item.desc}</p>
                                        <button
                                            className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-transform duration-300 hover:scale-110 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                                }`}
                                        >
                                            Download
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ABOUT REMISE */}
                    <div
                        className={`rounded-3xl p-8 sm:p-10 border backdrop-blur-xl mb-20 sm:mb-24 text-center transition-all duration-300 hover:border-[#FF0000]/50 ${cardBase}`}
                    >
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                            About Remise
                        </span>
                        <p className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mt-4 mb-6 ${mutedText}`}>
                            Remise is a local commerce and product discovery platform that connects
                            customers with nearby businesses. Customers can discover products, compare
                            available options, choose stores, and place orders through the platform.
                        </p>
                        <a
                            href="/about"
                            className={`inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider transition-transform duration-300 hover:scale-105 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                }`}
                        >
                            About Remise
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* PRESS CONTACT */}
                    <div
                        className={`rounded-3xl p-8 sm:p-12 border relative overflow-hidden text-center ${isDarkMode
                                ? "bg-neutral-950 border-[#FF0000]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                : "bg-white border-[#FF3333]/50 shadow-[0_20px_50px_rgba(255,0,0,0.15)]"
                            }`}
                    >
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] ${isDarkMode ? "bg-[#FF0000]/10" : "bg-[#FF6666]/30"}`} />
                        <div className="relative z-10">
                            <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)] mb-5">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <h3 className={`text-2xl sm:text-3xl font-black uppercase tracking-widest mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                Media & Press Contact
                            </h3>
                            <p className={`text-sm sm:text-base max-w-md mx-auto mb-6 font-medium ${mutedText}`}>
                                Are you a journalist or publication interested in learning more about
                                Remise?
                            </p>
                            <p className={`text-sm font-bold mb-8 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`}>
                                press@remise.com
                            </p>
                            <a
                                href="mailto:press@remise.com"
                                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                            >
                                <span>Contact Press Team</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <FooterComponent theme={theme} />
        </div>
    );
}