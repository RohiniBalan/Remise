// /components-seller/dashboard/seller-analytics.ts
// Analytics helpers for the Seller (Wholesaler / Home Business) dashboard.
//
// Wholesale orders (POST /api/orders/wholesale, read back via
// GET /api/orders/store/:storeId) have a flat shape:
//   { _id, orderId, storeId, storeName, buyerId, buyerRole, items[],
//     totalAmount, paymentStatus, paymentMethod, orderStatus, deliveryStatus,
//     createdAt, ... }
//
// Two known gaps, both intentional for now (per current backend):
//  1. There is no buyer store name/id on the order — only `buyerId` (a user
//     id). Callers must resolve buyerId -> store name themselves using
//     storeApi.getAll() and matching store.ownerId === order.buyerId.
//  2. There is no `paidAt` timestamp — only a `paymentStatus` enum. So this
//     file can only report "days pending since createdAt" for PENDING
//     orders, not true payment turnaround time. Once a `paidAt` field is
//     added on the backend, replace buildPaymentOverview's aging logic with
//     a real (paidAt - createdAt) calculation and add avg/fastest/slowest
//     payer metrics.

export type SellerLineItem = {
  productTitle: string;
  category: string;
  brand: string;
  qty: number;
  revenue: number;
  createdAt: string;
};

export type SellerOrder = {
  _id: string;
  orderId: string;
  buyerId: string;
  buyerRole?: string;
  totalAmount: number;
  paymentStatus: string; // e.g. "PENDING" | "PAID" | "FAILED"
  orderStatus: string;
  createdAt: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }[];
};

// ── Line items (feeds trend chart + top products) ───────────────────────────
export function extractSellerLineItems(
  orders: SellerOrder[],
  products: any[],
): SellerLineItem[] {
  const byId = new Map(products.map((p: any) => [p._id, p]));
  const items: SellerLineItem[] = [];

  for (const o of orders) {
    for (const it of o.items || []) {
      const product = byId.get(it.productId);
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      items.push({
        productTitle: it.title,
        category: product?.category || "Uncategorized",
        brand: product?.brand || "Unknown",
        qty,
        revenue: price * qty,
        createdAt: o.createdAt,
      });
    }
  }
  return items;
}

export type DateRangeKey = "today" | "week" | "month" | "lastMonth" | "custom";

export function getDateRange(
  key: DateRangeKey,
  custom?: { from: string; to: string },
) {
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (key === "today") return { from: startOfDay(now), to: now };
  if (key === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - now.getDay());
    return { from: startOfDay(from), to: now };
  }
  if (key === "month")
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  if (key === "lastMonth")
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  return {
    from: new Date(custom!.from),
    to: new Date(custom!.to + "T23:59:59"),
  };
}

function topFromMap(m?: Map<string, number>): string | undefined {
  if (!m || m.size === 0) return undefined;
  let best: string | undefined;
  let bestQty = -Infinity;
  for (const [k, v] of m.entries()) {
    if (v > bestQty) {
      bestQty = v;
      best = k;
    }
  }
  return best;
}

export function computeSellerAnalytics(items: SellerLineItem[]) {
  const byProduct = new Map<
    string,
    { title: string; brand: string; qty: number; revenue: number }
  >();
  const byDay = new Map<
    string,
    { qty: number; revenue: number; orders: number }
  >();
  const byDayProduct = new Map<string, Map<string, number>>();
  const byMonth = new Map<string, number>();
  const byMonthProduct = new Map<string, Map<string, number>>();
  let totalProductsSold = 0;
  let totalRevenue = 0;

  for (const it of items) {
    totalProductsSold += it.qty;
    totalRevenue += it.revenue;

    const key = `${it.productTitle}||${it.brand}`;
    const p = byProduct.get(key) || {
      title: it.productTitle,
      brand: it.brand,
      qty: 0,
      revenue: 0,
    };
    p.qty += it.qty;
    p.revenue += it.revenue;
    byProduct.set(key, p);

    const dayKey = it.createdAt.slice(0, 10);
    const d = byDay.get(dayKey) || { qty: 0, revenue: 0, orders: 0 };
    d.qty += it.qty;
    d.revenue += it.revenue;
    byDay.set(dayKey, d);

    const dayProd = byDayProduct.get(dayKey) || new Map<string, number>();
    dayProd.set(it.productTitle, (dayProd.get(it.productTitle) || 0) + it.qty);
    byDayProduct.set(dayKey, dayProd);

    const monthKey = it.createdAt.slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + it.revenue);

    const monthProd = byMonthProduct.get(monthKey) || new Map<string, number>();
    monthProd.set(it.productTitle, (monthProd.get(it.productTitle) || 0) + it.qty);
    byMonthProduct.set(monthKey, monthProd);
  }

  const topProducts = [...byProduct.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const revenueByMonth = [...byMonth.entries()]
    .sort()
    .map(([month, revenue]) => ({
      month,
      revenue,
      topProduct: topFromMap(byMonthProduct.get(month)),
    }));

  return {
    totalProductsSold,
    totalRevenue,
    topProducts,
    revenueByMonth,
    byDay,
    byDayProduct,
  };
}

