"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Info,
    UserCog,
    ShoppingBag,
    Store,
    ClipboardList,
    IndianRupee,
    Package,
    Truck,
    CreditCard,
    RotateCcw,
    Ban,
    Copyright,
    Plug,
    UserX,
    ShieldAlert,
    Settings2,
    FileEdit,
    Scale,
    Mail,
    ArrowRight,
    Plus,
    Minus,
} from "lucide-react";

// Adjust this import path to wherever NavbarHome actually lives in your project.
// Same navbar used across the rest of the site (Home, /help-center, /privacy-policy).
import NavbarHome from "@/app/components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";

// ─────────────────────────────────────────────────────────────────────────
// Brand tokens — identical across Help Center / Privacy Policy / Terms, so
// the three legal-adjacent pages read as one family.
// ─────────────────────────────────────────────────────────────────────────
// red        #FF0000  |  red hover   #e00000  |  red deep (gradients) #b30000
// red tint   #FFE5E5  |  red border  #FFD1D1  |  dark-mode red accent #FF6B6B
// navy       #0f172a  |  navy border #2d3748  |  light surface        #F5F5F5

const FOCUS_RING =
    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0000]";

const LAST_UPDATED = "20 August 2026";

// ─────────────────────────────────────────────────────────────────────────
// Content — the 19 clauses, kept in document order since that order is
// the actual structure of a Terms of Service (this is why numbering is
// used as the layout's organizing device, unlike the Help Center's topics).
// ─────────────────────────────────────────────────────────────────────────
type Article = {
    n: number;
    title: string;
    icon: React.ElementType;
    summary: string;
    body: React.ReactNode;
};

