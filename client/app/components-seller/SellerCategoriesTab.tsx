// /components-seller/dashboard/SellerCategoriesTab.tsx
"use client";
import { useState } from "react";
import { Plus, RefreshCw, Layers, Trash2 } from "lucide-react";
import { mergeCategories } from "./shared-utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function SellerCategoriesTab({ categories, products, token, onRefresh }: any) {
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
    <div className="max-w-2xl w-full space-y-4">
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl border border-[#BBD5DA] p-4 sm:p-5 shadow-sm mb-4 sm:mb-5"
      >
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Add New Category
        </h3>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Skincare"
            className="flex-1 min-w-0 w-full bg-white border border-[#BBD5DA] rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-10 sm:w-11 flex items-center justify-center bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white rounded-xl transition shrink-0"
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
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
                className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3 sm:py-4 ${idx !== 0 ? "border-t border-[#F5F5F5]" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#DFF1F1] flex items-center justify-center shrink-0">
                  <Layers size={14} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {c.name}
                    </p>
                    {c.isDefault && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5F5F5] text-gray-500 shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFF1F1] border border-[#BBD5DA] text-teal-700 whitespace-nowrap">
                    {count} product{count !== 1 ? "s" : ""}
                  </span>
                </div>
                {!c.isDefault && (
                  <button
                    onClick={() => handleDelete(c._id, c.name)}
                    disabled={deletingId === c._id}
                    className="text-gray-400 hover:text-[#FF0000] hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition shrink-0 disabled:opacity-50 ml-1"
                  >
                    <Trash2 size={14} />
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