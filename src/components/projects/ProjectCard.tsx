// src/components/projects/ProjectCard.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MoreVertical,
  Calendar,
  FileText,
  Package,
  Trash2,
  Edit3,
} from 'lucide-react';
import type { ProjectDto } from '@/types/api';

// ── Subject colors ─────────────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  'Toán học':   { bg: 'bg-blue-50',    text: 'text-blue-700' },
  'Vật lý':    { bg: 'bg-amber-50',   text: 'text-amber-700' },
  'Hóa học':   { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'Sinh học':  { bg: 'bg-green-50',   text: 'text-green-700' },
  'Ngữ văn':   { bg: 'bg-rose-50',    text: 'text-rose-700' },
  'Lịch sử':  { bg: 'bg-purple-50',  text: 'text-purple-700' },
  'Tiếng Anh': { bg: 'bg-cyan-50',    text: 'text-cyan-700' },
};

export function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] ?? { bg: 'bg-gray-50', text: 'text-gray-700' };
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusLabel(status: number) {
  return status === 0 ? 'Hoạt động' : 'Lưu trữ';
}

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
  const subjectColor = getSubjectColor(''); // Backend doesn't have subject yet

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5 transition-all cursor-pointer overflow-hidden"
    >
      {/* Color accent top bar */}
      <div className="h-1.5 bg-blue-400" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {project.projectName}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-500 font-mono">{project.projectCode}</span>
            </div>
          </div>

          {/* Context menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle();
              }}
              className={`p-1.5 rounded-lg hover:bg-gray-100 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 animate-fade-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa dự án
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            project.status === 0
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {getStatusLabel(project.status)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
