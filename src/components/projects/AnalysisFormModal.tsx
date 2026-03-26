'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CurriculumDto } from '@/types/api';

interface AnalysisFormModalProps {
  open: boolean;
  curricula: CurriculumDto[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (productName: string, year: number) => void;
}

export default function AnalysisFormModal({ open, curricula, isPending, onClose, onConfirm }: AnalysisFormModalProps) {
  const [productName, setProductName] = useState('');
  const [year, setYear] = useState<string>('');

  if (!open) return null;

  const handleConfirm = () => {
    if (!productName.trim() || !year) return;
    onConfirm(productName.trim(), Number(year));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Phân tích bài học AI</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Chương trình học</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            >
              <option value="">-- Chọn năm chương trình --</option>
              {Array.from(
                new Map(
                  curricula
                    .filter((c) => c.statusName === 'COMPLETED')
                    .map((c) => [c.curriculumYear, c])
                ).values()
              ).map((c) => (
                <option key={c.curriculumYear} value={c.curriculumYear}>
                  {c.curriculumYear} — {c.subjectCode.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tên sản phẩm</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="VD: Bài giảng Địa lí Bài 1"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={isPending} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !productName.trim() || !year}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-md transition-all disabled:opacity-50"
          >
            {isPending ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
          </button>
        </div>
      </div>
    </div>
  );
}
