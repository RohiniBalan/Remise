"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  User,
  SlidersHorizontal,
  Shield,
  Bell,
  Save,
  Camera,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Trash2,
  LogOut,
} from "lucide-react";
import UserAvatarMenu from "../components-main/UserAvatarMenu";
import {
  normalizeAuthErrorMessage,
  validatePasswordChangeForm,
} from "../utils/authValidation";

// ── Types ────────────────────────────────────────────────────────────────────
interface UserData {
  _id?: string;
  fullname?: string;
  name?: string;
  email?: string;
  mobilenumber?: string;
  role?: string;
  isEmailVerified?: boolean;
}

type Tab = "account" | "preferences" | "security" | "notifications";

// ── Tabs config ──────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Account", icon: <User size={16} /> },
  {
    id: "preferences",
    label: "Preferences",
    icon: <SlidersHorizontal size={16} />,
  },
  { id: "security", label: "Security", icon: <Shield size={16} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
];

// ── Toast helper ─────────────────────────────────────────────────────────────
function Toast({
  msg,
  ok,
  onClose,
}: {
  msg: string;
  ok: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium ${ok ? "bg-green-500" : "bg-[#FF0000]"}`}
    >
      {ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      {msg}
    </div>
  );
}

// ── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab({
  user,
  onSave,
}: {
  user: UserData;
  onSave: (u: Partial<UserData>) => void;
}) {
  const [fullname, setFullname] = useState(user.fullname || user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [mobilenumber, setMobilenumber] = useState(user.mobilenumber || "");
  const [dirty, setDirty] = useState(false);

  const isVerified = user.isEmailVerified !== false;

  const save = () => {
    onSave({ fullname, email, mobilenumber });
    setDirty(false);
  };

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#FF0000] flex items-center justify-center text-2xl font-bold text-white select-none">
            {fullname
              ? fullname
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "U"}
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-[#BBD5DA] rounded-full flex items-center justify-center shadow-sm hover:bg-[#F5F5F5] transition">
            <Camera size={13} className="text-gray-500" />
          </button>
        </div>
        <div>
          <p className="font-bold text-gray-900">{fullname || "Your Name"}</p>
          <p className="text-sm text-gray-500">{email}</p>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <CheckCircle size={9} /> Verified
            </span>
          ) : (
            <Link
              href="/verify-email"
              className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full transition"
            >
              <AlertCircle size={9} /> Email not verified — click to verify
            </Link>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          {
            label: "Full Name",
            value: fullname,
            set: setFullname,
            type: "text",
            icon: <User size={15} />,
          },
          {
            label: "Email Address",
            value: email,
            set: setEmail,
            type: "email",
            icon: <Mail size={15} />,
          },
          {
            label: "Mobile Number",
            value: mobilenumber,
            set: setMobilenumber,
            type: "tel",
            icon: <Phone size={15} />,
          },
        ].map(({ label, value, set, type, icon }) => (
          <div key={label} className={label === "Full Name" ? "" : ""}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {label}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {icon}
              </span>
              <input
                type={type}
                value={value}
                onChange={(e) => {
                  set(e.target.value);
                  setDirty(true);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm text-gray-800 outline-none focus:border-[#0FA3B1] focus:ring-2 focus:ring-teal-100 transition"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={!dirty}
        className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition"
      >
        <Save size={15} /> Save Changes
      </button>
    </div>
  );
}

// ── Preferences Tab ──────────────────────────────────────────────────────────
function PreferencesTab() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("INR");
  const [newsletter, setNewsletter] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const save = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const Toggle = ({
    label,
    desc,
    value,
    onChange,
  }: {
    label: string;
    desc: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-[#F5F5F5] last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${value ? "bg-[#FF0000]" : "bg-gray-200"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 divide-y divide-[#F5F5F5]">
        <Toggle
          label="Dark Mode"
          desc="Switch to dark theme across the app"
          value={darkMode}
          onChange={setDarkMode}
        />
        <Toggle
          label="Newsletter"
          desc="Receive weekly deals & product updates"
          value={newsletter}
          onChange={setNewsletter}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm text-gray-800 outline-none focus:border-[#0FA3B1] transition"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm text-gray-800 outline-none focus:border-[#0FA3B1] transition"
          >
            <option value="INR">₹ Indian Rupee (INR)</option>
            <option value="USD">$ US Dollar (USD)</option>
          </select>
        </div>
      </div>

      <button
        onClick={save}
        className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold text-sm rounded-xl transition"
      >
        {savedMsg ? (
          <>
            <CheckCircle size={15} /> Saved!
          </>
        ) : (
          <>
            <Save size={15} /> Save Preferences
          </>
        )}
      </button>
    </div>
  );
}

// ── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const errors = validatePasswordChangeForm({
      currentPassword: current,
      newPassword: newPass,
      confirmPassword: confirm,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: newPass,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(normalizeAuthErrorMessage(data.message) || "Failed");
      setSuccess(true);
      setCurrent("");
      setNewPass("");
      setConfirm("");
      setFieldErrors({});
    } catch (err: any) {
      setError(err.message);
    }
  };

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="space-y-6 max-w-md">
      <div className="bg-[#DFF1F1] border border-[#BBD5DA] rounded-2xl px-5 py-4 flex items-start gap-3">
        <Shield size={18} className="text-teal-600 mt-0.5 shrink-0" />
        <p className="text-sm text-teal-800">
          Keep your account secure by using a strong, unique password.
        </p>
      </div>

      <form onSubmit={handleChange} className="space-y-4">
        {[
          {
            label: "Current Password",
            value: current,
            set: setCurrent,
            show: showCurr,
            toggle: () => setShowCurr((v) => !v),
          },
          {
            label: "New Password",
            value: newPass,
            set: setNewPass,
            show: showNew,
            toggle: () => setShowNew((v) => !v),
          },
          {
            label: "Confirm Password",
            value: confirm,
            set: setConfirm,
            show: showNew,
            toggle: () => setShowNew((v) => !v),
          },
        ].map(({ label, value, set, show, toggle }) => {
          const fieldKey =
            label === "Current Password"
              ? "currentPassword"
              : label === "New Password"
                ? "newPassword"
                : "confirmPassword";
          const errorMessage = fieldErrors[fieldKey];

          return (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={15} />
                </span>
                <input
                  type={show ? "text" : "password"}
                  required
                  value={value}
                  onChange={(e) => {
                    set(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, [fieldKey]: "" }));
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm text-gray-800 outline-none focus:border-[#0FA3B1] focus:ring-2 focus:ring-teal-100 transition"
                />
                <EyeBtn show={show} toggle={toggle} />
              </div>
              {errorMessage && (
                <p className="mt-1.5 text-sm text-[#FF0000]">{errorMessage}</p>
              )}
            </div>
          );
        })}

        {error && (
          <p className="text-sm text-[#FF0000] flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <CheckCircle size={14} /> Password updated successfully!
          </p>
        )}

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold text-sm rounded-xl transition"
        >
          <Lock size={15} /> Update Password
        </button>
      </form>
    </div>
  );
}

// ── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    orderUpdates: true,
    promotions: true,
    nearbyOffers: true,
    emailDigest: false,
    pushEnabled: false,
    smsAlerts: false,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Row = ({
    k,
    label,
    desc,
  }: {
    k: keyof typeof prefs;
    label: string;
    desc: string;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-[#F5F5F5] last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => toggle(k)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${prefs[k] ? "bg-[#FF0000]" : "bg-gray-200"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${prefs[k] ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
          Email Notifications
        </h3>
        <Row
          k="orderUpdates"
          label="Order Updates"
          desc="Shipping, delivery, and status changes"
        />
        <Row
          k="promotions"
          label="Promotions"
          desc="Exclusive deals, sales, and coupons"
        />
        <Row
          k="emailDigest"
          label="Weekly Digest"
          desc="A summary of activity and new products"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
          Push & SMS
        </h3>
        <Row
          k="nearbyOffers"
          label="Nearby Offers"
          desc="Alerts when stores near you post deals"
        />
        <Row
          k="pushEnabled"
          label="Push Alerts"
          desc="In-browser push notifications"
        />
        <Row
          k="smsAlerts"
          label="SMS Alerts"
          desc="Text message updates for your orders"
        />
      </div>

      <button
        onClick={save}
        className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold text-sm rounded-xl transition"
      >
        {saved ? (
          <>
            <CheckCircle size={15} /> Saved!
          </>
        ) : (
          <>
            <Save size={15} /> Save Preferences
          </>
        )}
      </button>
    </div>
  );
}

// ── Settings Page ────────────────────────────────────────────────────────────
function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "account",
  );

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    } catch {}
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token"))
      router.push("/login?redirect=/settings");
  }, [router]);

  const handleSaveAccount = (updates: Partial<UserData>) => {
    const merged = { ...user, ...updates };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged as UserData);
    window.dispatchEvent(new CustomEvent("authChange"));
    setToast({ msg: "Profile updated successfully!", ok: true });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white border-b border-[#BBD5DA] sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 font-medium transition"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="text-base font-bold text-gray-900 hidden sm:block ml-2">
            Settings
          </h1>
          <div className="ml-auto">
            <UserAvatarMenu theme="light" compact />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden shadow-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold border-l-3 transition text-left ${
                    activeTab === tab.id
                      ? "bg-[#DFF1F1] text-teal-700 border-l-4 border-l-[#FF0000]"
                      : "text-gray-700 hover:bg-[#F5F5F5] border-l-4 border-l-transparent"
                  }`}
                >
                  <span
                    className={
                      activeTab === tab.id ? "text-[#FF0000]" : "text-gray-400"
                    }
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}

              {/* Danger zone */}
              <div className="border-t border-[#BBD5DA] mt-1">
                <button
                  onClick={() => {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    window.dispatchEvent(new CustomEvent("authChange"));
                    router.push("/");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold text-[#FF0000] hover:bg-red-50 transition text-left border-l-4 border-l-transparent"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </nav>
          </aside>

          {/* Content panel */}
          <section className="flex-1 bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm min-h-[400px]">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-[#FF0000]">
                {TABS.find((t) => t.id === activeTab)?.icon}
              </span>
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>

            {activeTab === "account" && user && (
              <AccountTab user={user} onSave={handleSaveAccount} />
            )}
            {activeTab === "preferences" && <PreferencesTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "notifications" && <NotificationsTab />}
          </section>
        </div>
      </main>

      {toast && (
        <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#BBD5DA] border-t-[#FF0000] animate-spin" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
