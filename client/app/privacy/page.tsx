"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  User,
  MapPin,
  Store,
  Package,
  Smartphone,
  Mic,
  ScanLine,
  Settings2,
  Share2,
  Database,
  Clock,
  UserCheck,
  Baby,
  RefreshCw,
  Mail,
  ArrowRight,
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
  Ban,
  CreditCard,
  QrCode,
  Fingerprint,
} from "lucide-react";

// Adjust this import path to wherever NavbarHome actually lives in your project.
// Same navbar used across the rest of the site (Home, /services, /help-center).
import NavbarHome from "@/app/components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";

// ─────────────────────────────────────────────────────────────────────────
// Brand tokens — identical to the Help Center page, so this drops in next
// to the rest of the site without a visual seam.
// ─────────────────────────────────────────────────────────────────────────
// red        #FF0000  |  red hover   #e00000  |  red deep (gradients) #b30000
// red tint   #FFE5E5  |  red border  #FFD1D1  |  dark-mode red accent #FF6B6B
// navy       #0f172a  |  navy border #2d3748  |  light surface        #F5F5F5

const FOCUS_RING =
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0000]";

const LAST_UPDATED = "20 August 2026";

// ─────────────────────────────────────────────────────────────────────────
// Content model
// ─────────────────────────────────────────────────────────────────────────
type Section = {
  id: string;
  navLabel: string;
  title: string;
  icon: React.ElementType;
};

const SECTIONS: Section[] = [
  { id: "collect", navLabel: "What we collect", title: "Information We Collect", icon: Database },
  { id: "voice-scan", navLabel: "Voice & scanning", title: "Voice and Scanning Features", icon: Mic },
  { id: "use", navLabel: "How we use it", title: "How We Use Information", icon: Settings2 },
  { id: "payments", navLabel: "Payments", title: "Payments", icon: CreditCard },
  { id: "sharing", navLabel: "Who we share with", title: "Information Sharing", icon: Share2 },
  { id: "security", navLabel: "Security", title: "Data Security", icon: Lock },
  { id: "retention", navLabel: "Retention", title: "Data Retention", icon: Clock },
  { id: "rights", navLabel: "Your rights", title: "Your Rights", icon: UserCheck },
  { id: "children", navLabel: "Children", title: "Children's Privacy", icon: Baby },
  { id: "changes", navLabel: "Policy changes", title: "Policy Changes", icon: RefreshCw },
  { id: "contact", navLabel: "Contact", title: "Contact", icon: Mail },
];

const DATA_CATEGORIES = [
  {
    title: "Account information",
    icon: User,
    items: ["Name", "Email address", "Mobile number", "Password / authentication information"],
  },
  {
    title: "Profile information",
    icon: Fingerprint,
    items: ["Profile photo", "Address", "Location information", "Account preferences"],
  },
  {
    title: "Seller information",
    icon: Store,
    items: ["Store name & address", "Business information", "Product & pricing information", "Stock information", "Payment / UPI details"],
    note: "Collected for Store Owners, Wholesalers, and Home Businesses.",
  },
  {
    title: "Order information",
    icon: Package,
    items: ["Products ordered", "Quantities & prices", "Store selected", "Delivery method", "Order status", "Transaction information"],
  },
  {
    title: "Location information",
    icon: MapPin,
    items: ["Used to find nearby stores", "Calculate store distance", "Support delivery"],
    note: "Only collected with your permission.",
  },
  {
    title: "Device & technical information",
    icon: Smartphone,
    items: ["Device type & OS", "IP address", "App / browser information", "Diagnostic information"],
  },
];

const USE_ITEMS = [
  "Create and manage accounts",
  "Process orders",
  "Compare nearby stores",
  "Calculate prices",
  "Process payments",
  "Facilitate delivery or pickup",
  "Manage products and inventory",
  "Send order notifications",
  "Prevent fraud and misuse",
  "Provide customer support",
  "Improve our services",
  "Maintain security",
  "Comply with legal requirements",
];

const SHARE_WITH = [
  { title: "Sellers", desc: "To fulfil the order you place.", icon: Store },
  { title: "Payment providers", desc: "To process your payment securely.", icon: CreditCard },
  { title: "Delivery partners", desc: "To get your order to you.", icon: Package },
  { title: "Hosting & technology providers", desc: "To keep Remise running.", icon: Database },
  { title: "Customer support providers", desc: "To help resolve your queries.", icon: Mail },
  { title: "Authorities", desc: "Only when required by law.", icon: ShieldCheck },
];

