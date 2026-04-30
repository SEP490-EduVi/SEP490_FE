'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, BookOpen } from 'lucide-react';
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
  const [showCurriculumPicker, setShowCurriculumPicker] = useState(false);

  const uniqueCurricula = Array.from(
    new Map(
      curricula
        .filter((c) => c.status === 2)
        .map((c) => [c.curriculumYear, c])
    ).values()
  );
  const selectedCurriculum = uniqueCurricula.find((c) => String(c.curriculumYear) === year);

  if (!open) return null;

  const handleConfirm = () => {
    if (!productName.trim() || !year) return;
    onConfirm(productName.trim(), Number(year));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Phân tích bài học AI</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Chương trình học</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCurriculumPicker((v) => !v)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${showCurriculumPicker ? 'border-blue-400' : 'border-gray-200'} bg-white hover:border-blue-300 transition-colors text-left`}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {selectedCurriculum
                    ? `${selectedCurriculum.curriculumYear} — ${selectedCurriculum.subjectCode.replace(/_/g, ' ').toUpperCase()}`
                    : '-- Chọn năm chương trình --'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showCurriculumPicker ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showCurriculumPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 z-10 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-h-52 overflow-y-auto"
                  >
                    {uniqueCurricula.map((c) => (
                      <button
                        key={c.curriculumYear}
                        type="button"
                        onClick={() => { setYear(String(c.curriculumYear)); setShowCurriculumPicker(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                          String(c.curriculumYear) === year ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-3 h-3 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${String(c.curriculumYear) === year ? 'text-blue-600' : 'text-gray-700'}`}>{c.curriculumYear}</p>
                          <p className="text-[11px] text-gray-400">{c.subjectCode.replace(/_/g, ' ').toUpperCase()}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
        <div className="flex justify-end gap-2.5 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
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
