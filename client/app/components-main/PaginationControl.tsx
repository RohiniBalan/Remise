import React from "react";

interface PaginationControlProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControl({
  currentPage,
  totalItems,
  itemsPerPage = 30,
  onPageChange,
}: PaginationControlProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalItems <= itemsPerPage) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-[#BBD5DA] gap-3">
      <p className="text-xs text-gray-500 font-medium">
        Showing <span className="font-bold text-gray-800">{startItem}</span> to{" "}
        <span className="font-bold text-gray-800">{endItem}</span> of{" "}
        <span className="font-bold text-gray-800">{totalItems}</span> records
      </p>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-xl border border-[#BBD5DA] bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`dots-${idx}`} className="text-xs text-gray-400 px-1">
                …
              </span>
            );
          }
          const pageNum = Number(p);
          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition ${
                currentPage === pageNum
                  ? "bg-teal-600 text-white shadow-xs"
                  : "border border-[#BBD5DA] bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-xl border border-[#BBD5DA] bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
