"use client";
import { useState, useRef, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Store,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  FileText,
  CreditCard,
  Utensils,
  Check,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { storeApi } from "../../api-services/storeApi";
import UserAvatarMenu from "../../components-main/UserAvatarMenu";
import { indianStates, getCities } from "../../utils/indiaLocation";

const CATEGORIES = [
  "Food & Beverages",
  "Grocery",
  "Fashion",
  "Electronics",
  "Pharmacy",
  "Toys",
  "Home & Living",
  "Beauty",
  "Sports",
  "Other",
];

const isValidLatLng = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  lat >= -90 &&
  lat <= 90 &&
  Number.isFinite(lng) &&
  lng >= -180 &&
  lng <= 180;

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
      {children} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
        outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition shadow-sm"
    />
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800
        outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition cursor-pointer shadow-sm"
    >
      {children}
    </select>
  );
}

function Textarea({
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
        outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none shadow-sm"
    />
  );
}

const STEPS = [
  { id: 1, title: "Basic Info", icon: Store, subtitle: "Store identity & contact" },
  { id: 2, title: "Verification", icon: FileText, subtitle: "PAN, FSSAI & GSTIN" },
  { id: 3, title: "Address", icon: MapPin, subtitle: "Location & Area" },
  { id: 4, title: "Bank & Razorpay", icon: CreditCard, subtitle: "Payouts & Settlements" },
];

