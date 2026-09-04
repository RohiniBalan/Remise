// /components-seller/dashboard/SellerProductModal.tsx
"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  X,
  ImageIcon,
  RefreshCw,
  Save,
  Trash2,
  AlertCircle,
  Mic,
  MicOff,
  Sparkles,
  Layers,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { Input, TextArea, Select } from "./FormComponents";
import { mergeCategories } from "./shared-utils";
import {
  useSpeechRecognition,
  VOICE_LANGUAGES,
  VoiceLanguageOption,
} from "../hooks/useSpeechRecognition";
import { productApi } from "../api-services/productApi";
import {
  getCategories,
  getSubcategories,
  getCategoryAttributes,
  normalizeSpecifications,
} from "../utils/categoryAttributes";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function SellerProductModal({
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
    subcategory: product?.subcategory || "",
    brand: product?.brand || "",
    totalStock: product?.totalStock || "",
    availability: product?.availability || "In Stock",
    tags: product?.tags?.join(", ") || "",
    imageUrl: product?.imageUrl || "",
    moq: product?.moq || "1",
  });

  // Dynamic product attributes (e.g. { ram: "8GB", storage: "256GB", netWeight: "1kg" })
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, string>>(() => {
    if (product?.attributes) {
      if (typeof product.attributes === "object") return { ...product.attributes };
    }
    // Fallback: extract from specifications array if present
    if (Array.isArray(product?.specifications)) {
      const init: Record<string, string> = {};
      product.specifications.forEach((s: any) => {
        if (s?.label && s?.value) init[s.label] = s.value;
      });
      return init;
    }
    return {};
  });

  const [bulkTiers, setBulkTiers] = useState<{ minQty: string; price: string }[]>(
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
  const [aiAutofilling, setAiAutofilling] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Dynamic Category & Subcategory options
  const categoryOptions = useMemo(() => {
    const predefined = getCategories();
    const dynamic = (categories || []).map((c) => c.name).filter(Boolean);
    return Array.from(new Set([...predefined, ...dynamic]));
  }, [categories]);

  const subcategoryOptions = useMemo(() => {
    return getSubcategories(form.category);
  }, [form.category]);

  // Dynamic attribute schema fields for current category & subcategory
  const dynamicFields = useMemo(() => {
    return getCategoryAttributes(form.category, form.subcategory);
  }, [form.category, form.subcategory]);

  const handleCategoryChange = (newCategory: string) => {
    setForm((f) => ({
      ...f,
      category: newCategory,
      subcategory: "", // Reset subcategory when category changes
    }));
  };

  const handleSubcategoryChange = (newSubcategory: string) => {
    setForm((f) => ({ ...f, subcategory: newSubcategory }));
  };

  const handleAttributeChange = (key: string, value: string) => {
    setDynamicAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const addTier = () => setBulkTiers((t) => [...t, { minQty: "", price: "" }]);
  const removeTier = (i: number) =>
    setBulkTiers((t) => t.filter((_, idx) => idx !== i));
  const setTier = (i: number, k: "minQty" | "price", v: string) =>
    setBulkTiers((t) =>
      t.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)),
    );

  // ── Voice Input Support ──────────────────────────────────────────────────
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
          throw new Error(data.message || "Could not understand voice input.");
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
      } catch (err: any) {
        setVoiceError(err.message || "Could not understand that.");
      } finally {
        setVoiceParsing(false);
      }
    },
    [voiceLang],
  );

  const voice = useSpeechRecognition(handleVoiceResult);

  // ── AI Auto-Fill Functionality ─────────────────────────────────────────────
  const handleAiAutoFill = async (fileToScan?: File) => {
    const targetFile = fileToScan || imageFile;
    if (!targetFile) {
      // Trigger hidden file picker
      const input = document.getElementById("ai-autofill-file-input") as HTMLInputElement;
      if (input) input.click();
      return;
    }

    setAiAutofilling(true);
    setAiSuccessMsg("");
    setError("");

    try {
      const fd = new FormData();
      fd.append("image", targetFile);

      const res = await fetch("/api/smart-product-upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Could not detect product details.");
      }

      const ext = data.extracted;

      // Update form state with detected data
      setForm((f) => ({
        ...f,
        title: ext.productName || f.title,
        category: ext.category || f.category,
        subcategory: ext.subcategory || f.subcategory,
        brand: ext.brand || f.brand,
        price: ext.price ? String(ext.price) : f.price,
        discountedPrice: ext.discountedPrice ? String(ext.discountedPrice) : f.discountedPrice,
        description: ext.description || f.description,
      }));

      // Update dynamic attributes if returned by AI
      if (ext.attributes && typeof ext.attributes === "object") {
        setDynamicAttributes((prev) => ({
          ...prev,
          ...ext.attributes,
        }));
      }

      if (ext.imageUrl && !imageFile) {
        setPreview(ext.imageUrl);
        set("imageUrl", ext.imageUrl);
      }

      setAiSuccessMsg("✨ Product details detected & auto-filled! Please review and edit before saving.");
    } catch (err: any) {
      setError(err.message || "AI auto-fill failed. Please enter details manually.");
    } finally {
      setAiAutofilling(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAiFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
    handleAiAutoFill(f);
  };

  // ── Submit Handler ─────────────────────────────────────────────────────────
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

      // Clean specifications array & attributes object
      const cleanSpecs = normalizeSpecifications(
        dynamicAttributes,
        [],
        form.category,
        form.subcategory,
      );
      fd.append("specifications", JSON.stringify(cleanSpecs));
      fd.append("attributes", JSON.stringify(dynamicAttributes));

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
        ? await productApi.update(product._id || product.id, fd, token)
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
        className="bg-white rounded-2xl border border-[#BBD5DA] w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#BBD5DA] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isEdit ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-xs text-gray-500">
                Manage product details, category specs, pricing, and stock.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="text-sm text-[#FF0000] bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {aiSuccessMsg && (
            <div className="text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
              <span>{aiSuccessMsg}</span>
            </div>
          )}

          {/* AI Auto-Fill Banner & Quick Actions */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <Sparkles size={16} className="text-teal-600" />
                <span>✨ Auto-fill Product Details</span>
              </div>
              <p className="text-xs text-teal-700 mt-0.5">
                Scan product photo/label to auto-detect Title, Category, Subcategory, Price & Specs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ai-autofill-file-input"
                type="file"
                accept="image/*"
                onChange={handleAiFileInput}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => handleAiAutoFill()}
                disabled={aiAutofilling}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                {aiAutofilling ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Scanning with AI…
                  </>
                ) : (
                  <>
                    <Sparkles size={13} /> {imageFile ? "Auto-fill from current image" : "Upload image & Auto-fill"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Voice Input Section */}
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 mr-1">Voice:</span>
                {VOICE_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setVoiceLang(l)}
                    disabled={voice.listening || voiceParsing}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition disabled:opacity-50 ${
                      voiceLang.code === l.code
                        ? "bg-teal-600 text-white"
                        : "bg-white text-gray-600 border border-gray-200"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 ${
                  voice.listening
                    ? "bg-[#FF0000] text-white"
                    : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {voiceParsing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Processing…
                  </>
                ) : voice.listening ? (
                  <>
                    <MicOff size={13} /> Stop
                  </>
                ) : (
                  <>
                    <Mic size={13} /> Speak details
                  </>
                )}
              </button>
            </div>
            {voice.listening && (
              <p className="text-xs text-teal-700 font-medium">
                Listening… "{voice.interimTranscript || voice.transcript || "…"}"
              </p>
            )}
            {(voice.error || voiceError) && (
              <p className="text-xs text-[#FF0000] flex items-center gap-1">
                <AlertCircle size={11} />
                {voice.error || voiceError}
              </p>
            )}
          </div>

          {/* Image upload section */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Product Image
            </label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#BBD5DA] bg-[#F9FAFB] flex items-center justify-center overflow-hidden shrink-0">
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-white border border-[#BBD5DA] rounded-xl text-xs font-semibold text-gray-700 hover:bg-[#F5F5F5] transition w-fit shadow-sm">
                  <ImageIcon size={14} /> Choose Image File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="hidden"
                  />
                </label>
                <Input
                  label=""
                  placeholder="Or paste external image URL"
                  value={form.imageUrl}
                  onChange={(e) => {
                    set("imageUrl", e.target.value);
                    if (!imageFile) setPreview(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Core Basic Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Product Title *"
                placeholder="e.g. Organic Face Moisturizer / Galaxy S24 Ultra"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <TextArea
                label="Description"
                placeholder="Provide a compelling description with key highlights, features, and benefits..."
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
              placeholder="Leave empty or same as Price"
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

            {/* Category Field */}
            <Select
              label="Category *"
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Select Category</option>
              {categoryOptions.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </Select>

            {/* Subcategory Field (Dependent on Category) */}
            <Select
              label="Subcategory"
              value={form.subcategory}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              disabled={!form.category || subcategoryOptions.length === 0}
            >
              <option value="">
                {!form.category
                  ? "Select Category first"
                  : subcategoryOptions.length === 0
                  ? "No subcategories available"
                  : "Select Subcategory"}
              </option>
              {subcategoryOptions.map((subName) => (
                <option key={subName} value={subName}>
                  {subName}
                </option>
              ))}
            </Select>

            <Input
              label="Brand"
              placeholder="e.g. Apple, Organic India, Nestle"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
            />

            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              placeholder="e.g. 50"
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

            <Input
              label="Tags (comma-separated)"
              placeholder="e.g. bestseller, trending, fast-delivery"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </div>

          {/* Dynamic Specifications & Product Details Section */}
          {form.category && dynamicFields.length > 0 && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {form.subcategory || form.category} Specifications & Details
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  Dynamic Fields
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {dynamicFields.map((field) => (
                  <div key={field.key} className={field.key === "ingredients" || field.key === "safetyInformation" || field.key === "benefits" ? "sm:col-span-2" : ""}>
                    <Input
                      label={field.label}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      value={dynamicAttributes[field.key] || ""}
                      onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wholesale / Bulk Pricing & MOQ */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <Input
              label="Minimum Order Quantity (MOQ) *"
              type="number"
              min="1"
              value={form.moq}
              onChange={(e) => set("moq", e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Bulk Pricing Tiers (Optional)
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
                      className="flex-1 bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500 transition"
                    />
                    <span className="text-gray-400 text-xs shrink-0 font-medium">
                      units @ ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={t.price}
                      onChange={(e) => setTier(i, "price", e.target.value)}
                      placeholder="Price"
                      className="flex-1 bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="text-gray-400 hover:text-[#FF0000] p-1.5 rounded-lg transition shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTier}
                className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
              >
                + Add Bulk Price Tier
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving || aiAutofilling}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FF0000] hover:bg-[#e00000] active:bg-[#cc0000] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-sm"
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Saving Product…
                </>
              ) : (
                <>
                  <Save size={15} /> {isEdit ? "Save Changes" : "Publish Product"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold rounded-xl text-sm transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}