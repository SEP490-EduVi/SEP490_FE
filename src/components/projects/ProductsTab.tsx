// src/components/projects/ProductsTab.tsx

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
  Layers,
  BarChart3,
  Pencil,
  Trash2,
  Video,
  Film,
} from 'lucide-react';
import type { ProductDto } from '@/types/api';

// ── Status display config ──────────────────────────────────────────────────
type StatusKey =
  | 'NEW'
  | 'EVALUATING'
  | 'EVALUATED'
  | 'EVALUATION_FAILED'
  | 'GENERATING_SLIDES'
  | 'SLIDES_GENERATED'
  | 'SLIDES_FAILED'
  | 'VIDEO_GENERATED';

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; color: string; icon: React.ElementType }
> = {
  NEW:               { label: 'Mới tạo',          color: 'bg-gray-100 text-gray-600',     icon: Clock },
  EVALUATING:        { label: 'Đang đánh giá',    color: 'bg-blue-50 text-blue-600',      icon: Loader2 },
  EVALUATED:         { label: 'Đã đánh giá',      color: 'bg-cyan-50 text-cyan-600',      icon: BarChart3 },
  EVALUATION_FAILED: { label: 'Đánh giá thất bại', color: 'bg-red-50 text-red-600',       icon: AlertCircle },
  GENERATING_SLIDES: { label: 'Đang tạo slide',   color: 'bg-amber-50 text-amber-600',    icon: Loader2 },
  SLIDES_GENERATED:  { label: 'Hoàn thành',       color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
  SLIDES_FAILED:     { label: 'Tạo slide thất bại', color: 'bg-red-50 text-red-600',      icon: AlertCircle },
  VIDEO_GENERATED:   { label: 'Video đã tạo',     color: 'bg-violet-50 text-violet-600',  icon: Film },
};

function getStatusConfig(statusName: string) {
  return (
    STATUS_CONFIG[statusName as StatusKey] ?? {
      label: statusName,
      color: 'bg-gray-100 text-gray-600',
      icon: Clock,
    }
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Props ──────────────────────────────────────────────────────────────────
interface ProductsTabProps {
  products: ProductDto[];
  isLoading?: boolean;
  onDeleteProduct?: (productCode: string) => void;
  onViewSlide?: (productCode: string) => void;
  onViewEvaluation?: (productCode: string) => void;
  onGenerateSlides?: (productCode: string) => void;
  onGenerateVideo?: (productCode: string) => void;
  videoLoadingCode?: string | null;
}

export default function ProductsTab({
  products,
  isLoading = false,
  onDeleteProduct,
  onViewSlide,
  onViewEvaluation,
  onGenerateSlides,
  onGenerateVideo,
  videoLoadingCode = null,
}: ProductsTabProps) {
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);

  const handleConfirmDelete = (productCode: string) => {
    onDeleteProduct?.(productCode);
    setConfirmDeleteCode(null);
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">Đang tải sản phẩm...</span>
      </div>
    );
  }

  return (
    <>
      <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          Các sản phẩm slide được AI tạo ra từ tài liệu bài giảng.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Chưa có sản phẩm nào
          </h3>
          <p className="text-sm text-gray-500">
            Hãy tải tài liệu lên và phân tích để tạo sản phẩm.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, idx) => {
            const statusConfig = getStatusConfig(product.statusName);
            const StatusIcon = statusConfig.icon;
            const isSpinning =
              product.statusName === 'EVALUATING' ||
              product.statusName === 'GENERATING_SLIDES';

            return (
              <motion.div
                key={product.productCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg rounded-2xl p-5 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {product.productName}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.color}`}
                      >
                        <StatusIcon
                          className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`}
                        />
                        {statusConfig.label}
                      </span>
                    </div>

                    {product.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {product.evaluatedAt
                          ? `Đánh giá ${formatDate(product.evaluatedAt)}`
                          : 'Chưa đánh giá'}
                      </span>
                      {product.slideGeneratedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Slide tạo {formatDate(product.slideGeneratedAt)}
                        </span>
                      )}
                    </div>

                    {/* Progress steps */}
                    <div className="flex items-center gap-2">
                      <StepBadge
                        done={product.hasEvaluation}
                        active={product.statusName === 'EVALUATING'}
                        label="Đánh giá"
                        icon={BarChart3}
                      />
                      <div className="w-6 h-px bg-gray-200" />
                      <StepBadge
                        done={product.hasSlide}
                        active={product.statusName === 'GENERATING_SLIDES'}
                        label="Tạo slide"
                        icon={Layers}
                      />
                      <div className="w-6 h-px bg-gray-200" />
                      <StepBadge
                        done={product.hasEditedSlide}
                        active={false}
                        label="Chỉnh sửa"
                        icon={Pencil}
                      />
                    </div>


                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {product.hasEvaluation && (
                      <button
                        onClick={() => onViewEvaluation?.(product.productCode)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Xem đánh giá
                      </button>
                    )}
                    {product.hasSlide && (
                      <button
                        onClick={() => onViewSlide?.(product.productCode)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem slide
                      </button>
                    )}
                    {product.statusName === 'EVALUATED' && !product.hasSlide && (
                      <button
                        onClick={() => onGenerateSlides?.(product.productCode)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-md rounded-lg transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Tạo slide
                      </button>
                    )}
                    {product.hasEditedSlide && (
                      <button
                        onClick={() => onGenerateVideo?.(product.productCode)}
                        disabled={videoLoadingCode === product.productCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r  from-blue-600 to-purple-600 hover:shadow-md rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {videoLoadingCode === product.productCode ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Video className="w-3.5 h-3.5" />
                        )}
                        Tạo Video
                      </button>
                    )}

                    {/* Delete product — inline confirm */}
                    {confirmDeleteCode === product.productCode ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-500 font-medium">Xóa?</span>
                        <button
                          onClick={() => handleConfirmDelete(product.productCode)}
                          className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => setConfirmDeleteCode(null)}
                          className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteCode(product.productCode)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}

// ── StepBadge ──────────────────────────────────────────────────────────────

function StepBadge({
  done,
  active,
  label,
  icon: Icon,
}: {
  done: boolean;
  active: boolean;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
        done
          ? 'bg-emerald-50 text-emerald-600'
          : active
          ? 'bg-blue-50 text-blue-600'
          : 'bg-gray-50 text-gray-400'
      }`}
    >
      {done ? (
        <CheckCircle className="w-3 h-3" />
      ) : active ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {label}
    </span>
  );
}
