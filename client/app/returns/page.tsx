"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    RotateCcw,
    PackageSearch,
    Ban,
    ClipboardList,
    Wallet,
    Banknote,
    XCircle,
    AlertTriangle,
    Building2,
    Headphones,
    Mail,
    ArrowRight,
    CheckCircle2,
    Snowflake,
    Droplets,
    PackageOpen,
    Wrench,
    Tag,
    ShieldAlert,
    ChevronRight,
} from "lucide-react";

// Adjust these import paths to match where NavbarHome / FooterHome live in
// your project — same components used across the rest of the site (Home,
// /help, /services, etc.)
import NavbarHome from "@/app/components-main/NavbarHome";
import FooterHome from "@/app/components-sections/Footer";

// ─────────────────────────────────────────────────────────────────────────
// Brand tokens — identical to the rest of the site, sourced from NavbarHome
// ─────────────────────────────────────────────────────────────────────────
// red        #FF0000  |  red hover   #e00000  |  red deep (gradients) #b30000
// red tint   #FFE5E5  |  red border  #FFD1D1  |  dark-mode red accent #FF6B6B
// navy       #0f172a  |  navy border #2d3748  |  light surface        #F5F5F5

const FOCUS_RING =
    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0000]";

const LAST_UPDATED = "1 September 2026";

// ─────────────────────────────────────────────────────────────────────────
// Content — sourced directly from the Returns & Refund Policy
// ─────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: "about", label: "About Returns", icon: PackageSearch },
    { id: "eligible", label: "Eligible Reasons", icon: CheckCircle2 },
    { id: "non-returnable", label: "Non-Returnable", icon: Ban },
    { id: "how-to", label: "Request a Return", icon: ClipboardList },
    { id: "refunds", label: "Refunds", icon: Wallet },
    { id: "cash", label: "Cash Payments", icon: Banknote },
    { id: "cancellation", label: "Cancellation", icon: XCircle },
    { id: "damaged", label: "Damaged Items", icon: AlertTriangle },
    { id: "sellers", label: "Seller Responsibility", icon: Building2 },
    { id: "contact", label: "Contact Us", icon: Headphones },
];

const RETURN_DEPENDENCIES = [
    "Product type",
    "Product condition",
    "Seller's return policy",
    "Reason for return",
    "Time since delivery/pickup",
    "Applicable laws and regulations",
];

const ELIGIBLE_REASONS = [
    "The product is damaged.",
    "The wrong product was delivered.",
    "The product is defective.",
    "The product is significantly different from the product description.",
    "Items are missing from the order.",
    "The product is otherwise eligible under the seller's return policy.",
];

const NON_RETURNABLE = [
    { title: "Perishable products", icon: Snowflake },
    { title: "Personal-care or hygiene products", icon: Droplets },
    { title: "Opened/sealed products", icon: PackageOpen },
    { title: "Customized products", icon: Wrench },
    { title: "Products marked as non-returnable", icon: Tag },
];

const RETURN_STEPS = [
    { title: "Open My Orders", detail: "Go to the My Orders section of your account." },
    { title: "Select the relevant order", detail: "Find the order you'd like to return or replace." },
    { title: "Select Return/Replace", detail: "Choose this option if it's available for the order." },
    { title: "Select the reason", detail: "Pick the reason that best matches your situation." },
    { title: "Provide details", detail: "Add any requested information or images." },
    { title: "Submit the request", detail: "The seller or Remise support will review it before approving." },
];

const REFUND_FACTORS = [
    "Payment method",
    "Order status",
    "Seller approval",
    "Return status",
    "Applicable fees",
];

const CANCELLATION_SOURCES = [
    {
        title: "By the customer",
        desc: "Subject to the order's current status.",
        icon: ClipboardList,
    },
    {
        title: "By the seller",
        desc: "Due to product availability or operational reasons.",
        icon: Building2,
    },
    {
        title: "By Remise",
        desc: "Where necessary to resolve an issue.",
        icon: ShieldAlert,
    },
];

const SELLER_RESPONSIBILITIES =
    "Store Owners, Wholesalers, and Home Businesses are responsible for fulfilling orders accurately and complying with applicable return, refund, consumer-protection, and product regulations.";

