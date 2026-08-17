// /components-seller/dashboard/SellerProductModal.tsx
"use client";
import { useState, useCallback } from "react";
import { X, ImageIcon, RefreshCw, Save, Trash2, AlertCircle, Mic, MicOff } from "lucide-react";
import { Input, TextArea, Select } from "./FormComponents";
import { mergeCategories, createOneSellerProduct } from "./shared-utils";
import { useSpeechRecognition, VOICE_LANGUAGES, VoiceLanguageOption } from "../hooks/useSpeechRecognition";
import { productApi } from "../api-services/productApi";

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
    brand: product?.brand || "",
    totalStock: product?.totalStock || "",
    availability: product?.availability || "In Stock",
    tags: product?.tags?.join(", ") || "",
    imageUrl: product?.imageUrl || "",
    moq: product?.moq || "1",
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
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
                    <RefreshCw size={14} className="animate-spin" /> Understanding…
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
                Voice input isn't supported in this browser — try Chrome or Edge.
              </p>
            )}
            {voice.listening && (
              <p className="text-xs text-teal-700">
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Product Image
            </label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[#BBD5DA] bg-[#F5F5F5] flex items-center justify-center overflow-hidden shrink-0">
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
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
              {mergeCategories(categories || []).map((c) => (
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