// src/components/projects/PipelineProgressModal.tsx

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  FileSearch,
  Download,
  FileText,
  Database,
  Brain,
  Layers,
  X,
  Film,
  Video,
  Scissors,
  Clock,
  Upload,
} from 'lucide-react';
import type { PipelineProgress } from '@/types/api';

// ── Pipeline step mapping ──────────────────────────────────────────────────

interface StepInfo {
  label: string;
  icon: React.ElementType;
}

const EVALUATION_STEPS: Record<string, StepInfo> = {
  started:         { label: 'Bắt đầu pipeline',        icon: Sparkles },
  downloading:     { label: 'Tải xuống tài liệu',       icon: Download },
  extracting_text: { label: 'Trích xuất văn bản',       icon: FileText },
  fetching_data:   { label: 'Lấy dữ liệu chuẩn',       icon: Database },
  evaluating:      { label: 'AI đang đánh giá',         icon: Brain },
  completed:       { label: 'Hoàn thành',               icon: CheckCircle },
};

const SLIDE_STEPS: Record<string, StepInfo> = {
  started:           { label: 'Bắt đầu tạo slide',      icon: Sparkles },
  planning:          { label: 'Lên kế hoạch cấu trúc',   icon: FileSearch },
  generating_slides: { label: 'Đang tạo slides',         icon: Layers },
  assembling:        { label: 'Đang tổng hợp',           icon: Database },
  slides_completed:  { label: 'Hoàn thành',              icon: CheckCircle },
};

const VIDEO_STEPS: Record<string, StepInfo> = {
  started:             { label: 'Bắt đầu tạo video',       icon: Sparkles },
  rendering_slides:    { label: 'Render từng slide',        icon: Film },
  concatenating_video: { label: 'Ghép clip video',          icon: Scissors },
  building_timeline:   { label: 'Tạo timeline tương tác',  icon: Clock },
  uploading_video:     { label: 'Tải lên video',           icon: Upload },
  video_completed:     { label: 'Hoàn thành',              icon: CheckCircle },
};

function getStepInfo(step: string, pipelineType: 'evaluation' | 'slides' | 'video'): StepInfo {
  const map = pipelineType === 'evaluation' ? EVALUATION_STEPS
            : pipelineType === 'video'      ? VIDEO_STEPS
            : SLIDE_STEPS;
  return map[step] ?? { label: step, icon: Loader2 };
}

function getOrderedSteps(pipelineType: 'evaluation' | 'slides' | 'video') {
  if (pipelineType === 'evaluation')
    return ['started', 'downloading', 'extracting_text', 'fetching_data', 'evaluating', 'completed'];
  if (pipelineType === 'video')
    return ['started', 'rendering_slides', 'concatenating_video', 'building_timeline', 'uploading_video', 'video_completed'];
  return ['started', 'planning', 'generating_slides', 'assembling', 'slides_completed'];
}

// ── Props ──────────────────────────────────────────────────────────────────

interface PipelineProgressModalProps {
  open: boolean;
  progress: PipelineProgress | null;
  pipelineType: 'evaluation' | 'slides' | 'video';
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PipelineProgressModal({
  open,
  progress,
  pipelineType,
  onClose,
}: PipelineProgressModalProps) {
  const orderedSteps = getOrderedSteps(pipelineType);
  const currentStepIdx = progress ? orderedSteps.indexOf(progress.step) : -1;
  const isCompleted = progress?.status === 'completed';
  const isFailed = progress?.status === 'failed';
  const pct = progress?.progress ?? 0;
  // True when the modal is open but SignalR hasn't delivered a progress event yet
  // (e.g. page was reloaded mid-task and hub is still reconnecting)
  const isReconnecting = !progress;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isCompleted
                      ? 'bg-emerald-100'
                      : isFailed
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : isFailed ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {pipelineType === 'evaluation' ? 'Đánh giá bài giảng'
                       : pipelineType === 'video'    ? 'Tạo video AI'
                       : 'Tạo slide AI'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isCompleted
                        ? 'Hoàn thành!'
                        : isFailed
                        ? 'Đã xảy ra lỗi'
                        : isReconnecting
                        ? 'Đang kết nối lại với server...'
                        : 'Đang xử lý, vui lòng chờ...'}
                    </p>
                  </div>
                </div>

                {(isCompleted || isFailed) && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-6">
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                {isReconnecting ? (
                  /* Indeterminate sweep when reconnecting */
                  <motion.div
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                    style={{ width: '40%' }}
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : (
                  <>
                    <motion.div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        isFailed
                          ? 'bg-red-500'
                          : isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    {!isCompleted && !isFailed && (
                      <motion.div
                        className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-80px', '500px'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center justify-between mt-1.5 mb-4">
                <span className="text-xs text-gray-400">
                  {isReconnecting ? 'Đang kết nối lại với server...' : (progress?.detail ?? 'Đang khởi tạo...')}
                </span>
                <span className="text-xs font-semibold text-gray-600">{pct}%</span>
              </div>
            </div>

            {/* Steps timeline */}
            <div className="px-6 pb-6">
              {isReconnecting ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <p className="text-xs text-gray-400 text-center">
                    Đang kiểm tra tiến trình từ server, vui lòng chờ...
                  </p>
                </div>
              ) : (
              <div className="space-y-1">
                {orderedSteps.map((stepKey, idx) => {
                  const stepInfo = getStepInfo(stepKey, pipelineType);
                  const Icon = stepInfo.icon;
                  const isDone = currentStepIdx > idx || isCompleted;
                  const isCurrent = currentStepIdx === idx && !isCompleted && !isFailed;

                  return (
                    <motion.div
                      key={stepKey}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-blue-50'
                          : isDone
                          ? 'bg-emerald-50/50'
                          : ''
                      }`}
                    >
                      {/* Step indicator */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone
                          ? 'bg-emerald-100'
                          : isCurrent
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {isDone ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>

                      {/* Label */}
                      <span className={`text-sm font-medium ${
                        isDone
                          ? 'text-emerald-700'
                          : isCurrent
                          ? 'text-blue-700'
                          : 'text-gray-400'
                      }`}>
                        {stepInfo.label}
                      </span>

                      {/* Pulse dot for current */}
                      {isCurrent && (
                        <motion.span
                          className="ml-auto w-2 h-2 rounded-full bg-blue-500"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
              )}

              {/* Error message */}
              {isFailed && progress?.error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <p className="text-sm text-red-600">{progress.error}</p>
                </motion.div>
              )}

              {/* Success actions */}
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex justify-end"
                >
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Hoàn tất
                  </button>
                </motion.div>
              )}
            </div>

            {/* Animated background particles while processing */}
            {!isCompleted && !isFailed && (
              <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '200%' }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
