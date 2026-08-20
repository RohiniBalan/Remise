"use client";

import React, { useEffect, useState, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  CheckCircle2,
  Navigation,
  Clock,
  Search,
  User,
  Phone,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Package,
} from "lucide-react";
import { AuthContext } from "@/app/context/AuthContext";
import { storeApi } from "@/app/api-services/storeApi";
import { smartOrderApi } from "@/app/api-services/smartOrderApi";
import { offersApi } from "@/app/api-services/offersApi";
import NavbarHome from "@/app/components-main/NavbarHome";
import StoreDeliveryModal from "@/app/components-main/StoreDeliveryModal";
import PaginationControl from "@/app/components-main/PaginationControl";


function normalizeSmartOrder(o: any) {
  const addr = o.shippingAddress || {};
  const items = o.items || [];
  return {
    _id: o._id,
    orderId: o.orderId,
    status: o.orderStatus,
    offerTitle: items.length
      ? items.map((i: any) => `${i.quantity}x ${i.title}`).join(", ")
      : `Order ${o.orderId}`,
    customerName:
      [addr.firstName, addr.lastName].filter(Boolean).join(" ") ||
      o.contactEmail,
    customerPhone: addr.phone,
    customerEmail: o.contactEmail,
    customerId: o.userId || null,
    deliveryAddress: [addr.address, addr.city, addr.state, addr.pinCode]
      .filter(Boolean)
      .join(", "),
    totalAmount: o.totalAmount,
    quantity:
      items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) || 1,
    createdAt: o.createdAt,
    deliveryMethod: o.deliveryMethod,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    deliveryStatus: o.deliveryStatus,
    deliveryMode: o.deliveryMode,
    deliveryPerson: o.deliveryPerson,
    deliveryTimeline: o.deliveryTimeline,
    deliveryToken: o.deliveryToken,
    shippingAddress: o.shippingAddress,
    rawItems: items,
    _source: "smartOrder" as const,
  };
}

