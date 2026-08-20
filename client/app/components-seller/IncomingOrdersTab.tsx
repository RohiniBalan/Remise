"use client";
import { useState, useEffect } from "react";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { ORDER_STATUSES, STATUS_STYLE } from "./shared-utils";
import PaginationControl from "../components-main/PaginationControl";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface Order {
  _id: string;
  orderId: string;
  contactEmail?: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  items?: Array<{
    quantity: number;
    title: string;
    price: number;
    tierLabel?: string;
  }>;
}

interface IncomingOrdersTabProps {
  orders: Order[];
  token: string;
  onRefresh: () => void;
}

export function IncomingOrdersTab({ orders, token, onRefresh }: IncomingOrdersTabProps) {
  const [filter, setFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await fetch(`${API}/api/orders/internal/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(
    (o: Order) => filter === "all" || o.orderStatus === filter,
  );
  
  const counts: Record<string, number> = { all: orders.length };
  ORDER_STATUSES.forEach((s) => {
    counts[s] = orders.filter((o: Order) => o.orderStatus === s).length;
  });

  const paginatedOrders = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );


  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-400 transition"
        >
          <option value="all">All ({counts.all})</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s} ({counts[s] || 0})
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#BBD5DA] py-20 text-center shadow-sm">
          <ShoppingBag size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-lg font-semibold text-gray-700">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Orders placed by store owners will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedOrders.map((o: Order) => (
            <div
              key={o._id}
              className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-900">{o.orderId}</p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        STATUS_STYLE[o.orderStatus] || "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {o.orderStatus}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{o.contactEmail}</p>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {o.items?.map((it, i) => (
                      <p key={i}>
                        {it.quantity}× {it.title}{" "}
                        {it.tierLabel ? `(${it.tierLabel})` : ""} — ₹{it.price}
                        /unit
                      </p>
                    ))}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(o.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-teal-700">
                    ₹{o.totalAmount?.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F5F5F5]">
                <span className="text-xs text-gray-400 font-mono">
                  #{o._id.slice(-6).toUpperCase()}
                </span>
                <select
                  value={o.orderStatus}
                  onChange={(e) => handleStatus(o._id, e.target.value)}
                  disabled={updating === o._id}
                  className="ml-auto bg-[#F5F5F5] border border-[#BBD5DA] text-gray-700 text-sm rounded-xl px-3 py-1.5 outline-none focus:border-teal-400 transition cursor-pointer disabled:opacity-50"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {updating === o._id && (
                  <RefreshCw size={14} className="animate-spin text-teal-600" />
                )}
              </div>
            </div>
          ))}
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
    </div>
  );
}