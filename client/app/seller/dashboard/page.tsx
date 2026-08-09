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
import {
  Store,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  Edit2,
  Package,
  Settings,
  Search,
  X,
  AlertCircle,
  RefreshCw,
  ImageIcon,
  Save,
  Star,
  Truck,
  ScanLine,
  ListChecks,
  Sparkles,
  Upload,
  CheckCircle2,
  Mic,
  MicOff,
  BarChart2,
  QrCode,
  Menu,
  ChevronDown, Layers
} from "lucide-react";
import {
  useSpeechRecognition,
  VOICE_LANGUAGES,
  VoiceLanguageOption,
} from "../../hooks/useSpeechRecognition";
import { AuthContext } from "../../context/AuthContext";
import { storeApi } from "../../api-services/storeApi";
import { productApi } from "../../api-services/productApi";
import { orderApi } from "../../api-services/orderApi";
import UserAvatarMenu from "../../components-main/UserAvatarMenu";
import NotificationBell from "../../components-main/NotificationBell";
import SellerOverviewTab from "./SellerOverviewTab";
import { SellerOrder } from "./seller-analytics";
import TargetRevenueCard from "../../components-main/TargetRevenueCard";
import { indianStates, getCities } from "../../utils/indiaLocation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Tab = "overview" | "categories" | "products" | "orders" | "settings";

// Same list as DEFAULT_STORE_CATEGORIES in mobile's utils/storeCategories.ts —
// kept in sync so this dropdown matches the app.
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

// Merges the store's custom (backend-saved) categories with the built-in
// defaults, de-duplicated by name (case-insensitive) — custom entries win
// if a name collides, since they carry a real _id used for deletion.
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

const normalizeLoc = (value: string) => (value || "").trim().toLowerCase();

async function lookupPincode(cityName: string): Promise<string | null> {
  if (!cityName) return null;
  try {
    const res = await fetch(
      `https://api.postalpincode.in/postoffice/${encodeURIComponent(cityName)}`,
    );
    const data = await res.json();
    if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
      return data[0].PostOffice[0].Pincode || null;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
}

const ORDER_STATUSES = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;
const STATUS_STYLE: Record<string, string> = {
  Processing: "bg-amber-100 text-amber-700 border-amber-200",
  Shipped: "bg-blue-100 text-blue-700 border-blue-200",
  Delivered: "bg-green-100 text-green-700 border-green-200",
  Cancelled: "bg-red-100 text-[#FF0000] border-red-200",
};

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

type SellerScanForm = {
  title: string;
  category: string;
  price: string;
  discountedPrice: string;
  storePrice: string;
  storeDiscountedPrice: string;
  description: string;
  brand: string;
  imageUrl: string;
  totalStock: string;
  availability: string;
  tags: string;
  moq: string;
  bulkTiers: { minQty: string; price: string }[];
};

function groupSellerProductsByType(products: any[]) {
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

// Shared by SellerSmartUploadModal and SellerBulkSmartUploadModal — same
// field set as SellerProductModal's manual form (title, price, moq,
// bulkPricing tiers etc.), so scanned/voice-filled products get the same
// wholesale fields a manually-added product would.
async function createOneSellerProduct(
  form: SellerScanForm,
  storeId: string,
  token: string,
) {
  const disclaimer =
    "Note: Product image is for representation purposes only. Actual product may appear slightly different from what you see.";
  const description = [form.description, disclaimer]
    .filter(Boolean)
    .join("\n\n");
  const tags = form.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const validTiers = form.bulkTiers.filter((t) => t.minQty && t.price);

  const catList = await fetch(`${API}/api/categories`).then((r) => r.json());
  const existing = (catList.data || []).find(
    (c: any) => c.name.toLowerCase() === form.category.toLowerCase(),
  );
  if (!existing && form.category) {
    await fetch(`${API}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: form.category }),
    });
  }

  const isDataUri = form.imageUrl?.startsWith("data:");
  let productRes: Response;
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
    fd.append("title", form.title);
    fd.append("category", form.category);
    fd.append("price", form.price);
    fd.append(
      "discountedPrice",
      String(Number(form.discountedPrice) || Number(form.price)),
    );
    if (form.storePrice) fd.append("storePrice", String(Number(form.storePrice)));
    if (form.storeDiscountedPrice)
      fd.append(
        "storeDiscountedPrice",
        String(Number(form.storeDiscountedPrice)),
      );
    fd.append("description", description);
    fd.append("brand", form.brand);
    fd.append("storeId", storeId);
    fd.append("availability", form.availability);
    fd.append("totalStock", String(Number(form.totalStock) || 0));
    fd.append("moq", String(Number(form.moq) || 1));
    if (tags.length) fd.append("tags", JSON.stringify(tags));
    if (validTiers.length)
      fd.append(
        "bulkPricing",
        JSON.stringify(
          validTiers.map((t) => ({
            minQty: Number(t.minQty),
            price: Number(t.price),
          })),
        ),
      );
    productRes = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  } else {
    const imageUrl =
      form.imageUrl ||
      `https://loremflickr.com/400/400/${encodeURIComponent(form.title.split(" ").slice(0, 3).join(" "))}`;
    productRes = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: form.title,
        category: form.category,
        price: Number(form.price),
        discountedPrice: Number(form.discountedPrice) || Number(form.price),
        ...(form.storePrice ? { storePrice: Number(form.storePrice) } : {}),
        ...(form.storeDiscountedPrice
          ? { storeDiscountedPrice: Number(form.storeDiscountedPrice) }
          : {}),
        description,
        brand: form.brand,
        imageUrl,
        images: [imageUrl],
        storeId,
        availability: form.availability,
        tags,
        totalStock: Number(form.totalStock) || 0,
        moq: Number(form.moq) || 1,
        ...(validTiers.length
          ? {
              bulkPricing: validTiers.map((t) => ({
                minQty: Number(t.minQty),
                price: Number(t.price),
              })),
            }
          : {}),
      }),
    });
  }

  const data = await productRes.json();
  if (!data.success)
    throw new Error(data.message || "Failed to create product.");
  return data.data;
}

