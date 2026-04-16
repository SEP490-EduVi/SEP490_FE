// src/components/projects/ProductResultsCenter.tsx
'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  BarChart3,
  GalleryVerticalEnd,
  Video,
  ChevronRight,
  ChevronDown,
  Loader2,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Trash2,
} from 'lucide-react';
import { useProductEvaluation } from '@/hooks/useProductApi';
import type { ProductDto, VideoProductDto } from '@/types/api';

interface ProductResultsCenterProps {
  projectName: string;
  products: ProductDto[];
  videos: VideoProductDto[];
  viewSlideLoading: string | null;
  activeDocCode?: string | null;
  onViewSlide: (productCode: string) => void;
  onWatchVideo: (video: VideoProductDto) => void;
  onDeleteSlide: (productCode: string) => void;
  onDeleteVideo: (productVideoCode: string) => void;
  deletingSlide: string | null;
  deletingVideo: string | null;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN');
}

function VideoStatusChip({ status }: { status: VideoProductDto['status'] }) {
  if (status === 'completed')
    return <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">Hoàn thành</span>;
  if (status === 'processing' || status === 'pending')
    return (
      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Đang tạo
      </span>
    );
  return <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-medium">Lỗi</span>;
}

// ── Inline evaluation panel ───────────────────────────────────────────────────
function EvaluationInline({ productCode }: { productCode: string }) {
  const { data: evalData, isLoading } = useProductEvaluation(productCode);
  const evaluation = evalData?.evaluationResult?.evaluation;
  const score = evaluation?.coverage_score ?? 0;
  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const barColor   = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500'   : 'bg-red-500';

  if (isLoading) return (
    <div className="flex items-center justify-center py-6 gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      <span className="text-xs text-gray-400">Đang tải kết quả...</span>
    </div>
  );

  if (!evaluation) return (
    <div className="py-6 text-center text-xs text-gray-400">Không có dữ liệu đánh giá.</div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 space-y-3">
        {/* Detected lesson */}
        {evaluation.detected_lesson_name && (
          <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
            <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Bài học được phát hiện</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5">{evaluation.detected_lesson_name}</p>
            </div>
          </div>
        )}

        {/* Coverage score */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">Độ bao phủ nội dung</p>
            <span className={`text-xl font-bold ${scoreColor}`}>{score.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(score, 100)}%` }} />
          </div>
        </div>

        {/* Comment */}
        {evaluation.comment && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold mb-1">Nhận xét tổng quan</p>
            <p className="text-xs text-gray-700 leading-relaxed">{evaluation.comment}</p>
          </div>
        )}

        {/* Suggestions */}
        {(evaluation.suggestions?.length ?? 0) > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
              <p className="text-xs font-semibold text-gray-700">Gợi ý cải thiện ({evaluation.suggestions!.length})</p>
            </div>
            <ul className="space-y-1.5">
              {evaluation.suggestions!.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                  <span className="text-yellow-500 font-bold flex-shrink-0 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Covered concepts */}
        {(evaluation.covered_concepts?.length ?? 0) > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs font-semibold text-gray-700">Khái niệm đã bao phủ ({evaluation.covered_concepts!.length})</p>
            </div>
            <div className="space-y-1.5">
              {evaluation.covered_concepts!.map((item, i) => (
                <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                  {item.concept && <p className="text-xs font-medium text-emerald-700">{item.concept}</p>}
                  {item.explanation && <p className="text-[11px] text-gray-500 mt-0.5">{item.explanation}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing concepts */}
        {(evaluation.missing_concepts?.length ?? 0) > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-gray-700">Khái niệm còn thiếu ({evaluation.missing_concepts!.length})</p>
            </div>
            <div className="space-y-1.5">
              {evaluation.missing_concepts!.map((item, i) => {
                const isHigh = item.importance === 'high';
                return (
                  <div key={i} className={`rounded-lg px-2.5 py-1.5 border ${isHigh ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {item.concept && <p className={`text-xs font-medium ${isHigh ? 'text-red-700' : 'text-amber-700'}`}>{item.concept}</p>}
                      {item.importance && (
                        <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${isHigh ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {isHigh ? 'Quan trọng' : 'Trung bình'}
                        </span>
                      )}
                    </div>
                    {item.explanation && <p className="text-[11px] text-gray-500 leading-relaxed">{item.explanation}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ProductResultsCenter({
  projectName,
  products,
  videos,
  viewSlideLoading,
  activeDocCode,
  onViewSlide,
  onWatchVideo,
  onDeleteSlide,
  onDeleteVideo,
  deletingSlide,
  deletingVideo,
}: ProductResultsCenterProps) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [confirmDeleteSlide, setConfirmDeleteSlide] = useState<string | null>(null);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<string | null>(null);

  // Filter to active document when one is selected
  const visibleProducts = activeDocCode
    ? products.filter((p) => p.documentCode === activeDocCode)
    : products;

  // ── Empty state ──────────────────────────────────────────────────────────
  if (visibleProducts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-600 mb-2">{projectName}</h2>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
        Kết quả ({visibleProducts.length})
      </p>

      <AnimatePresence initial={false}>
        {visibleProducts.map((product, i) => {
          const productVideos = videos.filter((v) => v.productCode === product.productCode);
          const date = product.evaluatedAt ?? product.slideGeneratedAt ?? product.slideEditedAt;
          const isExpanded = expandedProduct === product.productCode;

          return (
            <motion.div
              key={product.productCode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.04, duration: 0.22 }}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* ── Card header ── */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.productName}</p>
                  {date && <p className="text-xs text-gray-400 mt-0.5">{formatDate(date)}</p>}
                </div>
              </div>

              {/* ── Rows ── */}
              <div className="divide-y divide-gray-50">
                {/* Evaluation row — toggle inline expand */}
                {product.hasEvaluation && (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpandedProduct(isExpanded ? null : product.productCode)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Kết quả phân tích</span>
                      </div>
                      <span className="text-xs text-blue-600 group-hover:underline flex items-center gap-0.5">
                        {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                        {isExpanded
                          ? <ChevronDown className="w-3 h-3 rotate-180 transition-transform" />
                          : <ChevronRight className="w-3 h-3" />
                        }
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <EvaluationInline key="eval" productCode={product.productCode} />
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Slide */}
                {(product.hasSlide || product.hasEditedSlide) && (
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-50 group hover:bg-gray-50/80 transition-colors">
                    <button
                      type="button"
                      onClick={() => onViewSlide(product.productCode)}
                      disabled={viewSlideLoading === product.productCode}
                      className="flex flex-1 items-center gap-2.5 disabled:opacity-50"
                    >
                      <GalleryVerticalEnd className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {product.hasEditedSlide ? 'Slide đã chỉnh sửa' : 'Slide bài giảng'}
                      </span>
                      {viewSlideLoading === product.productCode ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-auto" />
                      ) : (
                        <span className="ml-auto text-xs text-blue-600 group-hover:underline flex items-center gap-0.5">
                          Mở trong editor <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                    {confirmDeleteSlide === product.productCode ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">Xóa?</span>
                        <button
                          type="button"
                          disabled={deletingSlide === product.productCode}
                          onClick={() => { onDeleteSlide(product.productCode); setConfirmDeleteSlide(null); }}
                          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-md disabled:opacity-50"
                        >
                          {deletingSlide === product.productCode ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Có'}
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteSlide(null)} className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-0.5 rounded-md">Không</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSlide(product.productCode)}
                        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Videos */}
                {productVideos.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Video bài giảng</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      {productVideos.map((video) => (
                        <div key={video.productVideoCode} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {video.status === 'processing' || video.status === 'pending' ? (
                              <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-pulse" />
                            ) : video.status === 'failed' ? (
                              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            )}
                            <span className="text-xs text-gray-500 truncate">{video.productName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <VideoStatusChip status={video.status} />
                            {video.status === 'completed' && video.videoUrl && (
                              <button
                                type="button"
                                onClick={() => onWatchVideo(video)}
                                className="flex items-center gap-1 text-xs text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                <Play className="w-3 h-3" /> Xem
                              </button>
                            )}
                            {confirmDeleteVideo === video.productVideoCode ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Xóa?</span>
                                <button
                                  type="button"
                                  disabled={deletingVideo === video.productVideoCode}
                                  onClick={() => { onDeleteVideo(video.productVideoCode); setConfirmDeleteVideo(null); }}
                                  className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-md disabled:opacity-50"
                                >
                                  {deletingVideo === video.productVideoCode ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Có'}
                                </button>
                                <button type="button" onClick={() => setConfirmDeleteVideo(null)} className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-0.5 rounded-md">Không</button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteVideo(video.productVideoCode)}
                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa video"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
