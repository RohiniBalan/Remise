"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "../components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";
import {
    Rocket,
    Lightbulb,
    BookOpen,
    Handshake,
    Users,
    GraduationCap,
    PenTool,
    TrendingUp,
    Puzzle,
    Target,
    Hammer,
    Search,
    ChevronDown,
    FileText,
    MessageSquare,
    CheckCircle2,
    Briefcase,
    ArrowRight,
    Mail,
    Laptop,
    Palmtree,
    HeartPulse,
    IndianRupee,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONTENT                                                             */
/*  Kept as data so copy/positions can be edited without touching      */
/*  markup. OPEN_POSITIONS is empty on purpose — there are no live     */
/*  openings right now. Wire this array up to your jobs API/database   */
/*  when hiring starts; the empty state below only shows when it's     */
/*  actually empty, so nothing needs to change here once jobs exist.   */
/* ------------------------------------------------------------------ */

const WHY_JOIN = [
    {
        icon: Rocket,
        title: "Make an Impact",
        desc: "Work on features used by real customers.",
    },
    {
        icon: Lightbulb,
        title: "Build & Innovate",
        desc: "Turn ideas into practical solutions.",
    },
    {
        icon: BookOpen,
        title: "Keep Learning",
        desc: "Develop your skills through real projects.",
    },
    {
        icon: Handshake,
        title: "Grow Together",
        desc: "Collaborate with a team that supports growth.",
    },
];

const LIFE_AT_REMISE = [
    {
        icon: Users,
        title: "Collaborate",
        desc: "Work together, share ideas, and learn from one another.",
    },
    {
        icon: GraduationCap,
        title: "Learn",
        desc: "Take on new challenges and continuously develop your skills.",
    },
    {
        icon: PenTool,
        title: "Create",
        desc: "Turn ideas into features and experiences that solve real problems.",
    },
    {
        icon: TrendingUp,
        title: "Grow",
        desc: "Take ownership of your work and grow along with the company.",
    },
];

const WHAT_WE_LOOK_FOR = [
    {
        icon: Lightbulb,
        title: "Curious",
        desc: "We value people who enjoy learning and exploring new ideas.",
    },
    {
        icon: Puzzle,
        title: "Problem Solvers",
        desc: "We look for people who approach challenges thoughtfully.",
    },
    {
        icon: Handshake,
        title: "Team Players",
        desc: "Great products are built through collaboration.",
    },
    {
        icon: Target,
        title: "Ownership",
        desc: "Take responsibility for your work and follow it through.",
    },
    {
        icon: TrendingUp,
        title: "Growth Mindset",
        desc: "Be willing to learn, adapt, and improve.",
    },
    {
        icon: Hammer,
        title: "Builders",
        desc: "We value people who turn ideas into practical solutions.",
    },
];

type Job = {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    summary: string;
    stack: string[];
};

// No live openings right now — replace with a real fetch from your
// jobs API when a role opens up. The section below already renders
// an empty state whenever this array is empty, so no markup changes
// are needed later.
const OPEN_POSITIONS: Job[] = [];

const HIRING_STEPS = [
    {
        icon: FileText,
        title: "Apply",
        desc: "Submit your application for a position that matches your skills.",
    },
    {
        icon: Search,
        title: "Application Review",
        desc: "Our team reviews your application and experience.",
    },
    {
        icon: MessageSquare,
        title: "Interview",
        desc: "Discuss your experience, skills, and the role with our team.",
    },
    {
        icon: CheckCircle2,
        title: "Decision",
        desc: "We'll get back to you with the next steps.",
    },
];

// Only list benefits Remise actually provides — update this list to
// match real HR policy before shipping.
const BENEFITS = [
    { icon: Laptop, label: "Flexible Work" },
    { icon: BookOpen, label: "Learning & Development" },
    { icon: Palmtree, label: "Paid Time Off" },
    { icon: HeartPulse, label: "Health Benefits" },
    { icon: IndianRupee, label: "Competitive Compensation" },
    { icon: Rocket, label: "Growth Opportunities" },
];

/* ------------------------------------------------------------------ */
/*  SMALL VISUAL PIECES                                                 */
/*  Flat SVG marks (not stock photography) in the same style as the    */
/*  About page — keeps things license-clean and visually consistent.   */
/* ------------------------------------------------------------------ */

function HeroMark({ isDarkMode }: { isDarkMode: boolean }) {
    return (
        <svg viewBox="0 0 320 320" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="careersHeroGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <circle cx="160" cy="160" r="130" fill="url(#careersHeroGrad)" opacity="0.12" />
            <circle
                cx="160"
                cy="160"
                r="92"
                fill="none"
                stroke="url(#careersHeroGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
                opacity="0.5"
            />
            {/* laptop base */}
            <rect x="90" y="196" width="140" height="10" rx="4" fill="url(#careersHeroGrad)" />
            <rect
                x="106"
                y="120"
                width="108"
                height="76"
                rx="6"
                fill={isDarkMode ? "#0a0a0a" : "#fff"}
                stroke="url(#careersHeroGrad)"
                strokeWidth="4"
            />
            <rect x="118" y="134" width="84" height="8" rx="2" fill="url(#careersHeroGrad)" opacity="0.7" />
            <rect x="118" y="150" width="60" height="8" rx="2" fill="url(#careersHeroGrad)" opacity="0.4" />
            {/* rocket rising from the screen */}
            <g transform="translate(190 70)">
                <path d="M0 40 C0 15 12 0 12 0 C12 0 24 15 24 40 C24 48 18 54 12 54 C6 54 0 48 0 40Z" fill="url(#careersHeroGrad)" />
                <circle cx="12" cy="24" r="5" fill={isDarkMode ? "#0a0a0a" : "#fff"} />
                <path d="M0 40 L-10 54 L0 50Z" fill="url(#careersHeroGrad)" opacity="0.8" />
                <path d="M24 40 L34 54 L24 50Z" fill="url(#careersHeroGrad)" opacity="0.8" />
            </g>
        </svg>
    );
}

function TeamMark() {
    return (
        <svg viewBox="0 0 320 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="careersTeamGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            {[
                { cx: 110, cy: 100, r: 34 },
                { cx: 160, cy: 80, r: 40 },
                { cx: 210, cy: 100, r: 34 },
            ].map((c, i) => (
                <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="url(#careersTeamGrad)" opacity={0.18 + i * 0.06} />
            ))}
            <circle cx="110" cy="92" r="10" fill="url(#careersTeamGrad)" />
            <circle cx="160" cy="72" r="12" fill="url(#careersTeamGrad)" />
            <circle cx="210" cy="92" r="10" fill="url(#careersTeamGrad)" />
            <path d="M85 130 Q110 105 135 130" stroke="url(#careersTeamGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M130 130 Q160 95 190 130" stroke="url(#careersTeamGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M185 130 Q210 105 235 130" stroke="url(#careersTeamGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
    );
}

function CTAMark() {
    return (
        <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="careersCtaGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF4D4D" />
                    <stop offset="100%" stopColor="#B30000" />
                </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="70" fill="url(#careersCtaGrad)" opacity="0.12" />
            <circle cx="100" cy="100" r="46" fill="none" stroke="url(#careersCtaGrad)" strokeWidth="3" opacity="0.5" />
            <circle cx="100" cy="100" r="24" fill="none" stroke="url(#careersCtaGrad)" strokeWidth="3" opacity="0.7" />
            <circle cx="100" cy="100" r="8" fill="url(#careersCtaGrad)" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  CAREERS PAGE                                                        */
/* ------------------------------------------------------------------ */

const DEPARTMENTS = ["All Departments", "Engineering", "Product", "Design", "Marketing", "Sales", "Operations", "Customer Support"];
const LOCATIONS = ["All Locations", "Coimbatore", "Remote"];
const EMPLOYMENT_TYPES = ["All Types", "Full Time", "Part Time", "Internship"];

export default function CareersPage() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const isDarkMode = theme === "dark";

    const [query, setQuery] = useState("");
    const [department, setDepartment] = useState(DEPARTMENTS[0]);
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [employmentType, setEmploymentType] = useState(EMPLOYMENT_TYPES[0]);

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

    const filteredJobs = useMemo(() => {
        return OPEN_POSITIONS.filter((job) => {
            const matchesQuery = query.trim()
                ? job.title.toLowerCase().includes(query.trim().toLowerCase())
                : true;
            const matchesDept = department === "All Departments" || job.department === department;
            const matchesLocation = location === "All Locations" || job.location === location;
            const matchesType = employmentType === "All Types" || job.type === employmentType;
            return matchesQuery && matchesDept && matchesLocation && matchesType;
        });
    }, [query, department, location, employmentType]);

    const cardBase = isDarkMode ? "bg-neutral-950/80 border-[#FF0000]/20" : "bg-white border-[#FF3333]/30";
    const eyebrowColor = isDarkMode ? "text-[#FF0000]/80" : "text-[#990000]";
    const selectBase = isDarkMode
        ? "bg-neutral-950/80 border-[#FF0000]/20 text-gray-300"
        : "bg-white border-[#FF3333]/30 text-slate-700";

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
                                    <Rocket className="w-4 h-4 text-white" />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
                                    Careers at Remise
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter mb-5 leading-tight">
                                <span className={isDarkMode ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" : "text-slate-900"}>
                                    Build the future of{" "}
                                </span>
                                <span
                                    className={`bg-gradient-to-r from-[#FF4D4D] via-[#FF0000] to-[#B30000] bg-clip-text text-transparent ${isDarkMode ? "drop-shadow-[0_0_20px_rgba(255,0,0,0.3)]" : ""
                                        }`}
                                >
                                    local commerce with us
                                </span>
                            </h1>
                            <p className={`text-base sm:text-lg font-medium mb-3 max-w-xl ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                We're building technology that makes shopping simpler for customers and
                                helps local businesses connect with more people. Join us and be part of
                                the journey.
                            </p>
                            <p className={`text-sm sm:text-base font-bold italic mb-8 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`}>
                                Build. Learn. Create. Make an Impact.
                            </p>
                            <a
                                href="#open-positions"
                                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                            >
                                <span>View Open Positions</span>
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

                    {/* WHY JOIN REMISE */}
                    <div className="mb-20 sm:mb-24">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <div className="flex justify-center items-center gap-3 mb-4">
                                <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
                                <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Why Join Remise?</h2>
                            </div>
                            <p className={`text-sm sm:text-base font-medium ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                At Remise, you'll work on real products that solve real-world problems.
                                We believe in learning, collaboration, ownership, and building technology
                                that creates meaningful value for customers and businesses.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                            {WHY_JOIN.map((item, i) => {
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

                    {/* LIFE AT REMISE */}
                    <div className={`rounded-3xl p-8 sm:p-12 border backdrop-blur-xl mb-20 sm:mb-24 ${cardBase}`}>
                        <div className="flex items-center gap-3 sm:gap-4 mb-6">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Life at Remise</h2>
                        </div>
                        <p className={`text-sm sm:text-base leading-relaxed max-w-3xl mb-8 ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                            We believe great products are built by people who enjoy solving problems
                            together. At Remise, we encourage collaboration, curiosity, ownership, and
                            continuous learning.
                        </p>
                        <div className="w-full max-w-md mx-auto h-28 sm:h-32 mb-8 opacity-90">
                            <TeamMark />
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                            {LIFE_AT_REMISE.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <div key={i} className="text-center">
                                        <div
                                            className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center border mb-3 ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                        </div>
                                        <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                                        <p className={`text-xs leading-relaxed ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                            {item.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* WHAT WE LOOK FOR */}
                    <div className="mb-20 sm:mb-24">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Who We're Looking For</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                            {WHAT_WE_LOOK_FOR.map((item, i) => {
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

                    {/* OPEN POSITIONS */}
                    <div id="open-positions" className="mb-20 sm:mb-24 scroll-mt-32">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Open Positions</h2>
                        </div>

                        {/* Search + filters */}
                        <div className={`rounded-2xl border backdrop-blur-xl p-4 sm:p-5 mb-6 ${cardBase}`}>
                            <div className="flex flex-col sm:flex-row gap-3 mb-3">
                                <div className="relative flex-1">
                                    <Search
                                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}
                                    />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search jobs..."
                                        className={`w-full rounded-xl border pl-11 pr-4 py-3 text-sm outline-none transition-colors ${isDarkMode
                                            ? "bg-black/40 border-[#FF0000]/20 text-white placeholder-gray-500 focus:border-[#FF0000]/50"
                                            : "bg-white border-[#FF3333]/30 text-slate-900 placeholder-slate-400 focus:border-[#FF0000]"
                                            }`}
                                    />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {[
                                    { value: department, setValue: setDepartment, options: DEPARTMENTS },
                                    { value: location, setValue: setLocation, options: LOCATIONS },
                                    { value: employmentType, setValue: setEmploymentType, options: EMPLOYMENT_TYPES },
                                ].map((f, i) => (
                                    <div key={i} className="relative">
                                        <select
                                            value={f.value}
                                            onChange={(e) => f.setValue(e.target.value)}
                                            className={`w-full appearance-none rounded-xl border pl-4 pr-9 py-3 text-sm outline-none cursor-pointer transition-colors ${selectBase}`}
                                        >
                                            {f.options.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Job list / empty state */}
                        {filteredJobs.length > 0 ? (
                            <div className="space-y-4">
                                {filteredJobs.map((job) => (
                                    <div
                                        key={job.id}
                                        className={`rounded-2xl border backdrop-blur-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${cardBase}`}
                                    >
                                        <div>
                                            <h3 className="font-bold text-base sm:text-lg mb-1">{job.title}</h3>
                                            <p className={`text-xs sm:text-sm mb-2 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`}>
                                                {job.department} · {job.type} · {job.location}
                                            </p>
                                            <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>{job.summary}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {job.stack.map((s) => (
                                                    <span
                                                        key={s}
                                                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${isDarkMode ? "bg-[#FF0000]/10 text-[#FF3333]" : "bg-[#FFCCCC] text-[#990000]"
                                                            }`}
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <a
                                            href={`/careers/${job.id}`}
                                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs tracking-widest uppercase whitespace-nowrap border transition-colors ${isDarkMode
                                                ? "border-[#FF0000]/40 text-[#FF3333] hover:bg-[#FF0000]/10"
                                                : "border-[#FF0000] text-[#990000] hover:bg-[#FFF0F0]"
                                                }`}
                                        >
                                            View Position <ArrowRight className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`rounded-3xl border backdrop-blur-xl p-10 sm:p-16 text-center ${cardBase}`}>
                                <div
                                    className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border mb-5 ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                        }`}
                                >
                                    <Briefcase className={`w-6 h-6 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                </div>
                                <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest mb-2">
                                    No Open Positions at the Moment
                                </h3>
                                <p className={`text-sm sm:text-base max-w-md mx-auto ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                    We're always growing. Check back soon for new opportunities — or share
                                    your resume below and we'll reach out when a role fits.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* HIRING PROCESS */}
                    <div className="mb-20 sm:mb-24">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Our Hiring Process</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                            {HIRING_STEPS.map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={i} className={`rounded-2xl p-5 sm:p-6 border backdrop-blur-xl ${cardBase}`}>
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-xs mb-3 ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20 text-[#FF3333]" : "bg-[#FFCCCC] border-[#FF9999] text-[#990000]"
                                                }`}
                                        >
                                            {String(i + 1).padStart(2, "0")}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Icon className={`w-4 h-4 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                            <h3 className="font-bold text-sm sm:text-base">{step.title}</h3>
                                        </div>
                                        <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                            {step.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* BENEFITS */}
                    <div className={`rounded-3xl p-8 sm:p-12 border backdrop-blur-xl mb-20 sm:mb-24 ${cardBase}`}>
                        <div className="flex items-center gap-3 sm:gap-4 mb-8">
                            <div className="w-1.5 h-6 sm:h-8 rounded-full bg-gradient-to-b from-[#FF3333] to-[#990000] shadow-[0_0_10px_rgba(255,0,0,0.5)] flex-shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">What We Offer</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                            {BENEFITS.map((b, i) => {
                                const Icon = b.icon;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-[#FF0000]/10 border-[#FF0000]/20" : "bg-[#FFCCCC] border-[#FF9999]"
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isDarkMode ? "text-[#FF3333]" : "text-[#990000]"}`} />
                                        </div>
                                        <span className="text-sm font-bold">{b.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* DON'T SEE THE RIGHT ROLE */}
                    {/* <div className={`rounded-3xl p-8 sm:p-12 border backdrop-blur-xl mb-20 sm:mb-24 grid lg:grid-cols-2 gap-10 items-center ${cardBase}`}>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">Don't See a Role That Fits?</h2>
                            <p className={`text-sm sm:text-base leading-relaxed mb-6 ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                We're always interested in meeting talented people. If you don't see an
                                open position that matches your experience, you can still share your
                                profile with us.
                            </p>
                            <a
                                href="mailto:porulontechnologies@gmail.com?subject=Resume%20Submission%20-%20Remise"
                                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                            >
                                <Mail className="w-4 h-4" />
                                <span>Send Your Resume</span>
                            </a>
                        </div>
                        <div className="hidden lg:flex justify-center opacity-90">
                            <div className="w-48 h-48">
                                <CTAMark />
                            </div>
                        </div>
                    </div> */}

                    {/* FINAL CTA */}
                    <div
                        className={`rounded-3xl p-8 sm:p-12 border relative overflow-hidden text-center ${isDarkMode
                            ? "bg-neutral-950 border-[#FF0000]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            : "bg-white border-[#FF3333]/50 shadow-[0_20px_50px_rgba(255,0,0,0.15)]"
                            }`}
                    >
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] ${isDarkMode ? "bg-[#FF0000]/10" : "bg-[#FF6666]/30"}`} />
                        <div className="relative z-10">
                            <h3 className={`text-2xl sm:text-3xl font-black uppercase tracking-widest mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                Ready to build with us?
                            </h3>
                            <p className={`text-sm sm:text-base max-w-xl mx-auto mb-8 font-medium ${isDarkMode ? "text-gray-400" : "text-slate-600"}`}>
                                Explore opportunities and find your next challenge at Remise.
                            </p>
                            <a
                                href="#open-positions"
                                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#CC0000] bg-[length:200%_auto] hover:bg-[position:right_center] text-black shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-105"
                            >
                                <span>View Open Positions</span>
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