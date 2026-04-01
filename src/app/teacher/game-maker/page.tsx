'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { GAME_BLUEPRINTS } from '@/mediapipe-game/api-contracts.js';
import { PresentationGamePlayer } from '@/components/mediapipe-game/PresentationGamePlayer';

type TemplateId = (typeof GAME_BLUEPRINTS)[keyof typeof GAME_BLUEPRINTS];

export default function GameMakerPage() {
  const router = useRouter();

  const [templateId, setTemplateId] = React.useState<TemplateId>(GAME_BLUEPRINTS.HOVER_SELECT);
  const [timeLimitSec, setTimeLimitSec] = React.useState<number>(60);
  const [hoverHoldMs, setHoverHoldMs] = React.useState<number>(2000);
  const [pinchThreshold, setPinchThreshold] = React.useState<number>(0.045);

  const [status, setStatus] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [playable, setPlayable] = React.useState<any | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setStatus('Đang gửi cấu hình xuống BE...');

    const req = {
      templateId,
      slideDataReferences: {
        documentId: 'mock_document',
        slideIds: ['mock_slide_1'],
        note: 'Temp preview only (preset=game_quiz)',
      },
      teacherConfigs: {
        timeLimitSec,
        hoverHoldMs,
        pinchThreshold,
        enableSound: false,
      },
    };

    // eslint-disable-next-line no-console
    console.log('[GameConfigRequest]', req);

    try {
      const res = await fetch('/api/games/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `BE error (${res.status})`);
      }

      const data = await res.json();
      setPlayable(data);
      setStatus('');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setStatus(e instanceof Error ? e.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnd = () => {
    // No persistence: just leave the page.
    setPlayable(null);
    router.push('/teacher/editor');
  };

  return (
    <div className="min-h-screen bg-surface-tertiary">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="rounded-xl border border-border bg-surface shadow-card">
          <div className="px-6 py-4 border-b border-border">
            <h1 className="text-lg font-semibold text-slate-800">Tạo & chơi mini-game</h1>
            <p className="text-sm text-slate-500 mt-1">Chọn loại game → gửi BE trả payload → render để chơi. Không lưu trò chơi.</p>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time limit (sec)</label>
                  <input
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    type="number"
                    min={5}
                    max={600}
                    value={timeLimitSec}
                    onChange={(e) => setTimeLimitSec(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hover hold (ms)</label>
                  <input
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    type="number"
                    min={250}
                    max={5000}
                    value={hoverHoldMs}
                    onChange={(e) => setHoverHoldMs(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pinch threshold</label>
                  <input
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    type="number"
                    min={0.005}
                    max={0.2}
                    step={0.001}
                    value={pinchThreshold}
                    onChange={(e) => setPinchThreshold(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </div>

                {status && <div className="text-sm text-slate-600">{status}</div>}

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
    </div>
  );
}
