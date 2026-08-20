"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Package,
  Navigation,
  ArrowRight,
  Store,
  User,
  AlertCircle,
  Banknote,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { smartOrderApi } from "@/app/api-services/smartOrderApi";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const resolveImageUrl = (image?: string) => {
  if (!image) return "";
  if (image.startsWith("http") || image.startsWith("data:")) return image;
  return `${API}${image}`;
};

const DELIVERY_STEPS = [
  { key: "Assigned", label: "Assigned", desc: "Order linked to delivery" },
  { key: "Accepted", label: "Accepted", desc: "Delivery person accepted" },
  { key: "Picked Up", label: "Picked Up", desc: "Collected from store" },
  { key: "Out for Delivery", label: "Out for Delivery", desc: "On the way to customer" },
  { key: "Delivered", label: "Delivered", desc: "Completed successfully" },
];

export default function DeliveryPortalPage() {
  const routeParams = useParams();
  const token =
    typeof routeParams?.token === "string"
      ? routeParams.token
      : Array.isArray(routeParams?.token)
      ? routeParams.token[0]
      : "";

  const [order, setOrder] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  // Custom Modal States
  const [confirmModal, setConfirmModal] = useState<{
    status: string;
    title: string;
    message: string;
    confirmText?: string;
    iconBg?: string;
  } | null>(null);

  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
    type?: "error" | "success" | "info";
  } | null>(null);

  // Delivery Person contact inputs if not yet saved
  const [personName, setPersonName] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await smartOrderApi.getDeliveryPortalOrder(token);
      if (res.data.success) {
        setOrder(res.data.data);
        if (res.data.data.deliveryPerson?.name) {
          setPersonName(res.data.data.deliveryPerson.name);
        }
        if (res.data.data.deliveryPerson?.phone) {
          setPersonPhone(res.data.data.deliveryPerson.phone);
        }
      } else {
        setError(res.data.message || "Failed to load delivery details");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid or expired delivery link");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrder();
    }
  }, [token]);

  const currentStatus = order?.deliveryStatus || "Assigned";
  const stepIndex = DELIVERY_STEPS.findIndex((s) => s.key === currentStatus);
  const activeStepIdx = stepIndex >= 0 ? stepIndex : 0;

  const getNextAction = () => {
    switch (currentStatus) {
      case "Assigned":
        return {
          nextStatus: "Accepted",
          label: "Accept Delivery Order",
          color: "bg-teal-600 hover:bg-teal-700",
          icon: CheckCircle2,
        };
      case "Accepted":
        return {
          nextStatus: "Picked Up",
          label: "Confirm Picked Up from Store",
          color: "bg-blue-600 hover:bg-blue-700",
          icon: Store,
        };
      case "Picked Up":
        return {
          nextStatus: "Out for Delivery",
          label: "Start Delivery (Out for Delivery)",
          color: "bg-indigo-600 hover:bg-indigo-700",
          icon: Truck,
        };
      case "Out for Delivery":
        return {
          nextStatus: "Delivered",
          label: "Confirm Order Delivered to Customer",
          color: "bg-green-600 hover:bg-green-700",
          icon: Check,
        };
      default:
        return null;
    }
  };

  const handleUpdateStatus = (nextStatus: string) => {
    if (updating) return;

    if (nextStatus === "Delivered") {
      setConfirmModal({
        status: "Delivered",
        title: "Confirm Order Delivery",
        message: `Are you sure Order #${order?.orderId} has been successfully delivered to ${order?.customerName || "the customer"}?`,
        confirmText: "Yes, Confirm Delivered",
        iconBg: "bg-green-100 text-green-700",
      });
      return;
    }

    executeStatusUpdate(nextStatus);
  };

  const executeStatusUpdate = async (nextStatus: string) => {
    try {
      setUpdating(true);
      const res = await smartOrderApi.updateDeliveryPortalStatus(token, {
        status: nextStatus,
        note: statusNote || undefined,
        deliveryPersonName: personName || undefined,
        deliveryPersonPhone: personPhone || undefined,
      });

      if (res.data.success) {
        setStatusNote("");
        await fetchOrder();
      } else {
        setAlertModal({
          title: "Status Update Failed",
          message: res.data.message || "Failed to update status.",
          type: "error",
        });
      }
    } catch (err: any) {
      setAlertModal({
        title: "Update Error",
        message: err?.response?.data?.message || err?.message || "Failed to update delivery status.",
        type: "error",
      });
    } finally {
      setUpdating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Loading Delivery Order…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-red-600">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Delivery Link Not Found</h2>
          <p className="text-sm text-gray-600">{error || "This delivery link is invalid or has expired."}</p>
          <button
            onClick={fetchOrder}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const nextAction = getNextAction();
  const isCod = order.paymentMethod === "cod" || order.paymentMethod === "cash";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    order.deliveryAddress?.fullAddress || ""
  )}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Delivery Portal
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Live
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-500">#{order.orderId}</p>
            </div>
          </div>

          <button
            onClick={fetchOrder}
            disabled={loading || updating}
            className="p-2 text-gray-500 hover:text-teal-700 hover:bg-gray-100 rounded-xl transition"
            title="Refresh Order"
          >
            <RefreshCw size={16} className={loading || updating ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Status Card & Stepper */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Delivery Progress
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                currentStatus === "Delivered"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : currentStatus === "Out for Delivery"
                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                  : currentStatus === "Picked Up"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-teal-100 text-teal-800 border border-teal-200"
              }`}
            >
              {currentStatus}
            </span>
          </div>

          {/* Step Timeline */}
          <div className="relative pt-2 pb-1">
            <div className="grid grid-cols-5 gap-1 text-center relative">
              {DELIVERY_STEPS.map((step, idx) => {
                const isPassed = idx < activeStepIdx;
                const isCurrent = idx === activeStepIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isPassed
                          ? "bg-green-600 text-white"
                          : isCurrent
                          ? "bg-teal-600 text-white ring-4 ring-teal-100"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {isPassed ? <Check size={14} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-semibold mt-1.5 leading-tight ${
                        isCurrent
                          ? "text-teal-800 font-bold"
                          : isPassed
                          ? "text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Payment & Cash Collection Alert */}
        <section
          className={`rounded-2xl border p-4 shadow-xs ${
            isCod && order.paymentStatus !== "SUCCESS"
              ? "bg-amber-50 border-amber-300"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isCod && order.paymentStatus !== "SUCCESS"
                    ? "bg-amber-200 text-amber-900"
                    : "bg-green-100 text-green-800"
                }`}
              >
                <Banknote size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {isCod ? "Cash on Delivery (COD)" : "Prepaid Order (Online / QR)"}
                </p>
                <p className="text-[11px] text-gray-600 font-medium">
                  {order.paymentStatus === "SUCCESS"
                    ? "Payment Verified & Settled"
                    : isCod
                    ? "Collect exact cash upon delivery"
                    : "Payment Pending"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-gray-900">₹{order.totalAmount}</span>
            </div>
          </div>
        </section>

        {/* Customer Drop-off Card */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-teal-700" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Customer Delivery Address
              </h3>
            </div>
            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition"
              >
                <Phone size={13} /> Call Customer
              </a>
            )}
          </div>

          <div className="space-y-1 text-sm">
            <p className="font-bold text-gray-900">{order.customerName}</p>
            <p className="text-gray-600 text-xs leading-relaxed">
              {order.deliveryAddress?.fullAddress || "No address provided"}
            </p>
            {order.customerPhone && (
              <p className="text-gray-500 text-xs font-medium">📞 {order.customerPhone}</p>
            )}
          </div>

          {order.deliveryAddress?.fullAddress && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 w-full bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl py-2.5 text-xs font-bold transition"
            >
              <Navigation size={14} /> Open in Google Maps <ExternalLink size={12} />
            </a>
          )}
        </section>

        {/* Store Pickup Card */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-teal-700" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Pickup Store
              </h3>
            </div>
          </div>

          <div className="text-sm space-y-1">
            <p className="font-bold text-gray-900">{order.storeName}</p>
            <p className="text-gray-500 text-xs font-mono">Store ID: {order.storeId || "N/A"}</p>
          </div>
        </section>

        {/* Items Summary Card */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Package size={16} className="text-teal-700" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Items to Deliver ({order.items?.length || 0})
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {(order.items || []).map((item: any, idx: number) => {
              const img = resolveImageUrl(item.image);
              return (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                      {img ? (
                        <img src={img} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                      {item.brand ? (
                        <p className="text-[11px] text-gray-500">{item.brand}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-800">
                      x{item.quantity}
                    </span>
                    <p className="text-[11px] font-semibold text-gray-600 mt-1">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Delivery Person Information Form (if not set) */}
        {!order.deliveryPerson?.name && currentStatus !== "Delivered" && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-700" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Your Contact Info (Delivery Partner)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#F8FAFC] border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">
                  Your Mobile Number
                </label>
                <input
                  type="tel"
                  value={personPhone}
                  onChange={(e) => setPersonPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#F8FAFC] border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Fixed Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-lg">
        <div className="max-w-2xl mx-auto">
          {currentStatus === "Delivered" ? (
            <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 border border-green-200 py-3 px-4 rounded-xl text-sm font-bold">
              <CheckCircle2 size={18} /> Order Successfully Delivered
            </div>
          ) : nextAction ? (
            <button
              onClick={() => handleUpdateStatus(nextAction.nextStatus)}
              disabled={updating}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-bold text-sm shadow-md transition disabled:opacity-50 ${nextAction.color}`}
            >
              {updating ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <nextAction.icon size={18} />
              )}
              {updating ? "Updating Status…" : nextAction.label}
              {!updating && <ArrowRight size={16} />}
            </button>
          ) : null}
        </div>
      </footer>

      {/* ── Custom Confirmation Modal ── */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="bg-white rounded-3xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                confirmModal.iconBg || "bg-green-100 text-green-700"
              }`}
            >
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {confirmModal.message}
              </p>

              {isCod && confirmModal.status === "Delivered" && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-2">
                  <Banknote size={16} />
                  <span>Collected ₹{order.totalAmount} cash from customer?</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={updating}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextSt = confirmModal.status;
                  setConfirmModal(null);
                  executeStatusUpdate(nextSt);
                }}
                disabled={updating}
                className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition shadow-sm"
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Alert Modal ── */}
      {alertModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setAlertModal(null)}
        >
          <div
            className="bg-white rounded-3xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                alertModal.type === "error"
                  ? "bg-red-100 text-red-600"
                  : "bg-teal-100 text-teal-700"
              }`}
            >
              {alertModal.type === "error" ? (
                <AlertCircle size={32} />
              ) : (
                <CheckCircle2 size={32} />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                {alertModal.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {alertModal.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAlertModal(null)}
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