const RIGHTS = [
  { title: "Access", desc: "Request a copy of what we hold about you.", icon: Eye },
  { title: "Correction", desc: "Fix information that's inaccurate.", icon: Pencil },
  { title: "Update", desc: "Keep your details current.", icon: RotateCcw },
  { title: "Deletion", desc: "Ask us to remove your information.", icon: Trash2 },
  { title: "Withdrawal", desc: "Withdraw certain permissions you've given.", icon: Ban },
];

// ─────────────────────────────────────────────────────────────────────────
// Hero illustration — a single self-contained scene: a shield locking
// around the pieces of a profile (the promise of the page). One orchestrated
// entrance, one gentle idle pulse on the lock — nothing else moves on its own.
// ─────────────────────────────────────────────────────────────────────────
function ShieldIllustration() {
  return (
    <motion.svg
      viewBox="0 0 480 360"
      className="w-full max-w-md mx-auto"
      initial="hidden"
      animate="show"
    >
      <defs>
        <linearGradient id="pp-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF0000" />
          <stop offset="100%" stopColor="#b30000" />
        </linearGradient>
      </defs>

      <motion.ellipse
        cx="240" cy="308" rx="150" ry="14"
        fill="#ffffff" opacity="0.06"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* orbiting data chips: profile / location / order — represent the
          categories of data the shield protects */}
      {[
        { cx: 140, cy: 120, Icon: User },
        { cx: 340, cy: 110, Icon: MapPin },
        { cx: 360, cy: 230, Icon: Package },
      ].map((chip, i) => (
        <motion.g
          key={chip.cx}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, delay: 0.08 * i }}
        >
          <circle cx={chip.cx} cy={chip.cy} r="26" fill="#ffffff" opacity="0.06" />
        </motion.g>
      ))}

      {/* central shield */}
      <motion.g
        variants={{ hidden: { opacity: 0, y: 24, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1 } }}
        transition={{ duration: 0.55, delay: 0.2 }}
      >
        <path
          d="M240 60 L330 96 V180 C330 240 292 278 240 300 C188 278 150 240 150 180 V96 Z"
          fill="url(#pp-red)"
        />
        <path
          d="M240 78 L312 108 V180 C312 230 280 262 240 281 C200 262 168 230 168 180 V108 Z"
          fill="#0f172a"
          opacity="0.25"
        />
        <motion.g
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="216" y="176" width="48" height="38" rx="8" fill="#ffffff" />
          <path
            d="M226 176 v-16 a14 14 0 0 1 28 0 v16"
            stroke="#ffffff"
            strokeWidth="8"
            fill="none"
          />
          <circle cx="240" cy="195" r="6" fill="#FF0000" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Small building blocks
// ─────────────────────────────────────────────────────────────────────────
function Prose({ children, isLight }: { children: React.ReactNode; isLight: boolean }) {
  return (
    <p className={`text-sm leading-relaxed ${isLight ? "text-gray-600" : "text-gray-400"}`}>
      {children}
    </p>
  );
}

function SectionHeading({
  title,
  icon: Icon,
  isLight,
}: {
  title: string;
  icon: React.ElementType;
  isLight: boolean;
}) {
  return (
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
  );
}

