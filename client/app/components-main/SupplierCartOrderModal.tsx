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
  FileText,
  Download,
} from "lucide-react";
import { smartOrderApi } from "../api-services/smartOrderApi";
import { storeApi } from "../api-services/storeApi";
import { orderApi } from "../api-services/orderApi";
import { indianStates, getCities } from "../utils/indiaLocation";
import InvoiceViewModal from "@/app/components-main/InvoiceViewModal";

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

  const chosen = groups[index];
  const isLast = index === groups.length - 1;

  const [deliveryMethod, setDeliveryMethod] = useState<
    "pickup" | "delivery" | null
  >(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "qr" | null>(null);
  const [storeQr, setStoreQr] = useState<string | null>(null);
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

  useEffect(() => {
    if (paymentMethod !== "qr" || !chosen) return;
    let cancelled = false;
    setQrLoading(true);
    storeApi
      .getById(chosen.storeId)
      .then((res) => {
        if (!cancelled) setStoreQr(res.data?.data?.qrCodeImage || null);
      })
      .catch(() => {
        if (!cancelled) setStoreQr(null);
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

          {step === "payment" && (
            <div className="space-y-3">
              {!paymentMethod && (
  <>
    <p className="text-sm text-gray-600">
      How would you like to pay?
    </p>

    <button
      type="button"
      onClick={() => setPaymentMethod("qr")}
      className="w-full text-left border border-[#BBD5DA] hover:border-teal-400 rounded-xl p-4 transition flex items-center gap-3"
    >
      <QrCode size={20} className="text-teal-600 shrink-0" />
      <div>
        <p className="font-semibold text-gray-900">
          QR Code Payment
        </p>
        <p className="text-xs text-gray-400">
          Scan {chosen.storeName}'s QR code and pay instantly.
        </p>
      </div>
    </button>

    <button
      type="button"
      onClick={() => setStep("delivery")}
      className="text-xs text-gray-400 hover:text-teal-600 transition"
    >
      ← Back
    </button>
  </>
)}

              {paymentMethod === "qr" && (
                <div className="space-y-3">
                  {qrLoading && (
                    <p className="text-sm text-gray-400">
                      Loading {chosen.storeName}'s QR code…
                    </p>
                  )}

                  {!qrLoading && storeQr && (
                    <div className="flex flex-col items-center gap-2 bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-4">
                      <img
                        src={storeQr}
                        alt="Payment QR code"
                        className="w-48 h-48 object-contain bg-white rounded-lg border border-[#BBD5DA]"
                      />
                      <p className="text-xs text-gray-500 text-center">
                        Scan with any UPI app to pay {chosen.storeName} ₹
                        {chosen.totalAmount.toFixed(0)}
                      </p>
                    </div>
                  )}

                  {!qrLoading && !storeQr && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">
                      This supplier hasn't set up QR payment yet. Please go back
                      and choose Cash/Invoice instead.
                    </div>
                  )}

                  {storeQr && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Upload payment screenshot (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#DFF1F1] file:text-teal-700 file:text-sm file:font-semibold"
                      />
                      {screenshotPreview && (
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="mt-2 w-24 h-24 object-cover rounded-lg border border-[#BBD5DA]"
                        />
                      )}
                    </div>
                  )}

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
                      disabled={!storeQr}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> I've Completed Payment
                    </button>
                  </div>
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
                  {paymentMethod === "qr" ? "UPI / QR code" : "cash/invoice"}.
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
                      {paymentMethod === "qr" ? "UPI / QR Payment" : "Cash / Invoice on Delivery"}
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
    </div>
  );
}

