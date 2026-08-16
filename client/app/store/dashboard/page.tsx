"use client";
import {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  Clock,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  Edit2,
  Package,
  LayoutGrid,
  Settings,
  BarChart2,
  Search,
  X,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Eye,
  Star,
  Layers,
  IndianRupee,
  Users,
  ImageIcon,
  Save,
  ScanLine,
  Upload,
  CheckCircle2,
  Sparkles,
  Truck,
  QrCode,
  Wallet,
  ListChecks,
  Mic,
  MicOff,
  Menu,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  extractLineItems,
  computeAnalytics,
  buildTrend,
  getDateRange,
  DateRangeKey,
} from "./analytics";
import { AuthContext } from "../../context/AuthContext";
import { storeApi } from "../../api-services/storeApi";
import { offersApi } from "../../api-services/offersApi";
import { productApi } from "../../api-services/productApi";
import { orderApi } from "../../api-services/orderApi";
import { smartOrderApi } from "../../api-services/smartOrderApi";
import UserAvatarMenu from "../../components-main/UserAvatarMenu";
import NotificationBell from "../../components-main/NotificationBell";
import {
  useSpeechRecognition,
  VOICE_LANGUAGES,
  VoiceLanguageOption,
} from "../../hooks/useSpeechRecognition";
import SupplierCartOrderModal from "../../components-main/SupplierCartOrderModal";
import SupplierCompareDrawer, {
  ProductGroup,
  GroupedSupplier,
} from "../../components-main/SupplierCompareDrawer";
import SupplierBrandListDrawer, {
  TitleGroup,
  groupByTitle,
} from "../../components-main/SupplierBrandListDrawer";
import ConfirmModal from "../../components-main/ConfirmModal";
import { indianStates, getCities } from "../../utils/indiaLocation";
import TargetRevenueCard from "../../components-main/TargetRevenueCard";
import { isAuthenticated, redirectToLogin } from "../../utils/authGuard";

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

// ── Palette ───────────────────────────────────────────────────────────────────
// #F5F5F5 page bg · #DFF1F1 mint · #BBD5DA border · #FF0000 red · teal-600 CTA

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ── Category ───────────────────────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab =
  | "overview"
  | "products"
  | "categories"
  | "orders"
  | "offers"
  | "customers"
  | "suppliers"
  | "settings";

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;
const STATUS_STYLE: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Confirmed: "bg-[#DFF1F1] text-teal-700 border-[#BBD5DA]",
  Ready: "bg-teal-100 text-teal-800 border-teal-200",
  "Out for Delivery": "bg-blue-100 text-blue-700 border-blue-200",
  Delivered: "bg-green-100 text-green-700 border-green-200",
  Cancelled: "bg-red-100 text-[#FF0000] border-red-200",
};

// Normalizes an order-service `Order` document (Smart Order Comparison) into
// the same shape OrdersTab already renders for offers-service `OfferOrder`
// documents, so both lists can be merged and displayed together.
function normalizeSmartOrder(o: any) {
  const addr = o.shippingAddress || {};
  const items = o.items || [];
  return {
    _id: o._id,
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
    notes: null,
    totalAmount: o.totalAmount,
    quantity:
      items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) || 1,
    createdAt: o.createdAt,
    deliveryMethod: o.deliveryMethod,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    deliveryStatus: o.deliveryStatus,
    rawItems: items,
    _source: "smartOrder" as const,
  };
}

// Groups the merged orders array (offer orders + smart orders) by customer
// identity, then looks for products the same customer bought in 2+ different
// calendar months — a simple, no-backend signal for "recurring buyer."
function buildCustomerInsights(orders: any[]) {
  const byCustomer: Record<string, any> = {};

  for (const o of orders) {
    const key =
      o.customerId ||
      o.userId ||
      o.customerPhone ||
      o.customerEmail ||
      o.customerName ||
      o._id;
    if (!byCustomer[key]) {
      byCustomer[key] = {
        key,
        name: o.customerName || "Unknown",
        phone: o.customerPhone || null,
        email: o.customerEmail || null,
        customerId: o.customerId || o.userId || null,
        orders: [] as any[],
      };
    }
    byCustomer[key].orders.push(o);
  }

  return Object.values(byCustomer)
    .map((c: any) => {
      const totalOrders = c.orders.length;
      const totalSpent = c.orders.reduce(
        (s: number, o: any) => s + (o.totalAmount || 0),
        0,
      );
      const lastOrderDate = c.orders.reduce(
        (latest: string, o: any) =>
          !latest || new Date(o.createdAt) > new Date(latest)
            ? o.createdAt
            : latest,
        "",
      );

      // productTitle -> set of "YYYY-MM" months it was bought in
      const productMonths: Record<string, Set<string>> = {};
      for (const o of c.orders) {
        const month = (o.createdAt || "").slice(0, 7);
        const titles: string[] =
          o._source === "smartOrder" && o.rawItems?.length
            ? o.rawItems.map((it: any) => it.title)
            : [o.offerTitle];
        for (const t of titles) {
          if (!t) continue;
          if (!productMonths[t]) productMonths[t] = new Set();
          productMonths[t].add(month);
        }
      }

      const recurringProducts = Object.entries(productMonths)
        .filter(([, months]) => months.size >= 2)
        .map(([title, months]) => ({ title, monthCount: months.size }))
        .sort((a, b) => b.monthCount - a.monthCount);

      return {
        ...c,
        totalOrders,
        totalSpent,
        lastOrderDate,
        recurringProducts,
        isRecurring: recurringProducts.length > 0,
      };
    })
    .sort((a: any, b: any) => b.totalOrders - a.totalOrders);
}

// ── Small UI helpers ──────────────────────────────────────────────────────────
function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${className}`}
    >
      {children}
    </span>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400 disabled:opacity-50"
      />
    </div>
  );
}

function TextArea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <textarea
        {...props}
        className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400 resize-none"
      />
    </div>
  );
}

function Select({
  label,
  children,
  ...props
}: {
  label: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        {...props}
        className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-400 transition cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

// ── Product Modal ─────────────────────────────────────────────────────────────
function ProductModal({
  product,
  categories,
  storeId,
  token,
  onClose,
  onSaved,
  initialTitle,
  initialCategory,
}: {
  product?: any;
  categories: any[];
  storeId: string;
  token: string;
  onClose: () => void;
  onSaved: (p: any) => void;
  initialTitle?: string;
  initialCategory?: string;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    title: product?.title || initialTitle || "",
    description: product?.description || "",
    price: product?.price || "",
    discountedPrice: product?.discountedPrice || "",
    category: product?.category || initialCategory || "",
    brand: product?.brand || "",
    totalStock: product?.totalStock || "",
    availability: product?.availability || "In Stock",
    tags: product?.tags?.join(", ") || "",
    imageUrl: product?.imageUrl || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(
    product?.imageUrl ? `${API}${product.imageUrl}` : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [voiceLang, setVoiceLang] = useState<VoiceLanguageOption>(
    VOICE_LANGUAGES[0],
  );
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // Speak-to-fill: transcript → /api/voice-product-parse (translates via the
  // same indicTranslate() IndicTrans2 pipeline every OCR route uses, then
  // Claude-parses fields, then getProductImage()) → bulk-fills this SAME
  // form state. A returned image is almost always a data: URI (see
  // getProductImage/imageResultToUrl), so route it through the existing
  // `imageFile` upload path — exactly like a data-URI scan result already
  // does in `createOneProduct` — rather than stuffing a huge base64 string
  // into the `imageUrl` text field, which `handleSubmit` sends as a plain
  // form value. `handleSubmit` itself is untouched either way.
  const handleVoiceResult = useCallback(
    async (text: string) => {
      setVoiceParsing(true);
      setVoiceError("");
      try {
        const res = await fetch("/api/voice-product-parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sourceLang: voiceLang.short }),
        });
        const data = await res.json();
        if (!data.success)
          throw new Error(data.message || "Could not understand that.");
        const x = data.extracted;

        setForm((f) => ({
          ...f,
          title: x.productName || f.title,
          category: x.category || f.category,
          price: x.price ? String(x.price) : f.price,
          discountedPrice: x.discountedPrice
            ? String(x.discountedPrice)
            : f.discountedPrice,
          totalStock: x.totalStock ? String(x.totalStock) : f.totalStock,
          description: x.description || f.description,
          brand: x.brand || f.brand,
        }));

        if (x.imageUrl?.startsWith("data:")) {
          const blob = await fetch(x.imageUrl).then((r) => r.blob());
          const ext =
            blob.type === "image/svg+xml"
              ? "svg"
              : blob.type === "image/png"
                ? "png"
                : "jpg";
          setImageFile(new File([blob], `product.${ext}`, { type: blob.type }));
          setPreview(x.imageUrl);
        } else if (x.imageUrl) {
          setImageFile(null);
          set("imageUrl", x.imageUrl);
          setPreview(x.imageUrl);
        }
      } catch (err: any) {
        setVoiceError(err.message || "Could not understand that.");
      } finally {
        setVoiceParsing(false);
      }
    },
    [voiceLang],
  );

  const voice = useSpeechRecognition(handleVoiceResult);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      setError("Title and price are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "") fd.append(k, String(v));
      });
      fd.append("storeId", storeId);
      if (imageFile) fd.append("image", imageFile);

      const res = isEdit
        ? await productApi.update(product._id, fd, token)
        : await productApi.create(fd, token);
      onSaved(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#BBD5DA] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[#BBD5DA] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-[#FF0000] bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </p>
          )}

          {/* Voice entry */}
          <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {VOICE_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setVoiceLang(l)}
                    disabled={voice.listening || voiceParsing}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition disabled:opacity-50 ${
                      voiceLang.code === l.code
                        ? "bg-teal-600 text-white"
                        : "bg-white text-gray-600 border border-[#BBD5DA]"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  voice.listening ? voice.stop() : voice.start(voiceLang)
                }
                disabled={voiceParsing || !voice.supported}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                  voice.listening
                    ? "bg-[#FF0000] text-white"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
              >
                {voiceParsing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />{" "}
                    Understanding…
                  </>
                ) : voice.listening ? (
                  <>
                    <MicOff size={14} /> Stop
                  </>
                ) : (
                  <>
                    <Mic size={14} /> Speak product details
                  </>
                )}
              </button>
            </div>
            {!voice.supported && (
              <p className="text-xs text-gray-400">
                Voice input isn't supported in this browser — try Chrome or
                Edge.
              </p>
            )}
            {voice.listening && (
              <p className="text-xs text-teal-700">
                Listening… "{voice.interimTranscript || voice.transcript || "…"}
                "
              </p>
            )}
            {(voice.error || voiceError) && (
              <p className="text-xs text-[#FF0000] flex items-center gap-1">
                <AlertCircle size={11} />
                {voice.error || voiceError}
              </p>
            )}
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Product Image
            </label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[#BBD5DA] bg-[#F5F5F5] flex items-center justify-center overflow-hidden shrink-0">
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={24} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm text-gray-700 hover:bg-[#F5F5F5] transition w-fit">
                  <ImageIcon size={14} /> Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="hidden"
                  />
                </label>
                <Input
                  label=""
                  placeholder="Or paste image URL"
                  value={form.imageUrl}
                  onChange={(e) => {
                    set("imageUrl", e.target.value);
                    if (!imageFile) setPreview(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Product Title *"
                placeholder="e.g. Organic Face Moisturizer"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <TextArea
                label="Description"
                placeholder="Describe the product…"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <Input
              label="Price (₹) *"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
            <Input
              label="Discounted Price (₹)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.discountedPrice}
              onChange={(e) => set("discountedPrice", e.target.value)}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c: any) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Brand"
              placeholder="e.g. Nivea"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
            />
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              placeholder="0"
              value={form.totalStock}
              onChange={(e) => set("totalStock", e.target.value)}
            />
            <Select
              label="Availability"
              value={form.availability}
              onChange={(e) => set("availability", e.target.value)}
            >
              <option value="In Stock">In Stock</option>
              <option value="Out Of Stock">Out Of Stock</option>
              <option value="Pre Order">Pre Order</option>
            </Select>
            <div className="sm:col-span-2">
              <Input
                label="Tags (comma-separated)"
                placeholder="e.g. skincare, organic, moisturizer"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={14} /> {isEdit ? "Save Changes" : "Add Product"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-[#BBD5DA] text-gray-700 hover:bg-[#F5F5F5] font-semibold rounded-xl text-sm transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
const PIE_COLORS = [
  "#0d9488",
  "#FF0000",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function SalesTrendTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#BBD5DA] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <p className="text-teal-700 font-medium">
        revenue : ₹
        {Number(data.revenue).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      {data.topProduct && (
        <p className="text-gray-500 mt-1">
          Top product:{" "}
          <span className="font-semibold text-gray-700">{data.topProduct}</span>
        </p>
      )}
    </div>
  );
}

// Brand-wise Revenue tooltip — shows the currently selected date range
function BrandRevenueTooltip({ active, payload, from, to }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload; // { brand, qty, revenue }
  return (
    <div className="bg-white border border-[#BBD5DA] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{data.brand}</p>
      <p className="text-teal-700 font-medium">
        revenue : ₹
        {Number(data.revenue).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      {from && to && (
        <p className="text-gray-500 mt-1">
          Period: {formatPeriodLabel(from, to)}
        </p>
      )}
    </div>
  );
}

// Revenue by Month tooltip
function RevenueByMonthTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#BBD5DA] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <p className="text-teal-700 font-medium">
        revenue : ₹
        {Number(data.revenue).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      {data.topProduct && (
        <p className="text-gray-500 mt-1">
          Top product:{" "}
          <span className="font-semibold text-gray-700">{data.topProduct}</span>
        </p>
      )}
    </div>
  );
}

function formatPeriodLabel(from: Date, to: Date) {
  const days = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(from)} – ${fmt(to)} (${days} day${days !== 1 ? "s" : ""})`;
}

