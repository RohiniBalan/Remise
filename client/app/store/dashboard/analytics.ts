export type LineItem = { productTitle: string; category: string; qty: number; revenue: number; createdAt: string };

export function extractLineItems(orders: any[], products: any[]): LineItem[] {
  const catByTitle = new Map(products.map((p: any) => [p.title, p.category || 'Uncategorized']));
  const items: LineItem[] = [];

  for (const o of orders) {
    if (o._source === 'smartOrder' && Array.isArray(o.rawItems) && o.rawItems.length) {
      for (const it of o.rawItems) {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price ?? it.discountedPrice ?? 0); // adjust field name to match your Order schema
        items.push({
          productTitle: it.title,
          category: it.category || catByTitle.get(it.title) || 'Uncategorized',
          qty, revenue: price * qty, createdAt: o.createdAt,
        });
      }
    } else {
      items.push({
        productTitle: o.offerTitle || 'Unknown',
        category: catByTitle.get(o.offerTitle) || 'Offer',
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
  const byProduct = new Map<string, { qty: number; revenue: number }>();
  const byCategory = new Map<string, { qty: number; revenue: number }>();
  const byDay = new Map<string, { qty: number; revenue: number; orders: number }>();
  const byMonth = new Map<string, number>();
  let totalProductsSold = 0, totalRevenue = 0;

  for (const it of items) {
    totalProductsSold += it.qty; totalRevenue += it.revenue;

    const p = byProduct.get(it.productTitle) || { qty: 0, revenue: 0 };
    p.qty += it.qty; p.revenue += it.revenue; byProduct.set(it.productTitle, p);

    const c = byCategory.get(it.category) || { qty: 0, revenue: 0 };
    c.qty += it.qty; c.revenue += it.revenue; byCategory.set(it.category, c);

    const dayKey = it.createdAt.slice(0, 10);
    const d = byDay.get(dayKey) || { qty: 0, revenue: 0, orders: 0 };
    d.qty += it.qty; d.revenue += it.revenue; d.orders += 1; byDay.set(dayKey, d);

    const monthKey = it.createdAt.slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + it.revenue);
  }

  const products = [...byProduct.entries()].map(([title, v]) => ({ title, ...v }));
  const topProducts    = [...products].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const leastProducts  = [...products].sort((a, b) => a.qty - b.qty).slice(0, 5);
  const categoryWise   = [...byCategory.entries()].map(([name, v]) => ({ name, ...v }));
  const revenueByMonth = [...byMonth.entries()].sort().map(([month, revenue]) => ({ month, revenue }));

  let bestDay: { date: string; revenue: number; orders: number } | null = null;
  for (const [date, v] of byDay.entries()) if (!bestDay || v.revenue > bestDay.revenue) bestDay = { date, revenue: v.revenue, orders: v.orders };

  return { totalProductsSold, totalRevenue, topProducts, leastProducts, categoryWise, revenueByMonth, bestDay, byDay };
}

export function buildTrend(byDay: Map<string, { qty: number; revenue: number }>, granularity: 'daily' | 'weekly' | 'monthly') {
  const entries = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (granularity === 'daily') return entries.map(([date, v]) => ({ label: date, ...v }));
  const grouped = new Map<string, { qty: number; revenue: number }>();
  for (const [date, v] of entries) {
    const d = new Date(date);
    const key = granularity === 'monthly'
      ? date.slice(0, 7)
      : (() => { const ws = new Date(d); ws.setDate(d.getDate() - d.getDay()); return ws.toISOString().slice(0, 10); })();
    const g = grouped.get(key) || { qty: 0, revenue: 0 };
    g.qty += v.qty; g.revenue += v.revenue; grouped.set(key, g);
  }
  return [...grouped.entries()].map(([label, v]) => ({ label, ...v }));
}