const ARTICLES: Article[] = [
    {
        n: 1,
        title: "About Remise",
        icon: Info,
        summary: "What Remise connects customers and sellers to do.",
        body: (
            <>
                <p>
                    Remise is an e-commerce and local commerce platform that facilitates interactions
                    between customers and sellers, including Store Owners, Wholesalers, and Home
                    Businesses.
                </p>
                <p>Depending on the service, Remise may facilitate:</p>
                <ul>
                    <li>Product discovery</li>
                    <li>Store comparison</li>
                    <li>Product ordering</li>
                    <li>Payment processing</li>
                    <li>Pickup</li>
                    <li>Delivery</li>
                    <li>Seller-customer communication</li>
                </ul>
            </>
        ),
    },
    {
        n: 2,
        title: "User Accounts",
        icon: UserCog,
        summary: "Keep your details accurate and your login secure.",
        body: (
            <>
                <p>You must provide accurate information when creating an account. You are responsible for:</p>
                <ul>
                    <li>Maintaining the confidentiality of your account.</li>
                    <li>Keeping your login credentials secure.</li>
                    <li>Providing accurate information.</li>
                    <li>All activities performed through your account.</li>
                </ul>
                <p>Do not share your password or OTP with others.</p>
            </>
        ),
    },
    {
        n: 3,
        title: "Customer Responsibilities",
        icon: ShoppingBag,
        summary: "Accurate details, correct orders, and required payment.",
        body: (
            <ul>
                <li>Provide accurate delivery information.</li>
                <li>Select the correct store and products.</li>
                <li>Verify order details before confirmation.</li>
                <li>Make required payments.</li>
                <li>Follow applicable store policies.</li>
            </ul>
        ),
    },
    {
        n: 4,
        title: "Seller Responsibilities",
        icon: Store,
        summary: "Accurate listings, lawful products, and honoring orders.",
        body: (
            <ul>
                <li>Providing accurate product information.</li>
                <li>Maintaining correct prices.</li>
                <li>Maintaining accurate stock information.</li>
                <li>Fulfilling accepted orders.</li>
                <li>Providing genuine and lawful products.</li>
                <li>Following applicable laws and regulations.</li>
                <li>Honoring applicable return/refund policies.</li>
            </ul>
        ),
    },
    {
        n: 5,
        title: "Product Information",
        icon: ClipboardList,
        summary: "What a listing includes, and who's responsible for it.",
        body: (
            <>
                <p>Product information may include:</p>
                <ul>
                    <li>Product name</li>
                    <li>Description</li>
                    <li>Images</li>
                    <li>Price</li>
                    <li>Stock availability</li>
                    <li>Seller information</li>
                </ul>
                <p>
                    Product images generated or assisted by technology may be illustrative. Sellers are
                    responsible for ensuring that product information accurately represents the products
                    they sell.
                </p>
            </>
        ),
    },
    {
        n: 6,
        title: "Pricing",
        icon: IndianRupee,
        summary: "Price can vary by account type and quantity.",
        body: (
            <>
                <p>Prices may differ depending on the customer type and seller pricing configuration. For example, a seller may offer:</p>
                <ul>
                    <li>Customer price</li>
                    <li>Store Owner/Business price</li>
                    <li>Bulk pricing</li>
                </ul>
                <p>
                    The applicable price will be displayed based on the user's account type and
                    applicable quantity/pricing rules.
                </p>
            </>
        ),
    },
    {
        n: 7,
        title: "Orders",
        icon: Package,
        summary: "When an order is submitted, and what affects fulfillment.",
        body: (
            <>
                <p>An order is submitted when the customer confirms the purchase through the applicable checkout process.</p>
                <p>Order acceptance and fulfillment may depend on:</p>
                <ul>
                    <li>Product availability</li>
                    <li>Seller acceptance</li>
                    <li>Payment status</li>
                    <li>Delivery availability</li>
                    <li>Other operational conditions</li>
                </ul>
            </>
        ),
    },
    {
        n: 8,
        title: "Delivery and Pickup",
        icon: Truck,
        summary: "Self pickup or home delivery — availability may vary.",
        body: (
            <>
                <p><strong>Self Pickup:</strong> the customer collects the order from the selected store.</p>
                <p><strong>Home Delivery:</strong> the seller or applicable delivery service delivers the order to the customer's selected address.</p>
                <p>Delivery availability, fees, and estimated times may vary.</p>
            </>
        ),
    },
    {
        n: 9,
        title: "Payments",
        icon: CreditCard,
        summary: "UPI, gateways, or cash — provide accurate payment info.",
        body: (
            <>
                <p>Remise may support payment methods including:</p>
                <ul>
                    <li>UPI/QR payments</li>
                    <li>Online payment gateways</li>
                    <li>Cash</li>
                </ul>
                <p>Online payments may be processed through third-party providers such as Razorpay or Cashfree.</p>
                <p>Users must provide accurate payment information and must not attempt fraudulent transactions.</p>
            </>
        ),
    },
    {
        n: 10,
        title: "Cancellations, Returns and Refunds",
        icon: RotateCcw,
        summary: "Governed by order status, seller policy, and our Returns Policy.",
        body: (
            <p>
                Orders may be cancelled, returned, replaced, or refunded according to the applicable
                order status, seller policy, and Remise's Returns &amp; Refund Policy.
            </p>
        ),
    },
    {
        n: 11,
        title: "Prohibited Activities",
        icon: Ban,
        summary: "What you must not do on Remise.",
        body: (
            <ul>
                <li>Provide false information.</li>
                <li>Create fraudulent accounts.</li>
                <li>Use the platform for illegal activities.</li>
                <li>Upload malicious or unlawful content.</li>
                <li>Manipulate prices or orders fraudulently.</li>
                <li>Attempt to gain unauthorized access.</li>
                <li>Interfere with the operation of the platform.</li>
                <li>Abuse payment or refund systems.</li>
            </ul>
        ),
    },
    {
        n: 12,
        title: "Intellectual Property",
        icon: Copyright,
        summary: "Remise's name, logo, and materials are protected.",
        body: (
            <p>
                The Remise name, logo, software, design, content, and other platform materials are
                protected by applicable intellectual-property laws. Users may not copy, modify,
                distribute, or commercially exploit Remise materials without appropriate authorization.
            </p>
        ),
    },
    {
        n: 13,
        title: "Third-Party Services",
        icon: Plug,
        summary: "Payments, hosting, maps, AI, and more — each with its own terms.",
        body: (
            <>
                <p>Remise may use third-party services for:</p>
                <ul>
                    <li>Payment processing</li>
                    <li>Authentication</li>
                    <li>Hosting</li>
                    <li>Maps/location</li>
                    <li>Notifications</li>
                    <li>AI services</li>
                    <li>Image generation</li>
                    <li>Analytics</li>
                </ul>
                <p>Third-party services may have their own terms and privacy policies.</p>
            </>
        ),
    },
    {
        n: 14,
        title: "Account Suspension",
        icon: UserX,
        summary: "When Remise may suspend or terminate an account.",
        body: (
            <ul>
                <li>Fraudulent activity</li>
                <li>Violation of these Terms</li>
                <li>Illegal activity</li>
                <li>Abuse of the platform</li>
                <li>Security risk</li>
                <li>Other circumstances permitted by law</li>
            </ul>
        ),
    },
    {
        n: 15,
        title: "Limitation of Liability",
        icon: ShieldAlert,
        summary: "What's outside Remise's reasonable control.",
        body: (
            <p>
                To the extent permitted by applicable law, Remise will not be responsible for losses
                arising from circumstances outside its reasonable control, including seller actions,
                delivery delays, payment-provider failures, network failures, or inaccurate
                information provided by users or sellers.
            </p>
        ),
    },
    {
        n: 16,
        title: "Changes to the Service",
        icon: Settings2,
        summary: "We may modify or discontinue parts of the service.",
        body: <p>We may modify, update, suspend, or discontinue parts of the service when necessary.</p>,
    },
    {
        n: 17,
        title: "Changes to These Terms",
        icon: FileEdit,
        summary: "Updates are published through the app or website.",
        body: (
            <p>
                We may update these Terms from time to time. Updated Terms will be published through
                the Remise application or website.
            </p>
        ),
    },
    {
        n: 18,
        title: "Governing Law",
        icon: Scale,
        summary: "Governed by the laws of India.",
        body: (
            <p>
                These Terms shall be governed by the applicable laws of India. Any disputes shall be
                subject to the jurisdiction of the appropriate courts, subject to applicable law.
            </p>
        ),
    },
    {
        n: 19,
        title: "Contact",
        icon: Mail,
        summary: "Questions about these Terms.",
        body: (
            <p>
                For questions regarding these Terms, contact Remise through the official
                support/contact channel.
            </p>
        ),
    },
];

