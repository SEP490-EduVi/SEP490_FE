'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Loader2, Clock, Film } from 'lucide-react';
import type { VideoProductDto } from '@/types/api';
import { getVideoSignedUrl } from '@/services/videoServices';

interface VideoPlayerModalProps {
  video: VideoProductDto;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [urlError, setUrlError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch signed URL on open
  useEffect(() => {
    if (!video.videoUrl) {
      setLoadingUrl(false);
      setUrlError('Không tìm thấy URL video.');
      return;
    }
    setLoadingUrl(true);
    getVideoSignedUrl(video.videoUrl)
      .then((url) => {
        setSignedUrl(url);
        setLoadingUrl(false);
      })
      .catch(() => {
        setUrlError('Không thể tải video. Vui lòng thử lại.');
        setLoadingUrl(false);
      });
  }, [video.videoUrl]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="video-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-gray-950 rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-900/80 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Film className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{video.productName}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  {video.duration != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  {video.interactions?.length > 0 && (
                    <span>{video.interactions.length} câu hỏi tương tác</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-4 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video area */}
          <div className="relative bg-black aspect-video flex items-center justify-center">
            {loadingUrl && (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Đang tải video...</span>
              </div>
            )}
            {!loadingUrl && urlError && (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Film className="w-10 h-10 opacity-40" />
                <span className="text-sm text-red-400">{urlError}</span>
              </div>
            )}
            {!loadingUrl && signedUrl && (
              <video
                ref={videoRef}
                src={signedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Interactions list */}
          {video.interactions?.length > 0 && (
            <div className="px-5 py-4 bg-gray-900/60 border-t border-white/10 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Câu hỏi tương tác ({video.interactions.length})
              </p>
              <div className="space-y-2">
                {video.interactions
                  .filter((i) => i.payload?.question)
                  .map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <span className="flex-shrink-0 w-14 text-gray-500 mt-0.5">
                        {formatDuration(item.start_time)}
                      </span>
                      <span className="text-gray-300 line-clamp-1">{item.payload.question}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
