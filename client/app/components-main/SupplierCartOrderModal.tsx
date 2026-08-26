"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Store,
  Truck,
  QrCode,
  Wallet,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Building2,
  Lock,
  FileText,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { smartOrderApi } from "../api-services/smartOrderApi";
import { storeApi } from "../api-services/storeApi";
import { orderApi } from "../api-services/orderApi";
import { indianStates, getCities } from "../utils/indiaLocation";
import InvoiceViewModal from "@/app/components-main/InvoiceViewModal";
import RazorpayModal from "@/app/components-main/RazorpayModal";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface CartOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string | null;
  moq?: number;
  tierLabel?: string | null;
}

interface CartOrderGroup {
  storeId: string;
  storeName: string;
  supplierRole?: string;
  items: CartOrderItem[];
  totalAmount: number;
}

type FlowStep = "confirming" | "delivery" | "payment" | "placing" | "success";

export interface SupplierOrderPrefill {
  firstName?: string; lastName?: string; phone?: string; contactEmail?: string;
  address?: string; city?: string; state?: string; pinCode?: string;
}

interface Props {
  groups: CartOrderGroup[];
  prefill?: SupplierOrderPrefill;
  token: string;
  onComplete: () => void;
  onClose: () => void;
}

export default function SupplierCartOrderModal({ groups, prefill, token, onComplete, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<FlowStep>("confirming");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayModalData, setRazorpayModalData] = useState<any>(null);

  const chosen = groups[index];
  const isLast = index === groups.length - 1;

  const [deliveryMethod, setDeliveryMethod] = useState<
    "pickup" | "delivery" | null
  >(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "qr" | "razorpay" | null>(null);
  const [selectedSubMethod, setSelectedSubMethod] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
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
    firstName: prefill?.firstName || "",
    lastName: prefill?.lastName || "",
    phone: prefill?.phone || "",
    contactEmail: prefill?.contactEmail || "",
    address: prefill?.address || "",
    city: prefill?.city || "",
    state: prefill?.state || "",
    pinCode: prefill?.pinCode || "",
  });
  
  const [cities, setCities] = useState<any[]>([]);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const resetForNextGroup = () => {
    setDeliveryMethod(null);
    setPaymentMethod(null);
    setSelectedSubMethod("upi");
    setIsPayingRazorpay(false);
    setStoreQr(null);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setErrorMsg("");
    setStep("delivery");
  };

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
        console.warn(
          "State mismatch — saved value:",
          JSON.stringify(form.state),
          "→ no match found in indianStates",
        );
        setCities([]);
      }
    }, [form.state, findState]);

  const handleConfirmDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosen) return;
    setStep("delivery");
  };

  const handlePlaceOrder = async () => {
    if (!chosen || !deliveryMethod || !paymentMethod) return;

    if (paymentMethod === "razorpay") {
      setIsPayingRazorpay(true);
      setErrorMsg("");
      try {
        const res = await orderApi.placeWholesaleOrder(
          {
            supplierStoreId: chosen.storeId,
            supplierStoreName: chosen.storeName,
            supplierRole: chosen.supplierRole,
            contactEmail: form.contactEmail,
            items: chosen.items.map((i) => ({
              productId: i.productId,
              title: i.title,
              price: i.price,
              quantity: i.quantity,
              image: i.image,
              moq: i.moq,
              tierLabel: i.tierLabel,
            })),
            shippingAddress: form,
            billingAddress: form,
            paymentMethod: "razorpay",
          },
          token,
        );

        const data = res.data?.data || res.data;
        const placedOrderId = data?.orderId;
        const razorpayOrderId = data?.razorpayOrderId;

        if (placedOrderId) {
          setLastPlacedOrderId(placedOrderId);
        }

        if (!razorpayOrderId) {
          setIsPayingRazorpay(false);
          setStep("success");
          return;
        }

        const isSandbox = Boolean(
          data.isSandbox || razorpayOrderId.startsWith("order_mock_")
        );

        if (isSandbox) {
          setIsPayingRazorpay(false);
          setRazorpayModalData({
            orderId: placedOrderId,
            razorpayOrderId,
            amount: chosen.totalAmount || data.amountInRupees || (data.amount ? data.amount / 100 : 0),
            currency: data.currency || "INR",
            name: data.name || chosen.storeName || "WOW Lifestyle Marketplace",
            description: data.description || `Order #${placedOrderId}`,
            payeeVpa: storeUpiId || "remise.merchant@upi",
            customer: {
              name: [form.firstName, form.lastName].filter(Boolean).join(" "),
              email: form.contactEmail,
              contact: form.phone,
            },
            initialSubMethod: selectedSubMethod,
          });
          setShowRazorpayModal(true);
          return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          setIsPayingRazorpay(false);
          setRazorpayModalData({
            orderId: placedOrderId,
            razorpayOrderId,
            amount: chosen.totalAmount || data.amountInRupees || (data.amount ? data.amount / 100 : 0),
            currency: data.currency || "INR",
            name: data.name || chosen.storeName || "WOW Lifestyle Marketplace",
            description: data.description || `Order #${placedOrderId}`,
            payeeVpa: storeUpiId || "remise.merchant@upi",
            customer: {
              name: [form.firstName, form.lastName].filter(Boolean).join(" "),
              email: form.contactEmail,
              contact: form.phone,
            },
            initialSubMethod: selectedSubMethod,
          });
          setShowRazorpayModal(true);
          return;
        }

        const rzp = new window.Razorpay({
          key: data.key || "rzp_test_TRXC8nEMqsywBS",
          amount: data.amount,
          currency: data.currency || "INR",
          name: data.name || chosen.storeName || "WOW Lifestyle Marketplace",
          description: data.description || `Order #${placedOrderId}`,
          order_id: razorpayOrderId,
          prefill: {
            name: [form.firstName, form.lastName].filter(Boolean).join(" "),
            email: form.contactEmail,
            contact: form.phone,
          },
          theme: {
            color: "#0d9488",
          },
          handler: async (response: any) => {
            try {
              await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: placedOrderId,
                }),
              });
            } catch (vErr) {
              console.warn("Signature verification notice:", vErr);
            }
            setIsPayingRazorpay(false);
            setStep("success");
          },
          modal: {
            ondismiss: () => {
              setIsPayingRazorpay(false);
            },
          },
        });

        rzp.on("payment.failed", () => {
          setIsPayingRazorpay(false);
          setRazorpayModalData({
            orderId: placedOrderId,
            razorpayOrderId,
            amount: chosen.totalAmount || data.amountInRupees || (data.amount ? data.amount / 100 : 0),
            currency: data.currency || "INR",
            name: data.name || chosen.storeName || "WOW Lifestyle Marketplace",
            description: data.description || `Order #${placedOrderId}`,
            payeeVpa: storeUpiId || "remise.merchant@upi",
            customer: {
              name: [form.firstName, form.lastName].filter(Boolean).join(" "),
              email: form.contactEmail,
              contact: form.phone,
            },
            initialSubMethod: selectedSubMethod,
          });
          setShowRazorpayModal(true);
        });

        rzp.open();
        return;
      } catch (err: any) {
        setIsPayingRazorpay(false);
        setErrorMsg(err.message || "Failed to process Razorpay order.");
        return;
      }
    }

    setStep("placing");
    setErrorMsg("");
    try {
      const res = await orderApi.placeWholesaleOrder(
        {
          supplierStoreId: chosen.storeId,
          supplierStoreName: chosen.storeName,
          supplierRole: chosen.supplierRole,
          contactEmail: form.contactEmail,
          items: chosen.items.map((i) => ({
            productId: i.productId,
            title: i.title,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            moq: i.moq,
            tierLabel: i.tierLabel,
          })),
          shippingAddress: form,
          billingAddress: form,
        },
        token,
      );

      const placedOrder = res.data.data;
      if (placedOrder?.orderId) {
        setLastPlacedOrderId(placedOrder.orderId);
      }

      if (paymentMethod === "qr" && placedOrder?.orderId) {
        await smartOrderApi.confirmQrPayment(
          placedOrder.orderId,
          screenshotFile,
          utrNumber
        );
      }

      setStep("success");
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          "Order failed. Please try again.",
      );
      setStep("payment");
    }
  };

  const handleContinueOrFinish = () => {
    if (isLast) {
      onComplete();
      onClose();
    } else {
      setIndex((i) => i + 1);
      resetForNextGroup();
    }
  };

  if (!chosen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#BBD5DA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#BBD5DA] bg-[#DFF1F1] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {groups.length > 1
                ? `Order ${index + 1} of ${groups.length}`
                : "Confirm Your Order"}
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">{chosen.storeName}</p>
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

          {step === "confirming" && (
            <form onSubmit={handleConfirmDetails} className="space-y-3">
              <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    {chosen.storeName}
                  </p>
                  <p className="font-bold text-teal-700">
                    ₹{chosen.totalAmount.toFixed(0)}
                  </p>
                </div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {chosen.items.map((i) => (
                    <li key={i.productId}>
                      {i.quantity} × {i.title} — ₹{i.price}
                    </li>
                  ))}
                </ul>
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
        if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
          setField("pinCode", data[0].PostOffice[0].Pincode);
        }
      } catch {
        /* pincode lookup is best-effort — leave existing value on failure */
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

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} /> Continue — ₹
                {chosen.totalAmount.toFixed(0)}
              </button>
            </form>
          )}

          {step === "delivery" && (
  <div className="space-y-3">
    <p className="text-sm text-gray-600">
      Your order from <strong>{chosen.storeName}</strong> will be delivered
      to your store.
    </p>

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
        <p className="font-semibold text-gray-900">Delivery</p>
        <p className="text-xs text-gray-400">
          {chosen.storeName} will deliver the stock to your store.
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

          {/* ── Step: payment ────────────────────────────────────────────── */}
          {step === "payment" && (
            <div className="space-y-4">
              {!paymentMethod && (
                <>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      How would you like to pay?
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select a payment method for {chosen.storeName}.
                    </p>
                  </div>

                  {/* 1. Razorpay Option */}
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
                        Pay instantly using <strong>UPI</strong>, <strong>Cards</strong>, <strong>Net Banking</strong>, or <strong>Wallets</strong>.
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[11px] font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md">
                          ⚡ UPI / QR
                        </span>
                        <span className="text-[11px] font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md">
                          💳 Cards
                        </span>
                        <span className="text-[11px] font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md">
                          🏦 Net Banking
                        </span>
                        <span className="text-[11px] font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md">
                          👛 Wallets
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* 2. QR Code Option */}
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
                        Supplier QR Code Payment
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Scan {chosen.storeName}'s direct UPI QR code and upload screenshot proof.
                      </p>
                    </div>
                  </button>

                  {/* 3. Cash / Invoice on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className="w-full text-left border border-[#BBD5DA] hover:border-teal-400 bg-white hover:bg-gray-50/50 rounded-xl p-4 transition flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 border border-gray-200 mt-0.5">
                      <Wallet size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        Cash / Invoice on Delivery
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {deliveryMethod === "pickup"
                          ? "Pay or settle invoice when collecting from supplier warehouse."
                          : "Settle via credit terms / invoice upon delivery."}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("delivery")}
                    className="text-xs text-gray-500 hover:text-teal-700 font-semibold transition inline-flex items-center gap-1 mt-1"
                  >
                    ← Back to Delivery
                  </button>
                </>
              )}

              {/* ── Cashfree Payment Sub-methods Breakdown ── */}
              {paymentMethod === "razorpay" && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Available Cashfree Payment Methods
                      </h3>
                      <p className="text-xs text-gray-500">
                        Select a method to pay <strong>₹{chosen.totalAmount.toLocaleString("en-IN")}</strong>:
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      Cashfree Easy Split
                    </span>
                  </div>

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
                            Instant
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Instant checkout using any UPI App, QR scan, or UPI ID.
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
                            Credit / Debit Cards (Corporate & Personal)
                          </p>
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            All Cards
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Visa, MasterCard, RuPay & Business cards supported.
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
                            Corporate & Retail Net Banking
                          </p>
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            50+ Banks
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          SBI, HDFC, ICICI, Axis, Kotak and all major Indian banks.
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

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs">
                    <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                    <span>
                      256-bit SSL encrypted · Verified by Cashfree Easy Split · Instant invoice generation
                    </span>
                  </div>

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
                          <RefreshCw size={16} className="animate-spin" /> Opening Cashfree…
                        </>
                      ) : (
                        <>
                          <Lock size={16} /> Proceed to Pay ₹{chosen.totalAmount.toLocaleString("en-IN")} via Cashfree
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Cash / Invoice Step ── */}
              {paymentMethod === "cod" && (
                <div className="space-y-3">
                  <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-4 text-sm text-gray-600">
                    You will settle the amount of ₹{chosen.totalAmount.toLocaleString("en-IN")} directly upon delivery or via invoice settlement.
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
                      <ShoppingBag size={16} /> Confirm & Order — ₹{chosen.totalAmount.toLocaleString("en-IN")}
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
                      <span>Loading supplier QR details…</span>
                    </div>
                  ) : (
                    <>
                      {/* Supplier Store Header */}
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
                            ₹{chosen.totalAmount.toLocaleString("en-IN")}
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
                            alt="Supplier QR code"
                            className="w-36 h-36 object-contain"
                          />
                        </div>

                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <div className="bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-between gap-2">
                            <div className="text-left truncate">
                              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Supplier UPI VPA</span>
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
                            Scan with Google Pay, PhonePe, Paytm, CRED or BHIM to transfer ₹{chosen.totalAmount.toLocaleString("en-IN")}.
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
                          <CheckCircle size={16} /> I've Completed Payment
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "placing" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <RefreshCw size={32} className="text-teal-600 animate-spin" />
              <p className="text-sm text-gray-500">Placing your order…</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center border border-green-200">
                <CheckCircle size={36} className="text-green-600" />
              </div>

              <div>
                <p className="font-bold text-gray-900 text-lg">Order Confirmed!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Your wholesale order from <strong>{chosen.storeName}</strong> is
                  confirmed —{" "}
                  {deliveryMethod === "pickup"
                    ? "ready for self pickup"
                    : "out for delivery"}
                  , paying via{" "}
                  {paymentMethod === "razorpay" ? "Online Payment (Razorpay - Verified)" : paymentMethod === "qr" ? "UPI / QR code" : "Cash / Invoice on Delivery"}.
                </p>
              </div>

              {/* Bill Card */}
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
                    {lastPlacedOrderId && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        #{lastPlacedOrderId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Buyer:</span>
                    <span className="font-medium text-gray-800">
                      {[form.firstName, form.lastName].filter(Boolean).join(" ") || "Store Owner"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Payment Method:</span>
                    <span className="font-medium text-teal-800">
                      {paymentMethod === "razorpay" ? "Online Payment (Razorpay)" : paymentMethod === "qr" ? "UPI / QR Payment" : "Cash / Invoice on Delivery"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-xs">
                  <span className="text-gray-500">{chosen.items.length} product(s)</span>
                  <span className="font-bold text-sm text-gray-900">
                    Total: ₹{chosen.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col w-full gap-2 pt-1">
                {lastPlacedOrderId && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-bold transition"
                    >
                      <FileText size={14} /> View Invoice
                    </button>
                    <a
                      href={smartOrderApi.getInvoicePdfUrl(lastPlacedOrderId)}
                      download={`Invoice-${lastPlacedOrderId}.pdf`}
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
                  onClick={handleContinueOrFinish}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
                >
                  {isLast
                    ? "Done"
                    : `Continue to Order ${index + 2} of ${groups.length}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {lastPlacedOrderId && (
        <InvoiceViewModal
          orderId={lastPlacedOrderId}
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
          customer={razorpayModalData.customer}
          initialSubMethod={razorpayModalData.initialSubMethod}
          onSuccess={() => {
            setShowRazorpayModal(false);
            setStep("success");
          }}
          onFailure={(err) => {
            setShowRazorpayModal(false);
            setErrorMsg(err || "Payment failed. Please try again.");
          }}
          onClose={() => {
            setShowRazorpayModal(false);
          }}
        />
      )}
    </div>
  );
}

