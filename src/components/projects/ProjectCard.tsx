// src/components/projects/ProjectCard.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { ProjectDto } from '@/types/api';

// ── Props ──────────────────────────────────────────────────────────────────
interface ProjectCardProps {
  project: ProjectDto;
  index: number;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProjectCard({
  project,
  index,
  menuOpen,
  onMenuToggle,
  onClick,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const palette = [
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

  const color = palette[index % palette.length];

  // Keep props for compatibility with parent callers in grid mode.
  void menuOpen;
  void onMenuToggle;
  void onEdit;
  void onDelete;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full flex flex-col items-center gap-2 px-2 py-3 rounded-xl hover:bg-blue-50/60 transition-colors"
      >
        <div className="relative w-32 h-28 drop-shadow-sm group-hover:drop-shadow-md transition-all">
          <div className={`absolute left-3 top-1 h-4 w-8 rounded-t-md bg-gradient-to-b ${color.tab} border ${color.border} border-b-0`} />
          <div className={`absolute left-0 right-0 top-4 bottom-0 rounded-md bg-gradient-to-b ${color.body} border ${color.border}`} />
          <div className="absolute left-2 right-2 top-5 h-[2px] rounded-full bg-white/45" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-gray-800 text-center line-clamp-2 min-h-[2.25rem]">
          {project.projectName}
        </p>
      </button>
    </motion.div>
  );
}
