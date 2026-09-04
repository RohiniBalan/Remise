"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";
import {
    Map,
    ShoppingBag,
    Building2,
    Info,
    LifeBuoy,
    UserCircle,
    Scale,
    ArrowRight,
    ChevronRight,
    HelpCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONTENT                                                            */
/*  Data-driven on purpose — remove any link below that doesn't have  */
/*  a real page yet, and update hrefs to match your actual routes.    */
/* ------------------------------------------------------------------ */

const SITEMAP_SECTIONS = [
    {
        icon: ShoppingBag,
        title: "Shop",
        desc: "Discover and shop products on Remise.",
        links: [
            { label: "Home", href: "/" },
            { label: "All Products", href: "/category/all" },
            { label: "Categories", href: "/category/all" },
            { label: "New Arrivals", href: "/new-arrivals" },
            { label: "Best Sellers", href: "/best-sellers" },
            { label: "Offers", href: "/nearby" },
            { label: "Search Products", href: "/" },
        ],
    },
    {
        icon: Building2,
        title: "For Businesses",
        desc: "Grow your business with Remise.",
        links: [
            { label: "Store Owner", href: "/business/store-owner" },
            { label: "Wholesaler", href: "/business/wholesaler" },
            { label: "Home Business", href: "/business/home-business" },
            { label: "Business Registration", href: "/business/signup" },
            { label: "Business Login", href: "/business/login" },
            { label: "Store Dashboard", href: "/business/dashboard" },
        ],
    },
    {
        icon: Info,
        title: "Company",
        desc: "Learn more about Remise and our journey.",
        links: [
            { label: "About Us", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Blogs & News", href: "/blog" },
            { label: "Press", href: "/press" },
            { label: "Contact Us", href: "/services" },
        ],
    },
    {
        icon: LifeBuoy,
        title: "Support",
        desc: "Need help? Find answers and useful resources.",
        links: [
            { label: "Help Center", href: "/help-center" },
            { label: "Frequently Asked Questions", href: "/help-center#faq" },
            { label: "Returns & Refunds", href: "/returns" },
            { label: "Order Support", href: "/services" },
            { label: "Payment Support", href: "/services" },
            { label: "Contact Support", href: "/services" },
        ],
    },
    {
        icon: UserCircle,
        title: "Account",
        desc: "Manage your Remise account.",
        links: [
            { label: "Login", href: "/login" },
            { label: "Register", href: "/signup" },
            { label: "My Profile", href: "/account/profile" },
            { label: "My Orders", href: "/orders" },
            { label: "Wishlist", href: "/wishlist" },
            { label: "Saved Cart", href: "/account/cart" },
            { label: "Addresses", href: "/account/addresses" },
        ],
    },
    {
        icon: Scale,
        title: "Legal",
        desc: "Important information about using Remise.",
        links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Returns & Refunds", href: "/returns" },
        ],
    },
];

const QUICK_NAV = [
    {
        title: "Shop",
        links: [
            { label: "All Products", href: "/category/all" },
            { label: "Categories", href: "/category/all" },
            { label: "Offers", href: "/nearby" },
        ],
    },
    {
        title: "Discover",
        links: [
            { label: "New Arrivals", href: "/new-arrivals" },
            { label: "Best Sellers", href: "/best-sellers" },
            { label: "Blogs & News", href: "/blog" },
        ],
    },
    {
        title: "Business",
        links: [
            { label: "Become a Seller", href: "/business/signup" },
            { label: "Business Login", href: "/business/login" },
            { label: "Store Management", href: "/business/dashboard" },
        ],
    },
    {
        title: "Help",
        links: [
            { label: "Help Center", href: "/help-center" },
            { label: "Returns & Refunds", href: "/returns" },
            { label: "Contact Us", href: "/services" },
        ],
    },
];

/* ------------------------------------------------------------------ */
/*  SITEMAP PAGE                                                       */
/* ------------------------------------------------------------------ */

export default function SitemapPage() {
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
    const iconWrap = isDarkMode
        ? "bg-[#FF0000]/10 border-[#FF0000]/20"
        : "bg-[#FFCCCC] border-[#FF9999]";
    const iconColor = isDarkMode ? "text-[#FF3333]" : "text-[#990000]";

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
                    {/* HEADER — intentionally compact, no hero art */}
                    <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
                        <div className="flex justify-center items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                                <Map className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                Sitemap
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-tight">
                            <span className={isDarkMode ? "text-white" : "text-slate-900"}>Everything on Remise, </span>
                            <span
                                className={`bg-gradient-to-r from-[#FF4D4D] via-[#FF0000] to-[#B30000] bg-clip-text text-transparent ${isDarkMode ? "drop-shadow-[0_0_20px_rgba(255,0,0,0.3)]" : ""
                                    }`}
                            >
                                all in one place
                            </span>
                        </h1>
                        <p className={`text-sm sm:text-base font-medium ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                            Explore the main sections, shopping features, business services, support
                            resources, and company information available on Remise.
                        </p>
                    </div>

                    {/* DIRECTORY GRID */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-16 sm:mb-20">
                        {SITEMAP_SECTIONS.map((section, i) => {
                            const Icon = section.icon;
                            const isBusinessSection = section.title === "For Businesses";
                            const noLinkLabels =
                                section.title === "Account" ? ["Saved Cart", "Addresses"] : [];
                            return (
                                <motion.div
                                    key={section.title}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: i * 0.04 }}
                                    className={`rounded-2xl p-5 sm:p-6 border backdrop-blur-xl ${cardBase}`}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconWrap}`}>
                                            <Icon className={`w-5 h-5 ${iconColor}`} />
                                        </div>
                                        <div>
                                            <h2 className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                                {section.title}
                                            </h2>
                                        </div>
                                    </div>
                                    <p className={`text-xs mb-4 leading-relaxed ${isDarkMode ? "text-gray-500" : "text-slate-500"}`}>
                                        {section.desc}
                                    </p>
                                    <ul className="space-y-1">
                                        {section.links.map((link) =>
                                            isBusinessSection || noLinkLabels.includes(link.label) ? (
                                                <li
                                                    key={link.label}
                                                    className={`flex items-center gap-1.5 py-1.5 text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-slate-700"
                                                        }`}
                                                >
                                                    <ChevronRight
                                                        className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? "text-[#FF3333]/70" : "text-[#990000]/70"
                                                            }`}
                                                    />
                                                    {link.label}
                                                </li>
                                            ) : (
                                                <li key={link.label}>
                                                    <a
                                                        href={link.href}
                                                        className={`group flex items-center gap-1.5 py-1.5 text-sm font-medium transition-colors ${isDarkMode
                                                            ? "text-gray-300 hover:text-[#FF3333]"
                                                            : "text-slate-700 hover:text-[#990000]"
                                                            }`}
                                                    >
                                                        <ChevronRight
                                                            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${isDarkMode ? "text-[#FF3333]/70" : "text-[#990000]/70"
                                                                }`}
                                                        />
                                                        {link.label}
                                                    </a>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* QUICK NAVIGATION */}
                    <div className="mb-16 sm:mb-20">
                        <div className="text-center mb-8">
                            <h2 className="text-lg sm:text-xl font-black tracking-widest uppercase mb-2">
                                Looking for something specific?
                            </h2>
                            <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-slate-500"}`}>
                                A quick shortcut to the most-used pages.
                            </p>
                        </div>
                        <div className={`rounded-3xl border backdrop-blur-xl p-6 sm:p-8 ${cardBase}`}>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                {QUICK_NAV.map((col) => (
                                    <div key={col.title}>
                                        <h3
                                            className={`text-[11px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"
                                                }`}
                                        >
                                            {col.title}
                                        </h3>
                                        <ul className="space-y-2">
                                            {col.links.map((link) =>
                                                col.title === "Business" ? (
                                                    <li
                                                        key={link.label}
                                                        className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-slate-700"
                                                            }`}
                                                    >
                                                        {link.label}
                                                    </li>
                                                ) : (
                                                    <li key={link.label}>
                                                        <a
                                                            href={link.href}
                                                            className={`text-sm font-medium transition-colors ${isDarkMode
                                                                ? "text-gray-300 hover:text-white"
                                                                : "text-slate-700 hover:text-slate-950"
                                                                }`}
                                                        >
                                                            {link.label}
                                                        </a>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* NEED HELP CTA */}
                    <div
                        className={`rounded-3xl p-8 sm:p-12 border relative overflow-hidden text-center ${isDarkMode
                            ? "bg-neutral-950 border-[#FF0000]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            : "bg-white border-[#FF3333]/50 shadow-[0_20px_50px_rgba(255,0,0,0.15)]"
                            }`}
                    >
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] ${isDarkMode ? "bg-[#FF0000]/10" : "bg-[#FF6666]/30"}`} />
                        <div className="relative z-10">
                            <HelpCircle
                                className={`w-10 h-10 mx-auto mb-4 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`}
                            />
                            <h3 className={`text-2xl sm:text-3xl font-black uppercase tracking-widest mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                Can't find what you're looking for?
                            </h3>
                            <p className={`text-sm sm:text-base max-w-xl mx-auto mb-8 font-medium ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                Our Help Center has answers to common questions about shopping, orders,
                                payments, returns, and using Remise.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="/help-center"
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                                >
                                    <span>Visit Help Center</span>
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                                <a
                                    href="/services"
                                    className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 inline-flex items-center justify-center gap-3 border ${isDarkMode
                                        ? "border-[#FF0000]/40 text-[#FF3333] hover:bg-[#FF0000]/10"
                                        : "border-[#FF0000] text-[#990000] hover:bg-[#FFF0F0]"
                                        }`}
                                >
                                    <span>Contact Us</span>
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FooterComponent theme={theme} />
        </div>
    );
}