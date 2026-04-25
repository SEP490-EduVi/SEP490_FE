// src/components/projects/ProductResultPanel.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  GalleryVerticalEnd,
  Video,
  Gamepad2,
  Clock,
  AlertCircle,
  Loader2,
  BarChart3,
  BookOpen,
  ChevronRight,
  Play,
  Trash2,
  Swords,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useDeleteGame } from '@/hooks/useGamesApi';
import { getGameByCode } from '@/services/gamesServices';
import { notify, MSGS } from '@/components/common';
import type { ProductDto, VideoProductDto, GameDto } from '@/types/api';

// ── Props ─────────────────────────────────────────────────────────────────────
interface ProductResultPanelProps {
  projectName: string;
  products: ProductDto[];
  videos: VideoProductDto[];
  games: GameDto[];
  activeDocCode?: string | null;
  activeDocTitle?: string | null;
  isPipelineRunning?: boolean;
  activePipelineType?: 'evaluation' | 'slides' | 'video' | null;
  onOpenPipelineModal?: () => void;
  // detail view
  selectedDetailCode?: string | null;
  onSelectDetail: (productCode: string) => void;
  // slide actions
  onViewSlide: (productCode: string) => void;
  viewSlideLoading: string | null;
  onPreviewSlide: (productCode: string) => void;
  previewSlideLoading?: string | null;
  deletingSlide: string | null;
  onDeleteSlide: (productCode: string) => void;
  // video actions
  onWatchVideo: (video: VideoProductDto) => void;
  deletingVideo: string | null;
  onDeleteVideo: (productVideoCode: string) => void;
}

