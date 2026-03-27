'use client';

import React, { useState, useEffect } from 'react';
import { Film, Search, Loader2, Play, FolderOpen, Clock } from 'lucide-react';

import AppHeader from '@/components/sidebar/AppHeader';
import { Pagination } from '@/components/paging';
import VideoPlayerModal from '@/components/projects/VideoPlayerModal';
import { useAllVideos } from '@/hooks/usePipelineApi';
import type { VideoProductDto } from '@/types/api';

const PAGE_SIZE = 8;

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function TeacherVideosPage() {
  const { data: allVideos = [], isLoading } = useAllVideos();

  const [searchQuery, setSearchQuery]   = useState('');
  const [page, setPage]                 = useState(1);
  const [playingVideo, setPlayingVideo] = useState<VideoProductDto | null>(null);

  const completed = allVideos.filter((v) => v.status === 'completed');

  const filtered = completed.filter(
    (v) => v.productName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Video của tôi</h1>
            <p className="text-sm text-gray-500">
              {isLoading ? '…' : `${completed.length} video đã hoàn thành`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên video..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-rose-500 mr-2" />
            <span className="text-sm text-gray-500">Đang tải video...</span>
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {searchQuery ? 'Không tìm thấy video' : 'Chưa có video nào'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Tạo video từ trang Dự án → Pipeline'}
            </p>
          </div>
        )}

        {/* Video grid */}
        {!isLoading && paged.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paged.map((video) => (
                <div
                  key={video.productVideoCode}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all overflow-hidden cursor-pointer group"
                  onClick={() => setPlayingVideo(video)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-36 bg-gray-950 flex items-center justify-center">
                    <Film className="w-10 h-10 text-white/10" />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                      </div>
                    </div>

                    {video.duration != null && (
                      <span className="absolute bottom-2 right-2 text-xs text-white bg-black/60 px-1.5 py-0.5 rounded font-mono">
                        {formatTime(video.duration)}
                      </span>
                    )}

                    {(video.interactions?.length ?? 0) > 0 && (
                      <span className="absolute top-2 left-2 text-xs text-white bg-violet-600/80 px-1.5 py-0.5 rounded">
                        {video.interactions.length} tương tác
                      </span>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-1.5">
                      {video.productName}
                    </h3>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(video.completedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>

      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          projectCode={playingVideo.productCode}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  );
}
