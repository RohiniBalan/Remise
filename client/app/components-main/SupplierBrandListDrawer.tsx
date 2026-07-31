'use client';

import { useState } from 'react';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductGroup } from './SupplierCompareDrawer';

export interface TitleGroup {
  titleKey: string;
  title: string;
  image: string | null;
  brandCount: number;
  lowestPrice: number;
  brands: ProductGroup[]; // each is a brand+title group, sorted by price ascending
}

// Client-side rollup: groups the existing brand+title ProductGroup[] (from
// getGroupedSuppliers) one level further, by title alone, ignoring brand.
// Temporary/interim — same caveat as groupKey() on the backend: normalizes
// title only, no real product identifier involved.
export function groupByTitle(groups: ProductGroup[]): TitleGroup[] {
  const byTitle: Record<string, { title: string; image: string | null; brands: ProductGroup[] }> = {};

  for (const g of groups) {
    const key = (g.title || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (!byTitle[key]) {
      byTitle[key] = { title: g.title, image: g.image, brands: [] };
    }
    byTitle[key].brands.push(g);
  }

  return Object.entries(byTitle).map(([titleKey, v]) => {
    const sortedBrands = [...v.brands].sort((a, b) => a.lowestPrice - b.lowestPrice);
    return {
      titleKey,
      title: v.title,
      image: v.image,
      brandCount: sortedBrands.length,
      lowestPrice: sortedBrands[0]?.lowestPrice ?? 0,
      brands: sortedBrands,
    };
  });
}

export default function SupplierBrandListDrawer({
  titleGroup, onClose, onCompareBrand,
}: {
  titleGroup: TitleGroup;
  onClose: () => void;
  onCompareBrand: (brandGroup: ProductGroup) => void;
}) {
  const [index, setIndex] = useState(0);
  const total = titleGroup.brands.length;

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  const b = titleGroup.brands[index];
  // Cheapest supplier's stock — suppliers within a group are already
  // sorted ascending by price (see productController groupKey/getGroupedSuppliers).
  const cheapest = b?.suppliers[0];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#BBD5DA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="px-6 py-4 border-b border-[#BBD5DA] bg-[#DFF1F1] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{titleGroup.title}</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {titleGroup.brandCount} brand{titleGroup.brandCount !== 1 ? 's' : ''} available
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {total === 0 ? (
            <div className="text-center py-10">
              <Package size={36} className="text-[#BBD5DA] mx-auto mb-3" />
              <p className="text-sm text-gray-500">No brands available.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Prev arrow */}
              <button
                onClick={goPrev}
                disabled={total <= 1}
                aria-label="Previous brand"
                className="shrink-0 w-9 h-9 rounded-full border border-[#BBD5DA] bg-white text-gray-500 hover:bg-[#F5F5F5] hover:text-teal-700 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Card */}
              <div className="flex-1 min-w-0">
                <div
                  className={`rounded-xl border p-4 ${index === 0 ? 'border-teal-400 ring-2 ring-teal-100 bg-teal-50/30' : 'border-[#BBD5DA] bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
  <div className="min-w-0">
    <p className="font-semibold text-gray-900 break-words">{b.brand || 'Unbranded'}</p>
    {index === 0 && (
      <span className="inline-block text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full mt-1">
        Best price
      </span>
    )}
    <p className="text-xs text-gray-400 mt-1">
      Stock: {cheapest?.totalStock ?? '—'} · Available from{' '}
      <span className="font-semibold">{b.supplierCount}</span> supplier{b.supplierCount !== 1 ? 's' : ''}
    </p>
  </div>
  <p className="font-bold text-teal-700 text-lg whitespace-nowrap shrink-0">₹{b.lowestPrice}</p>
</div>

                  <button
                    onClick={() => onCompareBrand(b)}
                    className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2 rounded-lg transition"
                  >
                    Compare Suppliers
                  </button>
                </div>

                {/* Dot indicators */}
                {total > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-4">
                    {titleGroup.brands.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Go to brand ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === index ? 'w-5 bg-teal-600' : 'w-1.5 bg-[#BBD5DA]'
                        }`}
                      />
                    ))}
                  </div>
                )}
                <p className="text-center text-xs text-gray-400 mt-1.5">
                  {index + 1} of {total}
                </p>
              </div>

              {/* Next arrow */}
              <button
                onClick={goNext}
                disabled={total <= 1}
                aria-label="Next brand"
                className="shrink-0 w-9 h-9 rounded-full border border-[#BBD5DA] bg-white text-gray-500 hover:bg-[#F5F5F5] hover:text-teal-700 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}