function InfoCard({
  title,
  icon: Icon,
  items,
  note,
  isLight,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  note?: string;
  isLight: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 h-full flex flex-col ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"
        }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"
          }`}
      >
        <Icon size={18} />
      </div>
      <p className={`font-bold text-sm mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>{title}</p>
      <ul className="space-y-1.5 flex-1">
        {items.map((it) => (
          <li
            key={it}
            className={`text-xs leading-relaxed flex gap-2 ${isLight ? "text-gray-500" : "text-gray-400"}`}
          >
            <span className="text-[#FF0000] mt-0.5">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
      {note && (
        <p className={`text-[11px] mt-3 pt-3 border-t italic ${isLight ? "border-[#FFD1D1]/60 text-gray-400" : "border-white/10 text-gray-500"}`}>
          {note}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────
export default function PrivacyPolicyPage() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const isLight = theme === "light";

  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Track which section is in view, to highlight the sidebar / chip nav —
  // this is the one piece of "own" interactivity the layout needs.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

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
              "radial-gradient(600px circle at 85% 20%, rgba(255,0,0,0.35), transparent 60%), radial-gradient(500px circle at 15% 80%, rgba(255,0,0,0.18), transparent 55%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-14 sm:pb-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#FF6B6B] bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-5">
              <ShieldCheck size={13} /> Last updated {LAST_UPDATED}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-300 max-w-md leading-relaxed">
              This explains what Remise collects, how it's used, who it's shared with, and the
              choices you have — for customers, sellers, and everyone in between.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {["Data we collect", "How it's used", "Your rights"].map((label, i) => (
                <button
                  key={label}
                  onClick={() => scrollTo([SECTIONS[0].id, SECTIONS[2].id, SECTIONS[7].id][i])}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-200 hover:border-[#FF0000] hover:text-white transition ${FOCUS_RING}`}
                >
                  {label} <ArrowRight size={13} />
                </button>
              ))}
            </div>
          </div>
          <ShieldIllustration />
        </div>
      </section>

      {/* ── Mobile section nav (sticky chip strip, echoes Help Center) ── */}
      <div
        className={`lg:hidden sticky top-16 sm:top-28 z-20 border-b backdrop-blur ${isLight ? "bg-white/90 border-[#FFD1D1]" : "bg-[#0f172a]/90 border-white/10"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${FOCUS_RING} ${activeId === s.id
                  ? "bg-[#FF0000] border-[#FF0000] text-white"
                  : isLight
                    ? "border-[#FFD1D1] text-gray-600 hover:border-[#FF0000] hover:text-[#FF0000]"
                    : "border-white/10 text-gray-300 hover:border-[#FF0000] hover:text-[#FF6B6B]"
                  }`}
              >
                <s.icon size={13} />
                {s.navLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: sticky sidebar (desktop) + content — the layout that   */}
      {/*    sets this page apart from the Help Center's FAQ accordion   */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
          {/* Sidebar nav — desktop only */}
          <aside className="hidden lg:block">
            <nav className="sticky top-40 space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${FOCUS_RING} ${activeId === s.id
                    ? "bg-[#FFE5E5] text-[#FF0000]"
                    : isLight
                      ? "text-gray-500 hover:text-[#FF0000] hover:bg-[#FFE5E5]/60"
                      : "text-gray-400 hover:text-[#FF6B6B] hover:bg-white/5"
                    } ${activeId === s.id && !isLight ? "!bg-white/10 !text-[#FF6B6B]" : ""}`}
                >
                  <s.icon size={14} className="shrink-0" />
                  {s.navLabel}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-16 min-w-0">
            {/* What we collect */}
            <section
              id="collect"
              ref={(el) => { sectionRefs.current["collect"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Information We Collect" icon={Database} isLight={isLight} />
              <Prose isLight={isLight}>
                Depending on how you use Remise, we may collect information across the
                following categories.
              </Prose>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
                {DATA_CATEGORIES.map((cat) => (
                  <InfoCard key={cat.title} {...cat} isLight={isLight} />
                ))}
              </div>
            </section>

            {/* Voice & scanning */}
            <section
              id="voice-scan"
              ref={(el) => { sectionRefs.current["voice-scan"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Voice and Scanning Features" icon={Mic} isLight={isLight} />
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div className={`rounded-2xl border p-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"}`}>
                    <Mic size={18} />
                  </div>
                  <p className={`font-bold text-sm mb-1.5 ${isLight ? "text-gray-900" : "text-white"}`}>Voice search</p>
                  <Prose isLight={isLight}>
                    If you use voice-based features, Remise may process your voice input to
                    convert it into text and identify product names or order requirements.
                  </Prose>
                </div>
                <div className={`rounded-2xl border p-5 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"}`}>
                    <ScanLine size={18} />
                  </div>
                  <p className={`font-bold text-sm mb-1.5 ${isLight ? "text-gray-900" : "text-white"}`}>Image scanning</p>
                  <Prose isLight={isLight}>
                    If you use image scanning, uploaded images may be processed to identify
                    products and extract relevant information.
                  </Prose>
                </div>
              </div>
              <p className={`text-xs mt-3 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                Both features are used only to provide the functionality you requested.
              </p>
            </section>

            {/* How we use it */}
            <section
              id="use"
              ref={(el) => { sectionRefs.current["use"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="How We Use Information" icon={Settings2} isLight={isLight} />
              <div className={`rounded-2xl border p-5 sm:p-6 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {USE_ITEMS.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF0000] shrink-0" />
                      <span className={`text-sm ${isLight ? "text-gray-700" : "text-gray-300"}`}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Payments */}
            <section
              id="payments"
              ref={(el) => { sectionRefs.current["payments"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Payments" icon={CreditCard} isLight={isLight} />
              <Prose isLight={isLight}>
                Payments may be processed through third-party payment providers such as
                Razorpay or Cashfree, where applicable.
              </Prose>
              <div className="flex items-start gap-2.5 rounded-xl border border-[#FF0000]/25 bg-[#FF0000]/[0.06] px-4 py-3 mt-4">
                <QrCode size={15} className="text-[#FF0000] mt-0.5 shrink-0" />
                <p className={`text-xs leading-relaxed ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                  <span className="font-bold">Remise does not need to store</span> sensitive
                  payment credentials such as UPI PINs, card PINs, or banking passwords. Payment
                  providers process payment information according to their own privacy policies
                  and terms.
                </p>
              </div>
            </section>

            {/* Sharing */}
            <section
              id="sharing"
              ref={(el) => { sectionRefs.current["sharing"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Information Sharing" icon={Share2} isLight={isLight} />
              <Prose isLight={isLight}>
                We may share necessary information with the parties below — never beyond what's
                reasonably required to provide the requested service, except where legally
                required or otherwise permitted.
              </Prose>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
                {SHARE_WITH.map((s) => (
                  <div
                    key={s.title}
                    className={`flex items-start gap-3 rounded-2xl border p-4 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"}`}>
                      <s.icon size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{s.title}</p>
                      <p className={`text-xs mt-0.5 ${isLight ? "text-gray-500" : "text-gray-400"}`}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Security */}
            <section
              id="security"
              ref={(el) => { sectionRefs.current["security"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Data Security" icon={Lock} isLight={isLight} />
              <Prose isLight={isLight}>
                We use reasonable technical and organizational measures to protect user
                information against unauthorized access, alteration, disclosure, or
                destruction. However, no internet-based system can guarantee absolute security.
              </Prose>
            </section>

            {/* Retention */}
            <section
              id="retention"
              ref={(el) => { sectionRefs.current["retention"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Data Retention" icon={Clock} isLight={isLight} />
              <Prose isLight={isLight}>We retain information for as long as necessary to:</Prose>
              <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
                {["Provide our services", "Maintain account and transaction records", "Resolve disputes", "Meet legal and regulatory requirements", "Prevent fraud"].map((r) => (
                  <div
                    key={r}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isLight ? "border-[#FFD1D1] bg-[#F5F5F5]" : "border-white/10 bg-white/5"}`}
                  >
                    <span className={`text-sm font-medium ${isLight ? "text-gray-700" : "text-gray-300"}`}>{r}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Your rights */}
            <section
              id="rights"
              ref={(el) => { sectionRefs.current["rights"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Your Rights" icon={UserCheck} isLight={isLight} />
              <Prose isLight={isLight}>
                Depending on applicable law, you may have rights regarding your personal
                information, including requesting the following. Some information may need to
                be retained where required by law.
              </Prose>
              <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
                {RIGHTS.map((r) => (
                  <div
                    key={r.title}
                    className={`flex flex-col items-center text-center gap-2 rounded-2xl border p-4 ${isLight ? "border-[#FFD1D1] bg-white" : "border-white/10 bg-white/[0.03]"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? "bg-[#FFE5E5] text-[#FF0000]" : "bg-white/5 text-[#FF6B6B]"}`}>
                      <r.icon size={17} />
                    </div>
                    <p className={`text-xs font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{r.title}</p>
                    <p className={`text-[11px] leading-relaxed ${isLight ? "text-gray-500" : "text-gray-400"}`}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Children */}
            <section
              id="children"
              ref={(el) => { sectionRefs.current["children"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Children's Privacy" icon={Baby} isLight={isLight} />
              <Prose isLight={isLight}>
                Remise is not intended for children who are not legally permitted to use the
                service. We do not knowingly collect personal information from children in
                violation of applicable law.
              </Prose>
            </section>

            {/* Changes */}
            <section
              id="changes"
              ref={(el) => { sectionRefs.current["changes"] = el; }}
              className="scroll-mt-48"
            >
              <SectionHeading title="Policy Changes" icon={RefreshCw} isLight={isLight} />
              <Prose isLight={isLight}>
                We may update this Privacy Policy from time to time. Changes will be published
                through the application or website.
              </Prose>
            </section>

            {/* Contact CTA */}
            <section
              id="contact"
              ref={(el) => { sectionRefs.current["contact"] = el; }}
              className="scroll-mt-48 relative overflow-hidden rounded-3xl border border-white/10"
            >
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg, #FF0000 0%, #b30000 55%, #0f172a 100%)" }}
              />
              <div className="relative px-6 sm:px-10 py-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/80 mb-3">
                    <Mail size={13} /> Questions about your data?
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug max-w-md">
                    Contact us for privacy-related questions or requests.
                  </h3>
                  <p className="text-sm text-white/80 mt-2 max-w-md">
                    Reach Remise through the official support/contact channel inside the app.
                  </p>
                </div>
                <a
                  href="/services"
                  className={`shrink-0 inline-flex items-center gap-2 bg-white text-[#0f172a] font-bold text-sm px-5 py-3 rounded-xl hover:bg-white/90 transition ${FOCUS_RING}`}
                >
                  <Mail size={16} /> Get in touch <ArrowRight size={15} />
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

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