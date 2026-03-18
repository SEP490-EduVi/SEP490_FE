// src/components/projects/VideosTab.tsx

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Play, Clock, Loader2, MessageSquare } from 'lucide-react';
import type { VideoProductDto } from '@/types/api';
import VideoPlayerModal from './VideoPlayerModal';

interface VideosTabProps {
  latestVideo: VideoProductDto | null;
  isLoading?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m} phút ${s} giây`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function VideosTab({ latestVideo, isLoading = false }: VideosTabProps) {
  const [viewingVideo, setViewingVideo] = useState<VideoProductDto | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">Đang tải video...</span>
      </div>
    );
  }

  if (!latestVideo || latestVideo.status !== 'completed') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Film className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có video nào</h3>
        <p className="text-sm text-gray-500">
          Hãy chỉnh sửa slide và tạo video từ tab <strong>Slide</strong>.
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">Video được tạo từ slide bài giảng.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 hover:border-violet-200 hover:shadow-lg rounded-2xl p-5 transition-all"
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Film className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {latestVideo.productName}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  Hoàn thành
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                {latestVideo.duration != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(latestVideo.duration)}
                  </span>
                )}
                {latestVideo.interactions?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {latestVideo.interactions.length} câu hỏi tương tác
                  </span>
                )}
                {latestVideo.completedAt && (
                  <span>Hoàn thành {formatDate(latestVideo.completedAt)}</span>
                )}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => setViewingVideo(latestVideo)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:shadow-md rounded-xl transition-all flex-shrink-0"
            >
              <Play className="w-4 h-4" />
              Xem video
            </button>
          </div>
        </motion.div>
      </div>

      {viewingVideo && (
        <VideoPlayerModal
          video={viewingVideo}
          onClose={() => setViewingVideo(null)}
        />
      )}
    </>
  );
}
