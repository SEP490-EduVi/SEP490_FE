'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Layers, Loader2, Eye, Sparkles, Trash2,
  CheckCircle, BarChart3, Film, Play, Clock, AlertCircle, MoreHorizontal,
} from 'lucide-react';
import type { ProductDto, VideoProductDto } from '@/types/api';

// ─── Shared helpers ──────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '—';
  const now = new Date();
  const sameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();
  if (sameDay) return 'Hôm nay';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getSlideStatus(product: ProductDto) {
  if (product.hasSlide) return { label: 'Sẵn sàng', tone: 'bg-blue-100 text-blue-700' };
  if (product.statusName === 'GENERATING_SLIDES') return { label: 'Đang tạo', tone: 'bg-amber-100 text-amber-700' };
  if (product.statusName === 'SLIDES_FAILED') return { label: 'Lỗi tạo slide', tone: 'bg-red-100 text-red-700' };
  if (product.statusName === 'EVALUATED') return { label: 'Sẵn sàng tạo', tone: 'bg-cyan-100 text-cyan-700' };
  return { label: 'Chưa có', tone: 'bg-slate-100 text-slate-600' };
}

function getVideoStatus(video: VideoProductDto | null) {
  if (!video) return { label: 'Chưa có', tone: 'bg-slate-100 text-slate-600' };
  if (video.status === 'completed') return { label: 'Sẵn sàng', tone: 'bg-violet-100 text-violet-700' };
  if (video.status === 'processing' || video.status === 'pending') return { label: 'Đang tạo', tone: 'bg-amber-100 text-amber-700' };
  return { label: 'Lỗi tạo video', tone: 'bg-red-100 text-red-700' };
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
  SLIDES_GENERATED:  { label: 'Đã tạo slide',       color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
  SLIDES_FAILED:     { label: 'Tạo slide thất bại', color: 'bg-red-50 text-red-600',         icon: AlertCircle },
  VIDEO_GENERATED:   { label: 'Đã có video',        color: 'bg-violet-50 text-violet-600',   icon: Film },
};

export function getStatusConfig(statusName: string) {
  return STATUS_CONFIG[statusName as StatusKey] ?? { label: statusName, color: 'bg-gray-100 text-gray-600', icon: Clock };
}

function detailDate(dateStr: string | null): string | null {
  const f = formatDate(dateStr);
  if (f === '—' || f === 'Hôm nay') return null;
  return f;
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
  const [showQuickMenu, setShowQuickMenu] = React.useState(false);
  const quickMenuRef = React.useRef<HTMLDivElement | null>(null);
  const statusConfig = getStatusConfig(product.statusName);
  const StatusIcon = statusConfig.icon;
  const isSpinning = product.statusName === 'EVALUATING' || product.statusName === 'GENERATING_SLIDES';
  const toggleProductLabel = isExpanded ? 'Thu gọn phần sản phẩm' : 'Mở phần sản phẩm';
  const slideStatus = getSlideStatus(product);
  const videoStatus = getVideoStatus(latestVideo);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!quickMenuRef.current) return;
      if (!quickMenuRef.current.contains(event.target as Node)) {
        setShowQuickMenu(false);
      }
    };

    if (showQuickMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickMenu]);

  const primaryAction = product.hasSlide
    ? {
        label: 'Mở slide',
        icon: Eye,
        onClick: () => onViewSlide(product.productCode),
        disabled: viewSlideLoading === product.productCode,
        tone: 'text-white bg-blue-600 hover:bg-blue-700',
      }
    : product.statusName === 'EVALUATED'
      ? {
          label: 'Tạo slide',
          icon: Sparkles,
          onClick: () => onGenerateSlides(product.productCode),
          disabled: false,
          tone: 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-sm',
        }
      : product.hasEvaluation
        ? {
            label: 'Xem đánh giá',
            icon: BarChart3,
            onClick: () => onViewEvaluation(product.productCode),
            disabled: false,
            tone: 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100',
          }
        : null;

  const secondaryActions = [
    product.hasEvaluation
      ? {
          key: 'evaluation',
          label: 'Mở đánh giá',
          icon: BarChart3,
          onClick: () => onViewEvaluation(product.productCode),
        }
      : null,
    product.hasSlide
      ? {
          key: 'slide',
          label: 'Mở slide',
          icon: Eye,
          onClick: () => onViewSlide(product.productCode),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: React.ElementType;
    onClick: () => void;
  }>;

  const filteredSecondaryActions = secondaryActions.filter((action) => action.label !== primaryAction?.label);

  const slideDate = detailDate(product.slideGeneratedAt);
  const videoDate = detailDate(latestVideo?.completedAt ?? null);

  const slidePrimaryAction = product.hasSlide
    ? {
        label: viewSlideLoading === product.productCode ? 'Đang mở...' : 'Chỉnh sửa slide',
        icon: viewSlideLoading === product.productCode ? Loader2 : Eye,
        onClick: () => onViewSlide(product.productCode),
        disabled: viewSlideLoading === product.productCode,
        tone: 'text-blue-700 bg-blue-100 hover:bg-blue-200',
      }
    : product.statusName === 'EVALUATED'
      ? {
          label: 'Tạo slide',
          icon: Sparkles,
          onClick: () => onGenerateSlides(product.productCode),
          disabled: false,
          tone: 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-sm',
        }
      : {
          label: 'Cần đánh giá trước',
          icon: AlertCircle,
          onClick: () => {},
          disabled: true,
          tone: 'text-gray-400 bg-gray-100 cursor-not-allowed',
        };

  const videoPrimaryAction = latestVideo
    ? {
        label: 'Xem video',
        icon: Play,
        onClick: () => onWatchVideo(latestVideo),
        disabled: false,
        tone: 'text-violet-700 bg-violet-100 hover:bg-violet-200',
      }
    : product.hasEditedSlide
      ? {
          label: videoLoadingCode === product.productCode ? 'Đang xử lý...' : 'Tạo video',
          icon: videoLoadingCode === product.productCode ? Loader2 : Film,
          onClick: () => onGenerateVideo(product.productCode),
          disabled: videoLoadingCode === product.productCode,
          tone: 'text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-sm',
        }
      : {
          label: 'Cần chỉnh sửa slide trước',
          icon: AlertCircle,
          onClick: () => {},
          disabled: true,
          tone: 'text-gray-400 bg-gray-100 cursor-not-allowed',
        };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={onToggle}
          title={toggleProductLabel}
          aria-label={toggleProductLabel}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
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

        {/* Action hierarchy: primary + overflow */}
        <div className="relative flex items-center gap-1.5 flex-shrink-0" ref={quickMenuRef}>
          {primaryAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                primaryAction.onClick();
              }}
              disabled={primaryAction.disabled}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${primaryAction.tone}`}
            >
              {(() => {
                const PrimaryIcon = primaryAction.icon;
                return <PrimaryIcon className={`w-3 h-3 ${primaryAction.disabled ? 'animate-spin' : ''}`} />;
              })()}
              {primaryAction.disabled ? 'Đang mở...' : primaryAction.label}
            </button>
          )}

          {filteredSecondaryActions.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickMenu((prev) => !prev);
              }}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Thao tác phụ"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          )}

          {showQuickMenu && filteredSecondaryActions.length > 0 && (
            <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5">
              {filteredSecondaryActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQuickMenu(false);
                      action.onClick();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                );
              })}
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ── Slide card ── */}
                <div className={`flex flex-col rounded-2xl p-4 border ${product.hasSlide ? 'bg-blue-50/70 border-blue-100' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${product.hasSlide ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {product.hasSlide ? <CheckCircle className="w-4 h-4 text-blue-500" /> : <Layers className="w-4 h-4 text-gray-400" />}
                    </div>
                    {product.hasSlide && (
                      <div className="flex items-center gap-1">
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

                  <p className="text-xs font-semibold text-gray-800">Slide bài giảng</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 min-h-[16px]">
                    {slideDate ? `Cập nhật ${slideDate}` : ''}
                  </p>
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${slideStatus.tone}`}>
                      {slideStatus.label}
                    </span>
                  </div>

                  <div className="mt-auto pt-3 space-y-1.5">
                    <button
                      onClick={slidePrimaryAction.onClick}
                      disabled={slidePrimaryAction.disabled}
                      className={`w-full flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 ${slidePrimaryAction.tone}`}
                    >
                      {(() => {
                        const ActionIcon = slidePrimaryAction.icon;
                        return <ActionIcon className={`w-3 h-3 ${slidePrimaryAction.disabled && slidePrimaryAction.icon === Loader2 ? 'animate-spin' : ''}`} />;
                      })()}
                      {slidePrimaryAction.label}
                    </button>

                    {product.hasSlide && product.hasEvaluation ? (
                      <button
                        onClick={() => onViewEvaluation(product.productCode)}
                        className="w-full py-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-xl transition-colors"
                      >
                        Hành động phụ: Xem đánh giá
                      </button>
                    ) : product.hasEditedSlide ? (
                      <p className="text-[11px] text-blue-500 text-center">Hành động phụ: Đã chỉnh sửa</p>
                    ) : (
                      <p className="text-[11px] text-gray-400 text-center">Hành động phụ: Chưa có</p>
                    )}
                  </div>
                </div>

                {/* ── Video card ── */}
                <div className={`flex flex-col rounded-2xl p-4 border ${latestVideo ? 'bg-violet-50/70 border-violet-100' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${latestVideo ? 'bg-violet-100' : 'bg-gray-100'}`}>
                      {latestVideo ? <CheckCircle className="w-4 h-4 text-violet-500" /> : <Film className="w-4 h-4 text-gray-400" />}
                    </div>
                    {latestVideo && (
                      <div className="flex items-center gap-1">
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

                  <p className="text-xs font-semibold text-gray-800">Video bài giảng</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 min-h-[16px]">
                    {videoDate ? `Cập nhật ${videoDate}` : ''}
                  </p>
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${videoStatus.tone}`}>
                      {videoStatus.label}
                    </span>
                  </div>

                  <div className="mt-auto pt-3 space-y-1.5">
                    <button
                      onClick={videoPrimaryAction.onClick}
                      disabled={videoPrimaryAction.disabled}
                      className={`w-full flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 ${videoPrimaryAction.tone}`}
                    >
                      {(() => {
                        const ActionIcon = videoPrimaryAction.icon;
                        return <ActionIcon className={`w-3 h-3 ${videoPrimaryAction.icon === Loader2 ? 'animate-spin' : ''}`} />;
                      })()}
                      {videoPrimaryAction.label}
                    </button>

                    {latestVideo ? (
                      <button
                        onClick={() => onGenerateVideo(product.productCode)}
                        disabled={videoLoadingCode === product.productCode}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-violet-600 bg-white border border-violet-200 hover:bg-violet-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {videoLoadingCode === product.productCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                        {videoLoadingCode === product.productCode ? 'Đang xử lý...' : 'Hành động phụ: Tạo lại video'}
                      </button>
                    ) : product.hasSlide ? (
                      <button
                        onClick={() => onViewSlide(product.productCode)}
                        className="w-full py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        Hành động phụ: Mở slide để chỉnh sửa
                      </button>
                    ) : (
                      <p className="text-[11px] text-gray-400 text-center">Hành động phụ: Chưa có</p>
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
