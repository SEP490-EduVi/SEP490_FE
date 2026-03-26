'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Film, CheckCircle, Play } from 'lucide-react';
import VideoPlayerModal from '@/components/projects/VideoPlayerModal';
import type { VideoProductDto } from '@/types/api';

// ─── Props ────────────────────────────────────────────────────────────────

interface VideoStepProps {
  projectCode: string;
  videoCompleted: boolean;
  videoData: VideoProductDto | null;
  showPlayer: boolean;
  onShowPlayer: () => void;
  onClosePlayer: () => void;
  onBackToProject: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function VideoStep({
  projectCode,
  videoCompleted,
  videoData,
  showPlayer,
  onShowPlayer,
  onClosePlayer,
  onBackToProject,
}: VideoStepProps) {
  if (videoCompleted && videoData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Video đã tạo thành công!</h3>
                <p className="text-xs text-gray-400">{videoData.productName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowPlayer}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors"
              >
                <Play className="w-4 h-4" />
                Xem lại
              </button>
              <button
                onClick={onBackToProject}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-md transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Quay về dự án
              </button>
            </div>
          </div>
        </div>

        {showPlayer && (
          <VideoPlayerModal
            video={videoData}
            projectCode={projectCode}
            onClose={onClosePlayer}
          />
        )}
      </motion.div>
    );
  }

  // ─── Waiting state ────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-32 gap-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Film className="w-8 h-8 text-white" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-800">Tạo video AI</p>
        <p className="text-sm text-gray-500 mt-1">Pipeline đang xử lí. Bạn có thể đợi ở đây...</p>
      </div>
    </motion.div>
  );
}
