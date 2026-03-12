// src/components/projects/EvaluationModal.tsx

'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { useProductEvaluation } from '@/hooks/useProductApi';

interface EvaluationModalProps {
  open: boolean;
  productCode: string | null;
  productName?: string;
  onClose: () => void;
}

export default function EvaluationModal({
  open,
  productCode,
  productName,
  onClose,
}: EvaluationModalProps) {
  const { data: evalData, isLoading } = useProductEvaluation(
    open && productCode ? productCode : undefined,
  );

  const evaluation = evalData?.evaluationResult?.evaluation;
  const score = evaluation?.coverage_score ?? 0;

  const scoreColor =
    score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const barColor =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Light backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
          />

          {/* Slide-in drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className="relative z-10 w-full max-w-lg h-full bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Kết quả đánh giá</h2>
                  {productName && (
                    <p className="text-xs text-gray-400 mt-0.5">{productName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Đang tải kết quả đánh giá...</span>
                </div>
              ) : !evaluation ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <AlertCircle className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">Không có dữ liệu đánh giá.</p>
                </div>
              ) : (
                <>
                  {/* Detected lesson */}
                  {evaluation.detected_lesson_name && (
                    <div className="bg-white border border-gray-100 hover:border-blue-200 rounded-xl p-4 flex items-start gap-3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5 font-medium">
                          Bài học được phát hiện
                        </p>
                        <p className="text-sm font-semibold text-gray-800 leading-snug">
                          {evaluation.detected_lesson_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Coverage score */}
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-600">Độ bao phủ nội dung</p>
                      <span className={`text-2xl font-bold ${scoreColor}`}>
                        {score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Comment */}
                  {evaluation.comment && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold mb-1.5">
                        Nhận xét tổng quan
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{evaluation.comment}</p>
                    </div>
                  )}

                  {/* Covered concepts */}
                  {evaluation.covered_concepts?.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <p className="text-xs font-semibold text-gray-700">
                          Khái niệm đã bao phủ ({evaluation.covered_concepts.length})
                        </p>
                      </div>
                      <div className="space-y-2">
                        {evaluation.covered_concepts.map((item, i) => (
                          <div
                            key={i}
                            className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2"
                          >
                            {item.concept && (
                              <p className="text-xs font-medium text-emerald-700">{item.concept}</p>
                            )}
                            {item.explanation && (
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                {item.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing concepts */}
                  {evaluation.missing_concepts?.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <p className="text-xs font-semibold text-gray-700">
                          Khái niệm còn thiếu ({evaluation.missing_concepts.length})
                        </p>
                      </div>
                      <div className="space-y-2">
                        {evaluation.missing_concepts.map((item, i) => {
                          const isHigh = item.importance === 'high';
                          return (
                            <div
                              key={i}
                              className={`rounded-lg px-3 py-2 border ${
                                isHigh
                                  ? 'bg-red-50 border-red-100'
                                  : 'bg-amber-50 border-amber-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                {item.concept && (
                                  <p
                                    className={`text-xs font-medium ${
                                      isHigh ? 'text-red-700' : 'text-amber-700'
                                    }`}
                                  >
                                    {item.concept}
                                  </p>
                                )}
                                {item.importance && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                      isHigh
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-amber-100 text-amber-600'
                                    }`}
                                  >
                                    {isHigh ? 'Quan trọng' : 'Trung bình'}
                                  </span>
                                )}
                              </div>
                              {item.explanation && (
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {item.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {evaluation.suggestions?.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <p className="text-xs font-semibold text-gray-700">
                          Gợi ý cải thiện ({evaluation.suggestions.length})
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {evaluation.suggestions.map((s, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                            <span className="text-yellow-500 font-bold mt-0.5 flex-shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
