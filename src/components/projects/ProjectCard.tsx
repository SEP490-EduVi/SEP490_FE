// src/components/projects/ProjectCard.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, FolderKanban } from 'lucide-react';
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

export function formatDate(value?: string) {
  if (!value) return 'Cập nhật gần đây';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Cập nhật gần đây';
  return d.toLocaleDateString('vi-VN');
}

export function getSubjectColor(subjectCode?: string) {
  const code = (subjectCode ?? '').toUpperCase();
  if (code.startsWith('TOAN') || code.startsWith('MATH')) return 'blue';
  if (code.startsWith('LY') || code.startsWith('PHYS')) return 'amber';
  if (code.startsWith('HOA') || code.startsWith('CHEM')) return 'rose';
  if (code.startsWith('SINH') || code.startsWith('BIO')) return 'emerald';
  if (code.startsWith('VAN') || code.startsWith('LIT')) return 'violet';
  if (code.startsWith('SU') || code.startsWith('HIS')) return 'orange';
  if (code.startsWith('DIA') || code.startsWith('GEO')) return 'teal';
  if (code.startsWith('ANH') || code.startsWith('ENG')) return 'indigo';
  return 'slate';
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
  const statusLabel = project.status === 0 ? null : project.status === 1 ? 'Lưu trữ' : 'Ngoại lệ';

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
      className="relative h-full"
    >
      <button
        type="button"
        onClick={onClick}
        className="group w-full h-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm transition-all"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-4 h-4" />
          </div>
          {statusLabel ? (
            <span className="px-2 py-1 rounded-full text-[11px] font-medium whitespace-nowrap bg-slate-100 text-slate-600">
              {statusLabel}
            </span>
          ) : null}
        </div>

        <h3 className="text-[15px] leading-5 font-semibold text-slate-900 line-clamp-2 mb-1.5">
          {project.projectName}
        </h3>

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mt-2">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5" />
            {formatDate(project.createdAt)}
          </span>
          <span
            className="truncate text-right font-mono text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title={project.projectCode}
          >
            {project.projectCode}
          </span>
        </div>
      </button>
    </motion.div>
  );
}
