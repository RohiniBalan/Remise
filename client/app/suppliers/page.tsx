"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  Store as StoreIcon,
} from "lucide-react";
import NavbarHome from "../components-main/NavbarHome";
import { AuthContext } from "../context/AuthContext";
import { productApi } from "../api-services/productApi";
import { storeApi } from "../api-services/storeApi";
import { orderApi } from "../api-services/orderApi";
import SupplierCompareDrawer, {
  ProductGroup,
  GroupedSupplier,
} from "../components-main/SupplierCompareDrawer";
import SupplierCartOrderModal from "../components-main/SupplierCartOrderModal";
import SupplierBrandListDrawer, {
  TitleGroup,
  groupByTitle,
} from "../components-main/SupplierBrandListDrawer";
import { isAuthenticated, redirectToLogin } from "../utils/authGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const DEFAULT_STORE_CATEGORIES = [
  "Food & Beverages",
  "Grocery",
  "Fashion",
  "Electronics",
  "Pharmacy",
  "Toys",
  "Home & Living",
  "Beauty",
  "Sports",
  "Other",
];

type MergedCategory = { _id: string; name: string; isDefault: boolean };

function mergeCategories(
  customCategories: { _id: string; name: string }[],
): MergedCategory[] {
  const customNames = new Set(
    (customCategories || []).map((c) => c.name.toLowerCase()),
  );
  const defaults: MergedCategory[] = DEFAULT_STORE_CATEGORIES.filter(
    (name) => !customNames.has(name.toLowerCase()),
  ).map((name) => ({ _id: `default-${name}`, name, isDefault: true }));
  const custom: MergedCategory[] = (customCategories || []).map((c) => ({
    _id: c._id,
    name: c.name,
    isDefault: false,
  }));
  return [...custom, ...defaults];
}

const STATUS_STYLE: Record<string, string> = {
  Processing: "bg-amber-100 text-amber-700 border-amber-200",
  Shipped: "bg-blue-100 text-blue-700 border-blue-200",
  Delivered: "bg-green-100 text-green-700 border-green-200",
  Cancelled: "bg-red-100 text-[#FF0000] border-red-200",
};

type CartLine = {
  productId: string;
  storeId: string;
  storeName: string;
  title: string;
  image: string | null;
  price: number;
  qty: number;
  moq: number;
  tierLabel: string | null;
};

