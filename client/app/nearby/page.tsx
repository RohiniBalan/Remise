"use client";

import React, { useState, useEffect, useCallback, useContext, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Bell,
  BellOff,
  Clock,
  ShoppingBag,
  Truck,
  Store,
  Wallet,
  CreditCard,
  CheckCircle,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Smartphone,
  Upload,
  RefreshCw,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { offersApi } from "../api-services/offersApi";
import { storeApi } from "../api-services/storeApi";
import { indianStates, getCities } from "../utils/indiaLocation";
import { useNotifications } from "../hooks/useNotifications";
import NavbarHome from "../components-main/NavbarHome";
import { isAuthenticated, redirectToLogin } from "../utils/authGuard";

// Palette: #F5F5F5 bg · #DFF1F1 mint · #BBD5DA steel border · #FF0000 danger

interface Offer {
  _id: string;
  title: string;
  description: string;
  image: string;
  storeName: string;
  storeId: string;
  category: string;
  originalPrice: number;
  offerPrice: number;
  discountPercent: number;
  validUntil: string;
  distanceKm: number;
  orderCount: number;
}

function OrderModal({
  offer,
  onClose,
  onSuccess,
}: {
  offer: Offer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const ctx = useContext(AuthContext) as any;
  const user = ctx?.user;

  const [step, setStep] = useState<"details" | "delivery" | "payment" | "success">("details");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "qr" | "razorpay" | null>(null);
  const [selectedSubMethod, setSelectedSubMethod] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  
  const [form, setForm] = useState({
    firstName: user?.fullname?.split(" ")[0] || "",
    lastName: user?.fullname?.split(" ").slice(1).join(" ") || "",
    phone: user?.mobilenumber || "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    quantity: "1",
    notes: "",
  });

  const [cities, setCities] = useState<any[]>([]);
  const [storeQr, setStoreQr] = useState<string | null>(null);
  const [storeUpiId, setStoreUpiId] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const findState = useCallback((value: string) => {
    const v = normalize(value);
    if (!v) return undefined;
    return indianStates.find(
      (s) => normalize(s.name) === v || normalize(s.isoCode) === v,
    );
  }, []);

  // Update city list when state changes
  useEffect(() => {
    if (!form.state) {
      setCities([]);
      return;
    }
    const st = findState(form.state);
    if (st) {
      setCities(getCities(st.isoCode));
    } else {
      setCities([]);
    }
  }, [form.state, findState]);

  // Handle state select
  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextState = e.target.value;
    set("state", nextState);
    set("city", "");
    set("pinCode", "");
  };

  // Handle city select + auto pincode lookup
  const handleCitySelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCity = e.target.value;
    set("city", nextCity);
    if (!nextCity) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(nextCity)}`);
      const data = await res.json();
      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        set("pinCode", data[0].PostOffice[0].Pincode);
      }
    } catch {
      // ignore
    }
  };

  // Load store QR when QR payment is picked
  useEffect(() => {
    if (paymentMethod !== "qr") return;
    storeApi
      .getById(offer.storeId)
      .then((res) => {
        const s = res.data?.data;
        setStoreQr(s?.qrCodeImage || null);
        setStoreUpiId(s?.upiId || "rohinibalan529@oksbi");
      })
      .catch(() => {
        setStoreQr(null);
        setStoreUpiId("rohinibalan529@oksbi");
      });
  }, [paymentMethod, offer.storeId]);

  const handleCopyUpi = (upi: string) => {
    navigator.clipboard?.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const total = (offer.offerPrice * (parseInt(form.quantity) || 1)).toFixed(0);

  // Step 1 -> Step 2
  const handleNextToDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.phone.trim()) {
      setError("Please fill in your name and phone number.");
      return;
    }
    if (!form.address.trim() || !form.state.trim() || !form.city.trim() || !form.pinCode.trim()) {
      setError("Please fill in your complete address, state, city and pincode.");
      return;
    }
    setError("");
    setStep("delivery");
  };

  // Submit order
  const handlePlaceOrder = async (chosenPaymentMethod: "cod" | "qr" | "razorpay") => {
    setLoading(true);
    setError("");
    try {
      const customerName = `${form.firstName} ${form.lastName}`.trim();
      const deliveryAddress = `${form.address}, ${form.city}, ${form.state} - ${form.pinCode}`.trim();

      const res = await offersApi.placeOrder(offer._id, {
        customerName,
        customerPhone: form.phone,
        customerEmail: form.email,
        deliveryAddress,
        city: form.city,
        state: form.state,
        pinCode: form.pinCode,
        deliveryMethod,
        paymentMethod: chosenPaymentMethod,
        utrNumber,
        quantity: parseInt(form.quantity) || 1,
      });

      const placedId = res.data?.data?._id || "";
      setPlacedOrderId(placedId);
      setStep("success");
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Order placement failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#BBD5DA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#BBD5DA] bg-[#DFF1F1] flex items-start justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
              Nearby Offer Order
            </span>
            <h2 className="text-base font-bold text-gray-900 mt-1">{offer.title}</h2>
            <p className="text-gray-500 text-xs">{offer.storeName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4 transition"
          >
            ×
          </button>
        </div>

        {/* Price strip */}
        <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-[#BBD5DA] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-semibold">Offer Price:</span>
            <span className="font-extrabold text-teal-700 text-base">₹{offer.offerPrice}</span>
            {offer.originalPrice !== offer.offerPrice && (
              <span className="text-gray-400 text-xs line-through">₹{offer.originalPrice}</span>
            )}
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              {offer.discountPercent}% OFF
            </span>
          </div>
          <div className="text-xs font-bold text-teal-800">
            Total: ₹{total}
          </div>
        </div>

        {error && <p className="text-[#FF0000] text-xs font-semibold px-6 pt-3">{error}</p>}

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* ── STEP 1: CONTACT & ADDRESS DETAILS ── */}
          {step === "details" && (
            <form onSubmit={handleNextToDelivery} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  1. Contact & Address Details
                </span>
                <span className="text-[11px] font-semibold text-teal-700">Step 1 of 3</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">First Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-teal-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    placeholder="Mobile Number"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-teal-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Street Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="House / Flat No., Street, Area"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-teal-500 transition resize-none"
                />
              </div>

              {/* State, City & Pincode */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">State *</label>
                  <select
                    required
                    value={form.state}
                    onChange={handleStateSelect}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((s) => (
                      <option key={s.isoCode} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">City *</label>
                  <select
                    required
                    disabled={!form.state || cities.length === 0}
                    value={form.city}
                    onChange={handleCitySelect}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-teal-500 transition cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Select City</option>
                    {cities.map((c: any) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Pincode *</label>
                  <input
                    required
                    type="text"
                    placeholder="Auto / Pincode"
                    value={form.pinCode}
                    onChange={(e) => set("pinCode", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-600">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={form.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                    className="w-16 bg-white border border-[#BBD5DA] rounded-lg px-2 py-1 text-xs text-center font-bold text-gray-800 outline-none focus:border-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  Next: Delivery Method →
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: DELIVERY METHOD ── */}
          {step === "delivery" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  2. Choose Delivery Method
                </span>
                <span className="text-[11px] font-semibold text-teal-700">Step 2 of 3</span>
              </div>

              <p className="text-xs text-gray-600">
                How would you like to receive your order from <strong>{offer.storeName}</strong>?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition ${
                    deliveryMethod === "pickup"
                      ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${deliveryMethod === "pickup" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    <Store size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Self Pickup</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Visit the shop and collect your items yourself.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition ${
                    deliveryMethod === "delivery"
                      ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${deliveryMethod === "delivery" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Home Delivery</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {offer.storeName} will deliver to your address.
                    </p>
                  </div>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700">
                <span className="font-bold text-gray-800">Delivering to: </span>
                <span>
                  {form.firstName} {form.lastName} ({form.phone}) · {form.address}, {form.city}, {form.state} - {form.pinCode}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="text-xs text-gray-500 hover:text-teal-700 font-semibold transition"
                >
                  ← Back to Details
                </button>
                <button
                  type="button"
                  onClick={() => setStep("payment")}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  Next: Payment Method →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: PAYMENT METHOD ── */}
          {step === "payment" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  3. Payment Method
                </span>
                <span className="text-[11px] font-semibold text-teal-700">Step 3 of 3</span>
              </div>

              {!paymentMethod && (
                <div className="space-y-2.5">
                  {/* 1. Razorpay */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("razorpay");
                      setSelectedSubMethod("upi");
                    }}
                    className="w-full text-left border border-[#BBD5DA] hover:border-teal-500 bg-white hover:bg-gray-50/50 rounded-xl p-3.5 transition flex items-start gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-xs">Online Payment (Razorpay)</p>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          INSTANT · SECURE
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking & Wallets.
                      </p>
                    </div>
                  </button>

                  {/* 2. QR Code */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qr")}
                    className="w-full text-left border border-[#BBD5DA] hover:border-teal-500 bg-white hover:bg-gray-50/50 rounded-xl p-3.5 transition flex items-start gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 border border-gray-200">
                      <QrCode size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-xs">QR Code Payment</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Scan {offer.storeName}'s QR code and pay directly via any UPI App.
                      </p>
                    </div>
                  </button>

                  {/* 3. Cash */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className="w-full text-left border border-[#BBD5DA] hover:border-teal-500 bg-white hover:bg-gray-50/50 rounded-xl p-3.5 transition flex items-start gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 border border-gray-200">
                      <Wallet size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-xs">Cash</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {deliveryMethod === "pickup"
                          ? "Pay cash directly at the shop when collecting your order."
                          : "Pay cash on delivery."}
                      </p>
                    </div>
                  </button>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("delivery")}
                      className="text-xs text-gray-500 hover:text-teal-700 font-semibold transition"
                    >
                      ← Back to Delivery Method
                    </button>
                  </div>
                </div>
              )}

              {/* ── Razorpay Breakdown ── */}
              {paymentMethod === "razorpay" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 text-xs text-gray-700 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-teal-900">
                      <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                      <span>Instant Secure Checkout · UPI, Cards, NetBanking</span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      Click below to confirm and complete your offer order of <strong>₹{total}</strong>.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlaceOrder("razorpay")}
                      disabled={loading}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Processing…
                        </>
                      ) : (
                        <>
                          <Lock size={14} /> Confirm & Pay ₹{total}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── QR Code Breakdown ── */}
              {paymentMethod === "qr" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 text-xs text-gray-700 space-y-2.5">
                    <p className="font-bold text-gray-800">
                      Scan QR & Pay ₹{total} to {offer.storeName}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {storeQr ? (
                        <img
                          src={storeQr.startsWith("http") ? storeQr : `http://localhost:3000${storeQr}`}
                          alt="Store QR"
                          className="w-32 h-32 object-contain bg-white rounded-lg border border-gray-200 p-1"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 p-2 text-center">
                          Scan with any UPI App
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        {storeUpiId && (
                          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                            <span className="font-mono text-xs font-bold text-gray-800 truncate flex-1">
                              {storeUpiId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyUpi(storeUpiId)}
                              className="text-[10px] bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold px-2 py-1 rounded transition flex items-center gap-1"
                            >
                              {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                              {copiedUpi ? "Copied" : "Copy"}
                            </button>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            UTR / Transaction ID (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 329182391823"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value)}
                            className="w-full bg-white border border-[#BBD5DA] rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Upload Payment Screenshot (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlaceOrder("qr")}
                      disabled={loading}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Confirming…
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} /> Confirm QR Payment · ₹{total}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Cash Breakdown ── */}
              {paymentMethod === "cod" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700 space-y-2">
                    <p className="font-bold text-gray-800">
                      {deliveryMethod === "pickup" ? "Pay in Cash at Store" : "Cash on Delivery"}
                    </p>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      {deliveryMethod === "pickup"
                        ? `You will pay ₹${total} in cash directly to ${offer.storeName} when collecting your order.`
                        : `You will pay ₹${total} in cash to the delivery partner upon receiving your order.`}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlaceOrder("cod")}
                      disabled={loading}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Placing Order…
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} /> Place Cash Order · ₹{total}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: SUCCESS ── */}
          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle size={36} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">Order Placed Successfully!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Thank you for your order. <strong>{offer.storeName}</strong> will process it right away.
                </p>
              </div>

              {placedOrderId && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-700">
                  Order ID: <strong>#{placedOrderId.slice(-8).toUpperCase()}</strong>
                </div>
              )}

              <div className="pt-2 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NearbyContent() {
  const ctx = useContext(AuthContext) as any;
  const token: string | null =
    ctx?.token ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const searchParams = useSearchParams();
  const { subscribe, permission, subscribed } = useNotifications(token);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [radius, setRadius] = useState(10);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [subError, setSubError] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  const applyTheme = useCallback((nextTheme: "dark" | "light") => {
    const root = document.documentElement;
    root.setAttribute("data-theme", nextTheme);
    root.classList.toggle("dark", nextTheme === "dark");
    root.style.colorScheme = nextTheme;
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      const storedTheme = localStorage.getItem("theme");
      const rootTheme = document.documentElement.getAttribute("data-theme");
      const initialTheme =
        storedTheme === "dark" || storedTheme === "light"
          ? storedTheme
          : rootTheme;
      const resolvedTheme =
        initialTheme === "dark" || initialTheme === "light"
          ? initialTheme
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

      setTheme(resolvedTheme);
      applyTheme(resolvedTheme);
    };

    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const nextTheme = typeof detail === "string" ? detail : detail?.theme;

      if (nextTheme === "dark" || nextTheme === "light") {
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }
    };

    syncTheme();
    window.addEventListener("theme-change", handleThemeChange as EventListener);
    return () =>
      window.removeEventListener(
        "theme-change",
        handleThemeChange as EventListener,
      );
  }, [applyTheme]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () =>
        setLocError(
          "Location access denied. Enable location to see nearby offers.",
        ),
    );
  }, []);

  const loadOffers = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const res = await offersApi.getNearby(location.lat, location.lng, radius);
      setOffers(res.data.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [location, radius]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    const offerId = searchParams.get("offer");
    if (offerId) {
      setTimeout(() => {
        document
          .getElementById(`offer-${offerId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [offers, searchParams]);

  const handleSubscribe = async () => {
    if (!location) return;
    setSubLoading(true);
    setSubError("");
    const result = await subscribe(location.lat, location.lng);
    setSubLoading(false);
    if (!result.success)
      setSubError(result.message || "Failed to enable alerts.");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div
        className={`min-h-screen ${theme === "light" ? "bg-[#F5F5F5]" : "bg-[#0a0a0a]"}`}
      >
        <NavbarHome
          theme={theme}
          toggleTheme={() => {
            const nextTheme = theme === "light" ? "dark" : "light";
            setTheme(nextTheme);
            applyTheme(nextTheme);
            localStorage.setItem("theme", nextTheme);
            window.dispatchEvent(
              new CustomEvent("theme-change", { detail: nextTheme }),
            );
          }}
        />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-[80px] sm:pt-[112px] lg:pt-[152px] pb-8">
          {/* Hero */}
          <div
            className={`mb-4 rounded-2xl border p-4 sm:p-5 shadow-sm ${theme === "light" ? "bg-white border-[#BBD5DA]" : "bg-[#111827] border-[#2d3748]"}`}
          >
            <h1
              className={`text-2xl font-bold mb-1 ${theme === "light" ? "text-gray-900" : "text-white"}`}
            >
              📍 Nearby Offers
            </h1>
            <p
              className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}
            >
              Exclusive deals from stores around you
            </p>
          </div>

          {/* Location error */}
          {locError && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>{locError}</span>
            </div>
          )}

          {/* Push notification banner */}
          {token && !subscribed && permission !== "denied" && location && (
            <div className="mb-3">
              <div
                className={`rounded-xl border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme === "light" ? "bg-[#DFF1F1] border-[#BBD5DA]" : "bg-[#111827] border-[#2d3748]"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-[#BBD5DA] flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={16} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      Get notified about new nearby offers
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      We'll alert you when stores near you post deals.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="shrink-0 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
                >
                  {subLoading && (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {subLoading ? "Enabling…" : "Enable Alerts"}
                </button>
              </div>
              {subError && (
                <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm">
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <span>{subError}</span>
                </div>
              )}
            </div>
          )}

          {subscribed && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 mb-5 text-sm ${theme === "light" ? "bg-[#DFF1F1] border-[#BBD5DA]" : "bg-[#111827] border-[#2d3748]"}`}
            >
              <Bell size={15} className="text-teal-600 shrink-0" />
              <span className="text-teal-700 font-medium">
                You'll be notified about new offers within {radius} km
              </span>
            </div>
          )}

          {/* Radius filter */}
          {location && (
            <div
              className={`rounded-xl border p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap shadow-sm ${theme === "light" ? "bg-white border-[#BBD5DA]" : "bg-[#111827] border-[#2d3748]"}`}
            >
              <p
                className={`text-sm shrink-0 font-medium ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}
              >
                Search radius:
              </p>
              {[2, 5, 10, 20].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    radius === r
                      ? "bg-[#DFF1F1] text-teal-700 border border-[#BBD5DA]"
                      : "bg-[#F5F5F5] text-gray-500 border border-transparent hover:border-[#BBD5DA]"
                  }`}
                >
                  {r} km
                </button>
              ))}
              <p
                className={`text-xs ml-auto font-mono ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}
              >
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden animate-pulse"
                >
                  <div className="aspect-video bg-[#F5F5F5]" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-[#F5F5F5] rounded w-3/4" />
                    <div className="h-3 bg-[#F5F5F5] rounded w-1/2" />
                    <div className="h-8 bg-[#F5F5F5] rounded mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && offers.length === 0 && location && (
            <div className="bg-white rounded-2xl border border-[#BBD5DA] py-20 text-center shadow-sm">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-xl font-semibold text-gray-700 mb-1">
                No offers found within {radius} km
              </p>
              <p className="text-gray-400 text-sm">
                Try increasing the radius or check back later.
              </p>
            </div>
          )}

          {/* Offers grid */}
          {!loading && offers.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {offers.map((offer: Offer) => {
                const highlighted = searchParams.get("offer") === offer._id;
                const timeLeft =
                  new Date(offer.validUntil).getTime() - Date.now();
                const hoursLeft = Math.max(0, Math.floor(timeLeft / 3_600_000));

                return (
                  <div
                    key={offer._id}
                    id={`offer-${offer._id}`}
                    className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
                      highlighted
                        ? "border-teal-400 ring-2 ring-teal-100"
                        : "border-[#BBD5DA]"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-[#F5F5F5]">
                      <img
                        src={
                          offer.image?.startsWith("http")
                            ? offer.image
                            : `${process.env.NEXT_PUBLIC_API_URL}${offer.image}`
                        }
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      {offer.discountPercent > 0 && (
                        <span className="absolute top-2 right-2 bg-[#FF0000] text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
                          {offer.discountPercent}% OFF
                        </span>
                      )}
                      <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                        <MapPin size={10} /> {offer.distanceKm} km away
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <p className="text-xs text-teal-600 font-semibold mb-0.5">
                        {offer.storeName}
                      </p>
                      <h3 className="font-semibold text-gray-900 leading-tight mb-1 truncate">
                        {offer.title}
                      </h3>
                      {offer.description && (
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {offer.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-teal-700 font-bold text-lg">
                            ₹{offer.offerPrice}
                          </span>
                          {offer.originalPrice !== offer.offerPrice && (
                            <span className="text-gray-400 text-sm line-through ml-2">
                              ₹{offer.originalPrice}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium ${
                            hoursLeft < 24
                              ? "bg-red-50 text-[#FF0000] border border-red-200"
                              : "bg-[#F5F5F5] text-gray-500 border border-[#BBD5DA]"
                          }`}
                        >
                          <Clock size={10} />
                          {hoursLeft < 1
                            ? "< 1h left"
                            : hoursLeft < 24
                              ? `${hoursLeft}h left`
                              : `${Math.floor(hoursLeft / 24)}d left`}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (!isAuthenticated()) {
                            redirectToLogin("/nearby");
                            return;
                          }
                          setSelectedOffer(offer);
                          setOrderSuccess(false);
                        }}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={14} /> Order Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Order modal */}
        {selectedOffer && !orderSuccess && (
          <OrderModal
            offer={selectedOffer}
            onClose={() => setSelectedOffer(null)}
            onSuccess={() => setOrderSuccess(true)}
          />
        )}

        {/* Success overlay */}
        {orderSuccess && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 text-center border border-[#BBD5DA] max-w-sm w-full shadow-2xl">
              <p className="text-5xl mb-4">🎉</p>
              <h2 className="text-xl font-bold text-teal-700 mb-2">
                Order Placed!
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                The store will confirm your order shortly.
              </p>
              <button
                onClick={() => {
                  setSelectedOffer(null);
                  setOrderSuccess(false);
                }}
                className="w-full bg-[#F5F5F5] hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 font-semibold py-2.5 rounded-xl transition text-sm"
              >
                Back to Offers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NearbyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
          <p className="text-gray-500">Loading nearby offers...</p>
        </div>
      }
    >
      <NearbyContent />
    </Suspense>
  );
}
