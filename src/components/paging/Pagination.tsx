'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;          // current page, 1-based
  totalPages: number;    // total number of pages
  onPageChange: (page: number) => void;
  /** Max page buttons visible before collapsing to "…" (default 5) */
  siblingCount?: number;
}

// ─── Page range builder ───────────────────────────────────────────────────

function buildRange(current: number, total: number, siblings: number): (number | '…')[] {
  // Always show first, last, current ± siblings
  const left  = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);

  const range: (number | '…')[] = [1];

  if (left > 2) range.push('…');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);

  return range;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = buildRange(page, totalPages, siblingCount);

  const btn = (
    label: React.ReactNode,
    targetPage: number,
    disabled: boolean,
    isActive = false,
    key?: string | number,
  ) => (
    <button
      key={key ?? targetPage}
      onClick={() => !disabled && onPageChange(targetPage)}
      disabled={disabled}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'min-w-[36px] h-9 px-2.5 rounded-lg text-sm font-medium transition-colors select-none',
        isActive
          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 pointer-events-none'
          : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-1 pt-6 pb-2">
      {/* Prev */}
      {btn(
        <ChevronLeft className="w-4 h-4" />,
        page - 1,
        page === 1,
        false,
        'prev',
      )}

      {/* Page numbers */}
      {range.map((item, idx) =>
        item === '…' ? (
          <span
            key={`ellipsis-${idx}`}
            className="min-w-[36px] h-9 flex items-end justify-center pb-1 text-gray-400 text-sm select-none"
          >
            …
          </span>
        ) : (
          btn(item, item, false, item === page, item)
        ),
      )}

      {/* Next */}
      {btn(
        <ChevronRight className="w-4 h-4" />,
        page + 1,
        page === totalPages,
        false,
        'next',
      )}
    </div>
  );
}