// ─────────────────────────────────────────────────────────────────────────
// Small building blocks
// ─────────────────────────────────────────────────────────────────────────

function SectionShell({
    id,
    title,
    icon: Icon,
    isLight,
    children,
    sectionRef,
}: {
    id: string;
    title: string;
    icon: React.ElementType;
    isLight: boolean;
    children: React.ReactNode;
    sectionRef?: (el: HTMLDivElement | null) => void;
}) {
    return (
        <div id={id} ref={sectionRef} className="scroll-mt-48">
            <div className="flex items-center gap-3 mb-5">
                <div
                    className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"
                        }`}
                >
                    <Icon size={20} />
                </div>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}

function Card({
    isLight,
    children,
    className = "",
}: {
    isLight: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl border p-5 sm:p-6 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"
                } ${className}`}
        >
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Hero illustration — a returned parcel looping back to a store, built
// from primitive shapes. One entrance sequence, then a single idle loop
// on the return arrow — not motion scattered across every element.
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
                <linearGradient id="rf-red" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF0000" />
                    <stop offset="100%" stopColor="#b30000" />
                </linearGradient>
            </defs>

            {/* ground */}
            <motion.ellipse
                cx="240"
                cy="300"
                rx="190"
                ry="16"
                fill="#ffffff"
                opacity="0.06"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* store */}
            <motion.g
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, delay: 0.05 }}
            >
                <rect x="270" y="150" width="150" height="110" rx="8" fill="url(#rf-red)" />
                <rect x="270" y="150" width="150" height="26" rx="8" fill="#FF0000" />
                <rect x="300" y="196" width="34" height="34" rx="4" fill="#ffffff" opacity="0.9" />
                <rect x="356" y="196" width="34" height="34" rx="4" fill="#ffffff" opacity="0.9" />
                <rect x="328" y="240" width="34" height="20" rx="2" fill="#0f172a" opacity="0.4" />
            </motion.g>

            {/* parcel box on the left */}
            <motion.g
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, delay: 0.15 }}
            >
                <rect x="60" y="190" width="86" height="70" rx="8" fill="#ffffff" opacity="0.9" />
                <path d="M60 212 L146 212" stroke="#FF0000" strokeWidth="6" />
                <path d="M103 190 L103 260" stroke="#FF0000" strokeWidth="6" />
            </motion.g>

            {/* return arrow looping from store back to parcel — idle loop */}
            <motion.g
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <motion.path
                    d="M 260 140 C 210 90, 130 90, 90 150"
                    stroke="#FF6B6B"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="8 10"
                    animate={{ strokeDashoffset: [0, -36] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                />
                <motion.g
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                    <path d="M90 150 L78 140 L94 134 Z" fill="#FF6B6B" />
                </motion.g>
            </motion.g>
        </motion.svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────
export default function ReturnsRefundsPage() {
    const [theme, setTheme] = useState<"dark" | "light">("light");
    const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
    const isLight = theme === "light";

    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const scrollTo = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className={isLight ? "bg-white" : "bg-[#0f172a]"}>
            <NavbarHome theme={theme} toggleTheme={toggleTheme} />

            {/* Spacer for the fixed navbar */}
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
                            <RotateCcw size={13} /> Returns &amp; Refunds
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
                            Returns &amp; Refund Policy
                        </h1>
                        <p className="mt-4 text-sm sm:text-base text-gray-300 max-w-md leading-relaxed">
                            How returns, cancellations, replacements, and refunds work on Remise — for
                            every order, store, and payment method.
                        </p>
                        <p className="mt-3 text-xs text-gray-500">Last updated: {LAST_UPDATED}</p>

                        <div className="mt-7 flex flex-wrap gap-2">
                            {CATEGORIES.slice(0, 4).map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => scrollTo(cat.id)}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:border-[#FF0000] hover:text-[#FF6B6B] transition-colors ${FOCUS_RING}`}
                                >
                                    <cat.icon size={13} />
                                    {cat.label}
                                    <ChevronRight size={12} />
                                </button>
                            ))}
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
                {/* 1. About Returns */}
                <SectionShell
                    id="about"
                    sectionRef={(el) => {
                        sectionRefs.current["about"] = el;
                    }}
                    title="About Returns"
                    icon={PackageSearch}
                    isLight={isLight}
                >
                    <p className={`text-sm mb-4 ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        Return and replacement availability may depend on:
                    </p>
                    <div className="grid sm:grid-cols-3 gap-2.5 mb-4">
                        {RETURN_DEPENDENCIES.map((d) => (
                            <div
                                key={d}
                                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"
                                    }`}
                            >
                                <CheckCircle2 size={15} className="text-[#FF0000] shrink-0" />
                                <span className={`text-xs font-medium ${isLight ? "text-gray-700" : "text-gray-300"}`}>{d}</span>
                            </div>
                        ))}
                    </div>
                    <p className={`text-xs leading-relaxed ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                        Certain products may not be eligible for return due to hygiene, safety, perishability,
                        or other restrictions.
                    </p>
                </SectionShell>

                {/* 2. Eligible Return Reasons */}
                <SectionShell
                    id="eligible"
                    sectionRef={(el) => {
                        sectionRefs.current["eligible"] = el;
                    }}
                    title="Eligible Return Reasons"
                    icon={CheckCircle2}
                    isLight={isLight}
                >
                    <p className={`text-sm mb-4 ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        Depending on the product and seller policy, a return or replacement may be considered
                        when:
                    </p>
                    <Card isLight={isLight}>
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                            {ELIGIBLE_REASONS.map((reason) => (
                                <div key={reason} className="flex items-start gap-2.5">
                                    <CheckCircle2 size={15} className="text-[#FF0000] mt-0.5 shrink-0" />
                                    <span className={`text-sm ${isLight ? "text-gray-700" : "text-gray-300"}`}>{reason}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <p className={`text-xs mt-3 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                        Products should generally be returned in their original condition and packaging where
                        applicable.
                    </p>
                </SectionShell>

                {/* 3. Non-Returnable Products */}
                <SectionShell
                    id="non-returnable"
                    sectionRef={(el) => {
                        sectionRefs.current["non-returnable"] = el;
                    }}
                    title="Non-Returnable Products"
                    icon={Ban}
                    isLight={isLight}
                >
                    <p className={`text-sm mb-4 ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        Some products may not be eligible for return, including certain:
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3">
                        {NON_RETURNABLE.map((item) => (
                            <div
                                key={item.title}
                                className={`flex flex-col items-center text-center gap-2 rounded-2xl border p-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"
                                        }`}
                                >
                                    <item.icon size={18} />
                                </div>
                                <p className={`text-xs font-semibold ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                                    {item.title}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className={`text-xs mt-3 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                        The applicable return conditions may be displayed before purchase.
                    </p>
                </SectionShell>

                {/* 4. How to Request a Return */}
                <SectionShell
                    id="how-to"
                    sectionRef={(el) => {
                        sectionRefs.current["how-to"] = el;
                    }}
                    title="How to Request a Return"
                    icon={ClipboardList}
                    isLight={isLight}
                >
                    <p className={`text-sm mb-4 ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        If your order is eligible:
                    </p>
                    <ol className="grid sm:grid-cols-2 gap-2.5">
                        {RETURN_STEPS.map((step, i) => (
                            <li
                                key={step.title}
                                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"
                                    }`}
                            >
                                <span className="shrink-0 w-7 h-7 rounded-full bg-[#FF0000] text-white text-xs font-bold flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className={`text-sm font-semibold ${isLight ? "text-gray-800" : "text-gray-200"}`}>
                                        {step.title}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${isLight ? "text-gray-500" : "text-gray-500"}`}>{step.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <p className={`text-xs mt-3 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                        The seller or Remise support team may review the request before approving it.
                    </p>
                </SectionShell>

                {/* 5. Refunds */}
                <SectionShell
                    id="refunds"
                    sectionRef={(el) => {
                        sectionRefs.current["refunds"] = el;
                    }}
                    title="Refunds"
                    icon={Wallet}
                    isLight={isLight}
                >
                    <p className={`text-sm mb-4 ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        If a refund is approved, the refund amount and method may depend on:
                    </p>
                    <div className="grid sm:grid-cols-3 gap-2.5 mb-4">
                        {REFUND_FACTORS.map((f) => (
                            <div
                                key={f}
                                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"
                                    }`}
                            >
                                <CheckCircle2 size={15} className="text-[#FF0000] shrink-0" />
                                <span className={`text-xs font-medium ${isLight ? "text-gray-700" : "text-gray-300"}`}>{f}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-start gap-2.5 rounded-xl border border-[#FF0000]/25 bg-[#FF0000]/[0.06] px-4 py-3">
                        <Wallet size={15} className="text-[#FF0000] mt-0.5 shrink-0" />
                        <p className={`text-xs leading-relaxed ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                            For online payments, approved refunds will generally be processed through the
                            applicable payment method or payment gateway.
                        </p>
                    </div>
                </SectionShell>

                {/* 6. Cash Payments */}
                <SectionShell
                    id="cash"
                    sectionRef={(el) => {
                        sectionRefs.current["cash"] = el;
                    }}
                    title="Cash Payments"
                    icon={Banknote}
                    isLight={isLight}
                >
                    <Card isLight={isLight}>
                        <div className="flex items-start gap-3">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"
                                    }`}
                            >
                                <Banknote size={18} />
                            </div>
                            <p className={`text-sm leading-relaxed ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                                For orders paid in cash, refund arrangements may differ from online payments.
                                Remise or the applicable seller will provide instructions for the approved refund.
                            </p>
                        </div>
                    </Card>
                </SectionShell>

                {/* 7. Order Cancellation */}
                <SectionShell
                    id="cancellation"
                    sectionRef={(el) => {
                        sectionRefs.current["cancellation"] = el;
                    }}
                    title="Order Cancellation"
                    icon={XCircle}
                    isLight={isLight}
                >
                    <p className={`text-sm mb-4 ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        An order may be cancelled:
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3 mb-4">
                        {CANCELLATION_SOURCES.map((src) => (
                            <div
                                key={src.title}
                                className={`rounded-2xl border p-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"
                                        }`}
                                >
                                    <src.icon size={18} />
                                </div>
                                <p className={`font-bold text-sm mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>{src.title}</p>
                                <p className={`text-xs leading-relaxed ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                                    {src.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className={`text-xs ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                        If payment has already been made, eligible refunds will be processed according to this
                        policy.
                    </p>
                </SectionShell>

                {/* 8. Damaged or Incorrect Products */}
                <SectionShell
                    id="damaged"
                    sectionRef={(el) => {
                        sectionRefs.current["damaged"] = el;
                    }}
                    title="Damaged or Incorrect Products"
                    icon={AlertTriangle}
                    isLight={isLight}
                >
                    <div className="flex items-start gap-2.5 rounded-xl border border-[#FF0000]/25 bg-[#FF0000]/[0.06] px-4 py-3.5">
                        <AlertTriangle size={15} className="text-[#FF0000] mt-0.5 shrink-0" />
                        <p className={`text-sm leading-relaxed ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                            If you receive a damaged or incorrect product, report it as soon as possible after
                            receiving the order. Keep the product, packaging, and relevant proof until the issue
                            has been resolved.
                        </p>
                    </div>
                </SectionShell>

                {/* 9. Seller Responsibility */}
                <SectionShell
                    id="sellers"
                    sectionRef={(el) => {
                        sectionRefs.current["sellers"] = el;
                    }}
                    title="Seller Responsibility"
                    icon={Building2}
                    isLight={isLight}
                >
                    <Card isLight={isLight}>
                        <div className="flex items-start gap-3">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"
                                    }`}
                            >
                                <Building2 size={18} />
                            </div>
                            <p className={`text-sm leading-relaxed ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                                {SELLER_RESPONSIBILITIES}
                            </p>
                        </div>
                    </Card>
                </SectionShell>

                {/* 10. Contact Support CTA */}
                <div
                    id="contact"
                    ref={(el) => {
                        sectionRefs.current["contact"] = el;
                    }}
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
                                <Headphones size={13} /> Questions about a return or refund?
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug max-w-md">
                                Contact Remise support through the app and we'll take it from there.
                            </h3>
                            <p className="text-sm text-white/80 mt-2 max-w-md">
                                Reach us through the support option provided in the application — include your
                                order ID whenever possible.
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

            <FooterHome theme={theme} />

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
        </div>
    );
}