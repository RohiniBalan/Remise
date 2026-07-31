export type LineItem = { productTitle: string; category: string; brand: string; qty: number; revenue: number; createdAt: string };

function topProductFromMap(m?: Map<string, number>): string | undefined {
  if (!m || m.size === 0) return undefined;
  let best: string | undefined;
  let bestQty = -Infinity;
  for (const [k, v] of m.entries()) {
    if (v > bestQty) { bestQty = v; best = k; }
  }
  return best;
}

// Offer titles look like "10% off Charger" — there's no productId link on the
// Offer model, so we match by finding a product whose title appears inside
// the offer title. Longest match wins, in case multiple product names overlap
// (e.g. "Charger" vs "Fast Charger").
function matchProductByOfferTitle(offerTitle: string, products: any[]) {
  const lower = (offerTitle || '').toLowerCase();
  let best: any = null;
  for (const p of products) {
    const t = (p.title || '').toLowerCase();
    if (t && lower.includes(t)) {
      if (!best || t.length > best.title.length) best = p;
    }
  }
  return best;
}

export function extractLineItems(orders: any[], products: any[]): LineItem[] {
  const catByTitle   = new Map(products.map((p: any) => [p.title, p.category || 'Uncategorized']));
  const brandByTitle = new Map(products.map((p: any) => [p.title, p.brand || 'Unknown']));
  const items: LineItem[] = [];

  for (const o of orders) {
    if (o._source === 'smartOrder' && Array.isArray(o.rawItems) && o.rawItems.length) {
      for (const it of o.rawItems) {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price ?? it.discountedPrice ?? 0); // adjust field name to match your Order schema
        items.push({
          productTitle: it.title,
          category: it.category || catByTitle.get(it.title) || 'Uncategorized',
          brand: it.brand || brandByTitle.get(it.title) || 'Unknown',
          qty, revenue: price * qty, createdAt: o.createdAt,
        });
      }
    } else {
      // Offer order — no direct product link, so fuzzy-match the offer title
      // (e.g. "10% off Charger") against known product titles (e.g. "Charger").
      const matched = matchProductByOfferTitle(o.offerTitle, products);
      items.push({
        productTitle: o.offerTitle || 'Unknown',
        category: matched?.category || catByTitle.get(o.offerTitle) || 'Offer',
        brand: matched?.brand || brandByTitle.get(o.offerTitle) || 'Unknown',
        qty: Number(o.quantity) || 1,
        revenue: Number(o.totalAmount) || 0,
        createdAt: o.createdAt,
      });
    }
  }
  return items;
}

export type DateRangeKey = 'today' | 'week' | 'month' | 'lastMonth' | 'custom';

export function getDateRange(key: DateRangeKey, custom?: { from: string; to: string }) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (key === 'today')     return { from: startOfDay(now), to: now };
  if (key === 'week') {
    const from = new Date(now); from.setDate(now.getDate() - now.getDay());
    return { from: startOfDay(from), to: now };
  }
  if (key === 'month')     return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  if (key === 'lastMonth') return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) };
  return { from: new Date(custom!.from), to: new Date(custom!.to + 'T23:59:59') };
}

