'use client';

import { useState } from 'react';
import { X, Package, Star, MapPin, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GroupedSupplier {
  productId: string;
  storeId: string;
  storeName: string;
  price: number;
  moq: number;
  bulkPricing: { minQty: number; price: number }[];
  totalStock: number;
}

export interface ProductGroup {
  groupKey: string;
  title: string;
  brand: string;
  category: string;
  image: string | null;
  lowestPrice: number;
  supplierCount: number;
  suppliers: GroupedSupplier[];
}

// Best matching bulk-price tier for a given quantity (same logic as before,
// just operating on a single supplier entry instead of a flat product).
function tierFor(supplier: GroupedSupplier, qty: number) {
  if (!supplier.bulkPricing?.length) return { price: supplier.price, label: null as string | null };
  const sorted = [...supplier.bulkPricing].sort((a, b) => b.minQty - a.minQty);
  const match = sorted.find(t => qty >= t.minQty);
  if (!match) return { price: supplier.price, label: null as string | null };
  return { price: match.price, label: `${match.minQty}+ units @ ₹${match.price}` };
}

export default function SupplierCompareDrawer({
  group, onClose, onAddToCart,
}: {
  group: ProductGroup;
  onClose: () => void;
  onAddToCart: (supplier: GroupedSupplier, qty: number, price: number, tierLabel: string | null) => void;
}) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selected, setSelected] = useState<GroupedSupplier | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const total = group.suppliers.length;
  const goPrev = () => setCarouselIndex((i) => (i - 1 + total) % total);
  const goNext = () => setCarouselIndex((i) => (i + 1) % total);

  const handleSelect = (s: GroupedSupplier) => {
    setSelected(s);
    setQty(s.moq || 1);
  };

  const { price, label } = selected ? tierFor(selected, qty) : { price: 0, label: null };
  const subtotal = price * qty;

  const handleAdd = () => {
    if (!selected) return;
    onAddToCart(selected, qty, price, label);
    setAdded(true);
    setTimeout(onClose, 900);
  };

  const s = group.suppliers[carouselIndex];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#BBD5DA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="px-6 py-4 border-b border-[#BBD5DA] bg-[#DFF1F1] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{group.title}</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {selected ? `Ordering from ${selected.storeName}` : `${group.supplierCount} suppliers available`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-3">

          {!selected && total > 0 && (
            <div className="flex items-center gap-2">
              {/* Prev arrow */}
              <button
                onClick={goPrev}
                disabled={total <= 1}
                aria-label="Previous supplier"
                className="shrink-0 w-9 h-9 rounded-full border border-[#BBD5DA] bg-white text-gray-500 hover:bg-[#F5F5F5] hover:text-teal-700 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Card */}
              <div className="flex-1 min-w-0">
                <div
                  className={`rounded-xl border p-4 ${carouselIndex === 0 ? 'border-teal-400 ring-2 ring-teal-100 bg-teal-50/30' : 'border-[#BBD5DA] bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
  <div className="min-w-0">
    <p className="font-semibold text-gray-900 break-words">{s.storeName}</p>
    {carouselIndex === 0 && (
      <span className="inline-block text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full mt-1">
        Best price
      </span>
    )}
    <p className="text-xs text-gray-400 mt-1">MOQ: {s.moq} units · Stock: {s.totalStock}</p>
  </div>
  <p className="font-bold text-teal-700 text-lg whitespace-nowrap shrink-0">₹{s.price}</p>
</div>
                  {s.bulkPricing?.length > 0 && (
                    <div className="mt-1.5 text-xs text-gray-400 space-y-0.5">
                      {s.bulkPricing.map((t, i) => <p key={i}>{t.minQty}+ units — ₹{t.price}</p>)}
                    </div>
                  )}
                  <button
                    onClick={() => handleSelect(s)}
                    className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2 rounded-lg transition"
                  >
                    Select Supplier
                  </button>
                </div>

                {/* Dot indicators */}
                {total > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-4">
                    {group.suppliers.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        aria-label={`Go to supplier ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === carouselIndex ? 'w-5 bg-teal-600' : 'w-1.5 bg-[#BBD5DA]'
                        }`}
                      />
                    ))}
                  </div>
                )}
                <p className="text-center text-xs text-gray-400 mt-1.5">
                  {carouselIndex + 1} of {total}
                </p>
              </div>

              {/* Next arrow */}
              <button
                onClick={goNext}
                disabled={total <= 1}
                aria-label="Next supplier"
                className="shrink-0 w-9 h-9 rounded-full border border-[#BBD5DA] bg-white text-gray-500 hover:bg-[#F5F5F5] hover:text-teal-700 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {selected && !added && (
            <div className="space-y-4">
              <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-4">
                <p className="font-semibold text-gray-900">{selected.storeName}</p>
                <p className="text-xs text-gray-400 mt-0.5">MOQ: {selected.moq} units · Stock: {selected.totalStock}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                <div className="flex items-center border border-[#BBD5DA] rounded-lg w-fit">
                  <button onClick={() => setQty(q => Math.max(selected.moq, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-[#F5F5F5]">−</button>
                  <span className="w-14 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-[#F5F5F5]">+</button>
                </div>
                {label && <p className="text-xs text-teal-600 font-medium mt-1.5">{label}</p>}
              </div>

              <div className="flex justify-between items-center border-t border-[#F5F5F5] pt-3">
                <span className="font-bold text-gray-900 text-sm">Subtotal</span>
                <span className="font-bold text-teal-700 text-lg">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSelected(null)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-[#F5F5F5] border border-[#BBD5DA] hover:bg-white transition">
                  Back
                </button>
                <button onClick={handleAdd}
                  className="flex-1 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold py-3 rounded-xl transition">
                  Add to Cart
                </button>
              </div>
            </div>
          )}

          {added && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 size={36} className="text-green-600" />
              <p className="font-semibold text-gray-800">Added to cart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}