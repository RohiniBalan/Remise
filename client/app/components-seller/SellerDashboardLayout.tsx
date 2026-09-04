// /components-seller/dashboard/SellerDashboardLayout.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BarChart2, 
  Layers, 
  Package, 
  ShoppingBag, 
  Settings, 
  Menu, 
  ChevronDown, 
  Truck, 
  RefreshCw, 
  AlertCircle 
} from "lucide-react";
import UserAvatarMenu from "../components-main/UserAvatarMenu";
import NotificationBell from "../components-main/NotificationBell";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type Tab = "overview" | "categories" | "products" | "orders" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart2 size={15} /> },
  { id: "categories", label: "Categories", icon: <Layers size={15} /> },
  { id: "products", label: "Products", icon: <Package size={15} /> },
  { id: "orders", label: "Incoming Orders", icon: <ShoppingBag size={15} /> },
  { id: "settings", label: "Settings", icon: <Settings size={15} /> },
];

const SEEN_ORDERS_KEY = "seller_seen_order_ids";

function getSeenOrderIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_ORDERS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markOrdersAsSeen(orderIds: string[]) {
  if (typeof window === "undefined") return;
  try {
    const existing = getSeenOrderIds();
    orderIds.forEach((id) => existing.add(id));
    localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify([...existing]));
  } catch {
    // non-fatal
  }
}

interface SellerDashboardLayoutProps {
  store: any;
  orders: any[];
  products: any[];
  categories: any[];
  token: string;
  loadData: () => Promise<void>;
  loadError: string;
  tabComponents: {
    overview: (props: any) => React.ReactNode;
    categories: (props: any) => React.ReactNode;
    products: (props: any) => React.ReactNode;
    orders: (props: any) => React.ReactNode;
    settings: (props: any) => React.ReactNode;
  };
  roleLabel: string;
  role: string;
}

export function SellerDashboardLayout({
  store,
  orders,
  products,
  categories,
  token,
  loadData,
  loadError,
  tabComponents,
  roleLabel,
  role,
}: SellerDashboardLayoutProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => getSeenOrderIds());

  // Count only NEW (unseen) processing orders for the badge
  const processingOrders = orders.filter((o) => o.orderStatus === "Processing");
  const newOrderCount = processingOrders.filter((o) => !seenIds.has(o._id || o.id)).length;

  // When the user navigates to the orders tab, mark all current orders as seen
  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (newTab === "orders") {
      const allIds = orders.map((o) => o._id || o.id).filter(Boolean);
      markOrdersAsSeen(allIds);
      setSeenIds(getSeenOrderIds());
    }
    setMobileMenuOpen(false);
  };

  // When new orders arrive (orders list changes), refresh the seen set from storage
  useEffect(() => {
    setSeenIds(getSeenOrderIds());
  }, [orders]);

  const renderTab = () => {
    const props = {
      orders,
      products,
      categories,
      storeId: store?._id,
      token,
      store,
      storeNameByOwnerId: {},
      onRefresh: loadData,
      onGoToSettings: () => handleTabChange("settings"),
    };

    switch (tab) {
      case "overview":
        return tabComponents.overview(props);
      case "categories":
        return tabComponents.categories({ ...props, onRefresh: loadData });
      case "products":
        return tabComponents.products(props);
      case "orders":
        return tabComponents.orders({ ...props, onRefresh: loadData });
      case "settings":
        return tabComponents.settings({ ...props, onRefresh: loadData });
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-[#BBD5DA] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 transition font-medium shrink-0"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#DFF1F1] flex items-center justify-center shrink-0">
              {store?.logo ? (
                <img 
                  src={`${API}${store.logo}`} 
                  alt="" 
                  className="w-full h-full object-cover rounded-lg" 
                />
              ) : (
                <Truck size={16} className="text-teal-600" />
              )}
            </div>
            <span className="text-sm font-bold text-gray-900 truncate hidden sm:block">
              {store?.name}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DFF1F1] text-teal-700 border border-[#BBD5DA] shrink-0">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-gray-900 rounded-full">
              <NotificationBell />
            </div>
            <UserAvatarMenu theme="light" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-52 shrink-0">
            <nav className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden shadow-sm sticky top-24">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold border-l-4 transition text-left ${
                    tab === t.id
                      ? "bg-[#DFF1F1] text-teal-800 border-l-[#FF0000]"
                      : "text-gray-600 hover:bg-[#F5F5F5] border-l-transparent"
                  }`}
                >
                  <span className={tab === t.id ? "text-[#FF0000]" : "text-gray-400"}>
                    {t.icon}
                  </span>
                  {t.label}
                  {t.id === "orders" && newOrderCount > 0 && (
                    <span className="ml-auto bg-[#FF0000] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {newOrderCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden relative mb-5">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-expanded={mobileMenuOpen}
                className="flex items-center gap-2.5 w-full bg-white border border-[#BBD5DA] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm"
              >
                <Menu size={17} className="text-teal-600 shrink-0" />
                <span className="flex items-center gap-1.5 flex-1 text-left min-w-0 truncate">
                  <span className="text-[#FF0000] shrink-0">
                    {TABS.find((t) => t.id === tab)?.icon}
                  </span>
                  <span className="truncate">
                    {TABS.find((t) => t.id === tab)?.label}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 shrink-0 transition-transform ${
                    mobileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {mobileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#BBD5DA] rounded-xl shadow-lg z-30 overflow-hidden">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTabChange(t.id)}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-left transition ${
                          tab === t.id
                            ? "bg-[#DFF1F1] text-teal-800"
                            : "text-gray-600 hover:bg-[#F5F5F5]"
                        }`}
                      >
                        <span className={tab === t.id ? "text-[#FF0000]" : "text-gray-400"}>
                          {t.icon}
                        </span>
                        {t.label}
                        {t.id === "orders" && newOrderCount > 0 && (
                          <span className="ml-auto bg-[#FF0000] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {newOrderCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {TABS.find((t) => t.id === tab)?.label}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{store?.name}</p>
              </div>
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-[#BBD5DA]"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loadError && (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle
                  size={16}
                  className="text-amber-600 mt-0.5 shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    {loadError}
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="text-xs text-amber-700 hover:underline font-medium shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {renderTab()}
          </main>
        </div>
      </div>
    </div>
  );
}