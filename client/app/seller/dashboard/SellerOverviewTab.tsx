"use client";
import { useState } from "react";
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Store,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  SellerOrder,
  extractSellerLineItems,
  computeSellerAnalytics,
  buildSellerTrend,
  buildBuyerInsights,
  buildPaymentOverview,
} from "./seller-analytics";
import TargetRevenueCard from "../../components-main/TargetRevenueCard";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
  PAID: "text-green-600 bg-green-50 border-green-200",
  FAILED: "text-[#FF0000] bg-red-50 border-red-200",
};

// ── Custom tooltips (show top-selling product alongside revenue) ───────────
function SellerTrendTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#BBD5DA] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <p className="text-teal-700 font-medium">
        revenue : ₹{Number(data.revenue).toLocaleString("en-IN")}
      </p>
      {data.topProduct && (
        <p className="text-gray-500 mt-1">
          Top product:{" "}
          <span className="font-semibold text-gray-700">
            {data.topProduct}
          </span>
        </p>
      )}
    </div>
  );
}

function SellerRevenueByMonthTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#BBD5DA] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <p className="text-teal-700 font-medium">
        revenue : ₹{Number(data.revenue).toLocaleString("en-IN")}
      </p>
      {data.topProduct && (
        <p className="text-gray-500 mt-1">
          Top product:{" "}
          <span className="font-semibold text-gray-700">
            {data.topProduct}
          </span>
        </p>
      )}
    </div>
  );
}

export default function SellerOverviewTab({
  orders,
  products,
  storeNameByOwnerId,
  store,
  onGoToSettings,
}: {
  orders: SellerOrder[];
  products: any[];
  storeNameByOwnerId: Record<string, string>;
  store?: { targetRevenue?: number };
  onGoToSettings?: () => void;
}) {
  const [granularity, setGranularity] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const lineItems = extractSellerLineItems(orders, products);
  const analytics = computeSellerAnalytics(lineItems);
  const trend = buildSellerTrend(
    analytics.byDay,
    analytics.byDayProduct,
    granularity,
  );
  const buyers = buildBuyerInsights(orders, storeNameByOwnerId);
  const payments = buildPaymentOverview(orders, storeNameByOwnerId);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    // ── Target revenue: current calendar month, Delivered orders only ──
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthDeliveredRevenue = orders
    .filter(
      (o) => (o.orderStatus || "").toLowerCase() === "delivered" &&
        new Date(o.createdAt) >= monthStart,
    )
    .reduce((s, o) => s + (o.totalAmount || 0), 0);

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: <ShoppingBag size={20} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Total Revenue (₹)",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      icon: <IndianRupee size={20} />,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
    },
    {
      label: "Total Products Sold",
      value: analytics.totalProductsSold,
      icon: <TrendingUp size={20} />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <TargetRevenueCard
        targetRevenue={store?.targetRevenue || 0}
        achievedRevenue={monthDeliveredRevenue}
        onGoToSettings={onGoToSettings}
      />
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-sm ${s.border}`}
          >
            <div
              className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-1.5 sm:mb-3 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-5 sm:[&>svg]:h-5`}
            >
              {s.icon}
            </div>
            <p className={`text-sm sm:text-2xl font-bold ${s.color} truncate`}>
              {s.value}
            </p>
            <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Sales trend (daily / weekly / monthly) */}
      <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm">Sales Trend</h3>
          <div className="flex gap-1">
            {(["daily", "weekly", "monthly"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  granularity === g
                    ? "bg-teal-600 text-white"
                    : "bg-[#F5F5F5] text-gray-600"
                }`}
              >
                {g[0].toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<SellerTrendTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0d9488"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by month + Top selling products */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">
            Revenue by Month
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<SellerRevenueByMonthTooltip />} />
              <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#BBD5DA]">
            <h3 className="font-bold text-gray-900 text-sm">
              Top Selling Products
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase">
                <th className="text-left px-5 py-2">Product</th>
                <th className="text-left px-5 py-2">Brand</th>
                <th className="text-right px-5 py-2">Qty</th>
                <th className="text-right px-5 py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProducts.map((r) => (
                <tr
                  key={`${r.title}-${r.brand}`}
                  className="border-t border-[#F5F5F5]"
                >
                  <td className="px-5 py-2.5 font-medium text-gray-800">
                    {r.title}
                  </td>
                  <td className="px-5 py-2.5 text-gray-500">{r.brand}</td>
                  <td className="px-5 py-2.5 text-right">{r.qty}</td>
                  <td className="px-5 py-2.5 text-right text-teal-700 font-semibold">
                    ₹{r.revenue.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {analytics.topProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-6">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Buying Stores + Payment Status Overview */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#BBD5DA] flex items-center gap-2">
            <Store size={15} className="text-teal-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Top Buying Stores
            </h3>
          </div>
          {buyers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">
              No buyers yet
            </p>
          ) : (
            <div className="divide-y divide-[#F5F5F5]">
              {buyers.slice(0, 8).map((b) => (
                <div
                  key={b.buyerId}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {b.storeName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.totalOrders} order{b.totalOrders !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-teal-700 shrink-0">
                    ₹{b.totalRevenue.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">
            Payment Status Overview
          </h3>
          <div className="flex gap-3 flex-wrap mb-4">
            {Object.entries(payments.statusCounts).map(([status, count]) => (
              <div
                key={status}
                className={`flex-1 min-w-[100px] rounded-xl border p-3 text-center ${
                  STATUS_COLORS[status] ||
                  "text-gray-600 bg-gray-50 border-gray-200"
                }`}
              >
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs font-semibold mt-0.5">{status}</p>
                <p className="text-[11px] mt-0.5 opacity-80">
                  ₹
                  {(payments.statusAmounts[status] || 0).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>
            ))}
            {Object.keys(payments.statusCounts).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 w-full">
                No orders yet
              </p>
            )}
          </div>

          <div className="border-t border-[#F5F5F5] pt-3 flex items-center justify-between text-xs text-gray-500">
            <span>Avg. pending days</span>
            <span className="font-semibold text-gray-800">
              {payments.avgPendingDays.toFixed(1)} days
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Pending &gt; 7 days</span>
            <span
              className={`font-semibold ${
                payments.over7Days.length > 0
                  ? "text-[#FF0000]"
                  : "text-gray-800"
              }`}
            >
              {payments.over7Days.length}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Payment Aging */}
      <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#BBD5DA] flex items-center gap-2">
          <Clock size={15} className="text-amber-600" />
          <h3 className="font-bold text-gray-900 text-sm">
            Pending Payment Aging
          </h3>
        </div>
        {payments.pendingAging.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No pending payments
          </p>
        ) : (
          <div className="divide-y divide-[#F5F5F5]">
            {payments.pendingAging.map((p) => (
              <div
                key={p.orderId}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {p.storeName}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{p.orderId}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <span className="text-sm font-bold text-teal-700">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                      p.daysPending > 7
                        ? "bg-red-50 text-[#FF0000] border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {p.daysPending > 7 && <AlertCircle size={11} />}
                    Pending for {p.daysPending} day
                    {p.daysPending !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}