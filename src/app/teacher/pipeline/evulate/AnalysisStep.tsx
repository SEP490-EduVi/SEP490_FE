'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, BookOpen, CheckCircle, AlertCircle,
  Lightbulb, Loader2, Layers,
} from 'lucide-react';
import type { CurriculumDto, ProductEvaluationResponse } from '@/types/api';

// ─── Props ────────────────────────────────────────────────────────────────

interface AnalysisStepProps {
  curricula: CurriculumDto[];
  curriculumYear: string;
  productName: string;
  isPending: boolean;
  analysisDone: boolean;
  evalData: ProductEvaluationResponse | undefined;
  evalLoading: boolean;
  slidePending: boolean;
  onCurriculumChange: (value: string) => void;
  onProductNameChange: (value: string) => void;
  onStartAnalysis: () => void;
  onStartSlides: () => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function AnalysisStep({
  curricula,
  curriculumYear,
  productName,
  isPending,
  analysisDone,
  evalData,
  evalLoading,
  slidePending,
  onCurriculumChange,
  onProductNameChange,
  onStartAnalysis,
  onStartSlides,
  onCancel,
}: AnalysisStepProps) {
  const evaluation = evalData?.evaluationResult?.evaluation;

  const scoreColor =
    (evaluation?.coverage_score ?? 0) >= 80 ? 'text-emerald-600' :
    (evaluation?.coverage_score ?? 0) >= 50 ? 'text-amber-600' :
    'text-red-600';

  const scoreBg =
    (evaluation?.coverage_score ?? 0) >= 80 ? 'bg-emerald-500' :
    (evaluation?.coverage_score ?? 0) >= 50 ? 'bg-amber-500' :
    'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {!analysisDone ? (
        // ─── Analysis form ───────────────────────────────────────────────
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Phân tích bài học AI</h2>
                  <p className="text-xs text-gray-500">Nhập thông tin và bắt đầu phân tích</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Chương trình học
                </label>
                <select
                  value={curriculumYear}
                  onChange={(e) => onCurriculumChange(e.target.value)}
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
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => onProductNameChange(e.target.value)}
                  placeholder="VD: Bài giảng Địa lí Bài 1"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={onStartAnalysis}
                disabled={isPending || !productName.trim() || !curriculumYear}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-md transition-all disabled:opacity-50"
              >
                {isPending ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // ─── Evaluation results ──────────────────────────────────────────
        <div className="space-y-6">
          {evalLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-gray-500">Đang tải kết quả đánh giá...</span>
            </div>
          ) : evaluation ? (
            <div className="space-y-4">
              {/* Detected lesson */}
              {evaluation.detected_lesson_name && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Bài học phát hiện</p>
                      <p className="text-sm font-bold text-gray-900">{evaluation.detected_lesson_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Coverage score */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-700">Độ phủ nội dung</p>
                  </div>
                  <span className={`text-2xl font-bold ${scoreColor}`}>
                    {evaluation.coverage_score}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${scoreBg}`}
                    style={{ width: `${evaluation.coverage_score}%` }}
                  />
                </div>
                {evaluation.comment && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-700 leading-relaxed">{evaluation.comment}</p>
                  </div>
                )}
              </div>

              {/* Covered concepts */}
              {evaluation.covered_concepts?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs font-semibold text-gray-700">
                      Khái niệm đã bao phủ ({evaluation.covered_concepts.length})
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evaluation.covered_concepts.map((item, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100"
                      >
                        {item.concept && (
                          <p className="text-xs font-medium text-emerald-700">{item.concept}</p>
                        )}
                        {item.explanation && (
                          <p className="text-xs text-gray-500 leading-relaxed">{item.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing concepts */}
              {evaluation.missing_concepts?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs font-semibold text-gray-700">
                      Khái niệm còn thiếu ({evaluation.missing_concepts.length})
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evaluation.missing_concepts.map((item, i) => {
                      const isHigh = item.importance === 'high';
                      return (
                        <div
                          key={i}
                          className={`flex flex-col gap-1 p-2.5 rounded-xl border ${
                            isHigh ? 'bg-red-50/60 border-red-100' : 'bg-amber-50/60 border-amber-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {item.concept && (
                              <p className={`text-xs font-medium ${isHigh ? 'text-red-700' : 'text-amber-700'}`}>
                                {item.concept}
                              </p>
                            )}
                            {item.importance && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  isHigh ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                }`}
                              >
                                {isHigh ? 'Quan trọng' : 'Trung bình'}
                              </span>
                            )}
                          </div>
                          {item.explanation && (
                            <p className="text-xs text-gray-500 leading-relaxed">{item.explanation}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {evaluation.suggestions?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
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

              {/* Next step */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={onStartSlides}
                  disabled={slidePending}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {slidePending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                  Tiếp tục → Tạo slide
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-gray-500">Không có dữ liệu đánh giá.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
