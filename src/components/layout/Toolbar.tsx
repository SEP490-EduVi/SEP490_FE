'use client';

/**
 * Toolbar Component
 * =================
 *
 * Two-row toolbar:
 *  Row 1 (header): Logo / doc title / undo-redo / online users / present / share
 *  Row 2 (insert bar): Quick-insert buttons for teachers (Tiêu đề, Văn bản, …)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { EduViGame, EduViVideo, exportToEduvi } from '@/lib/exportToEduvi';
import { GAME_BLUEPRINTS } from '@/mediapipe-game/api-contracts.js';
import {
  createPlayableGameTask,
  getGameResultJson,
  getGamesByProductCode,
} from '@/services/gamesServices';
import { getEditedSlideGcsUrl } from '@/services/productServices';
import { getProjectByCode } from '@/services/projectServices';
import { getVideosByProject } from '@/services/videoServices';
import type { GameDto } from '@/types/api';
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
  const searchParams = useSearchParams();
  const document = useDocumentStore((state) => state.document);
  const hasSlides = !!document && Array.isArray(document.cards) && document.cards.length > 0;
  const startPresentation = useDocumentStore((state) => state.startPresentation);
  const canUndo = useDocumentStore((state) => state.canUndo());
  const canRedo = useDocumentStore((state) => state.canRedo());
  const currentProductCode = useDocumentStore((state) => state.currentProductCode);
  const currentProductName = useDocumentStore((state) => state.currentProductName);
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
  const [gameName, setGameName] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<string>('');
  const [isGameCreating, setIsGameCreating] = useState(false);
  const [showEduviExportModal, setShowEduviExportModal] = useState(false);
  const [exportFolderName, setExportFolderName] = useState('');
  const [includeGamesInExport, setIncludeGamesInExport] = useState(false);
  const [gamesForEduviExport, setGamesForEduviExport] = useState<GameDto[]>([]);
  const [selectedProductGameCodes, setSelectedProductGameCodes] = useState<string[]>([]);
  const [isLoadingGamesForExport, setIsLoadingGamesForExport] = useState(false);
  const [isExportingEduvi, setIsExportingEduvi] = useState(false);
  const [isExportingVideoEduvi, setIsExportingVideoEduvi] = useState(false);
  const [eduviExportError, setEduviExportError] = useState('');
  const autoOpenEduviExportRef = useRef(false);

  const getDefaultExportFolderName = useCallback(() => {
    const normalizedTitle = typeof document?.title === 'string' ? document.title.trim() : '';
    return normalizedTitle || 'eduvi-folder';
  }, [document?.title]);

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

  useEffect(() => {
    if (autoOpenEduviExportRef.current) return;
    if (searchParams.get('openEduviExport') !== '1') return;
    if (!hasSlides) return;

    autoOpenEduviExportRef.current = true;
    setShowEduviExportModal(true);
    setExportFolderName((prev) => (prev.trim() ? prev : getDefaultExportFolderName()));
    setIncludeGamesInExport(false);
    setGamesForEduviExport([]);
    setSelectedProductGameCodes([]);
    setEduviExportError('');

    const url = new URL(window.location.href);
    url.searchParams.delete('openEduviExport');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [getDefaultExportFolderName, hasSlides, searchParams]);

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

  const handleExportVideoEduvi = async () => {
    if (!document || !currentProductCode || !currentProjectCode) {
      window.alert('Không xác định được dữ liệu hiện tại để xuất video .eduvi.');
      return;
    }

    setShowShareMenu(false);
    setIsExportingVideoEduvi(true);

    try {
      // Ensure the latest content is saved before selecting the generated video package.
      if (isDirty) {
        await saveSlide();
      }

      const projectVideos = await getVideosByProject(currentProjectCode);
      const candidateVideos = projectVideos
        .filter(
          (video) =>
            video.productCode === currentProductCode
            && video.status === 'completed'
            && typeof video.videoUrl === 'string'
            && video.videoUrl.trim().length > 0,
        )
        .sort((a, b) => {
          const aTs = Date.parse(a.completedAt || a.updatedAt || a.createdAt || '');
          const bTs = Date.parse(b.completedAt || b.updatedAt || b.createdAt || '');
          return (Number.isNaN(bTs) ? 0 : bTs) - (Number.isNaN(aTs) ? 0 : aTs);
        });

      const latestVideo = candidateVideos[0];
      if (!latestVideo || !latestVideo.videoUrl) {
        throw new Error('Chưa có video hoàn thành cho slide này. Vui lòng tạo video trước khi xuất .eduvi.');
      }

      let academicContext: {
        projectCode?: string;
        projectName?: string;
        subjectCode?: string;
        subjectName?: string;
        gradeCode?: string;
        gradeName?: string;
      } | undefined;
      let projectName = '';

      try {
        const project = await getProjectByCode(currentProjectCode);
        projectName = typeof project.projectName === 'string' ? project.projectName.trim() : '';
        academicContext = {
          projectCode: project.projectCode,
          projectName: project.projectName,
          subjectCode: project.subjectCode,
          subjectName: project.subjectName,
          gradeCode: project.gradeCode,
          gradeName: project.gradeName,
        };
      } catch {
        // Keep exporting even when metadata lookup fails.
      }

      const normalizedFolderName =
        projectName
        || (typeof document.title === 'string' ? document.title.trim() : '')
        || 'eduvi-folder';

      const videoOnlyDocument = {
        ...document,
        cards: [],
        activeCardId: '',
      };

      const videosForExport: EduViVideo[] = [
        {
          productVideoCode: latestVideo.productVideoCode,
          productCode: latestVideo.productCode,
          productName: latestVideo.productName,
          status: latestVideo.status,
          duration: latestVideo.duration,
          videoUrl: latestVideo.videoUrl,
          createdAt: latestVideo.createdAt,
          updatedAt: latestVideo.updatedAt,
          completedAt: latestVideo.completedAt,
          interactions: latestVideo.interactions?.filter((i) => i.type !== 'index'),
        },
      ];

      const videoResult = await exportToEduvi(videoOnlyDocument, {
        requireOfflineReady: true,
        academicContext,
        projectName: projectName || undefined,
        folderName: normalizedFolderName,
        packageType: 'video',
        fileNameSuffix: 'video',
        videos: videosForExport,
        mediaFetchTimeoutMs: 120000,
      });

      const embeddedAssets = videoResult.schema.integrity?.stats.embeddedAssetCount ?? 0;
      window.alert(
        `Đã xuất thành công file video .eduvi.\n\n` +
        `- ${videoResult.fileName}\n` +
        `- Offline assets đã nhúng: ${embeddedAssets}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xuất file video .eduvi thất bại';
      window.alert(message);
    } finally {
      setIsExportingVideoEduvi(false);
    }
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
        productGameName: gameName.trim() || 'Game chưa đặt tên',
        productCode: currentProductCode ?? '',
        templateId: gameTemplateId,
        slideEditedDocumentUrl: slideEditedDocumentUrl.trim(),
        roundCount: gameRoundCount,
      });

      setShowGameConfigModal(false);
      setGameStatus('');

      const query = new URLSearchParams({ taskId: task.taskId });
      if (currentProductCode) query.set('productCode', currentProductCode);

      const normalizedProductName =
        typeof currentProductName === 'string' ? currentProductName.trim() : '';
      if (normalizedProductName) query.set('productName', normalizedProductName);

      const normalizedProductGameName =
        gameName.trim() || normalizedProductName || 'Game chưa đặt tên';
      if (normalizedProductGameName) query.set('productGameName', normalizedProductGameName);

      if (gameTemplateId) query.set('templateCode', gameTemplateId);

      router.push(`/teacher/game-maker?${query.toString()}`);
    } catch (e) {
      setGameStatus(e instanceof Error ? e.message : 'Tạo game thất bại');
    } finally {
      setIsGameCreating(false);
    }
  };

  const loadGamesForEduviExport = async () => {
    if (!currentProductCode) {
      setEduviExportError('Không xác định được sản phẩm hiện tại để lấy game.');
      setGamesForEduviExport([]);
      setSelectedProductGameCodes([]);
      return;
    }

    setEduviExportError('');
    setIsLoadingGamesForExport(true);

    try {
      const games = await getGamesByProductCode(currentProductCode);
      const completedGames = games.filter((game) => {
        const normalizedStatus = (game.status || '').toLowerCase();
        return normalizedStatus === 'completed' && !!game.productGameCode?.trim();
      });

      setGamesForEduviExport(completedGames);
      setSelectedProductGameCodes(completedGames.map((game) => game.productGameCode));

      if (completedGames.length === 0) {
        setEduviExportError('Không có game hoàn thành nào thuộc sản phẩm này để xuất.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách game để xuất';
      setEduviExportError(message);
      setGamesForEduviExport([]);
      setSelectedProductGameCodes([]);
    } finally {
      setIsLoadingGamesForExport(false);
    }
  };

  const handleOpenEduviExportModal = () => {
    if (!hasSlides) {
      window.alert('Bạn cần có ít nhất 1 slide để xuất file .eduvi.');
      return;
    }

    setShowShareMenu(false);
    setShowEduviExportModal(true);
    setExportFolderName((prev) => (prev.trim() ? prev : getDefaultExportFolderName()));
    setIncludeGamesInExport(false);
    setGamesForEduviExport([]);
    setSelectedProductGameCodes([]);
    setEduviExportError('');
  };

  const handleIncludeGamesChange = async (checked: boolean) => {
    setIncludeGamesInExport(checked);
    setEduviExportError('');

    if (!checked) return;
    if (gamesForEduviExport.length > 0 || isLoadingGamesForExport) return;

    await loadGamesForEduviExport();
  };

  const toggleSelectedGame = (productGameCode: string) => {
    setSelectedProductGameCodes((prev) =>
      prev.includes(productGameCode)
        ? prev.filter((code) => code !== productGameCode)
        : [...prev, productGameCode],
    );
  };

  const handleExportEduvi = async () => {
    if (!document || !hasSlides) {
      setEduviExportError('Bạn cần có ít nhất 1 slide để xuất file .eduvi.');
      return;
    }

    setEduviExportError('');
    setIsExportingEduvi(true);

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

      const normalizedFolderName =
        exportFolderName.trim() ||
        projectName ||
        (typeof document.title === 'string' ? document.title.trim() : '') ||
        'eduvi-folder';

      let gamesForExport: EduViGame[] | undefined;
      if (includeGamesInExport) {
        if (selectedProductGameCodes.length === 0) {
          throw new Error('Hãy chọn ít nhất một game để xuất file game .eduvi.');
        }

        const selectedGames = gamesForEduviExport.filter((game) =>
          selectedProductGameCodes.includes(game.productGameCode),
        );

        if (selectedGames.length === 0) {
          throw new Error('Không tìm thấy game hợp lệ để xuất. Vui lòng thử tải lại danh sách game.');
        }

        const gamePayloads = await Promise.all(
          selectedGames.map(async (game) => {
            const resultJson = await getGameResultJson(game.productGameCode);

            return {
              gameCode: game.gameCode,
              productGameCode: game.productGameCode,
              productCode: game.productCode,
              productGameName: game.productGameName,
              templateCode: game.templateCode || 'UNKNOWN',
              roundCount: game.roundCount,
              status: game.status || 'completed',
              resultJson,
            } satisfies EduViGame;
          }),
        );

        gamesForExport = gamePayloads;
      }

      const exportedFileNames: string[] = [];

      const slideResult = await exportToEduvi(document, {
        requireOfflineReady: false,
        academicContext,
        projectName: projectName || undefined,
        folderName: normalizedFolderName,
        packageType: 'slide',
        fileNameSuffix: 'slide',
      });
      exportedFileNames.push(slideResult.fileName);

      if (includeGamesInExport) {
        if (!gamesForExport || gamesForExport.length === 0) {
          throw new Error('Không có dữ liệu game hợp lệ để xuất file game .eduvi.');
        }

        const gameOnlyDocument = {
          ...document,
          cards: [],
          activeCardId: '',
        };

        const gameResult = await exportToEduvi(gameOnlyDocument, {
          requireOfflineReady: false,
          academicContext,
          projectName: projectName || undefined,
          games: gamesForExport,
          folderName: normalizedFolderName,
          packageType: 'game',
          fileNameSuffix: 'game',
          embedAssets: false,
        });

        exportedFileNames.push(gameResult.fileName);
      }

      const integrity = slideResult.schema.integrity;
      let successMessage =
        `Đã xuất thành công ${exportedFileNames.length} file .eduvi.\n\n` +
        `Folder trong metadata: ${normalizedFolderName}\n` +
        exportedFileNames.map((name) => `- ${name}`).join('\n');

      if (integrity && !integrity.offlineReady) {
        successMessage +=
          '\n\n' +
          `Lưu ý: còn ${integrity.stats.unresolvedMediaCount} media chưa thể đóng gói offline hoàn toàn trong file slide.`;
      }

      window.alert(successMessage);

      setShowEduviExportModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xuất file .eduvi thất bại';
      setEduviExportError(message);
    } finally {
      setIsExportingEduvi(false);
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
                {isSlideEdited && (
                  <button
                    onClick={() => { void handleExportVideoEduvi(); }}
                    disabled={isSaving || isExportingVideoEduvi}
                    title={isSaving ? 'Đang lưu slide, vui lòng đợi...' : isExportingVideoEduvi ? 'Đang xuất video .eduvi...' : ''}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors',
                      (isSaving || isExportingVideoEduvi)
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {isExportingVideoEduvi
                      ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      : <Download className="w-4 h-4 text-emerald-500" />}
                    Tải video .eduvi
                  </button>
                )}
                <button
                  onClick={handleOpenEduviExportModal}
                  disabled={!hasSlides}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors',
                    !hasSlides ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên game</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  type="text"
                  placeholder="Nhập tên cho game..."
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                />
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số câu</label>
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

      {/* ── EduVi Export Modal ───────────────────────────────────────────── */}
      {showEduviExportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Xuất file .eduvi</h3>
                <p className="text-sm text-gray-500">Luôn xuất 1 file slide. Nếu bật game, hệ thống sẽ xuất thêm 1 file game riêng.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên folder trong metadata</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  type="text"
                  placeholder="vd: dia-li-bai-1"
                  value={exportFolderName}
                  onChange={(e) => setExportFolderName(e.target.value)}
                />
                {/* <p className="text-xs text-gray-500 mt-1">Tên này sẽ được ghi vào `metadata.folderName` của file slide và file game.</p> */}
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3">
                <input
                  type="checkbox"
                  checked={includeGamesInExport}
                  onChange={(e) => { void handleIncludeGamesChange(e.target.checked); }}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Xuất thêm file game .eduvi</p>
                  <p className="text-xs text-gray-500">Nếu bật, hệ thống sẽ lấy danh sách game theo sản phẩm hiện tại và tạo thêm 1 file game chỉ chứa dữ liệu game.</p>
                </div>
              </label>

              {includeGamesInExport && (
                <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">Game đã hoàn thành</p>
                    <button
                      type="button"
                      onClick={() => { void loadGamesForEduviExport(); }}
                      disabled={isLoadingGamesForExport}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40"
                    >
                      Tải lại
                    </button>
                  </div>

                  {isLoadingGamesForExport ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải danh sách game...
                    </div>
                  ) : gamesForEduviExport.length === 0 ? (
                    <p className="text-sm text-gray-500">Không có game nào phù hợp để xuất.</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500">
                        Đã chọn {selectedProductGameCodes.length}/{gamesForEduviExport.length} game.
                      </p>
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                        {gamesForEduviExport.map((game) => (
                          <label
                            key={game.productGameCode}
                            className="flex items-start gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedProductGameCodes.includes(game.productGameCode)}
                              onChange={() => toggleSelectedGame(game.productGameCode)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{game.productGameName}</p>
                              <p className="text-xs text-gray-500 truncate">
                                template: {game.templateCode} • vòng: {game.roundCount} • code: {game.productGameCode}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {!!eduviExportError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{eduviExportError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEduviExportModal(false)}
                disabled={isExportingEduvi}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleExportEduvi}
                disabled={
                  isExportingEduvi ||
                  !hasSlides ||
                  (includeGamesInExport && (isLoadingGamesForExport || selectedProductGameCodes.length === 0))
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isExportingEduvi ? 'Đang xuất...' : 'Xuất file .eduvi'}
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
