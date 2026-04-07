'use client';

/**
 * KeyboardGamePlayer — canvas-only game player for keyboard-driven games.
 *
 * Used for: RUNNER_QUIZ, SNAKE_QUIZ, RUNNER_RACE, SNAKE_DUEL
 * No camera / MediaPipe needed — uses GameEngine with null tracker.
 */

import React from 'react';
import { X } from 'lucide-react';
import { GameEngine } from '@/mediapipe-game/mediapipe-engine.js';

type Props = {
  playable: any;
  onEnd?: () => void;
  onReplay?: () => void;
};

type GameResult = { correct: number; total: number; rounds?: { correct: number; total: number }[] };

const TEMPLATE_LABELS: Record<string, string> = {
  RUNNER_QUIZ:  '🏃 Runner Quiz',
  SNAKE_QUIZ:   '🐍 Snake Quiz',
  RUNNER_RACE:  '🏃‍♂️🏃‍♀️ Runner Race — 2 Người',
  SNAKE_DUEL:   '🐍🐍 Snake Duel — 2 Người',
};

const TEMPLATE_CONTROLS: Record<string, { label: string; keys: string }[]> = {
  RUNNER_QUIZ: [
    { label: 'Di chuyển', keys: 'A / D' },
    { label: 'Nhảy', keys: 'Space' },
    { label: 'Trả lời', keys: 'Z X C V' },
  ],
  SNAKE_QUIZ: [
    { label: 'Điều hướng', keys: 'W A S D / ↑↓←→' },
    { label: 'Trả lời', keys: 'Z X C V / 1 2 3 4' },
  ],
  RUNNER_RACE: [
    { label: 'P1 di chuyển', keys: 'A / D' },
    { label: 'P1 nhảy', keys: 'Space' },
    { label: 'P1 trả lời', keys: 'Z X C V' },
    { label: 'P2 di chuyển', keys: '← / →' },
    { label: 'P2 nhảy', keys: 'Enter' },
    { label: 'P2 trả lời', keys: '1 2 3 4' },
  ],
  SNAKE_DUEL: [
    { label: 'P1 điều hướng', keys: 'W A S D' },
    { label: 'P1 trả lời', keys: 'Z X C V' },
    { label: 'P2 điều hướng', keys: '↑ ↓ ← →' },
    { label: 'P2 trả lời', keys: '1 2 3 4' },
  ],
};

export function KeyboardGamePlayer({ playable, onEnd, onReplay }: Props) {
  const canvasRef  = React.useRef<HTMLCanvasElement | null>(null);
  const engineRef  = React.useRef<any>(null);

  const templateId: string = playable?.templateId ?? '';
  const gameLabel = TEMPLATE_LABELS[templateId] ?? templateId;
  const controls  = TEMPLATE_CONTROLS[templateId] ?? [];

  const [gameResult, setGameResult] = React.useState<GameResult | null>(null);
  const [showEndConfirm, setShowEndConfirm] = React.useState(false);
  const [showControls, setShowControls]     = React.useState(false);

  React.useEffect(() => {
    if (!canvasRef.current) return;

    setGameResult(null);

    const engine = new GameEngine({
      canvasEl: canvasRef.current,
      videoEl:  null as any,  // keyboard games don't use camera
      playable,
      tracker:  null as any,  // not needed for keyboard games
      onStatus: () => {},
      onFinish: (result: GameResult) => setGameResult(result),
      onRoundChange: () => {},
      onAttemptWarning: () => {},
    });

    engineRef.current = engine;
    let cancelled = false;

    (async () => {
      try {
        await engine.init();
      } catch (e) {
        if (cancelled) return;
        console.error('[KeyboardGamePlayer] engine init error', e);
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current = null;
      engine.dispose();
    };
  }, [playable]);

  const handleEnd = () => {
    engineRef.current?.dispose();
    engineRef.current = null;
    onEnd?.();
  };

  // ── Result Screen ─────────────────────────────────────────────────────────
  if (gameResult) {
    const pct = gameResult.total > 0 ? Math.round((gameResult.correct / gameResult.total) * 100) : 0;
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-3">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '😅'}</div>
          <h2 className="text-white text-2xl font-bold mb-1">Kết thúc!</h2>
          <p className="text-slate-400 text-sm mb-6">{gameLabel}</p>
          <div className="text-4xl font-extrabold text-emerald-400 mb-1">{pct}%</div>
          <p className="text-slate-400 text-sm mb-8">
            {gameResult.correct}/{gameResult.total} câu đúng
          </p>
          <div className="flex gap-3 justify-center">
            {onReplay && (
              <button
                onClick={() => { setGameResult(null); onReplay(); }}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
              >
                Chơi lại
              </button>
            )}
            <button
              onClick={handleEnd}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
            >
              Xong
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Game Screen ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div
        className="relative z-20 flex items-center justify-between h-12 shrink-0 px-4"
        style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">{gameLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {controls.length > 0 && (
            <button
              onClick={() => setShowControls((v) => !v)}
              className="px-3 py-1 rounded-lg border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors"
            >
              Phím tắt
            </button>
          )}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* Controls Tooltip */}
      {showControls && controls.length > 0 && (
        <div
          className="absolute top-14 right-4 z-30 bg-slate-900/95 border border-white/10 rounded-xl p-4 min-w-56 shadow-xl"
          onClick={() => setShowControls(false)}
        >
          <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">Phím tắt</p>
          <div className="space-y-2">
            {controls.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-4">
                <span className="text-white/70 text-xs">{c.label}</span>
                <span className="font-mono text-xs bg-white/10 text-white px-2 py-0.5 rounded-md">{c.keys}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End Confirm Dialog */}
      {showEndConfirm && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xs text-center">
            <p className="text-white font-semibold mb-1">Thoát game?</p>
            <p className="text-slate-400 text-sm mb-5">Tiến trình sẽ không được lưu.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
              >
                Tiếp tục
              </button>
              <button
                onClick={handleEnd}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