const HIGHLIGHTS = [
    { title: "One account, your responsibility", icon: UserCog, desc: "Keep your login and OTP private — every action on your account is yours." },
    { title: "Sellers vouch for listings", icon: Store, desc: "Store Owners, Wholesalers, and Home Businesses must keep prices, stock, and product info accurate." },
    { title: "Pricing can vary by account", icon: IndianRupee, desc: "You may see a different price than a Store Owner or bulk buyer for the same item." },
    { title: "Pickup or delivery, your choice", icon: Truck, desc: "Availability, fees, and timing can vary by store and location." },
    { title: "India-governed", icon: Scale, desc: "These Terms are governed by Indian law, with disputes subject to the appropriate courts." },
];

// ─────────────────────────────────────────────────────────────────────────
// Hero illustration — a single scene: a document rolling out and a stamp
// coming down to seal it. One orchestrated entrance, one idle pulse on the
// stamp's approval mark — nothing else animates on its own.
// ─────────────────────────────────────────────────────────────────────────
function DocumentIllustration() {
    return (
        <motion.svg viewBox="0 0 480 360" className="w-full max-w-md mx-auto" initial="hidden" animate="show">
            <defs>
                <linearGradient id="tos-red" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF0000" />
                    <stop offset="100%" stopColor="#b30000" />
                </linearGradient>
            </defs>

            <motion.ellipse
                cx="230" cy="312" rx="150" ry="14" fill="#ffffff" opacity="0.06"
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* document */}
            <motion.g
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, delay: 0.05 }}
            >
                <rect x="130" y="70" width="180" height="230" rx="10" fill="#ffffff" opacity="0.95" />
                <rect x="130" y="70" width="180" height="230" rx="10" fill="none" stroke="#0f172a" strokeOpacity="0.08" strokeWidth="2" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <rect
                        key={i}
                        x="155"
                        y={110 + i * 26}
                        width={i % 2 === 0 ? 128 : 96}
                        height="8"
                        rx="4"
                        fill="#0f172a"
                        opacity="0.12"
                    />
                ))}
            </motion.g>

            {/* seal / stamp — descends once, then a gentle approval pulse */}
            <motion.g
                variants={{ hidden: { opacity: 0, y: -40 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            >
                <motion.g
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: "330px 210px" }}
                >
                    <circle cx="330" cy="210" r="48" fill="url(#tos-red)" />
                    <circle cx="330" cy="210" r="48" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3" strokeDasharray="4 6" />
                    <path d="M310 210 l14 14 l28 -30" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                </motion.g>
            </motion.g>
        </motion.svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Numbered article row — the layout device that sets this page apart from
// the Help Center's chevron accordion and the Privacy Policy's card grid.
// A large serif numeral anchors each clause the way a printed contract
// numbers its sections; a plain +/− (not a rotating chevron) toggles it.
// ─────────────────────────────────────────────────────────────────────────
function ArticleRow({
    article,
    isOpen,
    onToggle,
    isLight,
}: {
    article: Article;
    isOpen: boolean;
    onToggle: () => void;
    isLight: boolean;
}) {
    const Icon = article.icon;
    return (
        <div
            id={`article-${article.n}`}
            className={`scroll-mt-40 border-b last:border-b-0 ${isLight ? "border-[#FFD1D1]/60" : "border-white/10"}`}
        >
            <button
                onClick={onToggle}
                aria-expanded={isOpen}
                className={`w-full flex items-start gap-4 sm:gap-5 text-left py-5 sm:py-6 rounded-md ${FOCUS_RING}`}
            >
                <span
                    className={`shrink-0 font-serif text-3xl sm:text-4xl leading-none tabular-nums ${isOpen ? "text-[#FF0000]" : isLight ? "text-gray-300" : "text-white/15"
                        }`}
                >
                    {String(article.n).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                        <Icon size={15} className={isLight ? "text-[#FF0000]" : "text-[#FF6B6B]"} />
                        <h3 className={`text-sm sm:text-base font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                            {article.title}
                        </h3>
                    </div>
                    <p className={`text-xs sm:text-sm mt-1 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                        {article.summary}
                    </p>
                </div>
                <span
                    className={`shrink-0 mt-1 w-7 h-7 rounded-full border flex items-center justify-center ${isLight ? "border-[#FFD1D1] text-gray-500" : "border-white/15 text-gray-400"
                        }`}
                >
                    {isOpen ? <Minus size={13} /> : <Plus size={13} />}
                </span>
            </button>

            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <div
                    className={`pl-[3.1rem] sm:pl-[3.6rem] pb-6 text-sm leading-relaxed space-y-3 [&_ul]:space-y-1.5 [&_ul]:list-none [&_li]:relative [&_li]:pl-4 ${isLight ? "text-gray-600" : "text-gray-400"
                        }`}
                >
                    <div
                        className={
                            isLight
                                ? "[&_li]:before:content-['•'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[#FF0000]"
                                : "[&_li]:before:content-['•'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[#FF6B6B]"
                        }
                    >
                        {article.body}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────
export default function TermsOfServicePage() {
    const [theme, setTheme] = useState<"dark" | "light">("light");
    const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
    const isLight = theme === "light";

    const [openSet, setOpenSet] = useState<Set<number>>(new Set([1]));
    const [progress, setProgress] = useState(0);

    const toggle = (n: number) =>
        setOpenSet((cur) => {
            const next = new Set(cur);
            next.has(n) ? next.delete(n) : next.add(n);
            return next;
        });

    const expandAll = () => setOpenSet(new Set(ARTICLES.map((a) => a.n)));
    const collapseAll = () => setOpenSet(new Set());

    // Reading-progress bar — the animation that answers the reader's own
    // scrolling, rather than motion that plays on its own.
    useEffect(() => {
        const onScroll = () => {
            const doc = document.documentElement;
            const scrollTop = doc.scrollTop || document.body.scrollTop;
            const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
            setProgress(scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToArticle = (n: number) => {
        setOpenSet((cur) => new Set(cur).add(n));
        document.getElementById(`article-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className={isLight ? "bg-white" : "bg-[#0f172a]"}>
            {/* Reading progress bar, sits above the navbar's own chrome */}
            <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent">
                <motion.div
                    className="h-full bg-[#FF0000] origin-left"
                    style={{ scaleX: progress }}
                    transition={{ duration: 0.1 }}
                />
            </div>

            <NavbarHome theme={theme} toggleTheme={toggleTheme} />

            {/* Spacer for the fixed navbar */}
            <div className="pt-16 sm:pt-28 lg:pt-36" />

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-[#0f172a]">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background:
                            "radial-gradient(600px circle at 85% 15%, rgba(255,0,0,0.35), transparent 60%), radial-gradient(500px circle at 10% 85%, rgba(255,0,0,0.18), transparent 55%)",
                    }}
                />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-14 sm:pb-20 grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#FF6B6B] bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-5">
                            <FileText size={13} /> Last updated {LAST_UPDATED}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
                            Terms of Service
                        </h1>
                        <p className="mt-4 text-sm sm:text-base text-gray-300 max-w-md leading-relaxed">
                            19 short clauses covering accounts, orders, pricing, payments, and what happens
                            if something goes wrong. By using Remise, you agree to these Terms.
                        </p>
                    </div>
                    <DocumentIllustration />
                </div>
            </section>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                {/* The gist — a handful of highlight cards, distinct from the full
            legal text below, so a reader can get the shape of it fast. */}
                <div className="mb-14">
                    <h2 className={`text-lg sm:text-xl font-black tracking-tight mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>
                        The gist
                    </h2>
                    <p className={`text-sm mb-5 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                        Not a substitute for the full Terms below — just the shape of them.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {HIGHLIGHTS.map((h) => (
                            <div
                                key={h.title}
                                className={`flex items-start gap-3 rounded-2xl border p-4 ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/10 text-[#FF6B6B]"}`}>
                                    <h.icon size={16} />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{h.title}</p>
                                    <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? "text-gray-500" : "text-gray-400"}`}>{h.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Index — a jump-to grid of every clause, instead of a sticky
            sidebar or chip strip */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                            Index
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={expandAll}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${FOCUS_RING} ${isLight ? "border-[#FFD1D1] text-gray-600 hover:border-[#FF0000] hover:text-[#FF0000]" : "border-white/15 text-gray-300 hover:border-[#FF0000] hover:text-[#FF6B6B]"}`}
                            >
                                Expand all
                            </button>
                            <button
                                onClick={collapseAll}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${FOCUS_RING} ${isLight ? "border-[#FFD1D1] text-gray-600 hover:border-[#FF0000] hover:text-[#FF0000]" : "border-white/15 text-gray-300 hover:border-[#FF0000] hover:text-[#FF6B6B]"}`}
                            >
                                Collapse all
                            </button>
                        </div>
                    </div>
                    <div className={`grid sm:grid-cols-2 rounded-2xl border overflow-hidden ${isLight ? "border-[#FFD1D1]" : "border-white/10"}`}>
                        {ARTICLES.map((a) => (
                            <button
                                key={a.n}
                                onClick={() => scrollToArticle(a.n)}
                                className={`flex items-center gap-3 px-4 py-3 text-left border-b sm:border-r sm:[&:nth-child(2n)]:border-r-0 last:border-b-0 ${FOCUS_RING} ${isLight
                                    ? "border-[#FFD1D1]/60 hover:bg-[#FFE5E5]/50"
                                    : "border-white/10 hover:bg-white/5"
                                    }`}
                            >
                                <span className={`text-xs font-bold tabular-nums w-5 shrink-0 ${isLight ? "text-[#FF0000]" : "text-[#FF6B6B]"}`}>
                                    {a.n}
                                </span>
                                <span className={`text-xs sm:text-sm font-medium ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                                    {a.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Full articles */}
                <div>
                    <h2 className={`text-lg sm:text-xl font-black tracking-tight mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
                        Full terms
                    </h2>
                    <div className={`rounded-2xl border px-4 sm:px-6 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
                        {ARTICLES.map((a) => (
                            <ArticleRow
                                key={a.n}
                                article={a}
                                isOpen={openSet.has(a.n)}
                                onToggle={() => toggle(a.n)}
                                isLight={isLight}
                            />
                        ))}
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 mt-14">
                    <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(135deg, #FF0000 0%, #b30000 55%, #0f172a 100%)" }}
                    />
                    <div className="relative px-6 sm:px-10 py-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/80 mb-3">
                                <Mail size={13} /> Questions about these Terms?
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug max-w-md">
                                Contact Remise through the official support channel.
                            </h3>
                        </div>
                        <a
                            href="/services"
                            className={`shrink-0 inline-flex items-center gap-2 bg-white text-[#0f172a] font-bold text-sm px-5 py-3 rounded-xl hover:bg-white/90 transition ${FOCUS_RING}`}
                        >
                            <Mail size={16} /> Get in touch <ArrowRight size={15} />
                        </a>
                    </div>
                </div>
            </div>
            <FooterComponent theme={theme} />
        </div>
    );
}