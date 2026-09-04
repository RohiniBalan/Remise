"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../components-main/NavbarHome";
import FooterComponent from "../../components-sections/Footer";
import {
    Calendar,
    ArrowRight,
    ArrowLeft,
    Share2,
    Twitter,
    Linkedin,
    Link2,
    Newspaper,
    Mail,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONTENT                                                            */
/*  Keep this in sync with the PRESS_RELEASES ids on the Newsroom page */
/*  (app/press/page.tsx). Swap for real release content as each one    */
/*  is actually published — the shape (date, title, body) is what      */
/*  this page expects either way.                                      */
/* ------------------------------------------------------------------ */

type PressReleaseContent = {
    id: string;
    date: string;
    title: string;
    excerpt: string;
    body: string[];
};

const PRESS_RELEASE_CONTENT: Record<string, PressReleaseContent> = {
    "smarter-local-discovery": {
        id: "smarter-local-discovery",
        date: "September 2026",
        title: "Remise introduces a smarter way to discover local products",
        excerpt:
            "Remise continues to improve product discovery and local shopping by connecting customers with nearby businesses.",
        body: [
            "Remise today announced improvements to how customers discover products from nearby stores, making it easier to find what's available without checking multiple locations one by one.",
            "The update focuses on connecting customers directly with local businesses that carry what they're looking for, showing availability and pricing together instead of requiring a separate check at each store.",
            "\"Local shopping shouldn't require more effort than shopping online,\" said a Remise spokesperson. \"This update is about closing that gap for both customers and the businesses that serve them.\"",
            "The feature is rolling out to all Remise users starting this month, with no action required to access it.",
        ],
    },
    "product-scanning-launch": {
        id: "product-scanning-launch",
        date: "August 2026",
        title: "Remise launches product list scanning",
        excerpt: "A faster way to compare an entire shopping list across nearby stores in one pass.",
        body: [
            "Remise has launched product list scanning, allowing customers to scan a written or photographed shopping list and instantly compare availability and pricing across nearby stores.",
            "Rather than searching for each item individually, customers can now scan an entire list at once, saving time for larger shopping trips.",
            "The feature is available now within the Remise app for all supported regions.",
        ],
    },
    "store-comparison-update": {
        id: "store-comparison-update",
        date: "July 2026",
        title: "Remise improves store comparison with total pricing",
        excerpt: "Customers can now see full pricing across stores at a glance, before choosing where to buy.",
        body: [
            "Remise has updated its store comparison view to show total pricing upfront, making it easier for customers to weigh options without opening each store's listing separately.",
            "The change was made in direct response to customer feedback requesting a faster way to compare costs across multiple nearby stores.",
            "This update is live now across the Remise platform.",
        ],
    },
};

function titleFromSlug(slug: string) {
    return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function ReleaseMark({ isDarkMode }: { isDarkMode: boolean }) {
    const bg = isDarkMode ? "#0a0a0a" : "#fff";
    return (
        <svg viewBox="0 0 480 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="releaseGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <rect width="480" height="300" fill={bg} />
            <circle cx="240" cy="150" r="130" fill="url(#releaseGrad)" opacity="0.1" />
            <path d="M180 130l80-32v98l-80-32Z" fill="url(#releaseGrad)" opacity="0.9" />
            <rect x="162" y="114" width="18" height="46" rx="3" fill="url(#releaseGrad)" opacity="0.9" />
            <path d="M186 178l9 32a10 10 0 0 0 20-5l-5-21" fill="url(#releaseGrad)" opacity="0.85" />
            <path d="M300 120a34 34 0 0 1 0 56" fill="none" stroke="url(#releaseGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
            <path d="M314 106a56 56 0 0 1 0 84" fill="none" stroke="url(#releaseGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
        </svg>
    );
}

export default function PressReleasePage() {
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

    // Placeholder fallback: any slug not yet in PRESS_RELEASE_CONTENT still
    // renders a full page instead of a blank one.
    const release: PressReleaseContent =
        PRESS_RELEASE_CONTENT[slug] ?? {
            id: slug || "untitled",
            date: "2026",
            title: slug ? titleFromSlug(slug) : "Press Release",
            excerpt: "This release is coming soon — check back shortly for the full announcement.",
            body: [
                "This press release hasn't been published yet, but the page is ready for it.",
                "Once the communications team adds the full announcement here, it will appear in this same layout automatically.",
            ],
        };

    const related = Object.values(PRESS_RELEASE_CONTENT)
        .filter((r) => r.id !== release.id)
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
                        href="/press"
                        className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-8 transition-transform duration-300 hover:scale-105 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                            }`}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Newsroom
                    </a>

                    {/* META */}
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                            <Newspaper className="w-4 h-4 text-white" />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                            Press Release
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
                        {release.title}
                    </h1>

                    <p className={`text-base sm:text-lg font-medium mb-6 ${mutedText}`}>{release.excerpt}</p>

                    <div className={`flex items-center gap-2 mb-10 pb-6 border-b ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                        <Calendar className={`w-4 h-4 ${mutedText}`} />
                        <span className={`text-sm font-bold ${mutedText}`}>{release.date}</span>
                    </div>

                    {/* COVER MARK */}
                    <div className={`rounded-3xl overflow-hidden border mb-10 aspect-video ${cardBase}`}>
                        <ReleaseMark isDarkMode={isDarkMode} />
                    </div>

                    {/* BODY */}
                    <div className="space-y-5 mb-12">
                        {release.body.map((para, i) => (
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
                                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-300 hover:scale-110 ${isDarkMode
                                        ? "bg-[#FF0000]/10 border-[#FF0000]/20 text-[#FF3333] hover:bg-[#FF0000]/20"
                                        : "bg-[#FFCCCC] border-[#FF9999] text-[#990000] hover:bg-[#FFB3B3]"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>

                    {/* MORE RELEASES */}
                    {related.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg sm:text-xl font-black tracking-widest uppercase mb-6">More Releases</h2>
                            <div className="grid sm:grid-cols-2 gap-5">
                                {related.map((r) => (
                                    <a
                                        key={r.id}
                                        href={`/press/${r.id}`}
                                        className={`rounded-2xl overflow-hidden border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] block ${isDarkMode
                                                ? "bg-neutral-950/80 border-[#FF0000]/20 hover:border-[#FF0000]/50"
                                                : "bg-white border-[#FF3333]/30 hover:border-[#FF0000]"
                                            }`}
                                    >
                                        <div className="aspect-video">
                                            <ReleaseMark isDarkMode={isDarkMode} />
                                        </div>
                                        <div className="p-5">
                                            <span className={`text-xs font-bold ${mutedText}`}>{r.date}</span>
                                            <h3 className="font-bold text-base mt-1 mb-2">{r.title}</h3>
                                            <span
                                                className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                                    }`}
                                            >
                                                Read
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PRESS CONTACT STRIP */}
                    <div className={`rounded-2xl p-6 border backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${cardBase}`}>
                        <div className="flex items-center gap-3">
                            <Mail className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                            <p className={`text-sm font-medium ${mutedText}`}>
                                Media inquiries: <span className="font-bold">press@remise.com</span>
                            </p>
                        </div>
                        <a
                            href="/press#press-releases"
                            className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider flex-shrink-0 transition-transform duration-300 hover:scale-105 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                }`}
                        >
                            View All Releases
                            <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>
            </div>

            <FooterComponent theme={theme} />
        </div>
    );
}