export default function SuppliersPage() {
  const ctx = useContext(AuthContext) as any;
  const router = useRouter();
  const token: string | null =
    ctx?.token ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const user =
    ctx?.user ??
    (typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem("user") || "null");
          } catch {
            return null;
          }
        })()
      : null);

  const [theme, setTheme] = useState<"dark" | "light">("light");
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
  };
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      if (e.detail) setTheme(e.detail as "dark" | "light");
    };
    window.addEventListener("theme-change", handleThemeChange as EventListener);
    const current = document.documentElement.getAttribute("data-theme") as
      | "dark"
      | "light";
    if (current) setTheme(current);
    return () =>
      window.removeEventListener(
        "theme-change",
        handleThemeChange as EventListener,
      );
  }, []);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [error, setError] = useState("");
  const [placedMsg, setPlacedMsg] = useState("");
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [view, setView] = useState<"browse" | "orders">("browse");
  const [compareGroup, setCompareGroup] = useState<ProductGroup | null>(null);
  const [showCartOrderFlow, setShowCartOrderFlow] = useState(false);
  const [selectedTitleGroup, setSelectedTitleGroup] =
    useState<TitleGroup | null>(null);

  useEffect(() => {
    productApi
      .getCategories()
      .then((res) => setAllCategories(mergeCategories(res.data.data || [])))
      .catch(() => {});
  }, []);

  const loadGroups = useCallback(async () => {
    if (!categoryFilter) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await productApi.getGroupedSuppliers("home_business", {
        search: search || undefined,
        category: categoryFilter,
      });
      const data: ProductGroup[] = res.data.data || [];

      const storeIds = Array.from(
        new Set(
          data.flatMap((g) =>
            g.suppliers.map((s: any) => s.storeId).filter(Boolean),
          ),
        ),
      );
      let nameById: Record<string, string> = {};
      if (storeIds.length) {
        try {
          const sRes = await storeApi.getByIds(storeIds);
          (sRes.data.data || []).forEach((s: any) => {
            nameById[s._id] = s.name;
          });
        } catch {
          /* names stay as fallback below */
        }
      }

      const withNames = data.map((g) => ({
        ...g,
        suppliers: g.suppliers.map((s: any) => ({
          ...s,
          storeName: nameById[s.storeId] || "Supplier",
        })),
      }));

      setGroups(withNames);
    } catch {
      setError("Could not load suppliers right now. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  const loadMyOrders = useCallback(async () => {
    if (!user?._id || !token) return;
    try {
      const res = await orderApi.getMyWholesaleOrders(user._id, token);
      setMyOrders(res.data.data || []);
    } catch {
      /* non-fatal */
    }
  }, [user, token]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);
  useEffect(() => {
    if (view === "orders") loadMyOrders();
  }, [view, loadMyOrders]);

  const supplierCategories = Array.from(
  new Set(mergeCategories(allCategories || []).map((c) => c.name)),
) as string[];

  const titleGroups = groupByTitle(groups);

  const handleAddToCart = (
    supplier: GroupedSupplier,
    qty: number,
    price: number,
    tierLabel: string | null,
    group: ProductGroup,
  ) => {
    if (!isAuthenticated()) {
      redirectToLogin("/suppliers");
      return;
    }

    setCart((c) => ({
      ...c,
      [supplier.productId]: {
        productId: supplier.productId,
        storeId: supplier.storeId,
        storeName: supplier.storeName,
        title: group.title,
        image: group.image,
        price,
        qty,
        moq: supplier.moq,
        tierLabel,
      },
    }));
  };

  const cartLines = Object.values(cart);
  const cartTotal = cartLines.reduce((sum, i) => sum + i.price * i.qty, 0);

  const cartOrderGroups = (() => {
    const bySupplier: Record<string, CartLine[]> = {};
    cartLines.forEach((i) => {
      (bySupplier[i.storeId] = bySupplier[i.storeId] || []).push(i);
    });
    return Object.entries(bySupplier).map(([storeId, items]) => ({
      storeId,
      storeName: items[0].storeName,
      items: items.map((i) => ({
        productId: i.productId,
        title: i.title,
        price: i.price,
        quantity: i.qty,
        image: i.image,
        moq: i.moq,
        tierLabel: i.tierLabel,
      })),
      totalAmount: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }));
  })();

  const handleCartOrderComplete = () => {
    setCart({});
    setPlacedMsg("Order(s) placed successfully!");
    setTimeout(() => setPlacedMsg(""), 4000);
  };

  const isLight = theme === "light";
  const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm outline-none transition placeholder-gray-400 ${
    isLight
      ? "bg-white border border-[#BBD5DA] text-gray-800 focus:border-teal-400"
      : "bg-white/5 border border-white/10 text-white focus:border-teal-400"
  }`;

  return (
    <>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />
      <div
        className={`min-h-screen pt-40 pb-16 px-4 sm:px-6 ${isLight ? "bg-[#F5F5F5]" : "bg-gray-950"}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1
              className={`text-2xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}
            >
              Buy from Suppliers
            </h1>
            <p
              className={`text-sm mt-1 ${isLight ? "text-gray-500" : "text-gray-400"}`}
            >
              Bulk-buy directly from home businesses at wholesale prices.
            </p>
          </div>

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setView("browse")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${view === "browse" ? "bg-[#FF0000] text-white" : `${isLight ? "bg-white border border-[#BBD5DA] text-gray-600" : "bg-white/5 border border-white/10 text-gray-300"}`}`}
            >
              Browse Suppliers
            </button>
            <button
              onClick={() => setView("orders")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${view === "orders" ? "bg-[#FF0000] text-white" : `${isLight ? "bg-white border border-[#BBD5DA] text-gray-600" : "bg-white/5 border border-white/10 text-gray-300"}`}`}
            >
              My Orders
            </button>
          </div>

          {error && (
            <p className="text-sm text-[#FF0000] bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </p>
          )}
          {placedMsg && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <CheckCircle size={14} />
              {placedMsg}
            </p>
          )}

          {view === "browse" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`${inputCls} sm:w-48 shrink-0 cursor-pointer`}
                  >
                    <option value="">Select Category</option>
                    {supplierCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products…"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                {loading ? (
                  <div
                    className={`rounded-2xl border py-16 text-center shadow-sm ${isLight ? "bg-white border-[#BBD5DA]" : "bg-white/5 border-white/10"}`}
                  >
                    <RefreshCw
                      size={24}
                      className="mx-auto text-teal-600 animate-spin mb-3"
                    />
                    <p
                      className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Loading catalog…
                    </p>
                  </div>
                ) : groups.length === 0 ? (
                  <div
                    className={`rounded-2xl border py-16 text-center shadow-sm ${isLight ? "bg-white border-[#BBD5DA]" : "bg-white/5 border-white/10"}`}
                  >
                    <Package size={36} className="mx-auto text-gray-400 mb-3" />
                    <p
                      className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {categoryFilter
                        ? "No products in this category."
                        : "Select a category to view products."}
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {titleGroups.map((tg) => {
                      const img = tg.image
                        ? tg.image.startsWith("http")
                          ? tg.image
                          : `${API}${tg.image}`
                        : "";
                      return (
                        <div
                          key={tg.titleKey}
                          className={`rounded-2xl border overflow-hidden shadow-sm ${isLight ? "bg-white border-[#BBD5DA]" : "bg-white/5 border-white/10"}`}
                        >
                          <div className="aspect-[4/3] bg-[#F5F5F5]">
                            {img ? (
                              <img
                                src={img}
                                alt={tg.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={32} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-3.5 space-y-2">
                            <p
                              className={`font-semibold text-sm truncate ${isLight ? "text-gray-900" : "text-white"}`}
                            >
                              {tg.title}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Available Brands{" "}
                              <span className="font-semibold">
                                ({tg.brandCount})
                              </span>
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Starting from
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-teal-600 font-bold text-base">
                                ₹{tg.lowestPrice}
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedTitleGroup(tg)}
                              className="w-full mt-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition"
                            >
                              View Brands →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                className={`rounded-2xl border p-5 shadow-sm h-fit sticky top-40 ${isLight ? "bg-white border-[#BBD5DA]" : "bg-white/5 border-white/10"}`}
              >
                <h3
                  className={`font-bold text-sm mb-4 ${isLight ? "text-gray-900" : "text-white"}`}
                >
                  Order Summary
                </h3>
                {cartLines.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Your cart is empty.
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                      {cartLines.map((i) => (
                        <div
                          key={i.productId}
                          className="flex justify-between text-sm"
                        >
                          <div className="min-w-0 pr-2">
                            <p
                              className={`font-medium truncate ${isLight ? "text-gray-800" : "text-white"}`}
                            >
                              {i.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {i.storeName} · {i.qty} × ₹{i.price}
                            </p>
                          </div>
                          <p className="font-semibold text-teal-600 shrink-0">
                            ₹{(i.price * i.qty).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`border-t pt-3 flex justify-between mb-4 ${isLight ? "border-[#F5F5F5]" : "border-white/10"}`}
                    >
                      <span
                        className={`font-bold text-sm ${isLight ? "text-gray-900" : "text-white"}`}
                      >
                        Total
                      </span>
                      <span className="font-bold text-teal-600 text-lg">
                        ₹{cartTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (!isAuthenticated()) {
                          redirectToLogin("/suppliers");
                          return;
                        }
                        setShowCartOrderFlow(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold rounded-xl text-sm transition"
                    >
                      <StoreIcon size={15} /> Place Order
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div
                  className={`rounded-2xl border py-16 text-center shadow-sm ${isLight ? "bg-white border-[#BBD5DA]" : "bg-white/5 border-white/10"}`}
                >
                  <ShoppingBag
                    size={36}
                    className="mx-auto text-gray-400 mb-3"
                  />
                  <p
                    className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}
                  >
                    No supplier orders yet.
                  </p>
                </div>
              ) : (
                myOrders.map((o: any) => (
                  <div
                    key={o._id}
                    className={`rounded-2xl border p-5 shadow-sm ${isLight ? "bg-white border-[#BBD5DA]" : "bg-white/5 border-white/10"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p
                          className={`font-bold text-sm ${isLight ? "text-gray-900" : "text-white"}`}
                        >
                          {o.storeName || "Supplier"}
                        </p>
                        <p className="text-xs text-gray-400">{o.orderId}</p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.orderStatus] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                      >
                        {o.orderStatus}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-0.5 mb-2">
                      {o.items?.map((it: any, i: number) => (
                        <p key={i}>
                          {it.quantity}× {it.title}{" "}
                          {it.tierLabel ? `(${it.tierLabel})` : ""}
                        </p>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-teal-600">
                      ₹{o.totalAmount?.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedTitleGroup && (
        <SupplierBrandListDrawer
          titleGroup={selectedTitleGroup}
          onClose={() => setSelectedTitleGroup(null)}
          onCompareBrand={(brandGroup) => {
            setCompareGroup(brandGroup);
            setSelectedTitleGroup(null);
          }}
        />
      )}

      {compareGroup && (
        <SupplierCompareDrawer
          group={compareGroup}
          onClose={() => setCompareGroup(null)}
          onAddToCart={(supplier, qty, price, tierLabel) =>
            handleAddToCart(supplier, qty, price, tierLabel, compareGroup)
          }
        />
      )}

      {showCartOrderFlow && cartOrderGroups.length > 0 && (
        <SupplierCartOrderModal
          groups={cartOrderGroups}
          prefill={{
            firstName:
              user?.fullname?.split(" ")[0] || user?.name?.split(" ")[0] || "",
            lastName: (user?.fullname || user?.name || "")
              .split(" ")
              .slice(1)
              .join(" "),
            contactEmail: user?.email || "",
          }}
          token={token!}
          onClose={() => setShowCartOrderFlow(false)}
          onComplete={handleCartOrderComplete}
        />
      )}
    </>
  );
}
