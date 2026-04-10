// src/components/projects/ProjectCard.tsx

'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock3, BookOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { ProjectDto } from '@/types/api';

// ── Props ──────────────────────────────────────────────────────────────────
// 
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
  if (!value) return 'Gần đây';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Gần đây';
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

const ICON_BG: Record<string, string> = {
  blue:    'bg-blue-100 text-blue-600',
  amber:   'bg-amber-100 text-amber-600',
  rose:    'bg-rose-100 text-rose-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  violet:  'bg-violet-100 text-violet-600',
  orange:  'bg-orange-100 text-orange-600',
  teal:    'bg-teal-100 text-teal-600',
  indigo:  'bg-indigo-100 text-indigo-600',
  slate:   'bg-slate-100 text-slate-500',
};

export default function ProjectCard({
  project,
  index,
  menuOpen,
  onMenuToggle,
  onClick,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const iconClass = ICON_BG[getSubjectColor(project.subjectCode)] ?? ICON_BG['slate'];

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onMenuToggle();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen, onMenuToggle]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
    >
      <div
        onClick={onClick}
        className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer select-none"
      >
        {/* Icon area */}
        <div className="flex items-center justify-center h-28 bg-blue-50 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
        </div>

        {/* Footer area */}
        <div className="px-4 py-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
              {project.projectName}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <Clock3 className="w-3 h-3 flex-shrink-0" />
              {formatDate(project.createdAt)}
              {project.status !== 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                  Lưu trữ
                </span>
              )}
            </p>
          </div>

          {/* 3-dot menu */}
          <div
            ref={menuRef}
            className="relative flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onMenuToggle}
              className="p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 overflow-hidden">
                <button
                  type="button"
                  onClick={onEdit}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa dự án
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