// ── Video status chip ─────────────────────────────────────────────────────────
function VideoStatusChip({ status, isCreating = false }: { status: VideoProductDto['status']; isCreating?: boolean }) {
  if (status === 'completed')
    return <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">Hoàn thành</span>;
  if (status === 'processing' || status === 'pending' || isCreating)
    return (
      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Đang tạo
      </span>
    );
  return <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-medium">Lỗi</span>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductResultPanel({
  projectName,
  products,
  videos,
  games,
  activeDocCode,
  activeDocTitle,
  isPipelineRunning,
  activePipelineType,
  onOpenPipelineModal,
  selectedDetailCode,
  onSelectDetail,
  onViewSlide,
  viewSlideLoading,
  onPreviewSlide,
  previewSlideLoading,
  deletingSlide,
  onDeleteSlide,
  onWatchVideo,
  deletingVideo,
  onDeleteVideo,
}: ProductResultPanelProps) {
  const [confirmDeleteSlide, setConfirmDeleteSlide] = useState<string | null>(null);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<string | null>(null);
  const [confirmDeleteGame, setConfirmDeleteGame] = useState<string | null>(null);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const deleteGame = useDeleteGame();
  const router = useRouter();

  const visibleProducts = activeDocCode
    ? products.filter((p) => p.documentCode === activeDocCode)
    : products;

  const handlePlayGame = async (gameCode: string, productGameName: string) => {
    setLaunchingGame(gameCode);
    try {
      const detail = await getGameByCode(gameCode);
      router.push(
        `/teacher/game-maker?taskId=${encodeURIComponent(detail.taskId)}&productName=${encodeURIComponent(productGameName)}&gameCode=${encodeURIComponent(gameCode)}`,
      );
    } catch {
      setLaunchingGame(null);
      notify.error(MSGS.game.openError);
    }
  };

  return (
    <aside className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-700">Kết quả</h2>
          {activeDocTitle && (
            <p className="text-xs text-gray-400 truncate" title={activeDocTitle}>{activeDocTitle}</p>
          )}
        </div>
        {isPipelineRunning && onOpenPipelineModal && (
          <button
            type="button"
            onClick={onOpenPipelineModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            {activePipelineType === 'video' ? 'Đang tạo video'
              : activePipelineType === 'slides' ? 'Đang tạo slide'
              : 'Đang phân tích'}
          </button>
        )}
      </div>

      {/* ── Product list ── */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">{projectName}</p>
            <p className="text-xs text-gray-400 mt-1">Chưa có kết quả nào</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleProducts.map((product, i) => {
              const productVideos = videos.filter((v) => v.productCode === product.productCode);
              const productGames  = games.filter((g) => g.productCode === product.productCode);
              const isSelected = selectedDetailCode === product.productCode;

              return (
                <motion.div
                  key={product.productCode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.03, duration: 0.18 }}
                  className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-colors ${
                    isSelected ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-100'
                  }`}
                >
                  {/* Card header */}
                  <div className={`flex items-center gap-2.5 px-3 py-3 border-b ${isSelected ? 'border-blue-100 bg-blue-50/40' : 'border-gray-50'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-100' : 'bg-blue-50'}`}>
                      <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="flex-1 text-xs font-semibold text-gray-800 truncate">{product.productName}</p>
                  </div>

                  <div className="divide-y divide-gray-50">

                    {/* ── Phân tích section ── */}
                    <div>
                      <div className="px-3 pt-2 pb-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-black">Phân tích</span>
                      </div>
                      {product.hasEvaluation ? (
                        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Kết quả phân tích</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectDetail(product.productCode)}
                            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors flex-shrink-0 ${
                              isSelected ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            Xem chi tiết <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          <span className="text-xs text-gray-400">Chưa phân tích</span>
                        </div>
                      )}
                    </div>

                    {/* ── Slide section ── */}
                    {(product.hasSlide || product.hasEditedSlide) && (
                      <div>
                        <div className="px-3 pt-2 pb-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-black">Slide</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50/80 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <GalleryVerticalEnd className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                            <span className="text-xs text-gray-600 truncate">
                              {product.hasEditedSlide ? 'Slide' : 'Slide'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">
                              {product.hasEditedSlide ? 'Đã sửa' : 'Hoàn thành'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onViewSlide(product.productCode)}
                              disabled={viewSlideLoading === product.productCode}
                              title="Mở trong editor"
                              className="flex items-center gap-0.5 text-[11px] text-white bg-indigo-500 hover:bg-indigo-600 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {viewSlideLoading === product.productCode
                                ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                : <ExternalLink className="w-2.5 h-2.5" />}
                              Mở
                            </button>
                            <button
                              type="button"
                              onClick={() => onPreviewSlide(product.productCode)}
                              disabled={previewSlideLoading === product.productCode}
                              title="Xem demo slide"
                              className="flex items-center gap-0.5 text-[11px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {previewSlideLoading === product.productCode
                                ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                : <Eye className="w-2.5 h-2.5" />}
                              Xem
                            </button>
                            {confirmDeleteSlide === product.productCode ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={deletingSlide === product.productCode}
                                  onClick={() => { onDeleteSlide(product.productCode); setConfirmDeleteSlide(null); }}
                                  className="text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded disabled:opacity-50"
                                >
                                  {deletingSlide === product.productCode ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Xóa'}
                                </button>
                                <button type="button" onClick={() => setConfirmDeleteSlide(null)} className="text-[11px] text-gray-500 hover:bg-gray-100 px-1.5 py-0.5 rounded">Hủy</button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSlide(product.productCode)}
                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Video section ── */}
                    {productVideos.length > 0 && (
                      <div>
                        <div className="px-3 pt-2 pb-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-black">Video</span>
                        </div>
                        {productVideos.map((video) => (
                          <div key={video.productVideoCode} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50/80 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              {video.status === 'processing' || video.status === 'pending' || (isPipelineRunning && activePipelineType === 'video') ? (
                                <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-pulse" />
                              ) : video.status === 'failed' ? (
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                              ) : (
                                <Video className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                              )}
                              <span className="text-xs text-gray-600 truncate">{video.videoName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <VideoStatusChip status={video.status} isCreating={isPipelineRunning && activePipelineType === 'video'} />
                              {video.status === 'completed' && video.videoUrl && (
                                <button
                                  type="button"
                                  onClick={() => onWatchVideo(video)}
                                  className="flex items-center gap-0.5 text-[11px] text-white bg-rose-500 hover:bg-rose-600 px-2 py-0.5 rounded-lg transition-colors"
                                >
                                  <Play className="w-2.5 h-2.5" /> Xem
                                </button>
                              )}
                              {confirmDeleteVideo === video.productVideoCode ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={deletingVideo === video.productVideoCode}
                                    onClick={() => { onDeleteVideo(video.productVideoCode); setConfirmDeleteVideo(null); }}
                                    className="text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded disabled:opacity-50"
                                  >
                                    {deletingVideo === video.productVideoCode ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Xóa'}
                                  </button>
                                  <button type="button" onClick={() => setConfirmDeleteVideo(null)} className="text-[11px] text-gray-500 hover:bg-gray-100 px-1.5 py-0.5 rounded">Hủy</button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteVideo(video.productVideoCode)}
                                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Game section ── */}
                    {productGames.length > 0 && (
                      <div>
                        <div className="px-3 pt-2 pb-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-black">TRÒ CHƠI</span>
                        </div>
                        {productGames.map((game) => (
                          <div key={game.gameCode} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50/80 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              {game.status === 'processing' || game.status === 'pending' ? (
                                <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-pulse" />
                              ) : game.status === 'failed' ? (
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                              ) : (
                                <Gamepad2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                              )}
                              <span className="text-xs text-gray-600 truncate">{game.productGameName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {game.status === 'completed' ? (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">Hoàn thành</span>
                              ) : game.status === 'processing' || game.status === 'pending' ? (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium flex items-center gap-1">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Đang tạo
                                </span>
                              ) : game.status === 'failed' ? (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-medium">Lỗi</span>
                              ) : null}
                              {game.status === 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => handlePlayGame(game.gameCode, game.productGameName)}
                                  disabled={launchingGame === game.gameCode}
                                  className="flex items-center gap-0.5 text-[11px] text-white bg-violet-600 hover:bg-violet-700 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {launchingGame === game.gameCode
                                    ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    : <Swords className="w-2.5 h-2.5" />}
                                  Chơi
                                </button>
                              )}
                              {confirmDeleteGame === game.gameCode ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={deleteGame.isPending}
                                    onClick={() => { deleteGame.mutate(game.gameCode); setConfirmDeleteGame(null); }}
                                    className="text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded disabled:opacity-50"
                                  >
                                    {deleteGame.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Xóa'}
                                  </button>
                                  <button type="button" onClick={() => setConfirmDeleteGame(null)} className="text-[11px] text-gray-500 hover:bg-gray-100 px-1.5 py-0.5 rounded">Hủy</button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteGame(game.gameCode)}
                                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </aside>
  );
}
