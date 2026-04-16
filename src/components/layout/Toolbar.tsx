'use client';

/**
 * Toolbar Component
 * =================
 *
 * Two-row toolbar:
 *  Row 1 (header): Logo / doc title / undo-redo / online users / present / share
 *  Row 2 (insert bar): Quick-insert buttons for teachers (Tiêu đề, Văn bản, …)
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { exportToEduvi } from '@/lib/exportToEduvi';
import { GAME_BLUEPRINTS } from '@/mediapipe-game/api-contracts.js';
import { createPlayableGameTask } from '@/services/gamesServices';
import { getEditedSlideGcsUrl } from '@/services/productServices';
import { getProjectByCode } from '@/services/projectServices';
import {
  Undo2,
  Redo2,
  Play,
  ChevronDown,
  Save,
  Loader2,
  ArrowLeft,
  Film,
  Gamepad2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { ContextualTextToolbar } from '@/components/blocks/FloatingTextToolbar';

type TemplateId = (typeof GAME_BLUEPRINTS)[keyof typeof GAME_BLUEPRINTS];
const LAST_EDITED_SLIDE_URL_KEY = 'eduvi_last_edited_slide_gcs_url';

export function Toolbar() {
  const router = useRouter();
  const document = useDocumentStore((state) => state.document);
  const startPresentation = useDocumentStore((state) => state.startPresentation);
  const canUndo = useDocumentStore((state) => state.canUndo());
  const canRedo = useDocumentStore((state) => state.canRedo());
  const currentProductCode = useDocumentStore((state) => state.currentProductCode);
  const currentProjectCode = useDocumentStore((state) => state.currentProjectCode);
  const isSaving = useDocumentStore((state) => state.isSaving);
  const saveSlide = useDocumentStore((state) => state.saveSlide);
  const isDirty = useDocumentStore((state) => state.isDirty);
  const isSlideEdited = useDocumentStore((state) => state.isSlideEdited);
  const isNewlyGenerated = useDocumentStore((state) => state.isNewlyGenerated);

  const [showVideoConfirm, setShowVideoConfirm] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [showGameConfigModal, setShowGameConfigModal] = useState(false);
  const [gameTemplateId, setGameTemplateId] = useState<TemplateId>(GAME_BLUEPRINTS.HOVER_SELECT);
  const [gameRoundCount, setGameRoundCount] = useState<number>(1);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [isGameCreating, setIsGameCreating] = useState(false);

  useEffect(() => {
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (isDirty || (isNewlyGenerated && !isSlideEdited)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
  }, [isDirty, isNewlyGenerated, isSlideEdited]);

  // Block browser native back button when user hasn't edited+saved an AI-generated slide
  useEffect(() => {
    if (!isNewlyGenerated || isSlideEdited) return;
    // Push a dummy entry so the native back button triggers popstate instead of leaving
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      // Re-push to stay on this page, then show the warning
      window.history.pushState(null, '', window.location.href);
      setShowExitWarning(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isNewlyGenerated, isSlideEdited]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showShareMenu]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useDocumentStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useDocumentStore.getState().redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const state = useDocumentStore.getState();
        if (state.isDirty || (state.isNewlyGenerated && !state.isSlideEdited)) state.saveSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGenerateVideo = async () => {
    if (!currentProductCode) return;
    setShowVideoConfirm(true);
  };

  const handleConfirmGenerateVideo = async () => {
    if (!currentProductCode || !currentProjectCode) return;
    setShowVideoConfirm(false);
    // Save first if there are unsaved changes so the video uses the latest slide
    if (isDirty) {
      await saveSlide();
    }
    // Navigate to the project page and pass params so it auto-starts video generation
    router.push(
      `/teacher/${encodeURIComponent(currentProjectCode)}?action=generate-video&productCode=${encodeURIComponent(currentProductCode)}`
    );
  };

  const handleStartGame = async () => {
    if (!currentProductCode) {
      setGameStatus('Không xác định được sản phẩm hiện tại.');
      return;
    }

    if (isDirty) {
      setGameStatus('Bạn có thay đổi chưa lưu. Hãy lưu slide trước khi tạo game.');
      return;
    }

    const cachedUrl = sessionStorage.getItem(LAST_EDITED_SLIDE_URL_KEY) ?? '';
    let slideEditedDocumentUrl = cachedUrl;

    if (!slideEditedDocumentUrl.trim()) {
      try {
        const gcsUrl = await getEditedSlideGcsUrl(currentProductCode);
        if (gcsUrl) {
          slideEditedDocumentUrl = gcsUrl;
          sessionStorage.setItem(LAST_EDITED_SLIDE_URL_KEY, gcsUrl);
        }
      } catch {
        // Use local cached value if available.
      }
    }

    if (!slideEditedDocumentUrl.trim()) {
      setGameStatus('Chưa tìm thấy dữ liệu slide đã lưu. Vui lòng lưu slide trước rồi thử lại.');
      return;
    }

    setGameStatus('Đang gửi yêu cầu tạo game...');
    setIsGameCreating(true);

    try {
      const task = await createPlayableGameTask({
        templateId: gameTemplateId,
        slideEditedDocumentUrl: slideEditedDocumentUrl.trim(),
        roundCount: gameRoundCount,
      });

      setShowGameConfigModal(false);
      setGameStatus('');
      router.push(`/teacher/game-maker?taskId=${encodeURIComponent(task.taskId)}`);
    } catch (e) {
      setGameStatus(e instanceof Error ? e.message : 'Tạo game thất bại');
    } finally {
      setIsGameCreating(false);
    }
  };

  return (
    <>
    <div className="flex flex-col shadow-md">
      {/* ── Row 1: Main navigation bar ────────────────────────────────────── */}
      <header className="h-14 bg-gradient-to-r from-[#0d3349] via-[#1a5276] to-[#2980b9] px-4 flex items-center justify-between">
        {/* Left: back button + title + undo/redo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isNewlyGenerated && !isSlideEdited) {
                setShowExitWarning(true);
                return;
              }
              if (isDirty) {
                pendingNavRef.current = currentProjectCode ? `/teacher/${currentProjectCode}` : null;
                setShowUnsavedWarning(true);
                return;
              }
              if (currentProjectCode) {
                router.push(`/teacher/${currentProjectCode}`);
              } else {
                router.back();
              }
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            title="Quay lại dự án"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-base font-semibold text-white max-w-[200px] truncate">
            {document?.title || 'EduVi'}
          </h1>

          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => useDocumentStore.getState().undo()}
              disabled={!canUndo}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-white transition-colors',
                canUndo ? 'hover:bg-white/15' : 'opacity-40 cursor-not-allowed'
              )}
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
              <span>Hoàn tác</span>
            </button>
            <button
              onClick={() => useDocumentStore.getState().redo()}
              disabled={!canRedo}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-white transition-colors',
                canRedo ? 'hover:bg-white/15' : 'opacity-40 cursor-not-allowed'
              )}
              title="Làm lại (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
              <span>Làm lại</span>
            </button>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={startPresentation}
            disabled={!document || !document.cards.length}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'bg-white/15 hover:bg-white/25 text-white font-medium text-sm transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            title="Thuyết trình"
          >
            <Play className="w-4 h-4" />
            Thuyết trình
          </button>

          <button
            onClick={saveSlide}
            disabled={(!isDirty && !(isNewlyGenerated && !isSlideEdited)) || !document || !currentProductCode || isSaving}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors',
              (isDirty || (isNewlyGenerated && !isSlideEdited)) && document && currentProductCode && !isSaving
                ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-md'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            )}
            title="Lưu (Ctrl+S)"
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />}
            Lưu
          </button>

          {/* Chia sẻ dropdown */}
          <div className="relative" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm transition-colors shadow-sm"
            >
              Chia sẻ
              <ChevronDown className="w-3 h-3" />
            </button>

            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-[9999]">
                <button
                  onClick={() => {
                    setShowShareMenu(false);
                    setShowGameConfigModal(true);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Gamepad2 className="w-4 h-4 text-purple-500" />
                  Tạo game
                </button>
                {isSlideEdited && (
                  <button
                    onClick={() => { handleGenerateVideo(); setShowShareMenu(false); }}
                    disabled={isDirty}
                    title={isDirty ? 'Hãy lưu slide trước khi tạo video' : ''}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors',
                      isDirty ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Film className="w-4 h-4 text-amber-500" />
                    Tạo video
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!document) {
                      setShowShareMenu(false);
                      return;
                    }

                    try {
                      let academicContext: {
                        projectCode?: string;
                        projectName?: string;
                        subjectCode?: string;
                        subjectName?: string;
                        gradeCode?: string;
                        gradeName?: string;
                      } | undefined;
                      let projectName = '';

                      if (currentProjectCode) {
                        try {
                          const project = await getProjectByCode(currentProjectCode);
                          projectName =
                            typeof project.projectName === 'string' ? project.projectName.trim() : '';
                          academicContext = {
                            projectCode: project.projectCode,
                            projectName: project.projectName,
                            subjectCode: project.subjectCode,
                            subjectName: project.subjectName,
                            gradeCode: project.gradeCode,
                            gradeName: project.gradeName,
                          };
                        } catch {
                          // Keep export flow smooth even if metadata lookup fails.
                        }
                      }

                      const result = await exportToEduvi(document, {
                        requireOfflineReady: false,
                        academicContext,
                        projectName: projectName || undefined,
                      });
                      const integrity = result.schema.integrity;

                      if (integrity && !integrity.offlineReady) {
                        window.alert(
                          'Đã xuất file .eduvi thành công.\n\n' +
                          `Lưu ý: còn ${integrity.stats.unresolvedMediaCount} media chưa thể đóng gói offline hoàn toàn. ` +
                          'Khi không có mạng, các media này sẽ hiện ô trống.\n\n' 
                          
                          ,
                        );
                      }
                    } catch (error) {
                      const message = error instanceof Error ? error.message : 'Xuất file .eduvi thất bại';
                      window.alert(
                        'Xuất file .eduvi thất bại.\n\n' + message,
                      );
                    } finally {
                      setShowShareMenu(false);
                    }
                  }}
                  disabled={!document}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors',
                    !document ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  Tải file .eduvi
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating text toolbar — portal to document.body, no layout impact */}
      <ContextualTextToolbar />
    </div>

      {/* ── Video Confirmation Modal ──────────────────────────────────────── */}
      {showVideoConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Film className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Xác nhận tạo video</h3>
                <p className="text-sm text-gray-500">Tính năng tạo video sử dụng tài nguyên AI đáng kể và có thể mất vài phút. Bạn có chắc muốn tiếp tục không?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowVideoConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmGenerateVideo}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors"
              >
                <Film className="w-4 h-4" />
                Xác nhận tạo video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Game Configuration Modal ─────────────────────────────────────── */}
      {showGameConfigModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Tạo game</h3>
                <p className="text-sm text-gray-500">Chọn cấu hình trước khi bắt đầu tạo mini-game.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dạng trò chơi</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: GAME_BLUEPRINTS.HOVER_SELECT, label: 'Giơ tay & Chọn',     desc: 'Giơ tay chọn đáp án',    icon: '🖐️' },
                      { id: GAME_BLUEPRINTS.DRAG_DROP,    label: 'Kéo & Thả',           desc: 'Kéo thả đáp án',         icon: '✋' },
                      { id: GAME_BLUEPRINTS.RUNNER_QUIZ,  label: 'Chạy trắc nghiệm',    desc: 'Mario chạy (1 người)',   icon: '🏃' },
                      { id: GAME_BLUEPRINTS.SNAKE_QUIZ,   label: 'Rắn trắc nghiệm',     desc: 'Rắn quiz (1 người)',     icon: '🐍' },
                      { id: GAME_BLUEPRINTS.RUNNER_RACE,  label: 'Đua tốc độ',           desc: 'Mario đua (2 người)',    icon: '🏁' },
                      { id: GAME_BLUEPRINTS.SNAKE_DUEL,   label: 'Rắn đấu',              desc: 'Rắn đấu (2 người)',      icon: '⚔️' },
                    ] as { id: TemplateId; label: string; desc: string; icon: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGameTemplateId(opt.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        gameTemplateId === opt.id
                          ? 'border-violet-400 bg-violet-50 text-violet-700'
                          : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/40 text-gray-700'
                      }`}
                    >
                      <span className="text-lg leading-none">{opt.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{opt.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số vòng</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  type="number"
                  min={1}
                  value={gameRoundCount}
                  onChange={(e) => setGameRoundCount(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>

              {!!gameStatus && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{gameStatus}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowGameConfigModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleStartGame}
                disabled={isGameCreating}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors"
              >
                {isGameCreating ? 'Đang tạo...' : 'Bắt đầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unsaved Warning Modal ──────────────────────────────────────────── */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Có thay đổi chưa lưu</h3>
                <p className="text-sm text-gray-500">Bạn có thay đổi chưa được lưu. Bạn có muốn lưu trước khi thoát không?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowUnsavedWarning(false);
                  if (pendingNavRef.current) router.push(pendingNavRef.current);
                  else router.back();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Thoát không lưu
              </button>
              <button
                onClick={async () => {
                  setShowUnsavedWarning(false);
                  await saveSlide();
                  if (pendingNavRef.current) router.push(pendingNavRef.current);
                  else router.back();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                Lưu và thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exit Warning Modal ──────────────────────────────────────────────── */}
      {showExitWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Chưa thể thoát</h3>
                <p className="text-sm text-gray-500">Slide vừa được AI tạo ra. Bạn cần lưu slide ít nhất một lần trước khi quay lại.</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-orange-700 font-medium">💡 Nhấn <strong>Lưu và thoát</strong> bên dưới hoặc <strong>Ctrl+S</strong> để lưu, sau đó bạn có thể thoát.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExitWarning(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                onClick={async () => {
                  setShowExitWarning(false);
                  await saveSlide();
                  if (currentProjectCode) router.push(`/teacher/${currentProjectCode}`);
                  else router.back();
                }}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Lưu và thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Toolbar;
