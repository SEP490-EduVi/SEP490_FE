'use client';

import React from 'react';

interface FolderTileProps {
  label: string;
  index: number;
  onClick: () => void;
  subtitle?: string;
  badge?: string;
  variant?: 'classic' | 'compact';
  tone?: 'color' | 'neutral';
  colorKey?: string;
}

const FOLDER_PALETTE = [
  {
    tab: 'from-red-400 to-red-500',
    body: 'from-red-500 to-red-600',
    border: 'border-red-700/50',
  },
  {
    tab: 'from-orange-400 to-orange-500',
    body: 'from-orange-500 to-orange-600',
    border: 'border-orange-700/50',
  },
  {
    tab: 'from-sky-400 to-sky-500',
    body: 'from-sky-500 to-blue-600',
    border: 'border-blue-700/50',
  },
  {
    tab: 'from-violet-300 to-violet-400',
    body: 'from-violet-400 to-violet-500',
    border: 'border-violet-700/40',
  },
  {
    tab: 'from-yellow-300 to-amber-400',
    body: 'from-amber-400 to-yellow-500',
    border: 'border-amber-700/40',
  },
] as const;

export default function FolderTile({
  label,
  index,
  onClick,
  subtitle,
  badge,
  variant = 'classic',
  tone = 'color',
  colorKey,
}: FolderTileProps) {
  const stablePaletteIndex = (() => {
    if (!colorKey) return index % FOLDER_PALETTE.length;
    let hash = 0;
    for (let i = 0; i < colorKey.length; i += 1) {
      hash = (hash * 31 + colorKey.charCodeAt(i)) >>> 0;
    }
    return hash % FOLDER_PALETTE.length;
  })();

  const color = FOLDER_PALETTE[stablePaletteIndex];
  const compactTone =
    tone === 'neutral'
      ? { tab: 'from-slate-300 to-slate-400', body: 'from-slate-400 to-slate-500', border: 'border-slate-500/40' }
      : color;

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm transition-all text-left"
      >
        <div className="relative w-11 h-10 flex-shrink-0">
          <div className={`absolute left-1 top-0.5 h-2.5 w-4 rounded-t-sm bg-gradient-to-b ${compactTone.tab} border ${compactTone.border} border-b-0`} />
          <div className={`absolute left-0 right-0 top-2 bottom-0 rounded-md bg-gradient-to-b ${compactTone.body} border ${compactTone.border}`} />
          <div className="absolute left-1 right-1 top-2.5 h-[2px] rounded-full bg-white/45" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-800 truncate">{label}</p>
          {subtitle && <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>}
        </div>

        {badge && (
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium whitespace-nowrap">
            {badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex flex-col items-center gap-2 px-2 py-3 rounded-xl hover:bg-blue-50/60 transition-colors"
    >
      <div className="relative w-32 h-28 drop-shadow-sm group-hover:drop-shadow-md transition-all">
        <div className={`absolute left-3 top-1 h-4 w-8 rounded-t-md bg-gradient-to-b ${color.tab} border ${color.border} border-b-0`} />
        <div className={`absolute left-0 right-0 top-4 bottom-0 rounded-md bg-gradient-to-b ${color.body} border ${color.border}`} />
        <div className="absolute left-2 right-2 top-5 h-[2px] rounded-full bg-white/45" />
      </div>
      <p className="text-xs sm:text-sm font-medium text-gray-800 text-center line-clamp-2 min-h-[2.25rem]">
        {label}
      </p>
      {(subtitle || badge) && (
        <div className="flex items-center gap-2 text-[11px]">
          {subtitle && <span className="text-gray-500">{subtitle}</span>}
          {badge && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{badge}</span>}
        </div>
      )}
    </button>
  );
}
