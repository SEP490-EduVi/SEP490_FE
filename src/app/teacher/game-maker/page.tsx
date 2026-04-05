'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { GAME_BLUEPRINTS } from '@/mediapipe-game/api-contracts.js';
import { PresentationGamePlayer } from '@/components/mediapipe-game/PresentationGamePlayer';
import { useGameHub } from '@/hooks/useGameHub';
import { createPlayableGameTask, getGameTaskStatus } from '@/services/gamesServices';
import { getEditedSlideGcsUrl } from '@/services/productServices';
import type { GameProgressDto } from '@/types/api';

type TemplateId = (typeof GAME_BLUEPRINTS)[keyof typeof GAME_BLUEPRINTS];

const LAST_EDITED_SLIDE_URL_KEY = 'eduvi_last_edited_slide_gcs_url';
const PRODUCT_CODE_KEY = 'eduvi_product_code';
const POLLING_INTERVAL_MS = 3000;

function normalizePlayableResult(result: Record<string, unknown> | null): unknown {
  if (!result) return null;

  if ('templateId' in result && 'payload' in result) return result;

  const candidateKeys = ['playable', 'game', 'data', 'payload'];
  for (const key of candidateKeys) {
    const value = result[key];
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if ('templateId' in obj && 'payload' in obj) {
        return obj;
      }
    }
  }

  return null;
}

function isTerminalStatus(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized === 'completed' || normalized === 'failed' || normalized === 'success';
}