export function computeAnalytics(items: LineItem[]) {
  // Key by "productTitle||brand" so the same product from two brands (rare,
  // but possible via offer fuzzy-matching) doesn't get merged into one row.
  const byProduct = new Map<string, { title: string; brand: string; qty: number; revenue: number }>();
  const byCategory = new Map<string, { qty: number; revenue: number }>();
  const byBrand = new Map<string, { qty: number; revenue: number }>();
  const byDay = new Map<string, { qty: number; revenue: number; orders: number }>();
  const byDayProduct = new Map<string, Map<string, number>>();
  const byMonth = new Map<string, number>();
  const byMonthProduct = new Map<string, Map<string, number>>();
  let totalProductsSold = 0, totalRevenue = 0;

  for (const it of items) {
    totalProductsSold += it.qty; totalRevenue += it.revenue;

    const key = `${it.productTitle}||${it.brand}`;
    const p = byProduct.get(key) || { title: it.productTitle, brand: it.brand, qty: 0, revenue: 0 };
    p.qty += it.qty; p.revenue += it.revenue; byProduct.set(key, p);

    const c = byCategory.get(it.category) || { qty: 0, revenue: 0 };
    c.qty += it.qty; c.revenue += it.revenue; byCategory.set(it.category, c);

    const b = byBrand.get(it.brand) || { qty: 0, revenue: 0 };
    b.qty += it.qty; b.revenue += it.revenue; byBrand.set(it.brand, b);

    const dayKey = it.createdAt.slice(0, 10);
    const d = byDay.get(dayKey) || { qty: 0, revenue: 0, orders: 0 };
    d.qty += it.qty; d.revenue += it.revenue; d.orders += 1; byDay.set(dayKey, d);

    const dayProd = byDayProduct.get(dayKey) || new Map<string, number>();
    dayProd.set(it.productTitle, (dayProd.get(it.productTitle) || 0) + it.qty);
    byDayProduct.set(dayKey, dayProd);

    const monthKey = it.createdAt.slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + it.revenue);

    const monthProd = byMonthProduct.get(monthKey) || new Map<string, number>();
    monthProd.set(it.productTitle, (monthProd.get(it.productTitle) || 0) + it.qty);
    byMonthProduct.set(monthKey, monthProd);
  }

  // Each row now carries its own brand — this is what feeds the merged
  // "Top/Least Selling Products" card (product + brand together, one card).
  const products = [...byProduct.values()];

  // Sort once, lowest qty first.
  const sortedByQtyAsc = [...products].sort((a, b) => a.qty - b.qty);
  const n = sortedByQtyAsc.length;

  // Split the SAME sorted list into two disjoint halves instead of taking
  // an independent "top 5" and "bottom 5" slice — two independent slices
  // overlap whenever there are 10 or fewer products (e.g. exactly 2 brands:
  // both would land in "top 5" and none would be left for "least 5").
  const leastCount = Math.min(5, Math.floor(n / 2));
  const topCount   = Math.min(5, n - leastCount);

  const leastProducts = sortedByQtyAsc.slice(0, leastCount);           // lowest qty first
  const topProducts   = sortedByQtyAsc.slice(n - topCount).reverse();  // highest qty first

  // Kept for any chart/section that still wants brand aggregated on its own
  // (e.g. the brandWise pie/bar chart) — not used by the merged cards.
  const brands = [...byBrand.entries()].map(([brand, v]) => ({ brand, ...v }));
  const brandWise = [...brands].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const categoryWise   = [...byCategory.entries()].map(([name, v]) => ({ name, ...v }));
  const revenueByMonth = [...byMonth.entries()]
    .sort()
    .map(([month, revenue]) => ({
      month,
      revenue,
      topProduct: topProductFromMap(byMonthProduct.get(month)),
    }));

  let bestDay: { date: string; revenue: number; orders: number } | null = null;
  for (const [date, v] of byDay.entries()) if (!bestDay || v.revenue > bestDay.revenue) bestDay = { date, revenue: v.revenue, orders: v.orders };

  return { totalProductsSold, totalRevenue, topProducts, leastProducts, brandWise, categoryWise, revenueByMonth, bestDay, byDay, byDayProduct };
}

export function buildTrend(
  byDay: Map<string, { qty: number; revenue: number }>,
  byDayProduct: Map<string, Map<string, number>>,
  granularity: 'daily' | 'weekly' | 'monthly'
) {
  const entries = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (granularity === 'daily') {
    return entries.map(([date, v]) => ({
      label: date,
      ...v,
      topProduct: topProductFromMap(byDayProduct.get(date)),
    }));
  }

  const grouped = new Map<string, { qty: number; revenue: number; products: Map<string, number> }>();
  for (const [date, v] of entries) {
    const d = new Date(date);
    const key = granularity === 'monthly'
      ? date.slice(0, 7)
      : (() => { const ws = new Date(d); ws.setDate(d.getDate() - d.getDay()); return ws.toISOString().slice(0, 10); })();

    const g = grouped.get(key) || { qty: 0, revenue: 0, products: new Map<string, number>() };
    g.qty += v.qty;
    g.revenue += v.revenue;

    const dayProd = byDayProduct.get(date);
    if (dayProd) for (const [p, q] of dayProd.entries()) g.products.set(p, (g.products.get(p) || 0) + q);

    grouped.set(key, g);
  }

  return [...grouped.entries()].map(([label, v]) => ({
    label,
    qty: v.qty,
    revenue: v.revenue,
    topProduct: topProductFromMap(v.products),
  }));
}