export function buildSellerTrend(
  byDay: Map<string, { qty: number; revenue: number }>,
  byDayProduct: Map<string, Map<string, number>>,
  granularity: "daily" | "weekly" | "monthly",
) {
  const entries = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (granularity === "daily") {
    return entries.map(([date, v]) => ({
      label: date,
      ...v,
      topProduct: topFromMap(byDayProduct.get(date)),
    }));
  }

  const grouped = new Map<
    string,
    { qty: number; revenue: number; products: Map<string, number> }
  >();
  for (const [date, v] of entries) {
    const d = new Date(date);
    const key =
      granularity === "monthly"
        ? date.slice(0, 7)
        : (() => {
            const ws = new Date(d);
            ws.setDate(d.getDate() - d.getDay());
            return ws.toISOString().slice(0, 10);
          })();

    const g = grouped.get(key) || {
      qty: 0,
      revenue: 0,
      products: new Map<string, number>(),
    };
    g.qty += v.qty;
    g.revenue += v.revenue;

    const dayProd = byDayProduct.get(date);
    if (dayProd)
      for (const [p, q] of dayProd.entries())
        g.products.set(p, (g.products.get(p) || 0) + q);

    grouped.set(key, g);
  }

  return [...grouped.entries()].map(([label, v]) => ({
    label,
    qty: v.qty,
    revenue: v.revenue,
    topProduct: topFromMap(v.products),
  }));
}

// ── Top buying stores ────────────────────────────────────────────────────────
// `storeNameByOwnerId` must be built by the caller from storeApi.getAll(),
// matching store.ownerId === order.buyerId (Store schema has ownerId).
export function buildBuyerInsights(
  orders: SellerOrder[],
  storeNameByOwnerId: Record<string, string>,
) {
  const byBuyer: Record<
    string,
    {
      buyerId: string;
      storeName: string;
      totalOrders: number;
      totalRevenue: number;
      lastOrderAt: string;
    }
  > = {};

  for (const o of orders) {
    const key = o.buyerId || "unknown";
    if (!byBuyer[key]) {
      byBuyer[key] = {
        buyerId: key,
        storeName: storeNameByOwnerId[key] || "Unknown Store",
        totalOrders: 0,
        totalRevenue: 0,
        lastOrderAt: o.createdAt,
      };
    }
    byBuyer[key].totalOrders += 1;
    byBuyer[key].totalRevenue += o.totalAmount || 0;
    if (new Date(o.createdAt) > new Date(byBuyer[key].lastOrderAt)) {
      byBuyer[key].lastOrderAt = o.createdAt;
    }
  }

  return Object.values(byBuyer).sort(
    (a, b) => b.totalRevenue - a.totalRevenue,
  );
}

// ── Payment status + pending aging (option "c" — no paidAt field yet) ──────
export function buildPaymentOverview(
  orders: SellerOrder[],
  storeNameByOwnerId: Record<string, string>,
) {
  const statusCounts: Record<string, number> = {};
  const statusAmounts: Record<string, number> = {};

  for (const o of orders) {
    const status = (o.paymentStatus || "UNKNOWN").toUpperCase();
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    statusAmounts[status] = (statusAmounts[status] || 0) + (o.totalAmount || 0);
  }

  const now = Date.now();
  const pendingAging = orders
    .filter((o) => (o.paymentStatus || "").toUpperCase() === "PENDING")
    .map((o) => {
      const daysPending = Math.floor(
        (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        orderId: o.orderId,
        buyerId: o.buyerId,
        storeName: storeNameByOwnerId[o.buyerId] || "Unknown Store",
        amount: o.totalAmount || 0,
        daysPending,
      };
    })
    .sort((a, b) => b.daysPending - a.daysPending);

  const avgPendingDays = pendingAging.length
    ? pendingAging.reduce((s, p) => s + p.daysPending, 0) / pendingAging.length
    : 0;

  const over7Days = pendingAging.filter((p) => p.daysPending > 7);

  return { statusCounts, statusAmounts, pendingAging, avgPendingDays, over7Days };
}