export default function GameMakerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [templateId, setTemplateId] = React.useState<TemplateId>(GAME_BLUEPRINTS.HOVER_SELECT);
  const [roundCount, setRoundCount] = React.useState<number>(1);
  const [slideEditedDocumentUrl, setSlideEditedDocumentUrl] = React.useState<string>('');

  const [status, setStatus] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [playable, setPlayable] = React.useState<any | null>(null);
  const [taskId, setTaskId] = React.useState<string | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  const pollTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoStartedRef = React.useRef(false);
  const startedTaskFromQueryRef = React.useRef<string | null>(null);

  const shouldAutoStart = searchParams.get('autoStart') === '1';

  const stopPolling = React.useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const applyProgressUpdate = React.useCallback(
    (event: GameProgressDto) => {
      if (!taskId || event.taskId !== taskId) return;

      const detail = event.detail?.trim();
      const step = event.step?.trim();
      if (detail) {
        setStatus(detail);
      } else if (step) {
        setStatus(`Đang xử lý: ${step}`);
      }

      if (event.status.toLowerCase() === 'failed') {
        stopPolling();
        setIsLoading(false);
        setStatus(event.error || 'Tạo game thất bại');
        return;
      }

      if (isTerminalStatus(event.status)) {
        const playableData = normalizePlayableResult(event.result);
        if (playableData) {
          stopPolling();
          setPlayable(playableData);
          setIsLoading(false);
          setStatus('');
          return;
        }
      }
    },
    [taskId, stopPolling],
  );

  useGameHub({ accessToken: taskId ? accessToken : null, onProgress: applyProgressUpdate });

  React.useEffect(() => {
    setAccessToken(localStorage.getItem('accessToken'));

    const templateFromQuery = searchParams.get('templateId');
    if (
      templateFromQuery === GAME_BLUEPRINTS.HOVER_SELECT ||
      templateFromQuery === GAME_BLUEPRINTS.DRAG_DROP
    ) {
      setTemplateId(templateFromQuery as TemplateId);
    }

    const roundFromQuery = Number(searchParams.get('roundCount'));
    if (!Number.isNaN(roundFromQuery) && roundFromQuery >= 1) {
      setRoundCount(Math.floor(roundFromQuery));
    }

    const cachedUrl = sessionStorage.getItem(LAST_EDITED_SLIDE_URL_KEY) ?? '';
    setSlideEditedDocumentUrl(cachedUrl);

    const productCode = sessionStorage.getItem(PRODUCT_CODE_KEY);
    if (!productCode) return;

    let cancelled = false;
    (async () => {
      try {
        const gcsUrl = await getEditedSlideGcsUrl(productCode);
        if (cancelled || !gcsUrl) return;

        setSlideEditedDocumentUrl(gcsUrl);
        sessionStorage.setItem(LAST_EDITED_SLIDE_URL_KEY, gcsUrl);
      } catch {
        if (!cancelled && !cachedUrl) {
          setStatus('Không lấy được dữ liệu slide đã lưu từ server. Vui lòng thử lại sau.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  React.useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const startPolling = React.useCallback(
    (createdTaskId: string) => {
      stopPolling();

      pollTimerRef.current = setInterval(async () => {
        try {
          const latest = await getGameTaskStatus(createdTaskId);
          applyProgressUpdate(latest);
        } catch {
          // Keep polling to survive transient network failures.
        }
      }, POLLING_INTERVAL_MS);
    },
    [applyProgressUpdate, stopPolling],
  );

  const resumeExistingTask = React.useCallback(
    async (existingTaskId: string) => {
      setTaskId(existingTaskId);
      setPlayable(null);
      setIsLoading(true);
      setStatus('Đang xử lý game...');

      try {
        const firstStatus = await getGameTaskStatus(existingTaskId);
        applyProgressUpdate(firstStatus);
      } catch {
        // Ignore first-status failure and continue polling.
      }

      startPolling(existingTaskId);
    },
    [applyProgressUpdate, startPolling],
  );

  const handleStart = React.useCallback(async () => {
    if (!slideEditedDocumentUrl.trim()) {
      setStatus('Chưa tìm thấy dữ liệu slide đã lưu. Vui lòng lưu slide trước rồi thử lại.');
      return;
    }

    setIsLoading(true);
    setPlayable(null);
    setStatus('');

    const req = {
      templateId,
      slideEditedDocumentUrl: slideEditedDocumentUrl.trim(),
      roundCount,
    };

    // eslint-disable-next-line no-console
    console.log('[CreatePlayableGameTaskInput]', req);

    try {
      const task = await createPlayableGameTask(req);
      setTaskId(task.taskId);

      try {
        const firstStatus = await getGameTaskStatus(task.taskId);
        applyProgressUpdate(firstStatus);
      } catch {
        // Ignore first-status failure and continue polling.
      }

      startPolling(task.taskId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      stopPolling();
      setStatus(e instanceof Error ? e.message : 'Failed to start game');
      setIsLoading(false);
    }
  }, [applyProgressUpdate, roundCount, slideEditedDocumentUrl, startPolling, stopPolling, templateId]);

  React.useEffect(() => {
    const existingTaskId = searchParams.get('taskId')?.trim();
    if (!existingTaskId) return;
    if (startedTaskFromQueryRef.current === existingTaskId) return;

    startedTaskFromQueryRef.current = existingTaskId;
    void resumeExistingTask(existingTaskId);
  }, [resumeExistingTask, searchParams]);

  React.useEffect(() => {
    if (!shouldAutoStart || hasAutoStartedRef.current || isLoading || !!playable) return;
    if (searchParams.get('taskId')) return;
    if (!slideEditedDocumentUrl.trim()) return;

    hasAutoStartedRef.current = true;
    handleStart();
  }, [handleStart, isLoading, playable, searchParams, shouldAutoStart, slideEditedDocumentUrl]);

  const handleEnd = () => {
    stopPolling();
    setPlayable(null);
    setTaskId(null);
    router.push('/teacher/editor');
  };

  return (
    <div className="relative min-h-screen bg-surface-tertiary">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="rounded-xl border border-border bg-surface shadow-card">
          <div className="px-6 py-4 border-b border-border">
            <h1 className="text-lg font-semibold text-slate-800">Tạo & chơi mini-game</h1>
            <p className="text-sm text-slate-500 mt-1"></p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {!playable ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dạng trò chơi</label>
                  <select
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value as TemplateId)}
                    disabled={isLoading}
                  >
                    <option value={GAME_BLUEPRINTS.HOVER_SELECT}>HOVER_SELECT</option>
                    <option value={GAME_BLUEPRINTS.DRAG_DROP}>DRAG_DROP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số round</label>
                  <input
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    type="number"
                    min={1}
                    value={roundCount}
                    onChange={(e) => setRoundCount(Math.max(1, Number(e.target.value) || 1))}
                    disabled={isLoading}
                  />
                </div>

                {!isLoading && status && <div className="text-sm text-slate-600">{status}</div>}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-border bg-surface-secondary hover:bg-surface-tertiary text-sm font-semibold"
                    onClick={handleEnd}
                    disabled={isLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-border bg-surface-secondary hover:bg-surface-tertiary text-sm font-semibold disabled:opacity-50"
                    onClick={handleStart}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Đang tạo...' : 'Bắt đầu'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <PresentationGamePlayer playable={playable} />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-border bg-surface-secondary hover:bg-surface-tertiary text-sm font-semibold"
                    onClick={handleEnd}
                  >
                    Kết thúc
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {isLoading && !playable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/40 bg-white/85 px-8 py-6 shadow-xl">
            <div className="flex flex-col items-center gap-3 text-slate-800">
              <Loader2 className="h-9 w-9 animate-spin" />
              <p className="text-sm font-semibold">Đang tạo game, vui lòng chờ...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
