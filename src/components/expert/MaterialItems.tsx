'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import type { MaterialDto } from '@/types/api';
import { APPROVAL_STATUS_MAP } from './materialConstants';

interface Props {
  material: MaterialDto;
  confirmDelete: string | null;
  isDeleting: boolean;
  onEdit: () => void;
  onDeleteStart: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function MaterialCard({ material: m, confirmDelete, isDeleting, onEdit, onDeleteStart, onDeleteConfirm, onDeleteCancel }: Props) {
  const status = APPROVAL_STATUS_MAP[m.approvalStatus] ?? APPROVAL_STATUS_MAP[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {m.previewUrl ? (
        <div className="h-36 bg-gray-100 overflow-hidden">
          <img src={m.previewUrl} alt={m.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-blue-300" />
        </div>
      )}

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{m.title}</h3>
          <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {m.description && <p className="text-xs text-gray-500 line-clamp-2">{m.description}</p>}

        <div className="flex items-center gap-2 text-xs text-gray-400">
          {m.subjectName && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{m.subjectName}</span>}
          {m.gradeName && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{m.gradeName}</span>}
          <span className="ml-auto font-medium text-gray-700">
            {m.price > 0 ? `${m.price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
          </span>
        </div>

        <p className="text-[10px] text-gray-400">{new Date(m.createdAt).toLocaleDateString('vi-VN')}</p>

        <div className="flex items-center gap-2 pt-1">
          <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Pencil className="w-3 h-3" /> Sửa
          </button>
          {confirmDelete === m.materialCode ? (
            <>
              <button onClick={onDeleteConfirm} disabled={isDeleting} className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? 'Xoá...' : 'Xác nhận'}
              </button>
              <button onClick={onDeleteCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Huỷ</button>
            </>
          ) : (
            <button onClick={onDeleteStart} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <Trash2 className="w-3 h-3" /> Xoá
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MaterialListItem({ material: m, confirmDelete, isDeleting, onEdit, onDeleteStart, onDeleteConfirm, onDeleteCancel }: Props) {
  const status = APPROVAL_STATUS_MAP[m.approvalStatus] ?? APPROVAL_STATUS_MAP[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {m.previewUrl ? (
            <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-6 h-6 text-blue-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{m.title}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium ${status.color}`}>{status.label}</span>
            <span className="text-xs font-medium text-gray-700 ml-auto">
              {m.price > 0 ? `${m.price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
            </span>
          </div>
          {m.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{m.description}</p>}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
            {m.subjectName && <span>{m.subjectName}</span>}
            {m.gradeName && <span>· {m.gradeName}</span>}
            <span>· {new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
            <Pencil className="w-4 h-4" />
          </button>
          {confirmDelete === m.materialCode ? (
            <div className="flex items-center gap-1">
              <button onClick={onDeleteConfirm} disabled={isDeleting} className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? '...' : 'Xoá'}
              </button>
              <button onClick={onDeleteCancel} className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Huỷ</button>
            </div>
          ) : (
            <button onClick={onDeleteStart} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xoá">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
