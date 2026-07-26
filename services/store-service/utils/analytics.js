const WK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getDateRange(rangeKey, customFrom, customTo) {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (rangeKey === 'today') return { from: startOfDay(now), to: now };
  if (rangeKey === 'week') {
    const from = new Date(now); from.setDate(now.getDate() - now.getDay());
    return { from: startOfDay(from), to: now };
  }
  if (rangeKey === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  if (rangeKey === 'lastMonth') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  }
  if (rangeKey === 'custom' && customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(customTo + 'T23:59:59') };
  }
  // default: all-time
  return { from: new Date(0), to: now };
}

// Flattens Order.items[] (order-service) and OfferOrder rows (offers-service)
// into one common line-item shape: { productTitle, category, qty, revenue, createdAt }
function extractLineItems(smartOrders, offerOrders, productCategoryMap) {
  const items = [];

  // Smart orders: each has a real items[] array with title/price/quantity
  for (const o of smartOrders) {
    for (const it of (o.items || [])) {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      items.push({
        productTitle: it.title,
        category: productCategoryMap.get(it.title) || 'Uncategorized',
        qty,
        revenue: price * qty,
        createdAt: o.createdAt,
      });
    }
  }

  // Offer orders: one row = one offer purchase (offerTitle, unitPrice, quantity)
  for (const o of offerOrders) {
    const qty = Number(o.quantity) || 1;
    items.push({
      productTitle: o.offerTitle,
      category: productCategoryMap.get(o.offerTitle) || 'Offer',
      qty,
      revenue: Number(o.totalAmount) || (Number(o.unitPrice) || 0) * qty,
      createdAt: o.createdAt,
    });
  }

  return items;
}

function computeAnalytics(items) {
  const byProduct  = new Map();
  const byCategory = new Map();
  const byDay      = new Map();
  const byMonth    = new Map();
  let totalProductsSold = 0;
  let totalRevenue = 0;

  for (const it of items) {
    totalProductsSold += it.qty;
    totalRevenue += it.revenue;

    const p = byProduct.get(it.productTitle) || { qty: 0, revenue: 0 };
    p.qty += it.qty; p.revenue += it.revenue;
    byProduct.set(it.productTitle, p);

    const c = byCategory.get(it.category) || { qty: 0, revenue: 0 };
    c.qty += it.qty; c.revenue += it.revenue;
    byCategory.set(it.category, c);

    const dayKey = new Date(it.createdAt).toISOString().slice(0, 10);
    const d = byDay.get(dayKey) || { qty: 0, revenue: 0, orders: 0 };
    d.qty += it.qty; d.revenue += it.revenue; d.orders += 1;
    byDay.set(dayKey, d);

    const monthKey = new Date(it.createdAt).toISOString().slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + it.revenue);
  }

  const products = [...byProduct.entries()].map(([title, v]) => ({ title, ...v }));
  const topProducts   = [...products].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const leastProducts = [...products].sort((a, b) => a.qty - b.qty).slice(0, 5);
  const categoryWise  = [...byCategory.entries()].map(([name, v]) => ({ name, ...v }));
  const revenueByMonth = [...byMonth.entries()].sort().map(([month, revenue]) => ({ month, revenue }));

  let bestDay = null;
  for (const [date, v] of byDay.entries()) {
    if (!bestDay || v.revenue > bestDay.revenue) bestDay = { date, revenue: v.revenue, orders: v.orders };
  }

  const trend = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ label: date, qty: v.qty, revenue: v.revenue }));

  return {
    totalProductsSold,
    totalRevenue,
    topProducts,
    leastProducts,
    categoryWise,
    revenueByMonth,
    bestDay,
    trend, // daily by default; weekly/monthly grouping can be done client-side or add a `granularity` param below
  };
}

module.exports = { getDateRange, extractLineItems, computeAnalytics };