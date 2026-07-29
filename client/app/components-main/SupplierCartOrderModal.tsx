"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Store,
  Truck,
  QrCode,
  Wallet,
} from "lucide-react";
import { smartOrderApi } from "../api-services/smartOrderApi";
import { storeApi } from "../api-services/storeApi";
import { orderApi } from "../api-services/orderApi";

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

export default function SupplierCartOrderModal({
  groups, prefill, token, onClose, onComplete,
}: {
  groups: CartOrderGroup[];
  prefill?: SupplierOrderPrefill; token: string; onClose: () => void; onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<FlowStep>("confirming");
  const [errorMsg, setErrorMsg] = useState("");

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
                <input
                  required
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
                <input
                  required
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setField("state", e.target.value)}
                  className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
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
                    Collect the stock yourself from the supplier.
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
                    onClick={() => setPaymentMethod("cod")}
                    className="w-full text-left border border-[#BBD5DA] hover:border-teal-400 rounded-xl p-4 transition flex items-center gap-3"
                  >
                    <Wallet size={20} className="text-teal-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Cash / Invoice
                      </p>
                      <p className="text-xs text-gray-400">
                        {deliveryMethod === "pickup"
                          ? "Pay at pickup."
                          : "Pay on delivery or by invoice."}
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

              {paymentMethod === "cod" && (
                <div className="space-y-3">
                  <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-4 text-sm text-gray-600">
                    {deliveryMethod === "pickup"
                      ? "You will pay when you pick up the stock."
                      : "You will pay the supplier on delivery or via invoice."}
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
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle size={48} className="text-green-600" />
              <div>
                <p className="font-bold text-gray-900">Order Placed!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your order from <strong>{chosen.storeName}</strong> is
                  confirmed —{" "}
                  {deliveryMethod === "pickup"
                    ? "ready for self pickup"
                    : "out for delivery"}
                  , paying via{" "}
                  {paymentMethod === "qr" ? "QR code" : "cash/invoice"}.
                </p>
              </div>
              <button
                onClick={handleContinueOrFinish}
                className="mt-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition"
              >
                {isLast
                  ? "Done"
                  : `Continue to Order ${index + 2} of ${groups.length}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
