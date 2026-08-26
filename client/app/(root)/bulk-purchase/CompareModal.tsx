"use client";

import { useState, useContext, useEffect, useCallback } from "react";
import {
  X,
  MapPin,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PackageX,
  PackageCheck,
  Store,
  Truck,
  QrCode,
  Wallet,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Building2,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { smartOrderApi, CartItem } from "../../api-services/smartOrderApi";
import { storeApi } from "../../api-services/storeApi";
import { productApi } from "../../api-services/productApi";
import { indianStates, getCities } from "../../utils/indiaLocation";
import InvoiceViewModal from "@/app/components-main/InvoiceViewModal";
import RazorpayModal from "@/app/components-main/RazorpayModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Helper: Dynamically load Cashfree checkout script
const loadCashfreeScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Cashfree) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Palette: #F5F5F5 bg · #DFF1F1 mint · #BBD5DA steel border · teal accents (matches bulk-purchase/nearby pages)

interface MatchedLine {
  requestedName: string;
  requestedBrand?: string | null;
  requestedQuantity: string;
  product: {
    id: string;
    title: string;
    brand?: string | null;
    price: number;
    image: string | null;
  };
  matchScore: number;
  brandMatched?: boolean;
  substituted?: boolean;
  lineTotal: number;
}

interface InsufficientLine {
  requestedName: string;
  requestedQuantity: string;
  product: { id: string; title: string; price: number; availableStock: number };
}

interface StoreResult {
  storeId: string;
  storeName: string;
  distanceKm: number;
  matched: MatchedLine[];
  insufficientStock: InsufficientLine[];
  unmatched: string[];
  matchedCount: number;
  totalRequested: number;
  totalAmount: number;
}

type Step =
  | "radius"
  | "searching"
  | "results"
  | "confirming"
  | "delivery"
  | "payment"
  | "placing"
  | "success"
  | "error";

const RADIUS_OPTIONS = [2, 5, 10, 15, 20];

// Normalizes a title the same way as the store dashboard's groupByTitle /
// groupProductsByType, so a store's product catalog and the customer's
// requested item names line up regardless of casing/whitespace.
const normalizeTitle = (s?: string) =>
  (s || "").toLowerCase().trim().replace(/\s+/g, " ");

