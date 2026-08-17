// /app/home-business/dashboard/page.tsx
"use client";
import { useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, Plus } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { storeApi } from "../../api-services/storeApi";
import { productApi } from "../../api-services/productApi";
import { orderApi } from "../../api-services/orderApi";
import { SellerDashboardLayout } from "../../components-seller/SellerDashboardLayout";
import SellerOverviewTab from "../../components-seller/SellerOverviewTab";
import { SellerProductsTab } from "../../components-seller/SellerProductsTab";
import { SellerCategoriesTab } from "../../components-seller/SellerCategoriesTab";
import { IncomingOrdersTab } from "../../components-seller/IncomingOrdersTab";
import { SellerSettingsTab } from "../../components-seller/SellerSettingsTab";
import { SellerOrder } from "../../components-seller/seller-analytics";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function HomeBusinessDashboard() {
  const ctx = useContext(AuthContext) as any;
  const token: string | null = ctx?.token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const user = ctx?.user ?? (typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })() : null);
  const router = useRouter();

  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [noStore, setNoStore] = useState(false);
  const [storeNameByOwnerId, setStoreNameByOwnerId] = useState<Record<string, string>>({});

  // Role guard — only home_business
  useEffect(() => {
    if (user && user.role !== "home_business") {
      router.push("/store/dashboard");
    }
  }, [user, router]);

  const loadData = useCallback(async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    setLoadError("");
    setNoStore(false);
    setStore(null);
    setOrders([]);
    setProducts([]);
    setCategories([]);
    try {
      let s: any;
      try {
        const storeRes = await storeApi.getMyStore(token);
        s = storeRes.data.data;
        if (!s) throw Object.assign(new Error("no store"), { status: 404 });
        setStore(s);
      } catch (err: any) {
        const status = err?.response?.status ?? err?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        if (status === 404) {
          setNoStore(true);
          setLoading(false);
          return;
        }
        setLoadError(`Could not load business data: ${err?.response?.data?.message || err?.message || "Unknown error"}.`);
        setLoading(false);
        return;
      }

      const [prodRes, catRes, ordRes] = await Promise.allSettled([
        productApi.getByStore(s._id),
        productApi.getCategories(),
        fetch(`${API}/api/orders/store/${s._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ]);

      if (prodRes.status === "fulfilled") setProducts(prodRes.value.data.data || []);
      if (catRes.status === "fulfilled") setCategories(catRes.value.data.data || []);

      let loadedOrders: any[] = [];
      if (ordRes.status === "fulfilled") {
        loadedOrders = (ordRes.value as any).data || [];
        setOrders(loadedOrders);
      }

      const ownerIds = Array.from(new Set(loadedOrders.map((o: any) => o.buyerId).filter(Boolean)));
      if (ownerIds.length) {
        try {
          const storesRes = await storeApi.getStoresByOwnerIds(ownerIds, token);
          const map: Record<string, string> = {};
          (storesRes.data.data || []).forEach((st: any) => {
            map[st.ownerId] = st.name;
          });
          setStoreNameByOwnerId(map);
        } catch {
          /* non-fatal */
        }
      }

      const failed = [prodRes, catRes, ordRes].filter((r) => r.status === "rejected");
      if (failed.length) setLoadError("Some data could not be loaded. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#BBD5DA] border-t-[#FF0000] animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading your home business…</p>
        </div>
      </div>
    );
  }

  if (noStore) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#DFF1F1] flex items-center justify-center mx-auto mb-4">
            <Truck size={26} className="text-teal-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-1">No home business profile found</p>
          <p className="text-gray-500 text-sm mb-6">Please register your home business first.</p>
          <Link href="/store/register" className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition">
            <Plus size={15} /> Register Business
          </Link>
        </div>
      </div>
    );
  }

  const tabComponents = {
    overview: (props: any) => <SellerOverviewTab {...props} />,
    categories: (props: any) => <SellerCategoriesTab {...props} />,
    products: (props: any) => <SellerProductsTab {...props} sellerRole="home_business" />,
    orders: (props: any) => <IncomingOrdersTab {...props} />,
    settings: (props: any) => <SellerSettingsTab {...props} />,
  };

  return (
    <SellerDashboardLayout
      store={store}
      orders={orders}
      products={products}
      categories={categories}
      token={token || ""}
      loadData={loadData}
      loadError={loadError}
      tabComponents={tabComponents}
      roleLabel="Home Business"  
      role="home_business"     
    />
  );
}