export default function StoreRegisterPage() {
  const ctx = useContext(AuthContext) as any;
  const user = ctx?.user;
  const token: string | null =
    ctx?.token ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);

  const storeType =
    user?.role === "whole_saler"
      ? "whole_saler"
      : user?.role === "home_business"
        ? "home_business"
        : "store";

  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    email: user?.email || "",
    category: "Food & Beverages",
    pan: "",
    fssaiNumber: "",
    gstin: "",
    street: "",
    city: "",
    state: "",
    pinCode: "",
    latitude: "",
    longitude: "",
    // Bank & Razorpay
    legalBusinessName: user?.fullname || "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
  });

  const [panVerified, setPanVerified] = useState(false);
  const [panError, setPanError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [cities, setCities] = useState<any[]>([]);

  const isFoodCategory = form.category === "Food & Beverages";

  const normalizeLoc = (value: string) => (value || "").trim().toLowerCase();

  const findState = (value: string) => {
    const v = normalizeLoc(value);
    if (!v) return undefined;
    return indianStates.find(
      (s: any) => normalizeLoc(s.name) === v || normalizeLoc(s.isoCode) === v,
    );
  };

  async function lookupPincode(cityName: string): Promise<string | null> {
    if (!cityName) return null;
    try {
      const res = await fetch(
        `https://api.postalpincode.in/postoffice/${encodeURIComponent(cityName)}`,
      );
      const data = await res.json();
      if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
        return data[0].PostOffice[0].Pincode || null;
      }
    } catch (err) {
      console.log(err);
    }
    return null;
  }

  const handleStateSelect = (isoCode: string, label: string) => {
    setForm((f) => ({ ...f, state: label, city: "", pinCode: "" }));
    setCities(isoCode ? getCities(isoCode) : []);
  };

  const handleCitySelect = async (cityName: string) => {
    set("city", cityName);
    if (!cityName) return;
    const pin = await lookupPincode(cityName);
    if (pin) set("pinCode", pin);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const verifyPAN = (panVal: string) => {
    const cleanPan = panVal.trim().toUpperCase();
    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!cleanPan) {
      setPanError("Please enter a PAN number.");
      setPanVerified(false);
      return false;
    }
    if (!PAN_REGEX.test(cleanPan)) {
      setPanError("Invalid PAN format (must be 10 characters e.g. ABCDE1234F).");
      setPanVerified(false);
      return false;
    }
    setPanError("");
    setPanVerified(true);
    return true;
  };

  const detectLocation = () => {
    setDetecting(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDetecting(false);
        if (!isValidLatLng(lat, lng)) {
          setError(
            `Detected location looks invalid (lat: ${lat}, lng: ${lng}). Please enter your coordinates manually.`,
          );
          return;
        }
        set("latitude", String(lat));
        set("longitude", String(lng));
      },
      () => {
        setDetecting(false);
        setError("Could not detect location. Enter manually.");
      },
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // Step Validation before progressing
  const validateStep = (step: number): boolean => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) {
        setError("Store Name is required.");
        return false;
      }
      if (!form.phone.trim()) {
        setError("Contact Phone is required.");
        return false;
      }
      if (!form.email.trim()) {
        setError("Contact Email is required.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!form.pan.trim()) {
        setError("PAN Number is mandatory for business verification.");
        return false;
      }
      const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!PAN_REGEX.test(form.pan.trim().toUpperCase())) {
        setError("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).");
        return false;
      }

      if (isFoodCategory) {
        if (!form.fssaiNumber.trim()) {
          setError("FSSAI License Number is mandatory for Food & Beverages category.");
          return false;
        }
        const FSSAI_REGEX = /^[0-9]{14}$/;
        if (!FSSAI_REGEX.test(form.fssaiNumber.trim())) {
          setError("Please enter a valid 14-digit FSSAI License Number (e.g. 10012345678901).");
          return false;
        }
      }

      if (form.gstin.trim()) {
        const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!GSTIN_REGEX.test(form.gstin.trim().toUpperCase())) {
          setError("Please enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5).");
          return false;
        }
      }
      return true;
    }

    if (step === 3) {
      if (!form.street.trim()) {
        setError("Street address is required.");
        return false;
      }
      if (!form.state) {
        setError("Please select a state.");
        return false;
      }
      if (!form.city) {
        setError("Please select a city.");
        return false;
      }
      if (!form.latitude || !form.longitude) {
        setError("Store GPS location (latitude & longitude) is required.");
        return false;
      }
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      if (!isValidLatLng(lat, lng)) {
        setError("Invalid coordinates. Latitude must be -90 to 90, Longitude -180 to 180.");
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (form.accountNumber && form.accountNumber !== form.confirmAccountNumber) {
        setError("Bank Account Number and Confirm Account Number do not match.");
        return false;
      }
      if (form.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.trim().toUpperCase())) {
        setError("Please enter a valid 11-character Indian IFSC code (e.g. IDIB000K073).");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("You must be logged in.");
      return;
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("category", form.category);
      fd.append("pan", form.pan.trim().toUpperCase());
      if (form.fssaiNumber.trim()) {
        fd.append("fssaiNumber", form.fssaiNumber.trim());
        fd.append("fssai", form.fssaiNumber.trim());
      }
      if (form.gstin.trim()) {
        fd.append("gstin", form.gstin.trim().toUpperCase());
      }
      fd.append("latitude", form.latitude);
      fd.append("longitude", form.longitude);
      fd.append(
        "address",
        JSON.stringify({
          street: form.street,
          city: form.city,
          state: form.state,
          pinCode: form.pinCode,
        }),
      );
      fd.append("ownerName", user?.fullname || form.name);
      fd.append("storeType", storeType);
      fd.append("legalBusinessName", form.legalBusinessName || form.name);

      if (form.accountNumber.trim() && form.ifscCode.trim()) {
        fd.append(
          "bankAccount",
          JSON.stringify({
            accountNumber: form.accountNumber.trim(),
            ifscCode: form.ifscCode.trim().toUpperCase(),
            beneficiaryName: form.legalBusinessName || form.name,
          }),
        );
      }

      if (logoFile) fd.append("logo", logoFile);

      const res = await storeApi.register(fd, token);

      const newToken = res.data?.token;
      if (newToken && ctx?.login) {
        ctx.login(user, newToken);
      }

      router.push(
        storeType === "store"
          ? "/store/dashboard"
          : storeType === "whole_saler"
            ? "/wholesaler/dashboard"
            : storeType === "home_business"
              ? "/home-business/dashboard"
              : "/store/dashboard",
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#BBD5DA] sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 font-medium transition"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#FF0000]">
              Register Your Store
            </span>
            <UserAvatarMenu theme="light" compact />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Title Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#FF0000] tracking-tight">
            Register Your Store
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Complete your merchant profile to start publishing live offers & receiving payouts.
          </p>
        </div>

        {/* ── Step Progress Indicator ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#BBD5DA] p-4 sm:p-6 mb-8 shadow-xs">
          <div className="relative flex items-center justify-between max-w-2xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 -z-0">
              <div
                className="h-full bg-teal-600 transition-all duration-300 ease-in-out"
                style={{
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>

            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center relative z-10 cursor-pointer"
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id);
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                      isCompleted
                        ? "bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-4 ring-white"
                        : isCurrent
                          ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/25 ring-4 ring-white"
                          : "bg-gray-100 text-gray-400 border border-gray-200 ring-4 ring-white"
                    }`}
                  >
                    {isCompleted ? <Check size={18} strokeWidth={3} /> : step.id}
                  </div>
                  <span
                    className={`text-xs mt-2 font-semibold transition ${
                      isCurrent
                        ? "text-[#FF0000] font-bold"
                        : isCompleted
                          ? "text-teal-700"
                          : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl mb-6 text-sm animate-shake">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: Basic Information & Store Logo                           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Logo Card */}
              <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm">
                <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <Camera size={18} className="text-teal-600" /> Store Logo
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Upload a high quality logo to showcase on customer invoices and discovery cards.
                </p>
                <div className="flex items-center gap-5">
                  <div
                    onClick={() => logoRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#BBD5DA] bg-[#F5F5F5] flex items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-[#DFF1F1] transition overflow-hidden shadow-inner"
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={26} className="text-[#BBD5DA]" />
                    )}
                  </div>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {logoPreview ? "✓ Logo selected" : "Upload your store logo"}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Optional · JPG / PNG up to 5 MB
                    </p>
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      className="mt-2.5 text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold px-3 py-1.5 rounded-lg border border-teal-200 transition inline-block"
                    >
                      {logoPreview ? "Change Logo" : "Choose File"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Store size={18} className="text-teal-600" /> Store Identity & Contact
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label required>Store Name</Label>
                    <Input
                      required
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Smart Electronics"
                    />
                  </div>
                  <div>
                    <Label required>Category</Label>
                    <Select
                      required
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label required>Contact Phone</Label>
                    <Input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <Label required>Contact Email</Label>
                    <Input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="store@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label>Store Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    placeholder="Tell nearby customers what your store offers…"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: Business & Tax Verification (PAN + FSSAI + GSTIN)         */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                    <ShieldCheck size={20} className="text-teal-600" /> Tax & Business Compliance
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Regulatory credentials required for marketplace settlement and payout routing.
                  </p>
                </div>

                {/* PAN Number Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label required>Permanent Account Number (PAN)</Label>
                    {panVerified && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={13} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      required
                      value={form.pan}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        set("pan", val);
                        if (panVerified) setPanVerified(false);
                      }}
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                      className="font-mono tracking-wider uppercase text-base font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => verifyPAN(form.pan)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition shrink-0 shadow-sm"
                    >
                      Verify PAN
                    </button>
                  </div>
                  {panError && <p className="text-xs text-red-600 font-medium">{panError}</p>}
                  <p className="text-[11px] text-gray-500">
                    Standard 10-character alphanumeric PAN issued by the Income Tax Department.
                  </p>
                </div>

                {/* Conditional FSSAI License Number for Food & Beverages */}
                {isFoodCategory && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Utensils size={16} className="text-amber-700" />
                        <Label required>FSSAI License Number</Label>
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full border border-amber-300">
                        Mandatory for Food & Beverages
                      </span>
                    </div>
                    <Input
                      required
                      value={form.fssaiNumber}
                      onChange={(e) => set("fssaiNumber", e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 10012345678901 (14 digits)"
                      maxLength={14}
                      className="font-mono tracking-wider text-base font-semibold"
                    />
                    <p className="text-[11px] text-amber-800">
                      14-digit food safety registration / license issued by FSSAI for food merchants.
                    </p>
                  </div>
                )}

                {/* GSTIN Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>GSTIN Number <span className="text-gray-400 font-normal">(Optional)</span></Label>
                  </div>
                  <Input
                    value={form.gstin}
                    onChange={(e) => set("gstin", e.target.value.toUpperCase())}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    maxLength={15}
                    className="font-mono uppercase tracking-wider"
                  />
                  <p className="text-[11px] text-gray-400">
                    15-character Goods and Services Tax Identification Number.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: Store Address & Map Location                              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                    <MapPin size={19} className="text-teal-600" /> Physical Store Address
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customers within your radius will be able to discover your store and offers.
                  </p>
                </div>

                <div>
                  <Label required>Street Address</Label>
                  <Input
                    required
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                    placeholder="e.g. 123 Bazaar Road, 2nd Cross"
                  />
                </div>

                {/* Cascading State -> City -> Pincode */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label required>State</Label>
                    <Select
                      required
                      value={findState(form.state)?.isoCode || ""}
                      onChange={(e) => {
                        const isoCode = e.target.value;
                        const label =
                          indianStates.find((s: any) => s.isoCode === isoCode)?.name || "";
                        handleStateSelect(isoCode, label);
                      }}
                    >
                      <option value="">Select State</option>
                      {indianStates.map((s: any) => (
                        <option key={s.isoCode} value={s.isoCode}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label required>City</Label>
                    <Select
                      required
                      value={form.city}
                      onChange={(e) => handleCitySelect(e.target.value)}
                      disabled={!form.state}
                    >
                      <option value="">
                        {form.state ? "Select City" : "Select state first"}
                      </option>
                      {cities.map((c: any) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label required>PIN Code</Label>
                    <Input
                      required
                      value={form.pinCode}
                      onChange={(e) => set("pinCode", e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 600001"
                      maxLength={6}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Auto-populated on city select</p>
                  </div>
                </div>

                {/* GPS Coordinates & Current Location */}
                <div className="pt-2 border-t border-gray-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">GPS Coordinates *</h3>
                      <p className="text-xs text-gray-400">Used for hyper-local geo-proximity distance searches.</p>
                    </div>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detecting}
                      className="flex items-center justify-center gap-2 bg-[#DFF1F1] hover:bg-teal-100 border border-[#BBD5DA] text-teal-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-60 shrink-0 shadow-xs"
                    >
                      {detecting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />{" "}
                          Detecting Location…
                        </>
                      ) : (
                        <>
                          <MapPin size={15} /> Use My Current Location
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label required>Latitude</Label>
                      <Input
                        required
                        value={form.latitude}
                        onChange={(e) => set("latitude", e.target.value)}
                        placeholder="e.g. 13.0827"
                        type="number"
                        step="any"
                      />
                    </div>
                    <div>
                      <Label required>Longitude</Label>
                      <Input
                        required
                        value={form.longitude}
                        onChange={(e) => set("longitude", e.target.value)}
                        placeholder="e.g. 80.2707"
                        type="number"
                        step="any"
                      />
                    </div>
                  </div>

                  {form.latitude && form.longitude && (
                    <div className="flex items-center gap-2 bg-[#DFF1F1] border border-teal-200 rounded-xl px-4 py-2.5 text-xs">
                      <CheckCircle2 size={16} className="text-teal-700 shrink-0" />
                      <span className="text-teal-800 font-semibold">
                        Coordinates mapped: {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-teal-700 hover:underline font-bold"
                      >
                        Preview on Map ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 4: Settlement Bank Account & Razorpay Connection              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                    <Building2 size={19} className="text-teal-600" /> Settlement Bank Account Details
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Used for automated marketplace split settlements directly to your bank account via Razorpay Route.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label required>Legal Business / Entity Name</Label>
                    <Input
                      required
                      value={form.legalBusinessName}
                      onChange={(e) => set("legalBusinessName", e.target.value)}
                      placeholder="e.g. Rohini B"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Must match the name on your PAN card and bank passbook.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label required>Bank Account Number</Label>
                      <Input
                        required
                        type="password"
                        value={form.accountNumber}
                        onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 6285854908"
                      />
                    </div>
                    <div>
                      <Label required>Confirm Bank Account Number</Label>
                      <Input
                        required
                        value={form.confirmAccountNumber}
                        onChange={(e) => set("confirmAccountNumber", e.target.value.replace(/\D/g, ""))}
                        placeholder="Re-enter bank account number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label required>Bank IFSC Code</Label>
                    <Input
                      required
                      value={form.ifscCode}
                      onChange={(e) => set("ifscCode", e.target.value.toUpperCase())}
                      placeholder="e.g. IDIB000K073"
                      maxLength={11}
                      className="font-mono uppercase tracking-wider"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      11-character Indian Financial System Code (IFSC) of your bank branch.
                    </p>
                  </div>
                </div>

                {/* Razorpay Route Connection Card matching screenshot */}
                <div className="mt-4 bg-[#F0FDFA] border border-teal-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <CreditCard size={17} className="text-teal-700" />
                        Razorpay Route Marketplace Account
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Mandatory to accept online Razorpay payments. Customer payments are split directly to your linked account.
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                      Razorpay Ready
                    </span>
                  </div>

                  <div className="bg-white border border-teal-100 rounded-xl p-3 text-xs text-gray-600 flex items-center justify-between">
                    <span>Account Connection:</span>
                    <span className="font-semibold text-teal-800">
                      Auto-linking upon store creation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Bottom Bar ──────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-sm transition shadow-xs"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-7 py-3 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold text-sm rounded-xl transition shadow-md shadow-red-500/20 ml-auto"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-base rounded-xl transition shadow-lg shadow-teal-600/20 disabled:opacity-50 ml-auto"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Registering Store & Linking Razorpay…
                  </>
                ) : (
                  <>
                    <Store size={18} /> Complete & Register Store
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}