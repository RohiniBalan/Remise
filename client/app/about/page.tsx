"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";
import {
    Search,
    MapPin,
    Scale,
    ShoppingBag,
    Store,
    Package,
    IndianRupee,
    BarChart3,
    Users,
    Truck,
    CheckCircle2,
    Smartphone,
    ShoppingCart,
    ArrowRight,
    ShieldCheck,
    FileText,
    Lock,
    ClipboardList,
    Building2,
    Headphones,
    Compass,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONTENT                                                            */
/*  Kept as data so copy can be adjusted without touching markup.      */
/*  Update anything below as Remise's real feature set evolves —      */
/*  don't present a feature here that isn't live yet.                  */
/* ------------------------------------------------------------------ */

const WHAT_IS_REMISE = [
    {
        icon: Search,
        title: "Discover",
        desc: "Find products and businesses around you.",
    },
    {
        icon: Scale,
        title: "Compare",
        desc: "Compare available options before choosing where to buy.",
    },
    {
        icon: ShoppingBag,
        title: "Shop",
        desc: "Select a store and complete your purchase conveniently.",
    },
];

const HOW_IT_WORKS = [
    {
        icon: Search,
        title: "Search or Scan",
        desc: "Search for products manually or use available scanning and voice features to find what you need.",
    },
    {
        icon: MapPin,
        title: "Find Nearby Stores",
        desc: "Discover businesses that have the products you're looking for within your selected area.",
    },
    {
        icon: Scale,
        title: "Compare Options",
        desc: "Compare product availability and total pricing across participating stores.",
    },
    {
        icon: Store,
        title: "Choose Your Store",
        desc: "Select the store that best matches your requirements.",
    },
    {
        icon: Truck,
        title: "Pickup or Delivery",
        desc: "Choose the available fulfillment option that works best for you.",
    },
    {
        icon: CheckCircle2,
        title: "Complete Your Order",
        desc: "Place your order using the available payment options.",
    },
];

const WHY_REMISE = [
    {
        icon: MapPin,
        title: "Nearby Choices",
        desc: "Discover businesses around you.",
    },
    {
        icon: IndianRupee,
        title: "Compare Prices",
        desc: "Compare available options before you decide.",
    },
    {
        icon: Search,
        title: "Easy Discovery",
        desc: "Find products using simple search and smart features.",
    },
    {
        icon: ShoppingCart,
        title: "Convenient Shopping",
        desc: "Choose pickup or delivery based on availability.",
    },
    {
        icon: Store,
        title: "Support Local Businesses",
        desc: "Every order helps a nearby business grow.",
    },
    {
        icon: Smartphone,
        title: "Simple Digital Experience",
        desc: "A clean, straightforward way to shop and manage orders.",
    },
];

const CUSTOMER_BENEFITS = [
    "Discover products available around them",
    "Search for products easily",
    "Use voice-based product search where available",
    "Scan products or product lists where supported",
    "Compare products and prices across nearby stores",
    "Choose a preferred store",
    "Select pickup or home delivery when available",
    "Manage and track orders",
    "Shop from local businesses through a single platform",
];

const BUSINESS_STEPS = [
    { icon: Store, label: "Create Your Store" },
    { icon: Package, label: "Add & Manage Products" },
    { icon: IndianRupee, label: "Manage Pricing" },
    { icon: BarChart3, label: "Manage Inventory" },
    { icon: ShoppingBag, label: "Receive Orders" },
    { icon: Users, label: "Reach More Customers" },
];

const TRUST_POINTS = [
    { icon: FileText, label: "Clear Product Information" },
    { icon: IndianRupee, label: "Transparent Pricing" },
    { icon: Lock, label: "Secure Account Management" },
    { icon: ClipboardList, label: "Reliable Order Information" },
    { icon: Building2, label: "Business Accountability" },
    { icon: Headphones, label: "Customer Support" },
];

/* ------------------------------------------------------------------ */
/*  SMALL VISUAL PIECES                                                */
/*  Simple, hand-drawn-flat SVG marks instead of stock photography —   */
/*  keeps the page license-clean and matches the site's card/glow look */
/* ------------------------------------------------------------------ */

function HeroMark({ isDarkMode }: { isDarkMode: boolean }) {
    return (
        <svg
            viewBox="0 0 320 320"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <circle
                cx="160"
                cy="160"
                r="130"
                fill="url(#heroGrad)"
                opacity="0.12"
            />
            <circle
                cx="160"
                cy="160"
                r="92"
                fill="none"
                stroke="url(#heroGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
                opacity="0.5"
            />
            {/* storefront */}
            <rect x="96" y="150" width="128" height="80" rx="6" fill="url(#heroGrad)" opacity="0.9" />
            <rect x="108" y="176" width="34" height="54" rx="3" fill={isDarkMode ? "#000" : "#fff"} opacity="0.85" />
            <rect x="152" y="176" width="66" height="24" rx="3" fill={isDarkMode ? "#000" : "#fff"} opacity="0.5" />
            <path d="M90 152 L160 104 L230 152 Z" fill="url(#heroGrad)" />
            {/* pin */}
            <path
                d="M220 96c0-15.46-12.54-28-28-28s-28 12.54-28 28c0 21 28 44 28 44s28-23 28-44Z"
                fill={isDarkMode ? "#0a0a0a" : "#fff"}
                stroke="url(#heroGrad)"
                strokeWidth="4"
            />
            <circle cx="192" cy="96" r="10" fill="url(#heroGrad)" />
        </svg>
    );
}

function ProcessMark() {
    return (
        <svg viewBox="0 0 320 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="procGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <line x1="20" y1="100" x2="300" y2="100" stroke="url(#procGrad)" strokeWidth="2" strokeDasharray="2 10" opacity="0.6" />
            {[40, 120, 200, 280].map((x, i) => (
                <g key={i}>
                    <circle cx={x} cy="100" r="26" fill="url(#procGrad)" opacity={0.15 + i * 0.08} />
                    <circle cx={x} cy="100" r="10" fill="url(#procGrad)" />
                </g>
            ))}
        </svg>
    );
}

function CTAMark() {
    return (
        <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="ctaGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <rect x="40" y="70" width="120" height="90" rx="10" fill="url(#ctaGrad)" opacity="0.9" />
            <path d="M60 70 L60 50a40 40 0 0 1 80 0v20" fill="none" stroke="url(#ctaGrad)" strokeWidth="8" strokeLinecap="round" />
            <circle cx="80" cy="115" r="6" fill="#022c22" />
            <circle cx="120" cy="115" r="6" fill="#022c22" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  ABOUT PAGE                                                         */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
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
                    {/* HERO */}
                    <div className="grid lg:grid-cols-2 gap-10 items-center mb-20 sm:mb-24">
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                                    <Compass className="w-4 h-4 text-white" />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                    About Remise
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter mb-5 leading-tight">
                                <span className={isDarkMode ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" : "text-slate-900"}>
                                    Making local shopping{" "}
                                </span>
                                <span
                                    className={`bg-gradient-to-r from-[#FF4D4D] via-[#FF0000] to-[#B30000] bg-clip-text text-transparent ${isDarkMode ? "drop-shadow-[0_0_20px_rgba(255,0,0,0.3)]" : ""
                                        }`}
                                >
                                    smarter, simpler, and closer to home
                                </span>
                            </h1>
                            <p className={`text-base sm:text-lg font-medium mb-8 max-w-xl ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                Remise connects customers with nearby stores and businesses, making it
                                easier to discover products, compare prices, choose the right store, and
                                shop with confidence.
                            </p>
                            <a
                                href="/category/all"
                                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                            >
                                <span>Explore Products</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            className="w-full max-w-sm mx-auto aspect-square"
                        >
                            <HeroMark isDarkMode={isDarkMode} />
                        </motion.div>
                    </div>

                    {/* OUR STORY */}
                    <div className={`rounded-3xl p-8 sm:p-12 border backdrop-blur-xl mb-20 sm:mb-24 ${cardBase}`}>
                        <div className="flex items-center gap-3 sm:gap-4 mb-6">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Our Story</h2>
                        </div>
                        <p className={`text-sm sm:text-base leading-relaxed max-w-3xl mb-4 ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                            Shopping for everyday products can sometimes be difficult. Customers may
                            need to search across different stores, compare prices manually, and spend
                            time finding the products they need.
                        </p>
                        <p className={`text-sm sm:text-base leading-relaxed max-w-3xl mb-6 ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                            Remise was created to make this process simpler — bringing customers and
                            local businesses together on one convenient platform, so customers can
                            discover what's available around them while businesses get a digital way
                            to showcase their products and reach more people.
                        </p>
                        <p className={`text-base sm:text-lg font-bold italic ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`}>
                            Find what you need. Compare your options. Choose where to shop.
                        </p>
                    </div>

                    {/* WHAT IS REMISE */}
                    <div className="mb-20 sm:mb-24">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <div className="flex justify-center items-center gap-3 mb-4">
                                <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
                                <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">What is Remise?</h2>
                            </div>
                            <p className={`text-sm sm:text-base font-medium ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                A local commerce and product discovery platform designed to connect
                                customers with nearby businesses — and give store owners, wholesalers,
                                and home businesses a place to reach them.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
                            {WHAT_IS_REMISE.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <div key={i} className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${cardBase}`}>
                                        <div
                                            className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center border mb-4 ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                }`}
                                        >
                                            <Icon className={`w-6 h-6 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                        </div>
                                        <h3 className="font-bold text-base mb-1.5">{item.title}</h3>
                                        <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                            {item.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* HOW REMISE WORKS */}
                    <div className="mb-20 sm:mb-24">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">How Remise Works</h2>
                        </div>
                        <div className="w-full max-w-2xl mx-auto h-16 sm:h-20 mb-8 opacity-90">
                            <ProcessMark />
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                            {HOW_IT_WORKS.map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={i} className={`rounded-2xl p-5 sm:p-6 border backdrop-blur-xl flex gap-4 ${cardBase}`}>
                                        <div
                                            className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border font-black text-xs ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20 text-[#FF3333]" : "bg-[#FFCCCC] border-[#FF9999] text-[#990000]"
                                                }`}
                                        >
                                            {String(i + 1).padStart(2, "0")}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Icon className={`w-4 h-4 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                                <h3 className="font-bold text-sm sm:text-base">{step.title}</h3>
                                            </div>
                                            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* WHY CHOOSE REMISE */}
                    <div className="mb-20 sm:mb-24">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Why Choose Remise?</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                            {WHY_REMISE.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={i}
                                        className={`rounded-2xl p-5 sm:p-6 border backdrop-blur-xl transition-all duration-300 group ${isDarkMode
                                            ? "bg-neutral-950/80 border-[#FF0000]/20 hover:border-[#FF0000]/50 hover:bg-neutral-900"
                                            : "bg-white border-[#FF3333]/30 hover:border-[#FF0000] hover:shadow-lg"
                                            }`}
                                    >
                                        <div
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-4 transition-transform group-hover:scale-110 ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                        </div>
                                        <h3 className="font-bold text-base mb-1.5">{item.title}</h3>
                                        <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                            {item.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* FOR CUSTOMERS */}
                    <div className={`rounded-3xl p-8 sm:p-12 border backdrop-blur-xl mb-20 sm:mb-24 grid lg:grid-cols-2 gap-10 items-center ${cardBase}`}>
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                                    <ShoppingCart className="w-4 h-4 text-white" />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                    For Customers
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-6">A Better Way to Shop Locally</h2>
                            <ul className="space-y-3 mb-8">
                                {CUSTOMER_BENEFITS.map((b, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? "text-[#FF3333]" : "text-[#CC0000]"}`} />
                                        <span className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-slate-700"}`}>{b}</span>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href="/"
                                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                            >
                                <span>Start Shopping</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="hidden lg:flex justify-center opacity-90">
                            <div className="w-56 h-56">
                                <CTAMark />
                            </div>
                        </div>
                    </div>

                    {/* FOR BUSINESSES */}
                    <div className="mb-20 sm:mb-24">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <div className="flex justify-center items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3333] to-[#990000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                                    <Building2 className="w-4 h-4 text-white" />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                    For Businesses
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">Helping Local Businesses Grow</h2>
                            <p className={`text-sm sm:text-base font-medium ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                Whether you're a store owner, wholesaler, or home business, Remise gives
                                you a digital platform to showcase your products and connect with
                                customers in your area.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {BUSINESS_STEPS.map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={i} className={`rounded-2xl p-5 border backdrop-blur-xl text-center ${cardBase}`}>
                                        <div
                                            className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center border mb-3 ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                        </div>
                                        <p className="text-xs sm:text-sm font-bold leading-tight">{step.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-center mt-8">
                            <a
                                href="/business/signup"
                                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                            >
                                <span>Join Remise</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* VISION + MISSION */}
                    <div className="grid md:grid-cols-2 gap-6 mb-20 sm:mb-24">
                        <div className={`rounded-3xl p-8 sm:p-10 border backdrop-blur-xl ${cardBase}`}>
                            <h2 className="text-lg sm:text-xl font-black tracking-widest uppercase mb-4">Our Vision</h2>
                            <p className={`text-base sm:text-lg font-bold italic mb-4 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`}>
                                To make local commerce more accessible, transparent, and convenient for
                                everyone.
                            </p>
                            <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                We envision a shopping experience where customers can easily discover
                                what's available around them, make informed purchasing decisions, and
                                connect with businesses without unnecessary complexity.
                            </p>
                        </div>
                        <div className={`rounded-3xl p-8 sm:p-10 border backdrop-blur-xl ${cardBase}`}>
                            <h2 className="text-lg sm:text-xl font-black tracking-widest uppercase mb-4">Our Mission</h2>
                            <p className={`text-sm sm:text-base leading-relaxed mb-4 ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                Our mission is to build a digital platform that brings customers and
                                local businesses closer together. We aim to:
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "Simplify product discovery",
                                    "Make local shopping more convenient",
                                    "Give customers better visibility into their options",
                                    "Help businesses establish a digital presence",
                                    "Support meaningful connections between local businesses and customers",
                                    "Build a reliable and easy-to-use shopping experience",
                                ].map((m, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${isDarkMode ? "bg-[#FF3333]" : "bg-[#CC0000]"}`} />
                                        <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-slate-700"}`}>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* TRUST & TRANSPARENCY */}
                    <div className="mb-20 sm:mb-24">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Built Around Trust</h2>
                        </div>
                        <div className={`rounded-3xl border backdrop-blur-xl p-8 sm:p-10 ${cardBase}`}>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-8">
                                {TRUST_POINTS.map((t, i) => {
                                    const Icon = t.icon;
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div
                                                className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center border ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                    }`}
                                            >
                                                <Icon className={`w-4 h-4 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                            </div>
                                            <span className="text-sm font-bold">{t.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={`flex items-start gap-3 pt-6 border-t ${isDarkMode ? "border-white/10" : "border-slate-100"}`}>
                                <ShieldCheck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                <p className={`text-sm sm:text-base leading-relaxed italic ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                    We believe a good shopping experience starts with clear information and
                                    transparent interactions. Remise is designed to give customers and
                                    businesses the information they need to make better decisions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div
                        className={`rounded-3xl p-8 sm:p-12 border relative overflow-hidden text-center ${isDarkMode
                            ? "bg-neutral-950 border-[#FF0000]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            : "bg-white border-[#FF3333]/50 shadow-[0_20px_50px_rgba(255,0,0,0.15)]"
                            }`}
                    >
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] ${isDarkMode ? "bg-[#FF0000]/10" : "bg-[#FF6666]/30"}`} />
                        <div className="relative z-10">
                            <h3 className={`text-2xl sm:text-3xl font-black uppercase tracking-widest mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                Ready to discover what's around you?
                            </h3>
                            <p className={`text-sm sm:text-base max-w-xl mx-auto mb-8 font-medium ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                Find products. Compare options. Shop local.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="/"
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                                >
                                    <span>Start Shopping</span>
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                                <a
                                    href="/signup"
                                    className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 inline-flex items-center justify-center gap-3 border ${isDarkMode
                                        ? "border-[#FF0000]/40 text-[#FF3333] hover:bg-[#FF0000]/10"
                                        : "border-[#FF0000] text-[#990000] hover:bg-[#FFF0F0]"
                                        }`}
                                >
                                    <span>Join Remise</span>
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