export default function StoreDeliveriesPage() {
  const ctx = useContext(AuthContext) as any;
  const token: string | null =
    ctx?.token ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const router = useRouter();

  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState<any>(null);

  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, modeFilter]);


  const loadData = useCallback(async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      setLoading(true);
      const storeRes = await storeApi.getMyStore(token);
      const s = storeRes.data?.data;
      if (!s) {
        router.push("/store/dashboard");
        return;
      }
      setStore(s);

      const [offerOrdersRes, smartOrdersRes] = await Promise.allSettled([
        offersApi.getStoreOrders(s._id, token),
        smartOrderApi.getStoreOrders(s._id, token),
      ]);


      const offerOrders =
        offerOrdersRes.status === "fulfilled"
          ? (offerOrdersRes.value.data?.data || []).map((o: any) => ({
              ...o,
              _source: "offerOrder",
            }))
          : [];

      const smartOrders =
        smartOrdersRes.status === "fulfilled"
          ? (smartOrdersRes.value.data?.data || []).map(normalizeSmartOrder)
          : [];

      const merged = [...offerOrders, ...smartOrders].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(merged);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter deliveries
  const deliveryOrders = orders.filter((o: any) => {
    const isDelivery =
      o.deliveryMethod !== "pickup" &&
      (o.deliveryMethod === "delivery" ||
        !!o.deliveryAddress ||
        !!o.deliveryPerson?.name ||
        !!o.deliveryStatus);
    return isDelivery;
  });

  const filtered = deliveryOrders.filter((o: any) => {
    const personName = o.deliveryPerson?.name || "";
    const personPhone = o.deliveryPerson?.phone || "";
    const customerName = o.customerName || "";
    const customerPhone = o.customerPhone || "";
    const orderId = o.orderId || o._id || "";
    const deliveryAddress = o.deliveryAddress || "";

    const matchSearch =
      !search ||
      personName.toLowerCase().includes(search.toLowerCase()) ||
      personPhone.includes(search) ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      customerPhone.includes(search) ||
      orderId.toLowerCase().includes(search.toLowerCase()) ||
      deliveryAddress.toLowerCase().includes(search.toLowerCase());

    const deliverySt =
      o.deliveryStatus || (o.status === "Delivered" ? "Delivered" : "Pending");
    const matchStatus = statusFilter === "all" || deliverySt === statusFilter;
    const matchMode =
      modeFilter === "all" || (o.deliveryMode || "own_delivery") === modeFilter;

    return matchSearch && matchStatus && matchMode;
  });

  const paginatedDeliveries = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalCount = deliveryOrders.length;

  const deliveredCount = deliveryOrders.filter(
    (o: any) => o.deliveryStatus === "Delivered" || o.status === "Delivered"
  ).length;
  const outForDeliveryCount = deliveryOrders.filter(
    (o: any) => o.deliveryStatus === "Out for Delivery"
  ).length;
  const pendingCount = deliveryOrders.filter(
    (o: any) =>
      !o.deliveryStatus ||
      o.deliveryStatus === "Pending" ||
      o.deliveryStatus === "Assigned"
  ).length;

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans pb-16">
      <NavbarHome theme="light" toggleTheme={() => {}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-[80px] sm:pt-[112px] lg:pt-[140px]">
        {/* Top Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/store/dashboard")}
              className="p-2 rounded-xl bg-white border border-[#BBD5DA] hover:bg-gray-50 text-gray-700 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  Deliveries Log — Who Delivered to Whom
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {store?.name || "Store"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete audit trail of all assigned, in-transit, and delivered orders.
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-white border border-[#BBD5DA] hover:bg-gray-50 text-gray-700 transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-4 shadow-xs">
            <div className="flex items-center gap-2 text-teal-600 mb-1">
              <Truck size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total Deliveries
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900">{totalCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-green-200 bg-green-50/30 p-4 shadow-xs">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-green-800">
                Delivered
              </span>
            </div>
            <p className="text-2xl font-black text-green-700">{deliveredCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-700 mb-1">
              <Navigation size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                Out for Delivery
              </span>
            </div>
            <p className="text-2xl font-black text-indigo-700">{outForDeliveryCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/30 p-4 shadow-xs">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Pending / Assigned
              </span>
            </div>
            <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by delivery person, customer, phone, address, or order ID…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm outline-none focus:border-teal-400 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-400 transition"
          >
            <option value="all">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Picked Up">Picked Up</option>
            <option value="Accepted">Accepted</option>
            <option value="Assigned">Assigned</option>
          </select>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-400 transition"
          >
            <option value="all">All Delivery Modes</option>
            <option value="own_delivery">Own Delivery Person</option>
            <option value="portal_delivery">Remise Portal Network</option>
            <option value="self_arrange">Self-Arranged</option>
          </select>
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#BBD5DA] py-20 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto text-teal-600 mb-3" />
            <p className="text-sm font-semibold text-gray-700">Loading delivery records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#BBD5DA] py-16 text-center shadow-xs">
            <Truck size={44} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-bold text-gray-700">No delivery records found</p>
            <p className="text-xs text-gray-400 mt-1">
              Orders with home delivery dispatch will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedDeliveries.map((o: any) => {
              const currentDeliveryStatus =
                o.deliveryStatus ||
                (o.status === "Delivered" ? "Delivered" : "Assigned");
              const isCompleted =
                currentDeliveryStatus === "Delivered" || o.status === "Delivered";
              const mapsUrl = o.deliveryAddress
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    o.deliveryAddress
                  )}`
                : null;

              return (
                <div
                  key={o._id}
                  className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-xs hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                        #{o.orderId || o._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(o.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          isCompleted
                            ? "bg-green-100 text-green-800 border-green-200"
                            : currentDeliveryStatus === "Out for Delivery"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                            : "bg-teal-100 text-teal-800 border-teal-200"
                        }`}
                      >
                        {currentDeliveryStatus}
                      </span>
                    </div>
                  </div>

                  {/* Who Delivered to Whom Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-gray-100">
                    {/* Left Column: Who Delivered */}
                    <div className="bg-[#F8FAFC] rounded-xl p-4 border border-gray-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck size={14} /> Who Delivered (Delivery Partner)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                          {o.deliveryMode === "portal_delivery"
                            ? "Remise Portal Network"
                            : o.deliveryMode === "self_arrange"
                            ? "Self-Arranged"
                            : "Own Delivery Person"}
                        </span>
                      </div>

                      <div className="pt-1">
                        <p className="text-sm font-bold text-gray-900">
                          {o.deliveryPerson?.name ||
                            (o.deliveryMode === "self_arrange"
                              ? "Store Owner (Self-Delivery)"
                              : "Assigned Delivery Partner")}
                        </p>
                        {o.deliveryPerson?.phone ? (
                          <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5">
                            <span>📞 {o.deliveryPerson.phone}</span>
                            <a
                              href={`tel:${o.deliveryPerson.phone}`}
                              className="text-[11px] font-bold text-teal-700 hover:underline"
                            >
                              Call
                            </a>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5 italic">
                            Contact number not specified
                          </p>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="text-[11px] text-gray-500 space-y-0.5 pt-1 border-t border-gray-200/60">
                        {o.deliveryPerson?.assignedAt && (
                          <p>
                            Assigned:{" "}
                            {new Date(
                              o.deliveryPerson.assignedAt
                            ).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        {o.deliveryPerson?.deliveredAt && (
                          <p className="text-green-700 font-semibold">
                            Delivered:{" "}
                            {new Date(
                              o.deliveryPerson.deliveredAt
                            ).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: To Whom (Customer) */}
                    <div className="bg-[#F8FAFC] rounded-xl p-4 border border-gray-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                          <User size={14} /> To Whom (Customer)
                        </span>
                        {o.customerPhone && (
                          <a
                            href={`tel:${o.customerPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 text-teal-800 rounded-lg text-[11px] font-bold border border-gray-200 transition"
                          >
                            <Phone size={11} /> Call Customer
                          </a>
                        )}
                      </div>

                      <div className="pt-1">
                        <p className="text-sm font-bold text-gray-900">
                          {o.customerName}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          📍 {o.deliveryAddress || "Address not provided"}
                        </p>
                      </div>

                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 pt-1"
                        >
                          <Navigation size={12} /> Open Map Navigation{" "}
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Items & Payment Footer */}
                  <div className="flex items-center justify-between pt-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">
                        {o.offerTitle}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="font-bold text-teal-700">
                        ₹{o.totalAmount}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                        {o.paymentMethod === "qr"
                          ? "QR Payment"
                          : "Cash on Delivery"}{" "}
                        ({o.paymentStatus === "SUCCESS" ? "Paid" : "Pending"})
                      </span>
                    </div>

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => setSelectedDeliveryOrder(o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition"
                      >
                        <Truck size={13} />
                        {o.deliveryToken
                          ? "View Delivery Link"
                          : "Manage Delivery"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > ITEMS_PER_PAGE && (
          <PaginationControl
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}

        {selectedDeliveryOrder && (

          <StoreDeliveryModal
            order={selectedDeliveryOrder}
            token={token!}
            isOpen={!!selectedDeliveryOrder}
            onClose={() => setSelectedDeliveryOrder(null)}
            onRefreshOrders={loadData}
          />
        )}
      </div>
    </div>
  );
}
