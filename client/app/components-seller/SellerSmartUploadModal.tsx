// /components-seller/dashboard/SellerSmartUploadModal.tsx
"use client";
import { useState, useRef } from "react";
import { X, ScanLine, Upload, Sparkles, RefreshCw, CheckCircle2, AlertCircle, ImageIcon, Plus, Camera, Trash2 } from "lucide-react";
import { createOneSellerProduct, SellerScanForm } from "./shared-utils";

type ScanStep = "idle" | "scanning" | "review" | "saving" | "done" | "error";

export function SellerSmartUploadModal({
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
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {(step === "idle" || step === "scanning" || step === "error") && (
            <>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickFile(f);
                }}
              />
              {!preview && (
                <div className="grid grid-cols-1 sm:hidden gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-[#FF0000] hover:bg-[#e00000] text-white text-sm font-semibold px-4 py-3 rounded-xl transition"
                  >
                    <Camera size={16} /> Take Photo
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-[#BBD5DA]" />
                    <span className="text-[11px] font-medium text-gray-400">
                      or
                    </span>
                    <div className="flex-1 h-px bg-[#BBD5DA]" />
                  </div>
                </div>
              )}
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

              {/* Form fields - same as SellerProductModal but simplified */}
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
                      onChange={(e) =>
                        setF("storeDiscountedPrice", e.target.value)
                      }
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