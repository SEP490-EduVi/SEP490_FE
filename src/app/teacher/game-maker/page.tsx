'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PresentationGamePlayer } from '@/components/mediapipe-game/PresentationGamePlayer';
import { GameEditorView, type GameEditorPlayable } from '@/components/mediapipe-game/GameEditorView';
import { useGameHub } from '@/hooks/useGameHub';
import { getGameTaskStatus } from '@/services/gamesServices';
import { EduViGame, exportToEduvi } from '@/lib/exportToEduvi';
import { getProjectByCode } from '@/services/projectServices';
import { useDocumentStore } from '@/store';
import type { GameProgressDto } from '@/types/api';
import type { IDocument } from '@/types/nodes';

// ── helpers ──────────────────────────────────────────────────────────────────

function normalizePlayableResult(result: Record<string, unknown> | null): unknown {
  if (!result) return null;
  if ('templateId' in result && 'payload' in result) return result;
  for (const key of ['playable', 'game', 'data', 'payload']) {
    const value = result[key];
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if ('templateId' in obj && 'payload' in obj) return obj;
    }
  }
  return null;
}

function isTerminalStatus(s: string) {
  const n = s.toLowerCase();
  return n === 'completed' || n === 'failed' || n === 'success';
}

function normalizeGameStatusMessage(raw?: string | null) {
  if (!raw) return '';
  const msg = raw.trim();
  if (!msg) return '';

  const lower = msg.toLowerCase();
  if (lower.includes('generating game payload with gemini')) return 'Đang tạo nội dung game bằng Gemini...';
  if (lower.includes('starting game generation') || lower.includes('start game generation')) return 'Đang bắt đầu tạo game...';
  if (lower.includes('validating') && lower.includes('input')) return 'Đang kiểm tra dữ liệu đầu vào...';
  if (lower.includes('fetching') && (lower.includes('slide') || lower.includes('document'))) {
    return 'Đang lấy dữ liệu slide...';
  }
  if (lower.includes('building') && lower.includes('payload')) return 'Đang xây dựng dữ liệu game...';
  if (lower.includes('queue')) return 'Đang xếp hàng xử lý...';
  if (lower.includes('processing')) return 'Đang xử lý...';
  if (lower.includes('completed') || lower.includes('success')) return 'Đã hoàn tất.';

  return msg;
}

type GameExportMeta = {
  gameCode?: string;
  productGameCode?: string;
  productCode?: string;
  productGameName?: string;
  templateCode?: string;
  roundCount?: number;
};

function readStringByKeys(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (normalized) return normalized;
    }
  }

  return undefined;
}

function readNumberByKeys(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return undefined;
}

function normalizeGameExportMeta(result: Record<string, unknown> | null): GameExportMeta {
  if (!result) return {};

  const candidates: Record<string, unknown>[] = [result];

  for (const key of ['game', 'playable', 'data', 'payload']) {
    const nested = result[key];
    if (nested && typeof nested === 'object') {
      candidates.push(nested as Record<string, unknown>);
    }
  }

  const meta: GameExportMeta = {};

  for (const candidate of candidates) {
    meta.gameCode ??= readStringByKeys(candidate, ['gameCode', 'game_code', 'code']);
    meta.productGameCode ??= readStringByKeys(candidate, ['productGameCode', 'product_game_code']);
    meta.productCode ??= readStringByKeys(candidate, ['productCode', 'product_code']);
    meta.productGameName ??= readStringByKeys(candidate, ['productGameName', 'product_game_name', 'name']);
    meta.templateCode ??= readStringByKeys(candidate, ['templateCode', 'templateId', 'template_code']);
    meta.roundCount ??= readNumberByKeys(candidate, ['roundCount', 'round_count']);
  }

  return meta;
}

function mergeGameExportMeta(base: GameExportMeta, patch: GameExportMeta): GameExportMeta {
  return {
    gameCode: patch.gameCode ?? base.gameCode,
    productGameCode: patch.productGameCode ?? base.productGameCode,
    productCode: patch.productCode ?? base.productCode,
    productGameName: patch.productGameName ?? base.productGameName,
    templateCode: patch.templateCode ?? base.templateCode,
    roundCount: patch.roundCount ?? base.roundCount,
  };
}

