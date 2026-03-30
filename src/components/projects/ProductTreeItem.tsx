'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Layers, Loader2, Eye, Sparkles, Trash2,
  CheckCircle, BarChart3, Film, Play, Clock, AlertCircle, X,
} from 'lucide-react';
import type { ProductDto, VideoProductDto } from '@/types/api';

// ─── Shared helpers ──────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type StatusKey =
  | 'NEW' | 'EVALUATING' | 'EVALUATED' | 'EVALUATION_FAILED'
  | 'GENERATING_SLIDES' | 'SLIDES_GENERATED' | 'SLIDES_FAILED' | 'VIDEO_GENERATED';

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; icon: React.ElementType }> = {
  NEW:               { label: 'Mới tạo',            color: 'bg-gray-100 text-gray-600',      icon: Clock },
  EVALUATING:        { label: 'Đang đánh giá',      color: 'bg-blue-50 text-blue-600',       icon: Loader2 },
  EVALUATED:         { label: 'Đã đánh giá',        color: 'bg-cyan-50 text-cyan-600',       icon: BarChart3 },
  EVALUATION_FAILED: { label: 'Đánh giá thất bại',  color: 'bg-red-50 text-red-600',         icon: AlertCircle },
  GENERATING_SLIDES: { label: 'Đang tạo slide',     color: 'bg-amber-50 text-amber-600',     icon: Loader2 },
  SLIDES_GENERATED:  { label: 'Hoàn thành',         color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
  SLIDES_FAILED:     { label: 'Tạo slide thất bại', color: 'bg-red-50 text-red-600',         icon: AlertCircle },
  VIDEO_GENERATED:   { label: 'Video đã tạo',       color: 'bg-violet-50 text-violet-600',   icon: Film },
};

export function getStatusConfig(statusName: string) {
  return STATUS_CONFIG[statusName as StatusKey] ?? { label: statusName, color: 'bg-gray-100 text-gray-600', icon: Clock };
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ProductTreeItemProps {
  product: ProductDto;
  latestVideo: VideoProductDto | null;
  isExpanded: boolean;
  onToggle: () => void;
  viewSlideLoading: string | null;
  videoLoadingCode: string | null;
  confirmDeleteCode: string | null;
  onViewSlide: (code: string) => void;
  onViewEvaluation: (code: string) => void;
  onGenerateSlides: (code: string) => void;
  onGenerateVideo: (code: string) => void;
  onDeleteProduct: (code: string) => void;
  onSetConfirmDelete: (code: string | null) => void;
  onWatchVideo: (video: VideoProductDto) => void;
  onDeleteVideo: (productVideoCode: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductTreeItem({
  product, latestVideo, isExpanded, onToggle,
  viewSlideLoading, videoLoadingCode, confirmDeleteCode,
  onViewSlide, onViewEvaluation, onGenerateSlides, onGenerateVideo,
  onDeleteProduct, onSetConfirmDelete, onWatchVideo, onDeleteVideo,
}: ProductTreeItemProps) {
  const [confirmDeleteVideoCode, setConfirmDeleteVideoCode] = React.useState<string | null>(null);
  const statusConfig = getStatusConfig(product.statusName);
  const StatusIcon = statusConfig.icon;
  const isSpinning = product.statusName === 'EVALUATING' || product.statusName === 'GENERATING_SLIDES';

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={onToggle} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
          <ChevronRight className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
          </div>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.color}`}>
            <StatusIcon className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`} />
            {statusConfig.label}
          </span>
        </button>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Evaluation button */}
          {product.hasEvaluation && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewEvaluation(product.productCode); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <BarChart3 className="w-3 h-3" /> Đánh giá
            </button>
          )}
          {/* Slide button */}
          {product.hasSlide && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewSlide(product.productCode); }}
              disabled={viewSlideLoading === product.productCode}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {viewSlideLoading === product.productCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
              Slide
            </button>
          )}
          {product.statusName === 'EVALUATED' && !product.hasSlide && (
            <button
              onClick={(e) => { e.stopPropagation(); onGenerateSlides(product.productCode); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-sm transition-all"
            >
              <Sparkles className="w-3 h-3" /> Tạo slide
            </button>
          )}

        </div>
      </div>

      {/* Expanded: Slide & Video cards */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 bg-gray-50/60 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">

                {/* ── Slide card ── */}
                <div className={`flex flex-col rounded-2xl p-4 border ${product.hasSlide ? 'bg-blue-50/70 border-blue-100' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${product.hasSlide ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {product.hasSlide
                        ? <CheckCircle className="w-4 h-4 text-blue-500" />
                        : <Layers className="w-4 h-4 text-gray-400" />}
                    </div>
                    {product.hasSlide && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Hoàn thành</span>
                        {confirmDeleteCode === product.productCode ? (
                          <>
                            <button onClick={() => onDeleteProduct(product.productCode)} className="text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded-md">Xóa</button>
                            <button onClick={() => onSetConfirmDelete(null)} className="text-[10px] text-gray-400 hover:text-gray-600 px-1 py-0.5 rounded-md">Hủy</button>
                          </>
                        ) : (
                          <button onClick={() => onSetConfirmDelete(product.productCode)} className="p-0.5 text-gray-300 hover:text-red-400 transition-colors rounded" title="Xóa slide">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mb-0.5">Slide bài giảng</p>
                  {product.slideGeneratedAt
                    ? <p className="text-[11px] text-gray-400 mb-0.5">{formatDate(product.slideGeneratedAt)}</p>
                    : <p className="text-[11px] text-gray-400 mb-0.5">Chưa tạo</p>}
                  {product.hasEditedSlide && (
                    <span className="text-[10px] font-medium text-blue-500 mb-0.5">✏ Đã chỉnh sửa</span>
                  )}
                  <div className="mt-auto pt-3">
                    {product.hasSlide ? (
                      <button
                        onClick={() => onViewSlide(product.productCode)}
                        disabled={!!viewSlideLoading}
                        className="w-full py-1.5 text-xs font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {viewSlideLoading === product.productCode ? 'Đang mở...' : 'Chỉnh sửa slide →'}
                      </button>
                    ) : product.statusName === 'EVALUATED' ? (
                      <button
                        onClick={() => onGenerateSlides(product.productCode)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-md transition-all"
                      >
                        <Sparkles className="w-3 h-3" /> Tạo slide
                      </button>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic text-center py-1">Cần đánh giá trước</p>
                    )}
                  </div>
                </div>

                {/* ── Video card ── */}
                <div className={`flex flex-col rounded-2xl p-4 border ${latestVideo ? 'bg-violet-50/70 border-violet-100' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${latestVideo ? 'bg-violet-100' : 'bg-gray-100'}`}>
                      {latestVideo
                        ? <CheckCircle className="w-4 h-4 text-violet-500" />
                        : <Film className="w-4 h-4 text-gray-400" />}
                    </div>
                    {latestVideo && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">Hoàn thành</span>
                        {confirmDeleteVideoCode === latestVideo.productVideoCode ? (
                          <>
                            <button onClick={() => { onDeleteVideo(latestVideo.productVideoCode); setConfirmDeleteVideoCode(null); }} className="text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded-md">Xóa</button>
                            <button onClick={() => setConfirmDeleteVideoCode(null)} className="text-[10px] text-gray-400 hover:text-gray-600 px-1 py-0.5 rounded-md">Hủy</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDeleteVideoCode(latestVideo.productVideoCode)} className="p-0.5 text-gray-300 hover:text-red-400 transition-colors rounded" title="Xóa video">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mb-0.5">Video bài giảng</p>
                  {latestVideo?.completedAt
                    ? <p className="text-[11px] text-gray-400 mb-0.5">{formatDate(latestVideo.completedAt)}</p>
                    : <p className="text-[11px] text-gray-400 mb-0.5">Chưa tạo</p>}
                  <div className="mt-auto pt-3 flex flex-col gap-1.5">
                    {latestVideo ? (
                      <>
                        <button
                          onClick={() => onWatchVideo(latestVideo)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-violet-600 bg-violet-100 hover:bg-violet-200 rounded-xl transition-colors"
                        >
                          <Play className="w-3 h-3" /> Xem video →
                        </button>
                        <button
                          onClick={() => onGenerateVideo(product.productCode)}
                          disabled={videoLoadingCode === product.productCode}
                          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-violet-500 bg-white border border-violet-200 hover:bg-violet-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {videoLoadingCode === product.productCode
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Film className="w-3 h-3" />}
                          {videoLoadingCode === product.productCode ? 'Đang xử lý...' : 'Tạo lại video'}
                        </button>
                      </>
                    ) : product.hasEditedSlide ? (
                      <button
                        onClick={() => onGenerateVideo(product.productCode)}
                        disabled={videoLoadingCode === product.productCode}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl hover:shadow-md transition-all disabled:opacity-50"
                      >
                        {videoLoadingCode === product.productCode
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Film className="w-3 h-3" />}
                        {videoLoadingCode === product.productCode ? 'Đang xử lý...' : 'Tạo video'}
                      </button>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic text-center py-1">Cần tạo slide trước</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