// ── Seller Product Modal (bulk-focused: MOQ + tiers, no scan flows) ──────────
function SellerProductModal({
  product,
  categories,
  storeId,
  token,
  isHomeBusiness,
  onClose,
  onSaved,
  initialTitle,
  initialCategory,
}: {
  product?: any;
  categories: any[];
  storeId: string;
  token: string;
  isHomeBusiness?: boolean;
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
    storePrice: product?.storePrice || "",
    storeDiscountedPrice: product?.storeDiscountedPrice || "",
    category: product?.category || initialCategory || "",
    brand: product?.brand || "",
    totalStock: product?.totalStock || "",
    availability: product?.availability || "In Stock",
    tags: product?.tags?.join(", ") || "",
    imageUrl: product?.imageUrl || "",
    moq: product?.moq || "1",
  });
  const [bulkTiers, setBulkTiers] = useState<
    { minQty: string; price: string }[]
  >(
    product?.bulkPricing?.map((t: any) => ({
      minQty: String(t.minQty),
      price: String(t.price),
    })) || [],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(
    product?.imageUrl ? `${API}${product.imageUrl}` : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const addTier = () => setBulkTiers((t) => [...t, { minQty: "", price: "" }]);
  const removeTier = (i: number) =>
    setBulkTiers((t) => t.filter((_, idx) => idx !== i));
  const setTier = (i: number, k: "minQty" | "price", v: string) =>
    setBulkTiers((t) =>
      t.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)),
    );

  const [voiceLang, setVoiceLang] = useState<VoiceLanguageOption>(
    VOICE_LANGUAGES[0],
  );
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [voiceError, setVoiceError] = useState("");

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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

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
      const validTiers = bulkTiers.filter((t) => t.minQty && t.price);
      if (validTiers.length) {
        fd.append(
          "bulkPricing",
          JSON.stringify(
            validTiers.map((t) => ({
              minQty: Number(t.minQty),
              price: Number(t.price),
            })),
          ),
        );
      }
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
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
            <Input
              label="Discounted Price (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.discountedPrice}
              onChange={(e) => set("discountedPrice", e.target.value)}
            />
            {isHomeBusiness && (
              <>
                <Input
                  label="Store Owner Price (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.storePrice}
                  onChange={(e) => set("storePrice", e.target.value)}
                  placeholder="Leave blank to use Price above"
                />
                <Input
                  label="Store Owner Discounted Price (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.storeDiscountedPrice}
                  onChange={(e) => set("storeDiscountedPrice", e.target.value)}
                  placeholder="Leave blank to use Discounted Price above"
                />
              </>
            )}
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
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
            />
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
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
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-[#F5F5F5] pt-4 space-y-3">
            <Input
              label="Minimum Order Quantity (MOQ) *"
              type="number"
              min="1"
              value={form.moq}
              onChange={(e) => set("moq", e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Bulk Pricing Tiers
              </label>
              <div className="space-y-2">
                {bulkTiers.map((t, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={t.minQty}
                      onChange={(e) => setTier(i, "minQty", e.target.value)}
                      placeholder="Min qty"
                      className="flex-1 bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                    <span className="text-gray-400 text-xs shrink-0">
                      units @ ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={t.price}
                      onChange={(e) => setTier(i, "price", e.target.value)}
                      placeholder="Price"
                      className="flex-1 bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="text-gray-400 hover:text-[#FF0000] shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTier}
                className="mt-2 text-xs text-teal-600 hover:underline font-medium"
              >
                + Add tier
              </button>
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

// ── Seller Smart Upload Modal (single scan) ──────────────────────────────────
type ScanStep = "idle" | "scanning" | "review" | "saving" | "done" | "error";

function SellerSmartUploadModal({
  storeId,
  token,
  isHomeBusiness,
  onClose,
  onCreated,
}: {
  storeId: string;
  token: string;
  isHomeBusiness?: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [step, setStep] = useState<ScanStep>("idle");
  const [errMsg, setErrMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [engine, setEngine] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<SellerScanForm>({
    title: "",
    category: "",
    price: "",
    discountedPrice: "",
    storePrice: "",
    storeDiscountedPrice: "",
    description: "",
    brand: "",
    imageUrl: "",
    totalStock: "",
    availability: "In Stock",
    tags: "",
    moq: "1",
    bulkTiers: [],
  });
  const setF = (k: keyof SellerScanForm, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));
  const addTier = () =>
    setForm((f) => ({
      ...f,
      bulkTiers: [...f.bulkTiers, { minQty: "", price: "" }],
    }));
  const removeTier = (i: number) =>
    setForm((f) => ({
      ...f,
      bulkTiers: f.bulkTiers.filter((_, idx) => idx !== i),
    }));
  const setTier = (i: number, k: "minQty" | "price", v: string) =>
    setForm((f) => ({
      ...f,
      bulkTiers: f.bulkTiers.map((row, idx) =>
        idx === i ? { ...row, [k]: v } : row,
      ),
    }));

  const reset = () => {
    setFile(null);
    setPreview("");
    setStep("idle");
    setErrMsg("");
    setEngine("");
    setForm({
      title: "",
      category: "",
      price: "",
      discountedPrice: "",
      storePrice: "",
      storeDiscountedPrice: "",
      description: "",
      brand: "",
      imageUrl: "",
      totalStock: "",
      availability: "In Stock",
      tags: "",
      moq: "1",
      bulkTiers: [],
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
      setForm({
        title: x.productName || "",
        category: x.category || "",
        price: String(x.price || ""),
        discountedPrice: String(x.discountedPrice || x.price || ""),
        storePrice: String(x.storePrice || ""),
        storeDiscountedPrice: String(x.storeDiscountedPrice || ""),
        description: x.description || "",
        brand: x.brand || "",
        imageUrl: x.imageUrl || "",
        totalStock: "",
        availability: "In Stock",
        tags: "",
        moq: "1",
        bulkTiers: [],
      });
      setStep("review");
    } catch (err: any) {
      setErrMsg(err.message || "Something went wrong.");
      setStep("error");
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.price) return;
    setStep("saving");
    try {
      await createOneSellerProduct(form, storeId, token);
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
                  <p className="text-sm font-semibold text-teal-800">
                    Reading your paper…
                  </p>
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

              <div className="flex gap-3 items-start">
                <div className="w-20 h-20 rounded-xl border border-[#BBD5DA] bg-[#F5F5F5] overflow-hidden shrink-0">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-gray-300" />
                    </div>
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
                  Product Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setF("title", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. HP Laptop 15s"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Price (₹) *
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
                    Discounted Price (₹)
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
              {isHomeBusiness && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Store Owner Price (₹)
                    </label>
                    <input
                      type="number"
                      value={form.storePrice}
                      onChange={(e) => setF("storePrice", e.target.value)}
                      className={inputCls}
                      placeholder="Leave blank to use Price"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Store Owner Discounted Price (₹)
                    </label>
                    <input
                      type="number"
                      value={form.storeDiscountedPrice}
                      onChange={(e) => setF("storeDiscountedPrice", e.target.value)}
                      className={inputCls}
                      placeholder="Leave blank to use Discounted Price"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    value={form.category}
                    onChange={(e) => setF("category", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <input
                    value={form.brand}
                    onChange={(e) => setF("brand", e.target.value)}
                    className={inputCls}
                  />
                </div>
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
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="border-t border-[#F5F5F5] pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Minimum Order Quantity (MOQ) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.moq}
                    onChange={(e) => setF("moq", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Bulk Pricing Tiers
                  </label>
                  <div className="space-y-2">
                    {form.bulkTiers.map((t, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          value={t.minQty}
                          onChange={(e) => setTier(i, "minQty", e.target.value)}
                          placeholder="Min qty"
                          className={`${inputCls} flex-1`}
                        />
                        <span className="text-gray-400 text-xs shrink-0">
                          units @ ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={t.price}
                          onChange={(e) => setTier(i, "price", e.target.value)}
                          placeholder="Price"
                          className={`${inputCls} flex-1`}
                        />
                        <button
                          type="button"
                          onClick={() => removeTier(i)}
                          className="text-gray-400 hover:text-[#FF0000] shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addTier}
                    className="mt-2 text-xs text-teal-600 hover:underline font-medium"
                  >
                    + Add tier
                  </button>
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
                  disabled={!form.title || !form.price || step === "saving"}
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

          {step === "done" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-600" />
                </div>
                <p className="font-bold text-gray-900">
                  Product created successfully!
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

// ── Seller Bulk Smart Upload Modal (bulk scan) ────────────────────────────────
type BulkStep = "idle" | "scanning" | "review" | "saving" | "done" | "error";
type SellerBulkRow = SellerScanForm & { id: string };

function SellerBulkSmartUploadModal({
  storeId,
  token,
  isHomeBusiness,
  onClose,
  onCreated,
}: {
  storeId: string;
  token: string;
  isHomeBusiness?: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [step, setStep] = useState<BulkStep>("idle");
  const [errMsg, setErrMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<SellerBulkRow[]>([]);
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
    setRows([]);
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

  const setRow = (id: string, k: keyof SellerScanForm, v: any) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const removeRow = (id: string) =>
    setRows((rs) => rs.filter((r) => r.id !== id));
  const addManually = (name: string) => {
    setRows((rs) => [
      ...rs,
      {
        id: `${Date.now()}-${Math.random()}`,
        title: name,
        category: "",
        price: "",
        discountedPrice: "",
        storePrice: "",
        storeDiscountedPrice: "",
        description: "",
        brand: "",
        imageUrl: "",
        totalStock: "",
        availability: "In Stock",
        tags: "",
        moq: "1",
        bulkTiers: [],
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
      const newRows: SellerBulkRow[] = (data.products || []).map(
        (p: any, i: number) => ({
          id: `${Date.now()}-${i}`,
          title: p.productName || "",
          category: p.category || "",
          price: "",
          discountedPrice: "",
          storePrice: "",
          storeDiscountedPrice: "",
          description: p.description || "",
          brand: p.brand || "",
          imageUrl: p.imageUrl || "",
          totalStock: "",
          availability: "In Stock",
          tags: "",
          moq: "1",
          bulkTiers: [],
        }),
      );
      setRows(newRows);
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
    for (const row of rows) {
      if (!row.title || !row.price) {
        failed.push({
          name: row.title || "(unnamed)",
          reason: "Missing name or price.",
        });
        continue;
      }
      try {
        await createOneSellerProduct(row, storeId, token);
        added++;
      } catch (err: any) {
        failed.push({
          name: row.title,
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
              Scan Product List & Add Products
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
                        Drop a product list, invoice or catalog sheet
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        or click to browse — JPG, PNG, WEBP
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
                  <p className="text-sm font-semibold text-teal-800">
                    Reading your list…
                  </p>
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

          {(step === "review" || step === "saving") && (
            <>
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                <p className="text-xs font-semibold text-teal-800 flex-1">
                  {rows.length} product{rows.length === 1 ? "" : "s"} detected —
                  review, set price/MOQ, then add all
                </p>
              </div>

              <div className="space-y-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="border border-[#BBD5DA] rounded-xl p-3 flex gap-3"
                  >
                    <div className="relative w-16 h-16 rounded-lg border border-[#BBD5DA] bg-[#F5F5F5] overflow-hidden shrink-0">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt={row.title}
                          className="w-full h-full object-cover"
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
                          value={row.title}
                          onChange={(e) =>
                            setRow(row.id, "title", e.target.value)
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
                          placeholder="Price ₹ *"
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
                        <input
                          type="number"
                          value={row.moq}
                          onChange={(e) =>
                            setRow(row.id, "moq", e.target.value)
                          }
                          className={inputCls}
                          placeholder="MOQ"
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
                    </div>
                  </div>
                ))}
                {rows.length === 0 && (
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
                  disabled={rows.length === 0 || step === "saving"}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
                >
                  {step === "saving" ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Adding…
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Add All Products ({rows.length})
                    </>
                  )}
                </button>
              </div>
            </>
          )}

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
  PAID: "text-green-600 bg-green-50 border-green-200",
  FAILED: "text-[#FF0000] bg-red-50 border-red-200",
};

// ── Products Tab ──────────────────────────────────────────────────────────────
function SellerProductsTab({
  products,
  categories,
  storeId,
  token,
  sellerRole,
  onRefresh,
}: any) {
  const isHomeBusiness = sellerRole === "home_business";
  const [search, setSearch] = useState("");
  const [editProd, setEditProd] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showBulkScan, setShowBulkScan] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedTypeKey, setSelectedTypeKey] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await productApi.delete(id, token);
      onRefresh();
    } catch {
      alert("Failed to delete product.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter(
    (p: any) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || "").toLowerCase().includes(search.toLowerCase()),
  );

  const productTypes = groupSellerProductsByType(filtered);
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
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    MOQ: {p.moq || 1} · {p.bulkPricing?.length || 0} tier
                    {p.bulkPricing?.length === 1 ? "" : "s"}
                  </p>
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
                    onClick={() => handleDelete(p._id)}
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
          <SellerProductModal
            product={editProd}
            categories={categories}
            storeId={storeId}
            token={token}
            isHomeBusiness={isHomeBusiness}
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
      </div>
    );
  }

  // ── Default view: product-type grid ─────────────────────────────────────
  return (
    <div>
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
            {products.length === 0 ? "No products yet" : "No results"}
          </p>
          <p className="text-gray-400 text-sm mb-5">
            {products.length === 0
              ? "Add your first bulk product for store owners to order."
              : "Try a different search."}
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
                  <button
                    onClick={() => setSelectedTypeKey(pt.typeKey)}
                    className="w-full mt-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition"
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
        <SellerProductModal
          product={editProd}
          categories={categories}
          storeId={storeId}
          token={token}
          isHomeBusiness={isHomeBusiness}
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
        <SellerSmartUploadModal
          storeId={storeId}
          token={token}
          isHomeBusiness={isHomeBusiness}
          onClose={() => setShowScan(false)}
          onCreated={onRefresh}
        />
      )}
      {showBulkScan && (
        <SellerBulkSmartUploadModal
          storeId={storeId}
          token={token}
          isHomeBusiness={isHomeBusiness}
          onClose={() => setShowBulkScan(false)}
          onCreated={onRefresh}
        />
      )}
    </div>
  );
}

// ── Category Tab ──────────────────────────────────────────────────────────────
function SellerCategoriesTab({ categories, products, token, onRefresh }: any) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const countByCategory: Record<string, number> = (products || []).reduce(
    (acc: Record<string, number>, p: any) => {
      if (p.category) acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    },
    {},
  );

  const mergedCategories = mergeCategories(categories || []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to create category.");
      setName("");
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to create category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Delete category "${catName}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to delete category.");
      onRefresh();
    } catch {
      alert("Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm mb-5"
      >
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Add New Category
        </h3>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Skincare"
            className="flex-1 bg-white border border-[#BBD5DA] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-11 flex items-center justify-center bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white rounded-xl transition shrink-0"
          >
            {saving ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
          </button>
        </div>
        {error && <p className="text-xs text-[#FF0000] mt-2">{error}</p>}
      </form>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
        All Categories ({mergedCategories.length})
      </p>

      <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
        {mergedCategories.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">
            No categories yet. Add one above.
          </p>
        ) : (
          mergedCategories.map((c, idx) => {
            const count = countByCategory[c.name] || 0;
            return (
              <div
                key={c._id}
                className={`flex items-center gap-3 px-5 py-4 ${idx !== 0 ? "border-t border-[#F5F5F5]" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#DFF1F1] flex items-center justify-center shrink-0">
                  <Layers size={14} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {c.name}
                    </p>
                    {c.isDefault && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5F5F5] text-gray-500">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFF1F1] border border-[#BBD5DA] text-teal-700">
                    {count} product{count !== 1 ? "s" : ""}
                  </span>
                </div>
                {!c.isDefault && (
                  <button
                    onClick={() => handleDelete(c._id, c.name)}
                    disabled={deletingId === c._id}
                    className="text-gray-400 hover:text-[#FF0000] hover:bg-red-50 p-2 rounded-lg transition shrink-0 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Incoming Orders Tab ─────────────────────────────────────────────────────
function IncomingOrdersTab({ orders, token, onRefresh }: any) {
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      // Uses the same order-service internal-facing status update your admin panel already relies on
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
    (o: any) => filter === "all" || o.orderStatus === filter,
  );
  const counts: Record<string, number> = { all: orders.length };
  ORDER_STATUSES.forEach((s) => {
    counts[s] = orders.filter((o: any) => o.orderStatus === s).length;
  });

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
          {filtered.map((o: any) => (
            <div
              key={o._id}
              className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-900">{o.orderId}</p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.orderStatus] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      {o.orderStatus}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{o.contactEmail}</p>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {o.items?.map((it: any, i: number) => (
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
    </div>
  );
}

// ── Settings Tab (trimmed — no UPI/QR, since that's a store-owner-only concept here; swap in full SettingsTab if you want parity) ──
function SellerSettingsTab({ store, token, onRefresh, categories }: any) {
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
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const [upiId, setUpiId] = useState(store?.upiId || "");
  const [fssai, setFssai] = useState(store?.fssai || "");
  const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const upiError =
    upiId.trim() && !UPI_ID_REGEX.test(upiId.trim())
      ? "Invalid UPI ID format (expected e.g. name@bank)."
      : "";

  const categoryOptions = useMemo(
    () =>
      mergeCategories(categories || []).map((c) => ({
        key: c.name,
        label: c.name,
      })),
    [categories],
  );

  const stateOptions = useMemo(
    () => indianStates.map((s: any) => ({ key: s.isoCode, label: s.name })),
    [],
  );

  const findState = useCallback((value: string) => {
    const v = normalizeLoc(value);
    if (!v) return undefined;
    return indianStates.find(
      (s: any) => normalizeLoc(s.name) === v || normalizeLoc(s.isoCode) === v,
    );
  }, []);

  const [cities, setCities] = useState<any[]>([]);
  useEffect(() => {
    if (!form.state) {
      setCities([]);
      return;
    }
    const state = findState(form.state);
    setCities(state ? getCities(state.isoCode) : []);
  }, [form.state, findState]);

  const cityOptions = useMemo(
    () => cities.map((c: any) => ({ key: c.name, label: c.name })),
    [cities],
  );

  const handleStateSelect = (isoCode: string) => {
    const label = stateOptions.find((s) => s.key === isoCode)?.label || "";
    setForm((f) => ({ ...f, state: label, city: "", pinCode: "" }));
    setCities(getCities(isoCode));
  };

  const handleCitySelect = async (cityName: string) => {
    set("city", cityName);
    if (!cityName) return;
    const pin = await lookupPincode(cityName);
    if (pin) set("pinCode", pin);
  };

  const isFoodCategory = form.category === "Food & Beverages";

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
          Business Profile
        </h3>
        {error && (
          <p className="text-sm text-[#FF0000] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Business Name *"
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
              placeholder="e.g. 50000"
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
              <option key={c.key} value={c.key}>
                {c.label}
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
            label="State"
            value={findState(form.state)?.isoCode || ""}
            onChange={(e) => handleStateSelect(e.target.value)}
          >
            <option value="">Select State</option>
            {stateOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>

          <Select
            label="City"
            value={form.city}
            onChange={(e) => handleCitySelect(e.target.value)}
            disabled={!form.state}
          >
            <option value="">
              {form.state ? "Select City" : "Select state first"}
            </option>
            {cityOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        {/* UPI Payment QR Code */}
        <div className="pt-2 border-t border-[#F5F5F5]">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            UPI Payment QR Code
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Enter your UPI ID to generate a scannable QR code for order
            payments.
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
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart2 size={15} /> },
  { id: "categories", label: "Categories", icon: <Layers size={15} /> },
  { id: "products", label: "Products", icon: <Package size={15} /> },
  { id: "orders", label: "Incoming Orders", icon: <ShoppingBag size={15} /> },
  { id: "settings", label: "Settings", icon: <Settings size={15} /> },
];

// ── Main Seller Dashboard ─────────────────────────────────────────────────────
export default function SellerDashboard() {
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

  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [noStore, setNoStore] = useState(false);
  const [storeNameByOwnerId, setStoreNameByOwnerId] = useState<
    Record<string, string>
  >({});

  // Role guard — only whole_saler / home_business belong here
  useEffect(() => {
    if (user && !["whole_saler", "home_business"].includes(user.role)) {
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
        setLoadError(
          `Could not load business data: ${err?.response?.data?.message || err?.message || "Unknown error"}.`,
        );
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

      if (prodRes.status === "fulfilled")
        setProducts(prodRes.value.data.data || []);
      if (catRes.status === "fulfilled")
        setCategories(catRes.value.data.data || []);

      let loadedOrders: any[] = [];
      if (ordRes.status === "fulfilled") {
        loadedOrders = (ordRes.value as any).data || [];
        setOrders(loadedOrders);
      }

      // Resolve buyerId -> store name using only the owners this seller
      // actually sold to (GET /api/stores is admin-only, so it can't be
      // used here — see storeApi.getStoresByOwnerIds instead).
      const ownerIds = Array.from(
        new Set(loadedOrders.map((o: any) => o.buyerId).filter(Boolean)),
      );
      if (ownerIds.length) {
        try {
          const storesRes = await storeApi.getStoresByOwnerIds(ownerIds, token);
          const map: Record<string, string> = {};
          (storesRes.data.data || []).forEach((st: any) => {
            map[st.ownerId] = st.name;
          });
          setStoreNameByOwnerId(map);
        } catch {
          /* non-fatal — buyers just show as "Unknown Store" */
        }
      }

      const failed = [prodRes, catRes, ordRes].filter(
        (r) => r.status === "rejected",
      );
      if (failed.length)
        setLoadError("Some data could not be loaded. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#BBD5DA] border-t-[#FF0000] animate-spin" />
          <p className="text-gray-500 text-sm font-medium">
            Loading your business…
          </p>
        </div>
      </div>
    );

  if (noStore)
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#DFF1F1] flex items-center justify-center mx-auto mb-4">
            <Truck size={26} className="text-teal-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-1">
            No business profile found
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Please register your business first.
          </p>
          <Link
            href="/store/register"
            className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Plus size={15} /> Register Business
          </Link>
        </div>
      </div>
    );

  const pendingCount = orders.filter(
    (o) => o.orderStatus === "Processing",
  ).length;

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
              {store?.storeType === "whole_saler"
                ? "Wholesaler"
                : "Home Business"}
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
                  {t.id === "orders" && pendingCount > 0 && (
                    <span className="ml-auto bg-[#FF0000] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingCount}
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
                        {t.id === "orders" && pendingCount > 0 && (
                          <span className="ml-auto bg-[#FF0000] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {pendingCount}
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

            {tab === "overview" && (
              <SellerOverviewTab
                orders={orders as SellerOrder[]}
                products={products}
                storeNameByOwnerId={storeNameByOwnerId}
                store={store}
                onGoToSettings={() => setTab("settings")}
              />
            )}
            {tab === "categories" && (
              <SellerCategoriesTab
                categories={categories}
                products={products}
                token={token!}
                onRefresh={loadData}
              />
            )}
            {tab === "products" && (
              <SellerProductsTab
                products={products}
                categories={categories}
                storeId={store?._id}
                token={token!}
                sellerRole={user?.role}
                onRefresh={loadData}
              />
            )}
            {tab === "orders" && (
              <IncomingOrdersTab
                orders={orders}
                token={token!}
                onRefresh={loadData}
              />
            )}
            {tab === "settings" && (
              <SellerSettingsTab
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