function buildGameOnlyDocument(source: IDocument | null, fallbackTitle: string, taskId: string | null): IDocument {
  if (source) {
    return {
      ...source,
      cards: [],
      activeCardId: '',
    };
  }

  const now = new Date().toISOString();
  return {
    id: taskId ? `game-export-${taskId}` : 'game-export',
    title: fallbackTitle,
    cards: [],
    activeCardId: '',
    createdAt: now,
    updatedAt: now,
  };
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function GameMakerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get('taskId');
  const [productName] = useState(() => searchParams.get('productName') ?? '');
  const productGameNameParam = searchParams.get('productGameName')?.trim() ?? '';
  const productCodeParam = searchParams.get('productCode')?.trim() ?? '';
  const productGameCodeParam = searchParams.get('productGameCode')?.trim() ?? '';
  const gameCodeParam = searchParams.get('gameCode')?.trim() ?? '';
  const templateCodeParam = searchParams.get('templateCode')?.trim() ?? '';

  const document = useDocumentStore((state) => state.document);
  const currentProductCode = useDocumentStore((state) => state.currentProductCode);
  const currentProductName = useDocumentStore((state) => state.currentProductName);
  const currentProjectCode = useDocumentStore((state) => state.currentProjectCode);

  const taskIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [taskId, setTaskId] = useState<string | null>(null);
  const [playable, setPlayable] = useState<unknown | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isExportingGameEduvi, setIsExportingGameEduvi] = useState(false);
  const [gameExportMeta, setGameExportMeta] = useState<GameExportMeta>(() => ({
    productCode: productCodeParam || undefined,
    productGameCode: productGameCodeParam || undefined,
    gameCode: gameCodeParam || undefined,
    templateCode: templateCodeParam || undefined,
    productGameName: productGameNameParam || undefined,
  }));

  // Stop interval polling
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Apply a progress event
  const applyProgressUpdate = useCallback(
    (event: GameProgressDto) => {
      if (!taskIdRef.current || event.taskId !== taskIdRef.current) return;

      const detail = event.detail?.trim();
      const step = event.step?.trim();
      if (detail) setStatusText(normalizeGameStatusMessage(detail));
      else if (step) setStatusText(normalizeGameStatusMessage(`Đang xử lý: ${step}`));

      if (event.status.toLowerCase() === 'failed') {
        stopPolling();
        setIsLoading(false);
        setStatusText(normalizeGameStatusMessage(event.error || 'Tạo game thất bại'));
        return;
      }

      if (isTerminalStatus(event.status)) {
        const result = normalizePlayableResult(event.result as Record<string, unknown> | null);
        if (result) {
          setGameExportMeta((prev) => mergeGameExportMeta(prev, normalizeGameExportMeta(event.result)));
          stopPolling();
          setPlayable(result);
          setIsEditing(true);
          setIsLoading(false);
          setStatusText('');
        }
      }
    },
    [stopPolling],
  );

  // SignalR live updates
  useGameHub({ accessToken: taskId ? accessToken : null, onProgress: applyProgressUpdate });

  // Resume an existing task (navigated here from Toolbar with taskId in URL)
  const resumeExistingTask = useCallback(
    async (id: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      taskIdRef.current = id;
      setAccessToken(token);
      setTaskId(id);
      setPlayable(null);
      setIsLoading(true);
      setStatusText('Đang xử lý...');

      // Immediate first poll
      try {
        const first = await getGameTaskStatus(id);
        applyProgressUpdate(first);
      } catch {
        /* ignore */
      }

      // Fallback interval polling
      stopPolling();
      pollTimerRef.current = setInterval(async () => {
        try {
          const latest = await getGameTaskStatus(id);
          applyProgressUpdate(latest);
        } catch {
          /* ignore */
        }
      }, 3000);
    },
    [applyProgressUpdate, stopPolling],
  );

  // On mount, start polling for the taskId in the URL
  useEffect(() => {
    if (taskIdParam) {
      resumeExistingTask(taskIdParam);
    }
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIdParam]);

  // Game end / replay
  const handleEnd = useCallback(() => {
    stopPolling();
    taskIdRef.current = null;
    setPlayable(null);
    setTaskId(null);
    setIsLoading(false);
    setStatusText('');
    setIsEditing(false);
    router.back();
  }, [router, stopPolling]);

  const handleReplay = useCallback(() => {
    // Return to edit screen instead of navigating away
    setIsEditing(true);
  }, []);

  const handleExportGameEduvi = useCallback(
    async (edited: GameEditorPlayable) => {
      setIsExportingGameEduvi(true);

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
            // Keep export flow smooth when project metadata cannot be loaded.
          }
        }

        const normalizedCurrentProductName =
          typeof currentProductName === 'string' ? currentProductName.trim() : '';
        const normalizedProductName = productName.trim() || normalizedCurrentProductName;
        const normalizedExportTitle = normalizedProductName || projectName || 'game-export';
        const normalizedFolderName = normalizedProductName || projectName || 'eduvi-game-folder';

        const effectiveProductCode =
          gameExportMeta.productCode || currentProductCode || productCodeParam || 'UNKNOWN_PRODUCT';
        const effectiveTemplateCode =
          gameExportMeta.templateCode || edited.templateId || 'UNKNOWN_TEMPLATE';
        const resolvedRoundCountFromPayload = Array.isArray(edited.payload) ? edited.payload.length : 1;
        const effectiveRoundCount =
          typeof gameExportMeta.roundCount === 'number' && gameExportMeta.roundCount > 0
            ? gameExportMeta.roundCount
            : Math.max(1, resolvedRoundCountFromPayload);
        const effectiveProductGameCode =
          gameExportMeta.productGameCode || gameExportMeta.gameCode || taskId || 'UNKNOWN_PRODUCT_GAME';
        const effectiveGameCode = gameExportMeta.gameCode || taskId || effectiveProductGameCode;
        const effectiveProductGameName =
          gameExportMeta.productGameName || `Game ${taskId ?? ''}`.trim();

        const gamePayload: EduViGame = {
          gameCode: effectiveGameCode,
          productGameCode: effectiveProductGameCode,
          productCode: effectiveProductCode,
          productGameName: effectiveProductGameName,
          templateCode: effectiveTemplateCode,
          roundCount: effectiveRoundCount,
          status: 'completed',
          resultJson: edited,
        };

        const gameOnlyDocument = buildGameOnlyDocument(
          document,
          normalizedExportTitle,
          taskId,
        );

        const result = await exportToEduvi(gameOnlyDocument, {
          requireOfflineReady: false,
          academicContext,
          projectName: normalizedExportTitle,
          games: [gamePayload],
          folderName: normalizedFolderName,
          packageType: 'game',
          fileNameSuffix: 'game',
          embedAssets: false,
        });

        window.alert(
          'Đã xuất file game .eduvi thành công.\n\n' +
          `Folder trong metadata: ${normalizedFolderName}\n` +
          `File: ${result.fileName}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Xuất file game .eduvi thất bại';
        window.alert('Xuất file game .eduvi thất bại.\n\n' + message);
      } finally {
        setIsExportingGameEduvi(false);
      }
    },
    [
      currentProductCode,
      currentProjectCode,
      document,
      gameExportMeta,
      productCodeParam,
      productName,
      currentProductName,
      taskId,
    ],
  );

  // ── render ────────────────────────────────────────────────────────────────

  // Edit screen — shown first after game generation
  if (playable && isEditing) {
    return (
      <GameEditorView
        playable={playable as GameEditorPlayable}
        productName={productName}
        isExportingGameEduvi={isExportingGameEduvi}
        onExportGameEduvi={handleExportGameEduvi}
        onStart={(edited) => {
          setPlayable(edited);
          setIsEditing(false);
        }}
      />
    );
  }

  // Fullscreen game player — shown after user clicks "Bắt đầu"
  if (playable && !isEditing) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <PresentationGamePlayer
          playable={playable}
          onEnd={handleEnd}
          onReplay={handleReplay}
        />
      </div>
    );
  }

  // Loading state
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-800">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <div className="text-center">
          <p className="text-lg font-semibold">Đang tạo game...</p>
          {statusText && (
            <p className="mt-1.5 text-sm text-slate-500 max-w-[280px]">{statusText}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleEnd}
          className="mt-2 text-xs text-slate-500 hover:text-slate-700 transition-colors underline underline-offset-2"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
