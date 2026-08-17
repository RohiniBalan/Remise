// /components-seller/dashboard/SellerBulkSmartUploadModal.tsx
"use client";
import { useState, useRef } from "react";
import { X, ListChecks, Upload, Sparkles, RefreshCw, CheckCircle2, AlertCircle, ImageIcon, Plus, Camera, Trash2 } from "lucide-react";
import { createOneSellerProduct, SellerBulkRow, SellerScanForm } from "./shared-utils";

type BulkStep = "idle" | "scanning" | "review" | "saving" | "done" | "error";

export function SellerBulkSmartUploadModal({
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
  const [failedItems, setFailedItems] = useState<{ name: string; reason: string }[]>([]);
  const [summary, setSummary] = useState<{
    added: number;
    failed: { name: string; reason: string }[];
  }>({ added: 0, failed: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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