export default function CompareModal({
  items,
  onClose,
  onOrderSuccess,
}: {
  items: CartItem[];
  onClose: () => void;
  onOrderSuccess?: () => void;
}) {
  const ctx = useContext(AuthContext) as any;
  const user: any = ctx?.user || null;
  const token: string | null =
    ctx?.token ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const [step, setStep] = useState<Step>("radius");
  const [radius, setRadius] = useState(5);
  const [customRadius, setCustomRadius] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [results, setResults] = useState<StoreResult[]>([]);
  const [chosen, setChosen] = useState<StoreResult | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<{ orderId: string } | null>(
    null,
  );
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayModalData, setRazorpayModalData] = useState<any>(null);

  // ── Carousel (one store card at a time) ────────────────────────────────
  const [carouselIndex, setCarouselIndex] = useState(0);

  // ── View Brands: per-store product catalog + user brand overrides ─────
  const [viewBrandsStoreId, setViewBrandsStoreId] = useState<string | null>(
    null,
  );
  const [brandOptionsByStore, setBrandOptionsByStore] = useState<
    Record<string, Record<string, any[]>>
  >({});
  const [brandLoading, setBrandLoading] = useState<Record<string, boolean>>({});
  // overrides[storeId][requestedName] = the product the customer picked instead
  const [overrides, setOverrides] = useState<
    Record<string, Record<string, any>>
  >({});

  const [deliveryMethod, setDeliveryMethod] = useState<
    "pickup" | "delivery" | null
  >(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "cod" | "qr" | "razorpay" | "cashfree" | null
  >(null);
  const [selectedSubMethod, setSelectedSubMethod] = useState<
    "upi" | "card" | "netbanking" | "wallet"
  >("upi");
  const [isPayingRazorpay, setIsPayingRazorpay] = useState(false);
  const [storeQr, setStoreQr] = useState<string | null>(null);
  const [storeUpiId, setStoreUpiId] = useState<string | null>(null);
  const [copiedStoreUpi, setCopiedStoreUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleCopyStoreUpi = (vpa: string) => {
    navigator.clipboard?.writeText(vpa);
    setCopiedStoreUpi(true);
    setTimeout(() => setCopiedStoreUpi(false), 2000);
  };

  useEffect(() => {
    if (paymentMethod !== "qr" || !chosen) return;
    let cancelled = false;
    setQrLoading(true);
    storeApi
      .getById(chosen.storeId)
      .then((res) => {
        if (!cancelled) {
          const s = res.data?.data;
          setStoreQr(s?.qrCodeImage || null);
          setStoreUpiId(s?.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStoreQr(null);
          setStoreUpiId(process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi");
        }
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paymentMethod, chosen]);

  const [form, setForm] = useState({
    firstName: user?.fullname?.split(" ")[0] || "",
    lastName: user?.fullname?.split(" ").slice(1).join(" ") || "",
    phone: user?.mobilenumber || "",
    contactEmail: user?.email || "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
  });
  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // ── City/State dropdowns + auto-pincode (same pattern used elsewhere) ──
  const [cities, setCities] = useState<any[]>([]);

  const normalize = (s: string) =>
    (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const findState = useCallback((value: string) => {
    const v = normalize(value);
    if (!v) return undefined;
    return indianStates.find(
      (s) => normalize(s.name) === v || normalize(s.isoCode) === v,
    );
  }, []);

  useEffect(() => {
    if (!form.state) return;
    const state = findState(form.state);
    if (state) {
      setCities(getCities(state.isoCode));
    } else {
      setCities([]);
    }
  }, [form.state, findState]);

  const effectiveRadius = customRadius ? parseFloat(customRadius) : radius;

  const executeComparison = async (lat: number, lng: number) => {
    try {
      const storesRes = await smartOrderApi.getNearbyStores(
        lat,
        lng,
        effectiveRadius,
        "store",
      );
      let stores: any[] = storesRes?.data?.data || [];

      // If no stores within specified radius, try broader fallback search
      if (!stores.length && effectiveRadius < 50) {
        try {
          const fallbackRes = await smartOrderApi.getNearbyStores(
            lat,
            lng,
            50,
            "store",
          );
          stores = fallbackRes?.data?.data || [];
        } catch {
          // ignore fallback error
        }
      }

      if (!stores.length) {
        setResults([]);
        setCarouselIndex(0);
        setStep("results");
        return;
      }

      const storeIds = stores.map((s) => s._id || s.id);
      const matchRes = await smartOrderApi.matchCart(items, storeIds);
      const ranked: any[] = matchRes?.data?.data || [];

      const byId: Record<string, any> = {};
      stores.forEach((s) => {
        byId[s._id || s.id] = s;
      });

      if (ranked.length > 0) {
        const merged: StoreResult[] = ranked.map((r) => ({
          ...r,
          storeName: byId[r.storeId]?.name || "Store",
          distanceKm: byId[r.storeId]?.distanceKm ?? 0,
        }));
        setResults(merged);
      } else {
        // Fallback: show nearby stores with unmatched status so customer can browse their inventory
        const unmatchedResults: StoreResult[] = stores.slice(0, 5).map((s) => ({
          storeId: s._id || s.id,
          storeName: s.name || "Store",
          distanceKm: s.distanceKm ?? 0,
          matched: [],
          insufficientStock: [],
          unmatched: items.map((i) => i.name),
          matchedCount: 0,
          totalRequested: items.length,
          totalAmount: 0,
        }));
        setResults(unmatchedResults);
      }

      setCarouselIndex(0);
      setViewBrandsStoreId(null);
      setOverrides({});
      setStep("results");
    } catch (err: any) {
      console.error("Comparison error:", err);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Could not compare nearby stores. Please try again.",
      );
      setStep("radius");
    }
  };

  const runSearch = async () => {
    if (!effectiveRadius || effectiveRadius <= 0) {
      setErrorMsg("Please choose a valid search radius.");
      return;
    }
    setStep("searching");
    setErrorMsg("");

    if (!navigator.geolocation) {
      executeComparison(13.0827, 80.2707);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        executeComparison(lat, lng);
      },
      (geoErr) => {
        console.warn("Geolocation unavailable or denied, using default coordinates:", geoErr);
        executeComparison(13.0827, 80.2707);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // ── View Brands: fetch a store's catalog once, group by normalized title ─
  const fetchBrandOptions = async (storeId: string) => {
    if (brandOptionsByStore[storeId] || brandLoading[storeId]) return;
    setBrandLoading((b) => ({ ...b, [storeId]: true }));
    try {
      const res = await productApi.getByStore(storeId);
      const products: any[] = res.data?.data || [];
      const byTitle: Record<string, any[]> = {};
      products.forEach((p) => {
        const key = normalizeTitle(p.title);
        (byTitle[key] = byTitle[key] || []).push(p);
      });
      Object.values(byTitle).forEach((arr) =>
        arr.sort(
          (a, b) =>
            (a.discountedPrice || a.price) - (b.discountedPrice || b.price),
        ),
      );
      setBrandOptionsByStore((s) => ({ ...s, [storeId]: byTitle }));
    } catch {
      setBrandOptionsByStore((s) => ({ ...s, [storeId]: {} }));
    } finally {
      setBrandLoading((b) => ({ ...b, [storeId]: false }));
    }
  };

  const toggleViewBrands = (storeId: string) => {
    if (viewBrandsStoreId === storeId) {
      setViewBrandsStoreId(null);
      return;
    }
    setViewBrandsStoreId(storeId);
    fetchBrandOptions(storeId);
  };

  const selectBrandOption = (
    storeId: string,
    requestedName: string,
    product: any,
  ) => {
    setOverrides((o) => ({
      ...o,
      [storeId]: { ...(o[storeId] || {}), [requestedName]: product },
    }));
  };

  // Applies any brand overrides on top of a store's original matched lines,
  // preserving each line's implied quantity multiplier (lineTotal / unitPrice)
  // since raw quantity isn't available separately on MatchedLine.
  const getDisplayMatched = (r: StoreResult): MatchedLine[] => {
    const storeOverrides = overrides[r.storeId] || {};
    return r.matched.map((m) => {
      const ov = storeOverrides[m.requestedName];
      if (!ov) return m;
      const price = ov.discountedPrice || ov.price;
      const multiplier =
        m.product.price > 0 ? m.lineTotal / m.product.price : 1;
      return {
        ...m,
        product: {
          id: ov._id,
          title: ov.title,
          brand: ov.brand,
          price,
          image: ov.imageUrl
            ? ov.imageUrl.startsWith("http")
              ? ov.imageUrl
              : `${API}${ov.imageUrl}`
            : null,
        },
        substituted: (ov.brand || "") !== (m.requestedBrand || ""),
        lineTotal: price * multiplier,
      };
    });
  };

  const getDisplayTotal = (r: StoreResult) =>
    getDisplayMatched(r).reduce((sum, m) => sum + m.lineTotal, 0);

  const handleSelectStore = (r: StoreResult) => {
    const displayMatched = getDisplayMatched(r);
    const displayTotal = getDisplayTotal(r);
    setChosen({ ...r, matched: displayMatched, totalAmount: displayTotal });
    setStep("confirming");
  };

  const handleConfirmDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosen) return;
    setStep("delivery");
  };

  const handlePlaceOrder = async () => {
    if (!chosen || !deliveryMethod || !paymentMethod) return;
    setStep("placing");
    setErrorMsg("");
    try {
      const cartItems = chosen.matched.map((m) => {
        const qty = parseInt(m.requestedQuantity, 10) || 1;
        return {
          id: m.product.id,
          title: m.product.title,
          brand: m.product.brand,
          price: m.product.price,
          quantity: qty,
          image: m.product.image,
        };
      });
      const res = await smartOrderApi.placeOrder(
        {
          amount: chosen.totalAmount,
          cartItems,
          contactEmail: form.contactEmail,
          shippingAddress: form,
          userId: user?._id || null,
          storeId: chosen.storeId,
          storeName: chosen.storeName,
          deliveryMethod,
          paymentMethod,
        },
        token,
      );

      if (paymentMethod === "razorpay" || paymentMethod === "cashfree") {
        const targetOrderId = res.data.orderId || "";
        const paymentSessionId = res.data.paymentSessionId;
        const cashfreeOrderId = res.data.cashfreeOrderId || res.data.razorpayOrderId || targetOrderId;

        if (paymentSessionId) {
          setIsPayingRazorpay(true);
          const isLoaded = await loadCashfreeScript();
          if (isLoaded && (window as any).Cashfree) {
            try {
              const isSandbox = Boolean(
                res.data.isSandbox ||
                res.data.paymentSessionId?.includes("paymentpayment") ||
                process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox"
              );
              const cashfreeMode = isSandbox ? "sandbox" : "production";
              const cashfree = (window as any).Cashfree({ mode: cashfreeMode });

              // Start background polling to detect phone simulator completion
              const pollTimer = setInterval(async () => {
                try {
                  const sRes = await fetch(`${API}/api/payment/status/${targetOrderId}`);
                  const sData = await sRes.json();
                  if (sData.success && (sData.status === "SUCCESS" || sData.paymentStatus === "SUCCESS")) {
                    clearInterval(pollTimer);
                    setIsPayingRazorpay(false);
                    setOrderPlaced({ orderId: targetOrderId });
                    setStep("success");
                    onOrderSuccess?.();
                  }
                } catch (e) {
                  // silent poll
                }
              }, 2000);

              cashfree.checkout({
                paymentSessionId,
                redirectTarget: "_modal",
              }).then(async (result: any) => {
                setTimeout(() => clearInterval(pollTimer), 10000);
                setIsPayingRazorpay(false);

                // Auto-verify on return
                try {
                  const verifyRes = await fetch(`${API}/api/payment/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId: targetOrderId,
                      paymentSessionId,
                      cashfree_order_id: cashfreeOrderId,
                    }),
                  });
                  const vData = await verifyRes.json();
                  if (verifyRes.ok && vData.success) {
                    clearInterval(pollTimer);
                    setOrderPlaced({ orderId: targetOrderId });
                    setStep("success");
                    onOrderSuccess?.();
                    return;
                  }
                } catch (vErr) {
                  console.warn("Signature verification notice:", vErr);
                }

                if (result?.error) {
                  clearInterval(pollTimer);
                  setErrorMsg(result.error.message || "Payment was cancelled or dismissed.");
                  setStep("payment");
                  return;
                }
              });
              return;
            } catch (sdkErr: any) {
              console.error("Cashfree SDK initiation error:", sdkErr);
            }
          }
        }

        setRazorpayModalData({
          orderId: targetOrderId,
          paymentSessionId,
          cashfreeOrderId,
          razorpayOrderId: cashfreeOrderId,
          amount: chosen.totalAmount || res.data.amountInRupees || (res.data.amount ? res.data.amount / 100 : 0),
          currency: res.data.currency || "INR",
          name:
            res.data.name || chosen.storeName || "WOW Lifestyle Marketplace",
          description: res.data.description || `Order #${targetOrderId}`,
          payeeVpa: storeUpiId || "remise.merchant@upi",
          customer: {
            name:
              `${form.firstName} ${form.lastName}`.trim() ||
              res.data.customer?.name,
            email: form.contactEmail || res.data.customer?.email,
            contact: form.phone || res.data.customer?.contact,
          },
          initialSubMethod: selectedSubMethod,
        });
        setShowRazorpayModal(true);
        return;
      }


      const orderIdMatch = (res.data.url || "").match(/orderId=([^&]+)/);
      const orderId = orderIdMatch ? orderIdMatch[1] : res.data.orderId || "";

      if (paymentMethod === "qr" && orderId) {
        await smartOrderApi.confirmQrPayment(orderId, screenshotFile, utrNumber);
      }

      setOrderPlaced({ orderId });
      setStep("success");
      onOrderSuccess?.();
    } catch (err: any) {
      setIsPayingRazorpay(false);
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          "Order failed. Please try again.",
      );
      setStep("payment");
    }
  };

  const total = results.length;
  const goPrev = () => setCarouselIndex((i) => (i - 1 + total) % total);
  const goNext = () => setCarouselIndex((i) => (i + 1) % total);
  const r = results[carouselIndex];

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#BBD5DA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#BBD5DA] bg-[#DFF1F1] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Find Cheapest Store
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {items.length} item{items.length !== 1 ? "s" : ""} on your list
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── Step: radius selection ─────────────────────────────────── */}
          {(step === "radius" || step === "searching") && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose how far we should search for stores near you.
              </p>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((rad) => (
                  <button
                    key={rad}
                    type="button"
                    onClick={() => {
                      setRadius(rad);
                      setCustomRadius("");
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      radius === rad && !customRadius
                        ? "bg-[#DFF1F1] text-teal-700 border border-teal-400"
                        : "bg-[#F5F5F5] text-gray-500 border border-transparent hover:border-[#BBD5DA]"
                    }`}
                  >
                    {rad} km
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  placeholder="Custom km"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(e.target.value)}
                  className="w-28 bg-white border border-[#BBD5DA] rounded-full px-4 py-1.5 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <button
                onClick={runSearch}
                disabled={step === "searching"}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {step === "searching" ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Searching
                    nearby stores…
                  </>
                ) : (
                  <>
                    <MapPin size={16} /> Search within {customRadius || radius}{" "}
                    km
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Step: results (carousel — one store card at a time) ─────── */}
          {step === "results" && (
            <div className="space-y-3">
              {results.length === 0 && (
                <div className="text-center py-10">
                  <PackageX size={40} className="text-[#BBD5DA] mx-auto mb-3" />
                  <p className="font-semibold text-gray-700">
                    No nearby stores carry these items
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try a larger search radius.
                  </p>
                  <button
                    onClick={() => setStep("radius")}
                    className="mt-4 text-sm font-semibold text-teal-600 hover:underline"
                  >
                    ← Change radius
                  </button>
                </div>
              )}

              {results.length > 0 && r && (
                <div className="flex items-start gap-2">
                  {/* Prev arrow */}
                  <button
                    onClick={goPrev}
                    disabled={total <= 1}
                    aria-label="Previous store"
                    className="shrink-0 mt-16 w-9 h-9 rounded-full border border-[#BBD5DA] bg-white text-gray-500 hover:bg-[#F5F5F5] hover:text-teal-700 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Card */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`rounded-xl border p-4 ${
                        carouselIndex === 0
                          ? "border-teal-400 ring-2 ring-teal-100 bg-teal-50/30"
                          : "border-[#BBD5DA] bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 break-words">
                            {r.storeName}
                          </p>
                          {carouselIndex === 0 && (
                            <span className="inline-block text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full mt-1">
                              Best match
                            </span>
                          )}
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin size={11} /> {r.distanceKm} km away ·{" "}
                            {r.matchedCount}/{r.totalRequested} items available
                          </p>
                        </div>
                        <p className="font-bold text-teal-700 text-lg whitespace-nowrap shrink-0">
                          ₹{getDisplayTotal(r).toFixed(0)}
                        </p>
                      </div>

                      {getDisplayMatched(r).length > 0 && (
                        <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
                          {getDisplayMatched(r).map((m) => (
                            <li
                              key={m.requestedName}
                              className="flex items-center gap-1.5 flex-wrap"
                            >
                              <PackageCheck
                                size={11}
                                className="text-teal-600 shrink-0"
                              />
                              {m.product.title}
                              {m.product.brand ? ` (${m.product.brand})` : ""} —
                              ₹{m.product.price}
                              {m.substituted && (
                                <span className="text-[10px] text-amber-600 font-semibold">
                                  — different brand than requested
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {(r.insufficientStock.length > 0 ||
                        r.unmatched.length > 0) && (
                        <p className="mt-1.5 text-xs text-amber-600 flex items-start gap-1.5">
                          <AlertCircle size={11} className="shrink-0 mt-0.5" />
                          Not available:{" "}
                          {[
                            ...r.insufficientStock.map((i) => i.requestedName),
                            ...r.unmatched,
                          ].join(", ")}
                        </p>
                      )}

                      {/* View Brands toggle */}
                      <button
                        type="button"
                        onClick={() => toggleViewBrands(r.storeId)}
                        className="w-full mt-2 text-xs font-semibold text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 py-2 rounded-lg transition"
                      >
                        {viewBrandsStoreId === r.storeId
                          ? "Hide Brands ▲"
                          : "View Brands ▾"}
                      </button>

                      {viewBrandsStoreId === r.storeId && (
                        <div className="mt-3 border-t border-[#F5F5F5] pt-3 space-y-3">
                          {brandLoading[r.storeId] ? (
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                              <RefreshCw size={12} className="animate-spin" />{" "}
                              Loading brands…
                            </p>
                          ) : (
                            items.map((item) => {
                              const key = normalizeTitle(item.name);
                              const options =
                                brandOptionsByStore[r.storeId]?.[key] || [];
                              const currentOverride =
                                overrides[r.storeId]?.[item.name];
                              const matchedLine = r.matched.find(
                                (m) => m.requestedName === item.name,
                              );
                              const currentProductId =
                                currentOverride?._id || matchedLine?.product.id;
                              return (
                                <div key={item.name}>
                                  <p className="text-xs font-semibold text-gray-700 mb-1">
                                    {item.name}
                                    {item.brand
                                      ? ` (wanted: ${item.brand})`
                                      : ""}
                                  </p>
                                  {options.length === 0 ? (
                                    <p className="text-xs text-gray-400">
                                      No brands available at this store.
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {options.map((opt) => {
                                        const price =
                                          opt.discountedPrice || opt.price;
                                        const isSelected =
                                          opt._id === currentProductId;
                                        return (
                                          <button
                                            key={opt._id}
                                            type="button"
                                            onClick={() =>
                                              selectBrandOption(
                                                r.storeId,
                                                item.name,
                                                opt,
                                              )
                                            }
                                            className={`text-left border rounded-lg px-2.5 py-1.5 text-xs transition ${
                                              isSelected
                                                ? "border-teal-500 bg-teal-50 ring-1 ring-teal-200"
                                                : "border-[#BBD5DA] bg-white hover:border-teal-300"
                                            }`}
                                          >
                                            <span className="font-semibold text-gray-800 block">
                                              {opt.brand || "Unbranded"}
                                            </span>
                                            <span className="block text-gray-500">
                                              ₹{price} · Stock {opt.totalStock}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => handleSelectStore(r)}
                        className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2 rounded-lg transition"
                      >
                        Select this store
                      </button>
                    </div>

                    {/* Dot indicators */}
                    {total > 1 && (
                      <div className="flex items-center justify-center gap-1.5 mt-4">
                        {results.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCarouselIndex(i)}
                            aria-label={`Go to store ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all ${
                              i === carouselIndex
                                ? "w-5 bg-teal-600"
                                : "w-1.5 bg-[#BBD5DA]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-center text-xs text-gray-400 mt-1.5">
                      {carouselIndex + 1} of {total}
                    </p>
                  </div>

                  {/* Next arrow */}
                  <button
                    onClick={goNext}
                    disabled={total <= 1}
                    aria-label="Next store"
                    className="shrink-0 mt-16 w-9 h-9 rounded-full border border-[#BBD5DA] bg-white text-gray-500 hover:bg-[#F5F5F5] hover:text-teal-700 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {results.length > 0 && (
                <button
                  onClick={() => setStep("radius")}
                  className="text-xs text-gray-400 hover:text-teal-600 transition"
                >
                  ← Search a different radius
                </button>
              )}
            </div>
          )}

          {/* ── Step: confirm delivery details ──────────────────────────── */}
          {step === "confirming" && chosen && (
            <form onSubmit={handleConfirmDetails} className="space-y-3">
              <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {chosen.storeName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {chosen.matchedCount}/{chosen.totalRequested} items ·{" "}
                    {chosen.distanceKm} km away
                  </p>
                </div>
                <p className="font-bold text-teal-700">
                  ₹{chosen.totalAmount.toFixed(0)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    First Name *
                  </label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Phone *
                  </label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setField("contactEmail", e.target.value)}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select
                  required
                  value={form.city}
                  disabled={!form.state}
                  onChange={async (e) => {
                    const city = e.target.value;
                    setField("city", city);
                    if (!city) return;
                    try {
                      const res = await fetch(
                        `https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`,
                      );
                      const data = await res.json();
                      if (
                        data[0]?.Status === "Success" &&
                        data[0].PostOffice?.length > 0
                      ) {
                        setField("pinCode", data[0].PostOffice[0].Pincode);
                      }
                    } catch {
                      /* pincode lookup is best-effort */
                    }
                  }}
                  className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400 disabled:opacity-50"
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {form.state && cities.length === 0 && (
                    <option value="" disabled>
                      No cities found for this state
                    </option>
                  )}
                </select>

                <select
                  required
                  value={findState(form.state)?.isoCode || ""}
                  onChange={(e) => {
                    const code = e.target.value;
                    const state = indianStates.find((s) => s.isoCode === code);
                    setForm((f) => ({
                      ...f,
                      state: state?.name || "",
                      city: "",
                      pinCode: "",
                    }));
                    setCities(getCities(code));
                  }}
                  className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  <option value="">Select State</option>
                  {indianStates.map((state) => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
                </select>

                <input
                  required
                  placeholder="Pin Code"
                  value={form.pinCode}
                  onChange={(e) => setField("pinCode", e.target.value)}
                  className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("results")}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-[#F5F5F5] border border-[#BBD5DA] hover:bg-white transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} /> Continue — ₹
                  {chosen.totalAmount.toFixed(0)}
                </button>
              </div>
            </form>
          )}

          {/* ── Step: delivery method ───────────────────────────────────── */}
          {step === "delivery" && chosen && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                How would you like to receive your order from{" "}
                <strong>{chosen.storeName}</strong>?
              </p>

              <button
                type="button"
                onClick={() => {
                  setDeliveryMethod("pickup");
                  setStep("payment");
                }}
                className="w-full text-left border border-[#BBD5DA] hover:border-teal-400 rounded-xl p-4 transition flex items-center gap-3"
              >
                <Store size={20} className="text-teal-600 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Self Pickup</p>
                  <p className="text-xs text-gray-400">
                    Visit the shop and collect your order yourself.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeliveryMethod("delivery");
                  setStep("payment");
                }}
                className="w-full text-left border border-[#BBD5DA] hover:border-teal-400 rounded-xl p-4 transition flex items-center gap-3"
              >
                <Truck size={20} className="text-teal-600 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Home Delivery</p>
                  <p className="text-xs text-gray-400">
                    {chosen.storeName} will deliver the order to your address.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep("confirming")}
                className="text-xs text-gray-400 hover:text-teal-600 transition"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── Step: payment method ────────────────────────────────────── */}
          {step === "payment" && chosen && (
            <div className="space-y-4">
              {!paymentMethod && (
                <>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      How would you like to pay?
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select your preferred payment method to complete this
                      order.
                    </p>
                  </div>

                  {/* 1. Razorpay Online Payment Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("razorpay");
                      setSelectedSubMethod("upi");
                    }}
                    className="w-full text-left border-2 border-teal-500 bg-gradient-to-r from-teal-50/70 to-emerald-50/40 hover:from-teal-50 hover:to-emerald-50 rounded-xl p-4 transition shadow-sm hover:shadow-md flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 group-hover:scale-105 transition-transform">
                      <CreditCard size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">
                          Online Payment (Cashfree Easy Split)
                        </p>
                        <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Instant · 100% Secure
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Pay securely using <strong>UPI</strong> (Google Pay,
                        PhonePe, Paytm), <strong>Credit/Debit Cards</strong>,{" "}
                        <strong>Net Banking</strong>, or{" "}
                        <strong>Wallets</strong>.
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[11px] font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md shadow-2xs">
                          ⚡ UPI / QR
                        </span>
                        <span className="text-[11px] font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md shadow-2xs">
                          💳 Cards
                        </span>
                        <span className="text-[11px] font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md shadow-2xs">
                          🏦 Net Banking
                        </span>
                        <span className="text-[11px] font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md shadow-2xs">
                          👛 Wallets
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* 2. Store QR Code Payment Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qr")}
                    className="w-full text-left border border-[#BBD5DA] hover:border-teal-400 bg-white hover:bg-gray-50/50 rounded-xl p-4 transition flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 border border-gray-200 mt-0.5">
                      <QrCode size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        Store QR Code Payment
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Scan {chosen.storeName}'s direct UPI QR code and upload
                        screenshot proof.
                      </p>
                    </div>
                  </button>

                  {/* 3. Cash on Delivery / Pickup */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className="w-full text-left border border-[#BBD5DA] hover:border-teal-400 bg-white hover:bg-gray-50/50 rounded-xl p-4 transition flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 border border-gray-200 mt-0.5">
                      <Wallet size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">Cash</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {deliveryMethod === "pickup"
                          ? "Pay cash directly at the shop when collecting your items."
                          : "Pay cash on delivery to the courier partner."}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("delivery")}
                    className="text-xs text-gray-500 hover:text-teal-700 font-semibold transition inline-flex items-center gap-1 mt-1"
                  >
                    ← Back to Delivery Choice
                  </button>
                </>
              )}

              {/* ── Cashfree Detailed Payment Methods Breakdown ── */}
              {paymentMethod === "razorpay" && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Available Cashfree Payment Methods
                      </h3>
                      <p className="text-xs text-gray-500">
                        Select a method to pay{" "}
                        <strong>₹{chosen.totalAmount.toFixed(0)}</strong>:
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      Cashfree Easy Split
                    </span>
                  </div>

                  {/* Sub-Methods Grid */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Method 1: UPI */}
                    <div
                      onClick={() => setSelectedSubMethod("upi")}
                      className={`cursor-pointer border-2 rounded-xl p-3 transition flex items-start gap-3 ${
                        selectedSubMethod === "upi"
                          ? "border-teal-500 bg-teal-50/50 shadow-xs"
                          : "border-gray-200 bg-white hover:border-teal-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900 text-xs">
                            UPI (Google Pay, PhonePe, Paytm, BHIM)
                          </p>
                          <span className="text-[9px] font-bold bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                            Fastest / 0% Fee
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Instant checkout using any UPI App, QR scan, or UPI
                          ID.
                        </p>
                      </div>
                    </div>

                    {/* Method 2: Cards */}
                    <div
                      onClick={() => setSelectedSubMethod("card")}
                      className={`cursor-pointer border-2 rounded-xl p-3 transition flex items-start gap-3 ${
                        selectedSubMethod === "card"
                          ? "border-teal-500 bg-teal-50/50 shadow-xs"
                          : "border-gray-200 bg-white hover:border-teal-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900 text-xs">
                            Credit / Debit Cards
                          </p>
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            All Cards
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Visa, MasterCard, RuPay, Maestro & Diners Club cards.
                        </p>
                      </div>
                    </div>

                    {/* Method 3: Net Banking */}
                    <div
                      onClick={() => setSelectedSubMethod("netbanking")}
                      className={`cursor-pointer border-2 rounded-xl p-3 transition flex items-start gap-3 ${
                        selectedSubMethod === "netbanking"
                          ? "border-teal-500 bg-teal-50/50 shadow-xs"
                          : "border-gray-200 bg-white hover:border-teal-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900 text-xs">
                            Net Banking
                          </p>
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            50+ Banks
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          SBI, HDFC, ICICI, Axis, Kotak and all major Indian
                          banks.
                        </p>
                      </div>
                    </div>

                    {/* Method 4: Wallets */}
                    <div
                      onClick={() => setSelectedSubMethod("wallet")}
                      className={`cursor-pointer border-2 rounded-xl p-3 transition flex items-start gap-3 ${
                        selectedSubMethod === "wallet"
                          ? "border-teal-500 bg-teal-50/50 shadow-xs"
                          : "border-gray-200 bg-white hover:border-teal-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Wallet size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900 text-xs">
                            Wallets
                          </p>
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            1-Click
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Paytm Wallet, PhonePe, Amazon Pay, Mobikwik & more.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security trust badge */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs">
                    <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                    <span>
                      256-bit SSL encrypted · Verified by Cashfree Easy Split · Instant
                      refund on cancellation
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(null)}
                      disabled={isPayingRazorpay}
                      className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-[#F5F5F5] border border-[#BBD5DA] hover:bg-white transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isPayingRazorpay}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isPayingRazorpay ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />{" "}
                          Opening Cashfree…
                        </>
                      ) : (
                        <>
                          <Lock size={16} /> Proceed to Pay ₹
                          {chosen.totalAmount.toFixed(0)} via Cashfree
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Cash on Delivery Step ── */}
              {paymentMethod === "cod" && (
                <div className="space-y-3">
                  <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-4 text-sm text-gray-600">
                    {deliveryMethod === "pickup"
                      ? "You will pay in cash when you pick up your order at the shop."
                      : "You will pay in cash to the delivery person (Cash on Delivery)."}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(null)}
                      className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-[#F5F5F5] border border-[#BBD5DA] hover:bg-white transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} /> Confirm & Order — ₹
                      {chosen.totalAmount.toFixed(0)}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Store QR Code Step ── */}
              {paymentMethod === "qr" && (
                <div className="space-y-3.5">
                  {qrLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-500">
                      <RefreshCw size={16} className="animate-spin text-teal-600" />
                      <span>Loading store merchant QR details…</span>
                    </div>
                  ) : (
                    <>
                      {/* Merchant Store Header */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            <Store size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900">
                              {chosen.storeName}
                            </p>
                            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                              ● Direct Merchant UPI
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block">Payable Amount</span>
                          <span className="text-sm font-black text-teal-700">
                            ₹{chosen.totalAmount.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Direct Store QR Image Box */}
                      <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-[#F5F5F5] p-3.5 rounded-xl border border-[#BBD5DA]">
                        <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 shrink-0">
                          <img
                            src={
                              storeQr ||
                              `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                `upi://pay?pa=${storeUpiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi"}&pn=${encodeURIComponent(chosen.storeName)}&am=${chosen.totalAmount.toFixed(2)}&cu=INR&tn=Order_${chosen.storeName}`
                              )}&margin=4`
                            }
                            alt="Store UPI QR Code"
                            className="w-36 h-36 object-contain"
                          />
                        </div>

                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <div className="bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-between gap-2">
                            <div className="text-left truncate">
                              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Merchant UPI VPA</span>
                              <span className="text-xs font-mono font-bold text-gray-800 truncate">
                                {storeUpiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyStoreUpi(storeUpiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi")}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold rounded transition shrink-0 flex items-center gap-1"
                            >
                              {copiedStoreUpi ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                              <span>{copiedStoreUpi ? "Copied" : "Copy"}</span>
                            </button>
                          </div>

                          <p className="text-[11px] text-gray-500 leading-snug">
                            Scan with Google Pay, PhonePe, Paytm, CRED or BHIM to pay ₹{chosen.totalAmount.toFixed(0)} directly.
                          </p>

                          <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                            {["GPay", "PhonePe", "Paytm", "CRED", "BHIM"].map((app) => (
                              <span key={app} className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                                {app}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* UTR / Transaction Reference Number Input */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          UPI Ref / UTR Number (Optional / Recommended)
                        </label>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="e.g. 12-digit UTR No. (3245XXXXXXXX)"
                          className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-teal-400"
                        />
                      </div>

                      {/* Payment Screenshot Upload */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          Upload payment screenshot (optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#DFF1F1] file:text-teal-700 file:text-xs file:font-semibold"
                        />
                        {screenshotPreview && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={screenshotPreview}
                              alt="Screenshot preview"
                              className="w-14 h-14 object-cover rounded-lg border border-[#BBD5DA]"
                            />
                            <span className="text-xs text-green-600 font-semibold">Screenshot attached ✓</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod(null)}
                          className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-[#F5F5F5] border border-[#BBD5DA] hover:bg-white transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handlePlaceOrder}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 size={16} /> I've Completed Payment
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step: placing ────────────────────────────────────────────── */}
          {step === "placing" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <RefreshCw size={32} className="text-teal-600 animate-spin" />
              <p className="text-sm text-gray-500">Placing your order…</p>
            </div>
          )}

          {/* ── Step: success ────────────────────────────────────────────── */}
          {step === "success" && chosen && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center border border-green-200">
                <CheckCircle2 size={36} className="text-green-600" />
              </div>

              <div>
                <p className="font-bold text-gray-900 text-lg">
                  Order & Payment Confirmed!
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Your order from <strong>{chosen.storeName}</strong> has been
                  successfully placed via{" "}
                  {paymentMethod === "razorpay"
                    ? "Online Payment (Razorpay - Verified)"
                    : paymentMethod === "qr"
                      ? "Store UPI / QR Code"
                      : "Cash on Delivery"}{" "}
                  (
                  {deliveryMethod === "pickup"
                    ? "Self Pickup"
                    : "Home Delivery"}
                  ).
                </p>
              </div>

              {/* Verified Bill Card */}
              <div className="w-full bg-[#F8FAFC] border border-[#BBD5DA] rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                      Verified Bill
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-0.5">
                      {chosen.storeName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      ● PAID
                    </span>
                    {orderPlaced?.orderId && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        #{orderPlaced.orderId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block text-[10px]">
                      Customer:
                    </span>
                    <span className="font-medium text-gray-800">
                      {[form.firstName, form.lastName]
                        .filter(Boolean)
                        .join(" ") || "Customer"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">
                      Payment Method:
                    </span>
                    <span className="font-medium text-teal-800">
                      {paymentMethod === "razorpay"
                        ? "Online Payment (Razorpay)"
                        : paymentMethod === "qr"
                          ? "Store UPI / QR Payment"
                          : "Cash on Delivery"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                    <span className="font-bold text-sm text-gray-900">
                      Total: ₹{chosen.totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Download Bill, View Invoice, Done */}
              <div className="flex flex-col w-full gap-2 pt-1">
                {orderPlaced?.orderId && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-bold transition"
                    >
                      <FileText size={14} /> View Invoice
                    </button>
                    <a
                      href={smartOrderApi.getInvoicePdfUrl(orderPlaced.orderId)}
                      download={`Invoice-${orderPlaced.orderId}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Download size={14} /> Download Bill (PDF)
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {orderPlaced?.orderId && (
        <InvoiceViewModal
          orderId={orderPlaced.orderId}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {showRazorpayModal && razorpayModalData && (
        <RazorpayModal
          isOpen={showRazorpayModal}
          orderId={razorpayModalData.orderId}
          paymentSessionId={razorpayModalData.paymentSessionId}
          cashfreeOrderId={razorpayModalData.cashfreeOrderId}
          razorpayOrderId={razorpayModalData.razorpayOrderId}
          amount={razorpayModalData.amount}
          currency={razorpayModalData.currency}
          name={razorpayModalData.name}
          description={razorpayModalData.description}
          payeeVpa={razorpayModalData.payeeVpa}
          customer={razorpayModalData.customer}
          initialSubMethod={razorpayModalData.initialSubMethod}
          onSuccess={(targetOrderId) => {
            setShowRazorpayModal(false);
            setOrderPlaced({ orderId: targetOrderId });
            setStep("success");
            onOrderSuccess?.();
          }}
          onFailure={(err) => {
            setShowRazorpayModal(false);
            setErrorMsg(err || "Payment failed. Please try again.");
            setStep("payment");
          }}
          onClose={() => {
            setShowRazorpayModal(false);
            setStep("payment");
          }}
        />
      )}
    </div>
  );
}
