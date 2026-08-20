"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Truck,
  Link2,
  Copy,
  Check,
  Share2,
  UserCheck,
  Users,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { smartOrderApi } from "../api-services/smartOrderApi";

interface StoreDeliveryModalProps {
  order: any;
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onRefreshOrders?: () => void;
}

export default function StoreDeliveryModal({
  order,
  token,
  isOpen,
  onClose,
  onRefreshOrders,
}: StoreDeliveryModalProps) {
  const [stage, setStage] = useState<"initial" | "has_person" | "no_person" | "link_generated" | "network_joined" | "self_arranged">("initial");

  // Form states
  const [deliveryPersonName, setDeliveryPersonName] = useState(order?.deliveryPerson?.name || "");
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState(order?.deliveryPerson?.phone || "");
  const [notes, setNotes] = useState("");

  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [deliveryToken, setDeliveryToken] = useState(order?.deliveryToken || "");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && order) {
      if (order.deliveryToken) {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        setDeliveryUrl(`${base}/delivery/${order.deliveryToken}`);
        setDeliveryToken(order.deliveryToken);
        setStage("link_generated");
      } else if (order.deliveryMode === "portal_delivery") {
        setStage("network_joined");
      } else if (order.deliveryMode === "self_arrange") {
        setStage("self_arranged");
      } else {
        setStage("initial");
      }
      setDeliveryPersonName(order.deliveryPerson?.name || "");
      setDeliveryPersonPhone(order.deliveryPerson?.phone || "");
      setNotes(order.deliveryPerson?.notes || "");
      setErrorMessage("");
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const orderId = order.orderId || order._id;

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await smartOrderApi.generateDeliveryLink(
        orderId,
        {
          deliveryPersonName: deliveryPersonName || undefined,
          deliveryPersonPhone: deliveryPersonPhone || undefined,
          notes: notes || undefined,
        },
        token
      );

      if (res.data.success) {
        const tokenVal = res.data.data.deliveryToken;
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${base}/delivery/${tokenVal}`;
        setDeliveryUrl(url);
        setDeliveryToken(tokenVal);
        setStage("link_generated");
        if (onRefreshOrders) onRefreshOrders();
      } else {
        setErrorMessage(res.data.message || "Failed to generate link");
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to generate delivery link");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinNetwork = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      await smartOrderApi.enrollDeliveryPortal({ enabled: true, hasOwnDelivery: false }, token);
      await smartOrderApi.setDeliveryMode(orderId, { mode: "portal_delivery" }, token);
      setStage("network_joined");
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to enroll in delivery network");
    } finally {
      setLoading(false);
    }
  };

  const handleSelfArrange = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      await smartOrderApi.setDeliveryMode(orderId, { mode: "self_arrange" }, token);
      setStage("self_arranged");
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to set delivery mode");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectStatusUpdate = async (status: string) => {
    try {
      setLoading(true);
      setErrorMessage("");
      await smartOrderApi.updateDeliveryStatusDirect(orderId, { status }, token);
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };


  const handleCopyLink = () => {
    if (!deliveryUrl) return;
    navigator.clipboard.writeText(deliveryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!deliveryUrl) return;
    const text = encodeURIComponent(
      `Hello, here is your delivery link for Order #${order.orderId}:\n${deliveryUrl}\n\nPlease click to accept and update order delivery milestones.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#BBD5DA] w-full max-w-lg overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#DFF1F1] border-b border-[#BBD5DA] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Manage Order Delivery</h2>
              <p className="text-[11px] text-gray-500 font-mono">Order #{order.orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* ── STAGE: Initial Decision ── */}
          {stage === "initial" && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold mb-2">
                  Delivery Flow Setup
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  Do you have your own delivery person?
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Choose how you would like this order to be fulfilled and delivered to the customer.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStage("has_person")}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-teal-600 bg-teal-50/50 hover:bg-teal-50 text-left transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      YES, I have a delivery person
                      <ArrowRight size={14} className="text-teal-600 group-hover:translate-x-1 transition-transform" />
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Generate a unique link to share with your delivery person.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStage("no_person")}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#BBD5DA] hover:border-gray-400 bg-white hover:bg-gray-50 text-left transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <Users size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      NO, I don't have one
                      <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Join Remise Delivery Portal network or arrange delivery yourself.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE: Has Person (Generate Link Form) ── */}
          {stage === "has_person" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setStage("initial")}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-semibold"
              >
                <ChevronLeft size={14} /> Back
              </button>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Assign to Delivery Person
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter details to create a trackable delivery link (optional contact info).
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Delivery Person Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryPersonName}
                    onChange={(e) => setDeliveryPersonName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full bg-[#F8FAFC] border border-[#BBD5DA] rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Delivery Person Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={deliveryPersonPhone}
                    onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-[#F8FAFC] border border-[#BBD5DA] rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Special Delivery Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Handle fragile items with care, collect cash"
                    className="w-full bg-[#F8FAFC] border border-[#BBD5DA] rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-teal-500 transition resize-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white py-3 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Link2 size={15} />}
                Generate Unique Delivery Link
              </button>
            </div>
          )}

          {/* ── STAGE: Link Generated & Active ── */}
          {stage === "link_generated" && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-900">
                    Unique Delivery Link Active
                  </p>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    Share this link with your delivery person. They can open it on mobile without signing in.
                  </p>
                </div>
              </div>

              {/* URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Delivery Link</label>
                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#BBD5DA] rounded-xl p-2">
                  <input
                    type="text"
                    readOnly
                    value={deliveryUrl}
                    className="flex-1 bg-transparent text-xs font-mono text-gray-800 outline-none select-all px-1"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Share Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition"
                >
                  <Share2 size={14} /> Share on WhatsApp
                </button>
                <a
                  href={deliveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition text-center"
                >
                  <ExternalLink size={14} /> Open Portal
                </a>
              </div>

              {/* Current Delivery Status Tracker */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Current Status:</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {order.deliveryStatus || "Assigned"}
                  </span>
                </div>
                {order.deliveryPerson?.name && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Delivery Person:</span>
                    <span className="font-medium text-gray-800">
                      {order.deliveryPerson.name}{" "}
                      {order.deliveryPerson.phone ? `(${order.deliveryPerson.phone})` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STAGE: No Person (Prompt Delivery Portal Network) ── */}
          {stage === "no_person" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setStage("initial")}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-semibold"
              >
                <ChevronLeft size={14} /> Back
              </button>

              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Would you like to join our Delivery Portal?
                </h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  Connect your store with verified on-demand delivery partners in your area.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleJoinNetwork}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  YES, Join Remise Delivery Network
                </button>

                <button
                  type="button"
                  onClick={handleSelfArrange}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl text-xs font-semibold transition"
                >
                  NO, I will arrange delivery myself
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE: Network Joined Confirmation ── */}
          {stage === "network_joined" && (
            <div className="space-y-4 text-center py-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Enrolled in Delivery Network!
                </h3>
                <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                  Your store profile is now enabled for automated delivery partner dispatch and tracking.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-left border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono font-bold text-gray-800">#{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network Mode:</span>
                  <span className="font-bold text-indigo-600">Remise Partner Dispatch</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Status:</span>
                  <span className="font-bold text-teal-700">{order.deliveryStatus || "Assigned"}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition"
              >
                Done
              </button>
            </div>
          )}

          {/* ── STAGE: Self Arranged Direct Controls ── */}
          {stage === "self_arranged" && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-900">
                  Self-Arranged Delivery
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  You are managing this delivery directly. Update the customer status below:
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Update Delivery Milestone</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Ready", "Out for Delivery", "Delivered"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleDirectStatusUpdate(st)}
                      disabled={loading}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        order.deliveryStatus === st
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition"
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
