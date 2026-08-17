// /components-seller/dashboard/SellerProductsTab.tsx
"use client";
import { useState } from "react";
import { Plus, Trash2, Package, Search, Edit2, ScanLine, ListChecks, ArrowLeft } from "lucide-react";
import { groupSellerProductsByType, mergeCategories } from "./shared-utils";
import { SellerProductModal } from "./SellerProductModal";
import { SellerSmartUploadModal } from "./SellerSmartUploadModal";
import { SellerBulkSmartUploadModal } from "./SellerBulkSmartUploadModal";
import ConfirmModal from "../components-main/ConfirmModal";
import { productApi } from "../api-services/productApi";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function SellerProductsTab({
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

  const filtered = products.filter(
    (p: any) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || "").toLowerCase().includes(search.toLowerCase()),
  );

  const productTypes = groupSellerProductsByType(filtered);
  const selectedType =
    productTypes.find((t) => t.typeKey === selectedTypeKey) || null;

  // Brand-management view
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

  // Default view: product-type grid
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