function OverviewTab({
  store,
  offers,
  orders,
  products,
  categories,
  onTabSwitch,
}: any) {
  const [range, setRange] = useState<DateRangeKey>("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [category, setCategory] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [granularity, setGranularity] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const { from, to } = getDateRange(range, custom);
  const filteredOrders = orders.filter((o: any) => {
    const d = new Date(o.createdAt);
    return d >= from && d <= to;
  });

  const mergedCategories = useMemo(
    () => mergeCategories(categories || []),
    [categories],
  );

  let items = extractLineItems(filteredOrders, products);
  if (category) items = items.filter((i) => i.category === category);
  if (productFilter)
    items = items.filter((i) => i.productTitle === productFilter);

  const analytics = computeAnalytics(items);
  const trend = buildTrend(
    analytics.byDay,
    analytics.byDayProduct,
    granularity,
  );

  // ── Target revenue: current calendar month, Delivered orders only ──
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const monthDeliveredRevenue = orders
    .filter(
      (o: any) =>
        o.status === "Delivered" && new Date(o.createdAt) >= monthStart,
    )
    .reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);

  const handleExportPdf = async () => {
    const res = await fetch("/api/store-analytics-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName: store?.name, ...analytics }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-analytics-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Original stats (based on ALL orders, unaffected by the analytics filters above) ──
  const totalRevenue = orders
    .filter((o: any) => o.status === "Delivered")
    .reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
  const offerRevenue = orders
    .filter((o: any) => o.status === "Delivered" && o._source !== "smartOrder")
    .reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
  const activeOffers = offers.filter(
    (o: any) => o.isActive && new Date(o.validUntil) > new Date(),
  ).length;
  const pendingOrders = orders.filter(
    (o: any) => o.status === "Pending",
  ).length;
  const lowStock = products.filter(
    (p: any) => p.totalStock < 5 && p.availability !== "Out Of Stock",
  ).length;

  const stats = [
    {
      label: "Total Products",
      value: products.length,
      icon: <Package size={20} />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
    {
      label: "Active Offers",
      value: activeOffers,
      icon: <Tag size={20} />,
      color: "text-teal-600",
      bg: "bg-[#DFF1F1]",
      border: "border-[#BBD5DA]",
    },
    {
      label: "Total Orders",
      value: orders.length,
      icon: <ShoppingBag size={20} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Revenue (₹)",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      icon: <IndianRupee size={20} />,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
    },
    {
      label: "Pending Orders",
      value: pendingOrders,
      icon: <Clock size={20} />,
      color: pendingOrders > 0 ? "text-[#FF0000]" : "text-gray-600",
      bg: pendingOrders > 0 ? "bg-red-50" : "bg-[#F5F5F5]",
      border: pendingOrders > 0 ? "border-red-200" : "border-[#BBD5DA]",
    },
    {
      label: "Offer Revenue (₹)",
      value: `₹${offerRevenue.toLocaleString("en-IN")}`,
      icon: <IndianRupee size={20} />,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
    },
    {
      label: "Low Stock",
      value: lowStock,
      icon: <AlertCircle size={20} />,
      color: lowStock > 0 ? "text-amber-600" : "text-gray-600",
      bg: lowStock > 0 ? "bg-amber-50" : "bg-[#F5F5F5]",
      border: lowStock > 0 ? "border-amber-200" : "border-[#BBD5DA]",
    },
  ];

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
  const topStockProducts = [...products]
    .sort((a, b) => b.totalStock - a.totalStock)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* ── Analytics filter bar ── */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 bg-white rounded-2xl border border-[#BBD5DA] p-3 shadow-sm">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as DateRangeKey)}
          className="col-span-1 bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm text-gray-700 outline-none w-full sm:w-auto"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="custom">Custom Range</option>
        </select>
        {range === "custom" && (
          <>
            <input
              type="date"
              value={custom.from}
              onChange={(e) =>
                setCustom((c) => ({ ...c, from: e.target.value }))
              }
              className="col-span-1 bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm text-gray-700 outline-none w-full sm:w-auto"
            />
            <input
              type="date"
              value={custom.to}
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              className="col-span-1 bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm text-gray-700 outline-none w-full sm:w-auto"
            />
          </>
        )}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="col-span-1 bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm text-gray-700 outline-none w-full sm:w-auto"
        >
          <option value="">All Categories</option>
          {mergedCategories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="col-span-1 bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm text-gray-700 outline-none w-full sm:w-auto"
        >
          <option value="">All Products</option>
          {products.map((p: any) => (
            <option key={p._id} value={p.title}>
              {p.title}
            </option>
          ))}
        </select>
        <button
          onClick={handleExportPdf}
          className="col-span-2 sm:col-auto sm:ml-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition w-full sm:w-auto"
        >
          Export PDF
        </button>
      </div>

      <TargetRevenueCard
        targetRevenue={store?.targetRevenue || 0}
        achievedRevenue={monthDeliveredRevenue}
        onGoToSettings={() => onTabSwitch("settings")}
      />

      {/* ── Stats grid: original 6 cards + Total Products Sold ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-purple-100 p-2.5 sm:p-4 shadow-sm">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-1.5 sm:mb-3">
            <TrendingUp size={14} className="sm:w-5 sm:h-5" />
          </div>
          <p className="text-sm sm:text-2xl font-bold text-purple-600 truncate">
            {analytics.totalProductsSold}
          </p>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 leading-tight">
            Total Products Sold
          </p>
        </div>
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

      {/* ── Recent Orders + Product Stock (original) ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#BBD5DA] flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Recent Orders</h3>
            <button
              onClick={() => onTabSwitch("orders")}
              className="text-xs text-teal-600 hover:underline font-medium"
            >
              View all
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">
              No orders yet
            </p>
          ) : (
            <div className="divide-y divide-[#F5F5F5]">
              {recentOrders.map((o: any) => (
                <div key={o._id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {o.offerTitle || o.customerName}
                    </p>
                    <p className="text-xs text-gray-500">{o.customerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-teal-700">
                      ₹{o.totalAmount}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#BBD5DA] flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Product Stock</h3>
            <button
              onClick={() => onTabSwitch("products")}
              className="text-xs text-teal-600 hover:underline font-medium"
            >
              Manage
            </button>
          </div>
          {topStockProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">
              No products yet
            </p>
          ) : (
            <div className="divide-y divide-[#F5F5F5]">
              {topStockProducts.map((p: any) => (
                <div key={p._id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] shrink-0 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={
                          p.imageUrl.startsWith("http")
                            ? p.imageUrl
                            : `${API}${p.imageUrl}`
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={16} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {p.title}
                    </p>
                    <p className="text-xs text-gray-500">{p.category || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${p.totalStock < 5 ? "text-amber-600" : "text-gray-900"}`}
                    >
                      {p.totalStock} left
                    </p>
                    <p className="text-xs text-gray-400">
                      ₹{p.discountedPrice || p.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sales trend ── */}
      <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm">Sales Trend</h3>
          <div className="flex gap-1">
            {(["daily", "weekly", "monthly"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${granularity === g ? "bg-teal-600 text-white" : "bg-[#F5F5F5] text-gray-600"}`}
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
            <Tooltip content={<SalesTrendTooltip />} />
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

      {/* ── Top/Least selling, category pie, revenue by month ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {[
          { title: "Top Selling Products", rows: analytics.topProducts },
          { title: "Least Selling Products", rows: analytics.leastProducts },
        ].map(({ title, rows }) => (
          <div
            key={title}
            className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#BBD5DA]">
              <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
            </div>
            <div className="overflow-x-auto">
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
                  {rows.map((r: any) => (
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
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-gray-400 py-6"
                      >
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* ── Brand-wise Revenue chart ── */}
        <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">
            Brand-wise Revenue
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={analytics.brandWise}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="brand"
                tick={{ fontSize: 11 }}
                width={90}
              />
              <Tooltip
                content={<BrandRevenueTooltip from={from} to={to} />}
                formatter={(value) => {
                  if (typeof value === "number") {
                    return `₹${value.toLocaleString("en-IN")}`;
                  }
                  return value ?? "";
                }}
              />
              <Bar dataKey="revenue" fill="#0d9488" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">
            Category-wise Sales
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={analytics.categoryWise}
                dataKey="revenue"
                nameKey="name"
                outerRadius={90}
                label
              >
                {analytics.categoryWise.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">
            Revenue by Month
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<RevenueByMonthTooltip />} />
              <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Best sales day ── */}
      {analytics.bestDay && (
        <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-2">
            Best Sales Day
          </h3>
          <p className="text-2xl font-bold text-teal-700">
            {new Date(analytics.bestDay.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Revenue: ₹{analytics.bestDay.revenue.toLocaleString("en-IN")} ·
            Orders: {analytics.bestDay.orders}
          </p>
        </div>
      )}

      {!store?.isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              Store Verification Pending
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Our team will review and verify your store shortly. Verified
              stores get a badge and higher visibility.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
// ── Smart Paper-Upload Modal ──────────────────────────────────────────────────
type ScanStep = "idle" | "scanning" | "review" | "saving" | "done" | "error";

const GATEWAY = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Field set shared by ProductModal (Manual Add), SmartUploadModal (single-scan)
// and BulkSmartUploadModal (bulk-scan) review forms.
type ScanProductForm = {
  productName: string;
  category: string;
  price: string;
  discountedPrice: string;
  description: string;
  brand: string;
  imageUrl: string;
  totalStock: string;
  availability: string;
  tags: string;
};

function groupProductsByType(products: any[]) {
  const byTitle: Record<
    string,
    {
      title: string;
      image: string;
      category: string;
      items: any[];
    }
  > = {};

  for (const p of products) {
    const key = (p.title || "").toLowerCase().trim().replace(/\s+/g, " ");

    if (!byTitle[key]) {
      byTitle[key] = {
        title: p.title,
        image: p.imageUrl || p.images?.[0] || "",
        category: p.category || "",
        items: [],
      };
    }

    byTitle[key].items.push(p);
  }

  return Object.values(byTitle).map((v) => ({
    typeKey: v.title.toLowerCase().trim().replace(/\s+/g, " "),
    title: v.title,
    image: v.image,
    category: v.category,
    items: v.items,
    brandCount: v.items.length,
    totalStock: v.items.reduce(
      (s: number, p: any) => s + (p.totalStock || 0),
      0,
    ),
  }));
}

// Single-product creation, shared by SmartUploadModal and BulkSmartUploadModal
// so bulk-adding N products is just N sequential calls to this — each one
// independently try/catchable by the caller for continue-on-failure semantics.
async function createOneProduct(
  form: ScanProductForm,
  storeId: string,
  token: string,
) {
  const disclaimer =
    "Note: Product image is for representation purposes only. Actual product may appear slightly different from what you see.";
  const description = [form.description, disclaimer]
    .filter(Boolean)
    .join("\n\n");
  const tags: string[] = form.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const catList = await fetch(`${GATEWAY}/api/categories`).then((r) =>
    r.json(),
  );
  const existing = (catList.data || []).find(
    (c: any) => c.name.toLowerCase() === form.category.toLowerCase(),
  );
  if (!existing && form.category) {
    await fetch(`${GATEWAY}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: form.category }),
    });
  }

  let productRes: Response;
  const isDataUri = form.imageUrl?.startsWith("data:");
  if (isDataUri) {
    const blob = await fetch(form.imageUrl).then((r) => r.blob());
    const ext =
      blob.type === "image/svg+xml"
        ? "svg"
        : blob.type === "image/png"
          ? "png"
          : "jpg";
    const fd = new FormData();
    fd.append("image", blob, `product.${ext}`);
    fd.append("title", form.productName);
    fd.append("category", form.category);
    fd.append("price", form.price);
    fd.append(
      "discountedPrice",
      String(Number(form.discountedPrice) || Number(form.price)),
    );
    fd.append("description", description);
    fd.append("brand", form.brand);
    fd.append("storeId", storeId);
    fd.append("availability", form.availability);
    fd.append("totalStock", String(Number(form.totalStock) || 0));
    if (tags.length) fd.append("tags", JSON.stringify(tags));
    productRes = await fetch(`${GATEWAY}/api/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  } else {
    const imageUrl =
      form.imageUrl ||
      `https://loremflickr.com/400/400/${encodeURIComponent(form.productName.split(" ").slice(0, 3).join(" "))}`;
    productRes = await fetch(`${GATEWAY}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: form.productName,
        category: form.category,
        price: Number(form.price),
        discountedPrice: Number(form.discountedPrice) || Number(form.price),
        description,
        brand: form.brand,
        imageUrl,
        images: [imageUrl],
        storeId,
        availability: form.availability,
        tags,
        totalStock: Number(form.totalStock) || 0,
      }),
    });
  }

  const data = await productRes.json();
  if (!data.success)
    throw new Error(data.message || "Failed to create product.");
  return data.data;
}

function SmartUploadModal({
  storeId,
  token,
  onClose,
  onCreated,
}: {
  storeId: string;
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [step, setStep] = useState<ScanStep>("idle");
  const [errMsg, setErrMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [engine, setEngine] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // editable review form — same field set as ProductModal (Manual Add Product)
  const [form, setForm] = useState({
    productName: "",
    category: "",
    price: "",
    discountedPrice: "",
    validTill: "",
    description: "",
    brand: "",
    imageUrl: "",
    totalStock: "",
    availability: "In Stock",
    tags: "",
  });
  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setFile(null);
    setPreview("");
    setStep("idle");
    setErrMsg("");
    setEngine("");
    setAiGenerated(false);
    setForm({
      productName: "",
      category: "",
      price: "",
      discountedPrice: "",
      validTill: "",
      description: "",
      brand: "",
      imageUrl: "",
      totalStock: "",
      availability: "In Stock",
      tags: "",
    });
  };

  const pickFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep("idle");
    setErrMsg("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) pickFile(f);
  };

  const handleScan = async () => {
    if (!file) return;
    setStep("scanning");
    setErrMsg("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/smart-product-upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Scan failed.");
      const x = data.extracted;
      setEngine(data.engine || "ocr");
      setAiGenerated(!!data.extracted?.aiGenerated);
      setForm({
        productName: x.productName || "",
        category: x.category || "",
        price: String(x.price || ""),
        discountedPrice: String(x.discountedPrice || x.price || ""),
        validTill: x.validTill || "",
        description: x.description || "",
        brand: x.brand || "",
        imageUrl: x.imageUrl || "",
        totalStock: "",
        availability: "In Stock",
        tags: x.validTill ? `Offer valid till ${x.validTill}` : "",
      });
      setStep("review");
    } catch (err: any) {
      setErrMsg(err.message || "Something went wrong.");
      setStep("error");
    }
  };

  const handleCreate = async () => {
    if (!form.productName || !form.price) return;
    setStep("saving");
    try {
      await createOneProduct(form, storeId, token);
      setStep("done");
    } catch (err: any) {
      setErrMsg(err.message || "Failed to create product.");
      setStep("error");
    }
  };

  const engineBadge: Record<string, string> = {
    gemini: "bg-blue-100 text-blue-700",
    claude: "bg-purple-100 text-purple-700",
    ocr: "bg-amber-100 text-amber-700",
  };

  const inputCls =
    "w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#BBD5DA] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[#BBD5DA] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-teal-600" />
            <h2 className="text-base font-bold text-gray-900">
              Scan Paper & Add Product
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* ── Step 1: upload ── */}
          {(step === "idle" || step === "scanning" || step === "error") && (
            <>
              <div
                className={`relative border-2 border-dashed rounded-2xl transition cursor-pointer
                  ${dragging ? "border-teal-500 bg-teal-50" : "border-[#BBD5DA] hover:border-teal-400 hover:bg-[#F5F5F5]"}
                  ${preview ? "p-2" : "p-10"}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !preview && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickFile(f);
                  }}
                />
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Paper"
                      className="w-full max-h-56 object-contain rounded-xl"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reset();
                      }}
                      className="absolute top-2 right-2 bg-white/90 border border-gray-200 rounded-full p-1 shadow"
                    >
                      <X size={14} className="text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#DFF1F1] flex items-center justify-center">
                      <Upload size={24} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        Drop your paper image here
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        or click to browse — JPG, PNG, WEBP
                      </p>
                      <p className="text-xs text-teal-600 font-medium mt-2">
                        Supports Hindi, Tamil, Telugu, Kannada, Malayalam,
                        Bengali & more
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {step === "scanning" && (
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <RefreshCw
                    size={18}
                    className="text-teal-600 animate-spin shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-teal-800">
                      Reading your paper…
                    </p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      Google OCR reading → qwen2.5 translating
                    </p>
                  </div>
                </div>
              )}
              {step === "error" && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle
                    size={16}
                    className="text-[#FF0000] shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-700">{errMsg}</p>
                </div>
              )}
              <button
                onClick={handleScan}
                disabled={!file || step === "scanning"}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
              >
                {step === "scanning" ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Scanning…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Scan & Extract Details
                  </>
                )}
              </button>
            </>
          )}

          {/* ── Step 2: review & edit ── */}
          {(step === "review" || step === "saving") && (
            <>
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                <p className="text-xs font-semibold text-teal-800 flex-1">
                  Details extracted — review and correct if needed
                </p>
                {engine && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${engineBadge[engine] || "bg-gray-100 text-gray-600"}`}
                  >
                    via {engine}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* Product image preview */}
                <div className="flex gap-3 items-start">
                  <div className="relative w-20 h-20 rounded-xl border border-[#BBD5DA] bg-[#F5F5F5] overflow-hidden shrink-0">
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt="product"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://loremflickr.com/80/80/${encodeURIComponent(form.productName || "product")}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-300" />
                      </div>
                    )}
                    {aiGenerated && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold bg-blue-600/80 text-white py-0.5">
                        AI Generated
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Product Image URL
                    </label>
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setF("imageUrl", e.target.value)}
                      className={inputCls}
                      placeholder="Auto-fetched — paste a different URL to override"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    value={form.productName}
                    onChange={(e) => setF("productName", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Basmati Rice 5kg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      MRP (₹) *
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setF("price", e.target.value)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Offer Price (₹)
                    </label>
                    <input
                      type="number"
                      value={form.discountedPrice}
                      onChange={(e) => setF("discountedPrice", e.target.value)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <input
                      value={form.category}
                      onChange={(e) => setF("category", e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Groceries"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Valid Till
                    </label>
                    <input
                      type="date"
                      value={form.validTill}
                      onChange={(e) => setF("validTill", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <input
                    value={form.brand}
                    onChange={(e) => setF("brand", e.target.value)}
                    className={inputCls}
                    placeholder="Brand name (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.totalStock}
                      onChange={(e) => setF("totalStock", e.target.value)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Availability
                    </label>
                    <select
                      value={form.availability}
                      onChange={(e) => setF("availability", e.target.value)}
                      className={inputCls}
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Out Of Stock">Out Of Stock</option>
                      <option value="Pre Order">Pre Order</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    value={form.tags}
                    onChange={(e) => setF("tags", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. skincare, organic, moisturizer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setF("description", e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400 resize-none"
                    placeholder="Product description…"
                  />
                </div>
              </div>

              {step === "saving" && (
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                  <RefreshCw
                    size={15}
                    className="text-teal-600 animate-spin shrink-0"
                  />
                  <p className="text-sm text-teal-700 font-medium">
                    Creating product…
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={reset}
                  disabled={step === "saving"}
                  className="px-5 py-2.5 border border-[#BBD5DA] rounded-xl text-sm font-semibold text-gray-700 hover:bg-[#F5F5F5] transition disabled:opacity-50"
                >
                  ← Rescan
                </button>
                <button
                  onClick={handleCreate}
                  disabled={
                    !form.productName || !form.price || step === "saving"
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
                >
                  {step === "saving" ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Create Product
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: done ── */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-600" />
                </div>
                <p className="font-bold text-gray-900">
                  Product created successfully!
                </p>
                <p className="text-sm text-gray-500">
                  It's now visible in your Products tab.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 py-2.5 border border-[#BBD5DA] rounded-xl text-sm font-semibold text-gray-700 hover:bg-[#F5F5F5] transition"
                >
                  Scan Another
                </button>
                <button
                  onClick={() => {
                    onCreated();
                    onClose();
                  }}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-xl text-sm font-semibold text-white transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bulk Smart Upload Modal (Scan Grocery List) ─────────────────────────────
// New, separate entry point from SmartUploadModal above — the single-scan
// flow stays untouched. Reuses the same OCR/AI/image-generation pipeline
// (via `/api/smart-bulk-product-scan`) and the same `createOneProduct`
// creation call, just looped per detected item with continue-on-failure.
type BulkStep = "idle" | "scanning" | "review" | "saving" | "done" | "error";
type BulkProductRow = ScanProductForm & { id: string; aiGenerated?: boolean };

function BulkSmartUploadModal({
  storeId,
  token,
  onClose,
  onCreated,
}: {
  storeId: string;
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [step, setStep] = useState<BulkStep>("idle");
  const [errMsg, setErrMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [products, setProducts] = useState<BulkProductRow[]>([]);
  const [failedItems, setFailedItems] = useState<
    { name: string; reason: string }[]
  >([]);
  const [summary, setSummary] = useState<{
    added: number;
    failed: { name: string; reason: string }[];
  }>({ added: 0, failed: [] });
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview("");
    setStep("idle");
    setErrMsg("");
    setProducts([]);
    setFailedItems([]);
  };

  const pickFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep("idle");
    setErrMsg("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) pickFile(f);
  };

  const setRow = (id: string, k: keyof ScanProductForm, v: string) =>
    setProducts((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)),
    );

  const removeRow = (id: string) =>
    setProducts((rows) => rows.filter((r) => r.id !== id));

  const addManually = (name: string) => {
    setProducts((rows) => [
      ...rows,
      {
        id: `${Date.now()}-${Math.random()}`,
        productName: name,
        category: "",
        price: "",
        discountedPrice: "",
        description: "",
        brand: "",
        imageUrl: "",
        totalStock: "",
        availability: "In Stock",
        tags: "",
      },
    ]);
    setFailedItems((items) => items.filter((i) => i.name !== name));
  };

  const handleScan = async () => {
    if (!file) return;
    setStep("scanning");
    setErrMsg("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/smart-bulk-product-scan", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Scan failed.");
      const rows: BulkProductRow[] = (data.products || []).map(
        (p: any, i: number) => ({
          id: `${Date.now()}-${i}`,
          productName: p.productName || "",
          category: p.category || "",
          price: "",
          discountedPrice: "",
          description: p.description || "",
          brand: p.brand || "",
          imageUrl: p.imageUrl || "",
          totalStock: "",
          availability: "In Stock",
          tags: "",
          aiGenerated: !!p.aiGenerated,
        }),
      );
      setProducts(rows);
      setFailedItems(data.failed || []);
      setStep("review");
    } catch (err: any) {
      setErrMsg(err.message || "Something went wrong.");
      setStep("error");
    }
  };

  const handleAddAll = async () => {
    setStep("saving");
    let added = 0;
    const failed: { name: string; reason: string }[] = [];
    for (const row of products) {
      if (!row.productName || !row.price) {
        failed.push({
          name: row.productName || "(unnamed)",
          reason: "Missing name or price.",
        });
        continue;
      }
      try {
        await createOneProduct(row, storeId, token);
        added++;
      } catch (err: any) {
        failed.push({
          name: row.productName,
          reason: err.message || "Failed to create product.",
        });
      }
    }
    setSummary({ added, failed: [...failedItems, ...failed] });
    setStep("done");
  };

  const inputCls =
    "w-full bg-white border border-[#BBD5DA] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#BBD5DA] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#BBD5DA] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ListChecks size={18} className="text-teal-600" />
            <h2 className="text-base font-bold text-gray-900">
              Scan Grocery List & Add Products
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* ── Step 1: upload ── */}
          {(step === "idle" || step === "scanning" || step === "error") && (
            <>
              <div
                className={`relative border-2 border-dashed rounded-2xl transition cursor-pointer
                  ${dragging ? "border-teal-500 bg-teal-50" : "border-[#BBD5DA] hover:border-teal-400 hover:bg-[#F5F5F5]"}
                  ${preview ? "p-2" : "p-10"}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !preview && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickFile(f);
                  }}
                />
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="List"
                      className="w-full max-h-56 object-contain rounded-xl"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reset();
                      }}
                      className="absolute top-2 right-2 bg-white/90 border border-gray-200 rounded-full p-1 shadow"
                    >
                      <X size={14} className="text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#DFF1F1] flex items-center justify-center">
                      <ListChecks size={24} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        Drop a grocery list, invoice or handwritten list
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        or click to browse — JPG, PNG, WEBP
                      </p>
                      <p className="text-xs text-teal-600 font-medium mt-2">
                        Up to 25 items per scan · supports multiple Indian
                        languages
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {step === "scanning" && (
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <RefreshCw
                    size={18}
                    className="text-teal-600 animate-spin shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-teal-800">
                      Reading your list…
                    </p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      OCR reading → translating → identifying each product
                    </p>
                  </div>
                </div>
              )}
              {step === "error" && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle
                    size={16}
                    className="text-[#FF0000] shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-700">{errMsg}</p>
                </div>
              )}
              <button
                onClick={handleScan}
                disabled={!file || step === "scanning"}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
              >
                {step === "scanning" ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Scanning…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Scan & Extract Products
                  </>
                )}
              </button>
            </>
          )}

          {/* ── Step 2: review & edit ── */}
          {(step === "review" || step === "saving") && (
            <>
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                <p className="text-xs font-semibold text-teal-800 flex-1">
                  {products.length} product{products.length === 1 ? "" : "s"}{" "}
                  detected — review, edit price/stock, then add all
                </p>
              </div>

              <div className="space-y-3">
                {products.map((row) => (
                  <div
                    key={row.id}
                    className="border border-[#BBD5DA] rounded-xl p-3 flex gap-3"
                  >
                    <div className="relative w-16 h-16 rounded-lg border border-[#BBD5DA] bg-[#F5F5F5] overflow-hidden shrink-0">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt={row.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `https://loremflickr.com/64/64/${encodeURIComponent(row.productName || "product")}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          value={row.productName}
                          onChange={(e) =>
                            setRow(row.id, "productName", e.target.value)
                          }
                          className={`${inputCls} flex-1 font-semibold`}
                          placeholder="Product name *"
                        />
                        <button
                          onClick={() => removeRow(row.id)}
                          className="text-gray-400 hover:text-[#FF0000] shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) =>
                            setRow(row.id, "price", e.target.value)
                          }
                          className={inputCls}
                          placeholder="MRP ₹ *"
                        />
                        <input
                          type="number"
                          value={row.discountedPrice}
                          onChange={(e) =>
                            setRow(row.id, "discountedPrice", e.target.value)
                          }
                          className={inputCls}
                          placeholder="Offer ₹"
                        />
                        <input
                          type="number"
                          value={row.totalStock}
                          onChange={(e) =>
                            setRow(row.id, "totalStock", e.target.value)
                          }
                          className={inputCls}
                          placeholder="Stock qty"
                        />
                        <select
                          value={row.availability}
                          onChange={(e) =>
                            setRow(row.id, "availability", e.target.value)
                          }
                          className={inputCls}
                        >
                          <option value="In Stock">In Stock</option>
                          <option value="Out Of Stock">Out Of Stock</option>
                          <option value="Pre Order">Pre Order</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          value={row.category}
                          onChange={(e) =>
                            setRow(row.id, "category", e.target.value)
                          }
                          className={inputCls}
                          placeholder="Category"
                        />
                        <input
                          value={row.brand}
                          onChange={(e) =>
                            setRow(row.id, "brand", e.target.value)
                          }
                          className={inputCls}
                          placeholder="Brand"
                        />
                      </div>
                      <input
                        value={row.tags}
                        onChange={(e) => setRow(row.id, "tags", e.target.value)}
                        className={inputCls}
                        placeholder="Tags (comma-separated)"
                      />
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No products left to add.
                  </p>
                )}
              </div>

              {failedItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800">
                    Couldn't confidently identify {failedItems.length} item
                    {failedItems.length === 1 ? "" : "s"}:
                  </p>
                  {failedItems.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-amber-700 truncate">
                        {f.name} — {f.reason}
                      </span>
                      <button
                        onClick={() => addManually(f.name)}
                        className="text-teal-700 font-semibold hover:underline shrink-0"
                      >
                        Add manually
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {step === "saving" && (
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                  <RefreshCw
                    size={15}
                    className="text-teal-600 animate-spin shrink-0"
                  />
                  <p className="text-sm text-teal-700 font-medium">
                    Adding products…
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={reset}
                  disabled={step === "saving"}
                  className="px-5 py-2.5 border border-[#BBD5DA] rounded-xl text-sm font-semibold text-gray-700 hover:bg-[#F5F5F5] transition disabled:opacity-50"
                >
                  ← Rescan
                </button>
                <button
                  onClick={handleAddAll}
                  disabled={products.length === 0 || step === "saving"}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
                >
                  {step === "saving" ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Adding…
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Add All Products ({products.length})
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: done ── */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-600" />
                </div>
                <p className="font-bold text-gray-900">
                  {summary.added} product{summary.added === 1 ? "" : "s"} added
                  successfully!
                </p>
                {summary.failed.length > 0 && (
                  <p className="text-sm text-amber-600">
                    {summary.failed.length} could not be added
                  </p>
                )}
              </div>
              {summary.failed.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                  {summary.failed.map((f, i) => (
                    <p key={i} className="text-xs text-amber-700">
                      <span className="font-semibold">{f.name}</span> —{" "}
                      {f.reason}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 py-2.5 border border-[#BBD5DA] rounded-xl text-sm font-semibold text-gray-700 hover:bg-[#F5F5F5] transition"
                >
                  Scan Another List
                </button>
                <button
                  onClick={() => {
                    onCreated();
                    onClose();
                  }}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-xl text-sm font-semibold text-white transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────────────
function CategoriesTab({ categories, products, token, onRefresh }: any) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const mergedCategories = useMemo(
    () => mergeCategories(categories || []),
    [categories],
  );

  const countByCategory = (products || []).reduce(
    (acc: Record<string, number>, p: any) => {
      if (p.category) acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    },
    {},
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await productApi.createCategory(name.trim(), token);
      setName("");
      onRefresh();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (!err.response) {
        setError(
          "Product service is not reachable. Make sure it is running on port 3003.",
        );
      } else if (status === 403) {
        setError(
          msg ||
            "Access denied. Your account role may need updating — try signing out and back in.",
        );
      } else {
        setError(msg || `Failed to create category (HTTP ${status}).`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: any) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    setDeleting(true);
    try {
      await productApi.deleteCategory(selectedCategory._id, token);
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      onRefresh();
    } catch {
      alert("Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      {/* Add form */}
      <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          Add New Category
        </h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Skincare"
            className="flex-1 bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}{" "}
            Add
          </button>
        </form>
        {error && <p className="text-xs text-[#FF0000] mt-2">{error}</p>}
      </div>

      {/* Categories list */}
      <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[#BBD5DA] bg-[#F9F9F9]">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            All Categories ({mergedCategories.length})
          </p>
        </div>
        {mergedCategories.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No categories yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-[#F5F5F5]">
            {mergedCategories.map((c) => (
              <li
                key={c._id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#F9F9F9] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#DFF1F1] flex items-center justify-center">
                    <Layers size={14} className="text-teal-600" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {c.name}
                    </span>
                    {c.isDefault && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5F5F5] text-gray-500">
                        Default
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-teal-700 bg-[#DFF1F1] border border-[#BBD5DA] px-2 py-0.5 rounded-full">
                      {countByCategory[c.name] || 0} product
                      {(countByCategory[c.name] || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {!c.isDefault && (
                  <button
                    onClick={() => handleDelete(c)}
                    className="text-gray-300 hover:text-[#FF0000] hover:bg-red-50 p-2 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ── Products Tab ────────────────────────────────────────────────────────────
function ProductsTab({ products, categories, storeId, token, onRefresh }: any) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [editProd, setEditProd] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showBulkScan, setShowBulkScan] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedTypeKey, setSelectedTypeKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const requestDelete = (id: string, title: string) =>
    setDeleteTarget({ id, title });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await productApi.delete(deleteTarget.id, token);
      onRefresh();
    } catch {
      alert("Failed to delete product.");
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  const mergedCategories = useMemo(
    () => mergeCategories(categories || []),
    [categories],
  );

  const filtered = products.filter((p: any) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const productTypes = groupProductsByType(filtered);
  const selectedType =
    productTypes.find((t) => t.typeKey === selectedTypeKey) || null;

  // ── Brand-management view (inside a product type) ──────────────────────
  if (selectedType) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedTypeKey(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-700 font-medium transition"
            >
              <ArrowLeft size={15} /> Back
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedType.title}
              </h2>
              <p className="text-xs text-gray-400">
                {selectedType.brandCount} brand
                {selectedType.brandCount !== 1 ? "s" : ""} ·{" "}
                {selectedType.totalStock} total stock
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shrink-0"
          >
            <Plus size={15} /> Add Brand
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
          {selectedType.items.map((p: any, idx: number) => {
            const img = p.imageUrl
              ? p.imageUrl.startsWith("http")
                ? p.imageUrl
                : `${API}${p.imageUrl}`
              : p.images?.[0] || "";
            return (
              <div
                key={p._id}
                className={`flex items-center gap-4 px-5 py-4 ${idx !== 0 ? "border-t border-[#F5F5F5]" : ""}`}
              >
                <div className="w-14 h-14 rounded-xl bg-[#F5F5F5] shrink-0 overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={p.brand || p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={20} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {p.brand || "Unbranded"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-teal-700 font-bold text-sm">
                      ₹{p.discountedPrice || p.price}
                    </span>
                    {p.discountedPrice && (
                      <span className="text-gray-400 text-xs line-through">
                        ₹{p.price}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        p.availability === "In Stock"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : p.availability === "Out Of Stock"
                            ? "bg-red-50 text-[#FF0000] border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {p.availability}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${p.totalStock < 5 ? "text-amber-600 font-bold" : "text-gray-400"}`}
                    >
                      Stock {p.totalStock}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditProd(p)}
                    className="text-gray-500 hover:text-teal-700 hover:bg-[#DFF1F1] p-2 rounded-lg transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => requestDelete(p._id, p.brand || p.title)}
                    disabled={deleting === p._id}
                    className="text-gray-500 hover:text-[#FF0000] hover:bg-red-50 p-2 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {(showAdd || editProd) && (
          <ProductModal
            product={editProd}
            categories={mergedCategories}
            storeId={storeId}
            token={token}
            initialTitle={!editProd ? selectedType.title : undefined}
            initialCategory={!editProd ? selectedType.category : undefined}
            onClose={() => {
              setShowAdd(false);
              setEditProd(null);
            }}
            onSaved={() => {
              setShowAdd(false);
              setEditProd(null);
              onRefresh();
            }}
          />
        )}

        <ConfirmModal
          open={!!deleteTarget}
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleting === deleteTarget?.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </div>
    );
  }

  // ── Default view: product-type grid ─────────────────────────────────────
  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm outline-none focus:border-teal-400 transition"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-400 transition"
        >
          <option value="">All Categories</option>
          {mergedCategories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowScan(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shrink-0"
        >
          <ScanLine size={15} /> Scan Paper
        </button>
        <button
          onClick={() => setShowBulkScan(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shrink-0"
        >
          <ListChecks size={15} /> Scan Product List
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shrink-0"
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {productTypes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#BBD5DA] py-20 text-center shadow-sm">
          <Package size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-1">
            {products.length === 0 ? "No products found" : "No results"}
          </p>
          <p className="text-gray-400 text-sm mb-5">
            {products.length === 0
              ? "Add your first product to start selling."
              : "Try a different search or category."}
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Plus size={15} /> Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {productTypes.map((pt) => {
            const img = pt.image
              ? pt.image.startsWith("http")
                ? pt.image
                : `${API}${pt.image}`
              : "";

            const brandRows = pt.items
              .map((p: any) => ({
                brand: p.brand || "Unbranded",
                stock: p.totalStock || 0,
              }))
              .sort((a, b) => b.stock - a.stock);
            const visibleBrands = brandRows.slice(0, 3);
            const extraCount = brandRows.length - visibleBrands.length;
            return (
              <div
                key={pt.typeKey}
                className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="relative aspect-square bg-[#F5F5F5]">
                  {img ? (
                    <img
                      src={img}
                      alt={pt.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={36} className="text-gray-200" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 mb-0.5">
                    {pt.category || "—"}
                  </p>
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {pt.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pt.brandCount} Brand{pt.brandCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    Total Stock: {pt.totalStock}
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#F5F5F5] space-y-1">
                    {visibleBrands.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-gray-600 truncate pr-2">
                          {b.brand}
                        </span>
                        <span
                          className={`font-semibold shrink-0 ${
                            b.stock < 5 ? "text-amber-600" : "text-gray-700"
                          }`}
                        >
                          {b.stock}
                        </span>
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <p className="text-[11px] text-gray-400">
                        +{extraCount} more
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTypeKey(pt.typeKey)}
                    className="w-full mt-3 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition"
                  >
                    Manage Brands →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showAdd || editProd) && (
        <ProductModal
          product={editProd}
          categories={mergedCategories}
          storeId={storeId}
          token={token}
          onClose={() => {
            setShowAdd(false);
            setEditProd(null);
          }}
          onSaved={() => {
            setShowAdd(false);
            setEditProd(null);
            onRefresh();
          }}
        />
      )}

      {showScan && (
        <SmartUploadModal
          storeId={storeId}
          token={token}
          onClose={() => setShowScan(false)}
          onCreated={onRefresh}
        />
      )}

      {showBulkScan && (
        <BulkSmartUploadModal
          storeId={storeId}
          token={token}
          onClose={() => setShowBulkScan(false)}
          onCreated={onRefresh}
        />
      )}
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab({ orders, token, onRefresh }: any) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await offersApi.updateOrderStatus(orderId, status, token);
      onRefresh();
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter((o: any) => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch =
      !search ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.offerTitle?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts: Record<string, number> = { all: orders.length };
  ORDER_STATUSES.forEach((s) => {
    counts[s] = orders.filter((o: any) => o.status === s).length;
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or offer…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm outline-none focus:border-teal-400 transition"
          />
        </div>
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
          <p className="text-lg font-semibold text-gray-700">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o: any) => (
            <div
              key={o._id}
              className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-900 truncate">
                      {o.offerTitle}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {o.customerName}
                    {o.customerPhone && (
                      <span className="text-gray-400">
                        {" "}
                        · {o.customerPhone}
                      </span>
                    )}
                    {(o.customerId || o.userId || o.userID) && (
                      <span className="text-gray-400">
                        {" "}
                        · Customer ID: {o.customerId || o.userId || o.userID}
                      </span>
                    )}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">
                    {o.deliveryAddress}
                  </p>
                  {o.notes && (
                    <p className="text-gray-400 text-xs mt-0.5 italic">
                      "{o.notes}"
                    </p>
                  )}
                  {o._source === "smartOrder" && o.deliveryMethod && (
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-[#F5F5F5] border border-[#BBD5DA] px-2 py-0.5 rounded-full">
                        {o.deliveryMethod === "pickup" ? (
                          <Store size={10} />
                        ) : (
                          <Truck size={10} />
                        )}
                        {o.deliveryMethod === "pickup"
                          ? "Self Pickup"
                          : "Home Delivery"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-[#F5F5F5] border border-[#BBD5DA] px-2 py-0.5 rounded-full">
                        {o.paymentMethod === "qr" ? (
                          <QrCode size={10} />
                        ) : (
                          <Wallet size={10} />
                        )}
                        {o.paymentMethod === "qr" ? "QR" : "Cash"} ·{" "}
                        {o.paymentStatus === "SUCCESS" ? "Paid" : "Pending"}
                      </span>
                    </div>
                  )}
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
                    ₹{o.totalAmount}
                  </p>
                  <p className="text-gray-400 text-xs">Qty: {o.quantity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F5F5F5]">
                <span className="text-xs text-gray-400 font-mono">
                  #{o._id.slice(-6).toUpperCase()}
                </span>
                {o._source === "smartOrder" || o.status === "Delivered" ? (
                  <span
                    className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl border ${STATUS_STYLE[o.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                  >
                    {o.status}
                  </span>
                ) : (
                  <select
                    value={o.status}
                    onChange={(e) => handleStatus(o._id, e.target.value)}
                    disabled={updating === o._id}
                    className="ml-auto bg-[#F5F5F5] border border-[#BBD5DA] text-gray-700 text-sm rounded-xl px-3 py-1.5 outline-none focus:border-teal-400 transition cursor-pointer disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                )}
                {updating === o._id && (
                  <RefreshCw size={14} className="animate-spin text-teal-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Offers Tab ────────────────────────────────────────────────────────────────
function OffersTab({ offers, token, onRefresh }: any) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    setDeleting(id);
    try {
      await offersApi.delete(id, token);
      onRefresh();
    } catch {
      alert("Failed to delete offer.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {offers.length} offer{offers.length !== 1 ? "s" : ""}
        </p>
        <Link
          href="/store/offers/new"
          className="flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <Plus size={15} /> New Offer
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#BBD5DA] py-20 text-center shadow-sm">
          <Tag size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-1">
            No offers yet
          </p>
          <p className="text-gray-400 text-sm mb-5">
            Publish location-based deals to attract nearby customers.
          </p>
          <Link
            href="/store/offers/new"
            className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Plus size={15} /> Publish First Offer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {offers.map((offer: any) => {
            const expired = new Date(offer.validUntil) < new Date();
            return (
              <div
                key={offer._id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition hover:shadow-md ${expired ? "border-gray-200 opacity-70" : "border-[#BBD5DA]"}`}
              >
                <div className="relative aspect-video bg-[#F5F5F5]">
                  <img
                    src={
                      offer.image?.startsWith("http")
                        ? offer.image
                        : `${API}${offer.image}`
                    }
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                  {offer.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 bg-[#FF0000] text-white text-xs font-bold px-2 py-0.5 rounded-lg shadow">
                      {offer.discountPercent}% OFF
                    </span>
                  )}
                  {offer.targetCustomerId && (
                    <span className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow">
                      Private · {offer.targetCustomerName}
                    </span>
                  )}
                  {expired && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                        EXPIRED
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 truncate">
                    {offer.title}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-teal-700 font-bold text-lg">
                      ₹{offer.offerPrice}
                    </span>
                    <span className="text-gray-400 text-sm line-through">
                      ₹{offer.originalPrice}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                    <Clock size={10} /> Valid until{" "}
                    {new Date(offer.validUntil).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5F5F5]">
                    <span className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Eye size={10} /> {offer.viewCount ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingBag size={10} /> {offer.orderCount ?? 0}
                      </span>
                    </span>
                    <button
                      onClick={() => handleDelete(offer._id)}
                      disabled={deleting === offer._id}
                      className="flex items-center gap-1 text-xs text-[#FF0000] hover:bg-red-50 px-2 py-1 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Customers Tab ─────────────────────────────────────────────────────────────
function CustomersTab({ orders }: any) {
  const [search, setSearch] = useState("");
  const [onlyRecurring, setOnlyRecurring] = useState(false);

  const customers = buildCustomerInsights(orders);

  const filtered = customers.filter((c: any) => {
    const matchSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchRecurring = !onlyRecurring || c.isRecurring;
    return matchSearch && matchRecurring;
  });

  const recurringCount = customers.filter((c: any) => c.isRecurring).length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-sm outline-none focus:border-teal-400 transition"
          />
        </div>
        <button
          onClick={() => setOnlyRecurring((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition shrink-0 ${
            onlyRecurring
              ? "bg-teal-600 text-white border-teal-600"
              : "bg-white text-gray-600 border-[#BBD5DA]"
          }`}
        >
          <Star size={14} /> Recurring only ({recurringCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#BBD5DA] py-20 text-center shadow-sm">
          <Users size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-lg font-semibold text-gray-700">
            No customers found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c: any) => (
            <div
              key={c.key}
              className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-900">{c.name}</p>
                    {c.isRecurring && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                        <Star size={10} /> Recurring buyer
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && (
                      <span className="text-gray-400"> · {c.email}</span>
                    )}
                    {c.customerId && (
                      <span className="text-gray-400">
                        {" "}
                        · Customer ID: {c.customerId}
                      </span>
                    )}
                  </p>
                  {c.lastOrderDate && (
                    <p className="text-gray-400 text-xs mt-1">
                      Last order:{" "}
                      {new Date(c.lastOrderDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-teal-700">
                    ₹
                    {c.totalSpent.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {c.totalOrders} order{c.totalOrders !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {c.isRecurring && (
                <div className="mt-4 pt-4 border-t border-[#F5F5F5]">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Buys repeatedly
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {c.recurringProducts.map((p: any) => (
                      <span
                        key={p.title}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#DFF1F1] text-teal-700 border border-[#BBD5DA]"
                      >
                        {p.title} · {p.monthCount} months
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/store/offers/new?customerId=${encodeURIComponent(c.customerId || c.key)}&customerName=${encodeURIComponent(c.name)}`}
                    className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    <Tag size={13} /> Create Offer →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Suppliers Tab ──────────────────────────────────────────────────────────────
function SuppliersTab({ token, store, categories }: any) {
  const [supplierType, setSupplierType] = useState<
    "whole_saler" | "home_business"
  >("whole_saler");
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cart, setCart] = useState<Record<string, CartLine>>({}); // key = productId
  const [error, setError] = useState("");
  const [placedMsg, setPlacedMsg] = useState("");
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [view, setView] = useState<"browse" | "orders">("browse");
  const [showCartOrderFlow, setShowCartOrderFlow] = useState(false);
  const [compareGroup, setCompareGroup] = useState<ProductGroup | null>(null);
  const [selectedTitleGroup, setSelectedTitleGroup] =
    useState<TitleGroup | null>(null);

  const loadGroups = useCallback(async () => {
    if (!categoryFilter) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await productApi.getGroupedSuppliers(supplierType, {
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
  }, [supplierType, search, categoryFilter]);

  const loadMyOrders = useCallback(async () => {
    if (!store?.ownerId) return;
    try {
      const res = await orderApi.getMyWholesaleOrders(store.ownerId, token);
      setMyOrders(res.data.data || []);
    } catch {
      /* non-fatal */
    }
  }, [store, token]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);
  useEffect(() => {
    if (view === "orders") loadMyOrders();
  }, [view, loadMyOrders]);

  const supplierCategories = Array.from(
    new Set(
      [
        ...mergeCategories(categories || []).map((c) => c.name),
        ...groups.map((g) => g.category),
      ].filter(Boolean),
    ),
  ) as string[];

  const titleGroups = groupByTitle(groups);

  const handleAddToCart = (
    supplier: GroupedSupplier,
    qty: number,
    price: number,
    tierLabel: string | null,
    group: ProductGroup,
  ) => {
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

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView("browse")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${view === "browse" ? "bg-[#FF0000] text-white" : "bg-white border border-[#BBD5DA] text-gray-600"}`}
        >
          Browse Suppliers
        </button>
        <button
          onClick={() => setView("orders")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${view === "orders" ? "bg-[#FF0000] text-white" : "bg-white border border-[#BBD5DA] text-gray-600"}`}
        >
          My Orders
        </button>
      </div>

      {error && (
        <p className="text-sm text-[#FF0000] bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      {placedMsg && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <CheckCircle size={14} /> {placedMsg}
        </p>
      )}

      {view === "browse" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 flex-wrap">
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => {
                    setSupplierType("whole_saler");
                    setCategoryFilter("");
                  }}
                  className={`flex-1 h-11 px-4 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-1 ${supplierType === "whole_saler" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-[#BBD5DA]"}`}
                >
                  📦 Wholesalers
                </button>
                <button
                  onClick={() => {
                    setSupplierType("home_business");
                    setCategoryFilter("");
                  }}
                  className={`flex-1 h-11 px-4 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-1 ${supplierType === "home_business" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-[#BBD5DA]"}`}
                >
                  🏠 Home Business
                </button>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-40 shrink-0 h-11 bg-white border border-[#BBD5DA] rounded-xl px-3 text-sm text-gray-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer"
              >
                <option value="">Select Category</option>
                {supplierCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="relative w-full sm:w-56 shrink-0 h-11">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  className="w-full h-11 bg-white border border-[#BBD5DA] rounded-xl pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400"
                />
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-[#BBD5DA] py-16 text-center shadow-sm">
                <RefreshCw
                  size={24}
                  className="mx-auto text-teal-600 animate-spin mb-3"
                />
                <p className="text-sm text-gray-500">Loading catalog…</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#BBD5DA] py-16 text-center shadow-sm">
                <Package size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-500">
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
                      className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden shadow-sm"
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
                            <Package size={28} className="text-gray-200" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-1.5">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {tg.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Available Brands{" "}
                          <span className="font-semibold">
                            ({tg.brandCount})
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">Starting from</p>
                        <p className="text-teal-700 font-bold text-base">
                          ₹{tg.lowestPrice}
                        </p>
                        <button
                          onClick={() => setSelectedTitleGroup(tg)}
                          className="w-full mt-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition"
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

          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm h-fit sticky top-24">
            <h3 className="font-bold text-gray-900 text-sm mb-4">
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
                        <p className="font-medium text-gray-800 truncate">
                          {i.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {i.storeName} · {i.qty} × ₹{i.price}
                        </p>
                      </div>
                      <p className="font-semibold text-teal-700 shrink-0">
                        ₹{(i.price * i.qty).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#F5F5F5] pt-3 flex justify-between mb-4">
                  <span className="font-bold text-gray-900 text-sm">Total</span>
                  <span className="font-bold text-teal-700 text-lg">
                    ₹{cartTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!isAuthenticated()) {
                      redirectToLogin("/store/dashboard");
                      return;
                    }
                    setShowCartOrderFlow(true);
                  }}
                  className="w-full flex items-center gap-2 justify-center py-3 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold rounded-xl text-sm transition"
                >
                  <Store size={15} /> Place Order
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#BBD5DA] py-16 text-center shadow-sm">
              <ShoppingBag size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No supplier orders yet.</p>
            </div>
          ) : (
            myOrders.map((o: any) => (
              <div
                key={o._id}
                className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
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
                <div className="text-xs text-gray-500 space-y-0.5 mb-2">
                  {o.items?.map((it: any, i: number) => (
                    <p key={i}>
                      {it.quantity}× {it.title}{" "}
                      {it.tierLabel ? `(${it.tierLabel})` : ""}
                    </p>
                  ))}
                </div>
                <p className="text-sm font-bold text-teal-700">
                  ₹{o.totalAmount?.toLocaleString("en-IN")}
                </p>
              </div>
            ))
          )}
        </div>
      )}

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
            firstName: store?.ownerName?.split(" ")[0] || "",
            lastName: store?.ownerName?.split(" ").slice(1).join(" ") || "",
            phone: store?.phone || "",
            contactEmail: store?.email || "",
            address: store?.address?.street || "",
            city: store?.address?.city || "",
            state: store?.address?.state || "",
            pinCode: store?.address?.pinCode || "",
          }}
          token={token}
          onClose={() => setShowCartOrderFlow(false)}
          onComplete={handleCartOrderComplete}
        />
      )}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ store, token, onRefresh, categories }: any) {
  const [form, setForm] = useState({
    name: store?.name || "",
    description: store?.description || "",
    phone: store?.phone || "",
    email: store?.email || "",
    category: store?.category || "",
    street: store?.address?.street || "",
    city: store?.address?.city || "",
    state: store?.address?.state || "",
    pinCode: store?.address?.pinCode || "",
    targetRevenue: store?.targetRevenue ? String(store.targetRevenue) : "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState<any[]>([]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const [upiId, setUpiId] = useState(store?.upiId || "");
  const [fssai, setFssai] = useState(store?.fssai || "");
  const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const upiError =
    upiId.trim() && !UPI_ID_REGEX.test(upiId.trim())
      ? "Invalid UPI ID format (expected e.g. name@bank)."
      : "";

  const categoryOptions = useMemo(
    () => mergeCategories(categories || []),
    [categories],
  );
  const isFoodCategory = form.category === "Food & Beverages";

  const normalize = (s: string) =>
    (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const findState = useCallback((value: string) => {
    const v = normalize(value);
    if (!v) return undefined;
    return indianStates.find(
      (s) => normalize(s.name) === v || normalize(s.isoCode) === v,
    );
  }, []);

  useEffect(() => {
    if (!form.state) return;
    const state = findState(form.state);
    if (state) {
      setCities(getCities(state.isoCode));
    } else {
      setCities([]);
    }
  }, [form.state, findState]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (upiError) {
      setError(upiError);
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("category", form.category);
      fd.append("address[street]", form.street);
      fd.append("address[city]", form.city);
      fd.append("address[state]", form.state);
      fd.append("address[pinCode]", form.pinCode);
      fd.append("targetRevenue", form.targetRevenue);
      fd.append("upiId", upiId.trim());
      fd.append("fssai", isFoodCategory ? fssai.trim() : "");
      await storeApi.update(store._id, fd, token);
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4"
      >
        <h3 className="text-base font-bold text-gray-900 mb-2">
          Store Profile
        </h3>

        {error && (
          <p className="text-sm text-[#FF0000] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Store Name *"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Monthly Revenue Target (₹)"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 100000"
              value={form.targetRevenue}
              onChange={(e) => set("targetRevenue", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Select Category</option>
            {categoryOptions.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>

          {isFoodCategory && (
            <Input
              label="FSSAI License Number"
              value={fssai}
              maxLength={14}
              inputMode="numeric"
              placeholder="14-digit FSSAI number"
              onChange={(e) => setFssai(e.target.value)}
            />
          )}

          <Input
            label="Pin Code"
            value={form.pinCode}
            onChange={(e) => set("pinCode", e.target.value)}
          />
          <Input
            label="Street"
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
          />
          <Select
            label="City"
            value={form.city}
            disabled={!form.state}
            onChange={async (e) => {
              const city = e.target.value;
              set("city", city);
              if (!city) return;

              try {
                const res = await fetch(
                  `https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`,
                );
                const data = await res.json();
                if (
                  data[0]?.Status === "Success" &&
                  data[0].PostOffice?.length > 0
                ) {
                  set("pinCode", data[0].PostOffice[0].Pincode);
                }
              } catch {
                /* pincode lookup is best-effort — leave existing value on failure */
              }
            }}
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
            {form.state && cities.length === 0 && (
              <option value="" disabled>
                No cities found for this state
              </option>
            )}
          </Select>
          <Select
            label="State"
            value={findState(form.state)?.isoCode || ""}
            onChange={(e) => {
              const code = e.target.value;
              const state = indianStates.find((s) => s.isoCode === code);
              setForm((f) => ({
                ...f,
                state: state?.name || "",
                city: "",
                pinCode: "",
              }));
              setCities(getCities(code));
            }}
          >
            <option value="">Select State</option>
            {indianStates.map((state) => (
              <option key={state.isoCode} value={state.isoCode}>
                {state.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="pt-2 border-t border-[#F5F5F5]">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            UPI Payment QR Code
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Enter your UPI ID to generate a scannable QR code. Customers who
            choose QR Code payment will see this when they order from your
            store.
          </p>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[#BBD5DA] bg-[#F5F5F5] flex items-center justify-center overflow-hidden shrink-0">
              {store?.qrCodeImage ? (
                <img
                  src={store.qrCodeImage}
                  alt="UPI QR code"
                  className="w-full h-full object-contain bg-white"
                />
              ) : (
                <QrCode size={22} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <Input
                label="UPI ID"
                placeholder="merchant@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              {upiError && (
                <p className="text-xs text-[#FF0000] mt-1">{upiError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {store?.qrCodeImage
                  ? "Save changes to regenerate the QR code."
                  : "Save a valid UPI ID to generate your QR code."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle size={14} /> Saved!
            </span>
          )}
        </div>
      </form>

      {/* Verification status */}
      <div className="mt-5 bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Verification Status
        </h3>
        {store?.isVerified ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle size={18} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">
                Your store is verified ✓
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Verified badge is shown on all your offers and store page.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">
                Verification pending
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Our team typically verifies stores within 24–48 hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart2 size={15} /> },
  { id: "categories", label: "Categories", icon: <Layers size={15} /> },
  { id: "products", label: "Products", icon: <Package size={15} /> },
  { id: "orders", label: "Orders", icon: <ShoppingBag size={15} /> },
  { id: "suppliers", label: "Order Stock", icon: <Truck size={15} /> },
  { id: "offers", label: "Offers", icon: <Tag size={15} /> },
  { id: "customers", label: "Customers", icon: <Users size={15} /> },
  { id: "settings", label: "Settings", icon: <Settings size={15} /> },
];

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StoreDashboard() {
  const ctx = useContext(AuthContext) as any;
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
  const router = useRouter();
  const roleFixed = useRef(false);

  const [store, setStore] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [noStore, setNoStore] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    setLoadError("");
    setNoStore(false);
    // Clear any previously-loaded owner's data before fetching this token's
    // own data, so a slow/failed request can never leave a stale render of
    // a different account's store/products on screen.
    setStore(null);
    setOffers([]);
    setOrders([]);
    setProducts([]);
    setCategories([]);
    try {
      // ── Step 1: load the store, scoped to the logged-in owner only ───────
      // storeApi.getMyStore hits GET /api/stores/me/my-store, which the
      // backend resolves via Store.findOne({ ownerId: req.user.id }) — so
      // this can only ever return *this* owner's own store, never another
      // owner's. A 404 here genuinely means "this account has no store yet."
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
          // No store found. Please create your store first.
          setNoStore(true);
          setLoading(false);
          return;
        }
        // Service temporarily down — show error, don't redirect
        const msg =
          err?.response?.data?.message || err?.message || "Unknown error";
        setLoadError(
          `Could not load store data: ${msg}. Make sure all services are running.`,
        );
        setLoading(false);
        return;
      }

      // ── Role fix: if user is still 'user' role but has a store, upgrade ─
      // Calls store-service which then calls auth-service internally.
      if (!roleFixed.current && user?.role === "user" && token && ctx?.login) {
        roleFixed.current = true;
        try {
          const fixRes = await fetch(`${API}/api/stores/me/sync-role`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const fixData = await fixRes.json();
          if (fixData.success && fixData.data?.token) {
            ctx.login({ ...user, role: "store_owner" }, fixData.data.token);
          }
        } catch {
          /* non-fatal */
        }
      }

      // ── Step 2: load the rest (allSettled — one failure never blocks others) ─
      // Orders come from two places: OfferOrder (offers-service, placed via
      // the /nearby "Order Now" flow) and Order (order-service, placed via
      // Smart Order Comparison). Both are fetched and merged below.
      const [offRes, ordRes, smartOrdRes, prodRes, catRes] =
        await Promise.allSettled([
          offersApi.getByStore(s._id),
          offersApi.getStoreOrders(s._id, token),
          smartOrderApi.getStoreOrders(s._id, token),
          productApi.getByStore(s._id),
          productApi.getCategories(),
        ]);

      if (offRes.status === "fulfilled")
        setOffers(offRes.value.data.data || []);
      if (prodRes.status === "fulfilled")
        setProducts(prodRes.value.data.data || []);
      if (catRes.status === "fulfilled")
        setCategories(catRes.value.data.data || []);

      const offerOrders =
        ordRes.status === "fulfilled" ? ordRes.value.data.data || [] : [];
      const smartOrders =
        smartOrdRes.status === "fulfilled"
          ? (smartOrdRes.value.data.data || []).map(normalizeSmartOrder)
          : [];
      setOrders(
        [...offerOrders, ...smartOrders].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );

      // Surface any failures as a soft warning (not a redirect)
      const failed = [offRes, ordRes, prodRes, catRes].filter(
        (r) => r.status === "rejected",
      );
      if (failed.length) {
        const reasons = failed.map((r: any) => {
          const err = r.reason;
          if (!err?.response) return "service unreachable";
          return `${err.response.status}: ${err.response.data?.message || err.message}`;
        });
        setLoadError(
          `Some data could not be loaded — ${reasons.join(" | ")}. Try refreshing.`,
        );
      }
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user && !["store_owner", "user"].includes(user.role)) {
      router.push("/seller/dashboard");
    }
  }, [user, router]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#BBD5DA] border-t-[#FF0000] animate-spin" />
          <p className="text-gray-500 text-sm font-medium">
            Loading your store…
          </p>
        </div>
      </div>
    );

  if (noStore)
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#DFF1F1] flex items-center justify-center mx-auto mb-4">
            <Store size={26} className="text-teal-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-1">
            No store found
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Please create your store first.
          </p>
          <Link
            href="/store/register"
            className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Plus size={15} /> Create Your Store
          </Link>
        </div>
      </div>
    );

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;

  const recurringCustomers = buildCustomerInsights(orders).filter(
    (c: any) => c.isRecurring,
  ).length;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* ── Header ────────────────────────────────────────────────────────── */}
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
                <Store size={16} className="text-teal-600" />
              )}
            </div>
            <span className="text-sm font-bold text-gray-900 truncate hidden sm:block">
              {store?.name}
            </span>
            {store?.isVerified && (
              <CheckCircle size={14} className="text-teal-600 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* NotificationBell ships with dark-theme styling (built for the dark navbar) — wrap in a dark pill so it stays visible on this light header without touching the shared component. */}
            <div className="bg-gray-900 rounded-full">
              <NotificationBell />
            </div>
            <UserAvatarMenu theme="light" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* ── Sidebar tabs (desktop) ────────────────────────────────────── */}
          <aside className="hidden lg:block w-52 shrink-0">
            <nav className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden shadow-sm sticky top-24">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold border-l-4 transition text-left ${
                    tab === t.id
                      ? "bg-[#DFF1F1] text-teal-800 border-l-[#FF0000]"
                      : "text-gray-600 hover:bg-[#F5F5F5] border-l-transparent"
                  }`}
                >
                  <span
                    className={
                      tab === t.id ? "text-[#FF0000]" : "text-gray-400"
                    }
                  >
                    {t.icon}
                  </span>
                  {t.label}
                  {t.id === "orders" && pendingOrders > 0 && (
                    <span className="ml-auto bg-[#FF0000] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingOrders}
                    </span>
                  )}
                  {t.id === "customers" && recurringCustomers > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {recurringCustomers}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Main content ──────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Mobile tab menu */}
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
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#BBD5DA] rounded-xl shadow-lg z-30 overflow-hidden max-h-[70vh] overflow-y-auto">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTab(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-left transition ${
                          tab === t.id
                            ? "bg-[#DFF1F1] text-teal-800"
                            : "text-gray-600 hover:bg-[#F5F5F5]"
                        }`}
                      >
                        <span
                          className={
                            tab === t.id ? "text-[#FF0000]" : "text-gray-400"
                          }
                        >
                          {t.icon}
                        </span>
                        {t.label}
                        {t.id === "orders" && pendingOrders > 0 && (
                          <span className="ml-auto bg-[#FF0000] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {pendingOrders}
                          </span>
                        )}
                        {t.id === "customers" && recurringCustomers > 0 && (
                          <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {recurringCustomers}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Tab heading ───────────────────────────────────────────── */}
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

            {/* ── Load error banner ─────────────────────────────────────── */}
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

            {/* ── Panels ────────────────────────────────────────────────── */}
            {tab === "overview" && (
              <OverviewTab
                store={store}
                offers={offers}
                orders={orders}
                products={products}
                categories={categories}
                onTabSwitch={setTab}
              />
            )}
            {tab === "categories" && (
              <CategoriesTab
                categories={categories}
                products={products}
                token={token!}
                onRefresh={loadData}
              />
            )}
            {tab === "products" && (
              <ProductsTab
                products={products}
                categories={categories}
                storeId={store?._id}
                token={token!}
                onRefresh={loadData}
              />
            )}
            {tab === "orders" && (
              <OrdersTab orders={orders} token={token!} onRefresh={loadData} />
            )}
            {tab === "suppliers" && (
              <SuppliersTab
                token={token!}
                store={store}
                categories={categories}
              />
            )}
            {tab === "offers" && (
              <OffersTab offers={offers} token={token!} onRefresh={loadData} />
            )}
            {tab === "customers" && <CustomersTab orders={orders} />}
            {tab === "settings" && (
              <SettingsTab
                store={store}
                token={token!}
                onRefresh={loadData}
                categories={categories}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
