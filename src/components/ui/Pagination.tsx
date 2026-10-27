import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages);
  const unique = [...new Set(visible)].sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-1.5 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-lg border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>
      {unique.map((page, idx) => {
        const showEllipsis = idx > 0 && page - unique[idx - 1] > 1;
        return (
          <span key={page} className="flex items-center gap-1.5">
            {showEllipsis && <span className="text-neutral-400 px-1">…</span>}
            <button
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                page === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {page}
            </button>
          </span>
        );
      })}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-lg border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
