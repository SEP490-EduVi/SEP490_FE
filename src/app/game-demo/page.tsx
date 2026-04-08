'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type GameType = 'RUNNER_QUIZ' | 'SNAKE_QUIZ' | 'RUNNER_RACE' | 'SNAKE_DUEL' | null;

export default function GameDemoPage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const engineRef  = useRef<any>(null);
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [status, setStatus]         = useState('');
  const [finished, setFinished]     = useState(false);

  // Poll engine for finish state
  useEffect(() => {
    if (!activeGame) return;
    setFinished(false);
    const interval = setInterval(() => {
      if (engineRef.current?.isFinished) {
        setFinished(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [activeGame]);

  // Auto-focus canvas so keyboard events are captured
  useEffect(() => {
    if (activeGame) {
      setTimeout(() => canvasRef.current?.focus(), 100);
    }
  }, [activeGame]);

  const startGame = useCallback(async (type: GameType) => {
    if (!type) return;

    if (engineRef.current) {
      try { engineRef.current.dispose(); } catch (_) {}
      engineRef.current = null;
    }
    setFinished(false);
    setActiveGame(type);
    setStatus('Đang khởi tạo...');

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Dynamic imports — runs only in browser (inside useEffect)
      const [engineMod, contractsMod] = await Promise.all([
        import('@/mediapipe-game/mediapipe-engine.js') as Promise<any>,
        import('@/mediapipe-game/api-contracts.js')    as Promise<any>,
      ]);

      const { GameEngine } = engineMod;
      const { createMockRunnerQuiz, createMockSnakeQuiz, createMockRunnerRace, createMockSnakeDuel } = contractsMod;

      const playable =
        type === 'RUNNER_QUIZ' ? createMockRunnerQuiz() :
        type === 'SNAKE_QUIZ'  ? createMockSnakeQuiz()  :
        type === 'RUNNER_RACE' ? createMockRunnerRace() :
                                 createMockSnakeDuel();

      const engine = new GameEngine({
        canvasEl: canvas,
        videoEl:  null,
        playable,
        tracker:  null,
        onStatus: (s: string) => setStatus(s),
      });

      engineRef.current = engine;
      await engine.init();
    } catch (err) {
      console.error(err);
      setStatus('Lỗi: ' + String(err));
    }
  }, []);

  const stopGame = useCallback(() => {
    if (engineRef.current) {
      try { engineRef.current.dispose(); } catch (_) {}
      engineRef.current = null;
    }
    setActiveGame(null);
    setStatus('');
    setFinished(false);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-2 text-slate-900">🎮 Game Demo — Bàn phím</h1>
      <p className="text-sm text-slate-600 mb-6">Demo game giáo dục, không cần camera</p>

      {/* Game picker */}
      <div className="flex gap-4 mb-4 flex-wrap justify-center">
        <button
          onClick={() => startGame('RUNNER_QUIZ')}
          disabled={activeGame === 'RUNNER_QUIZ'}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
        >
          🏃 Mario Runner Quiz
        </button>
        <button
          onClick={() => startGame('SNAKE_QUIZ')}
          disabled={activeGame === 'SNAKE_QUIZ'}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
        >
          🐍 Snake Quiz
        </button>
        <button
          onClick={() => startGame('RUNNER_RACE')}
          disabled={activeGame === 'RUNNER_RACE'}
          className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
        >
          🏃‍♂️🏃‍♀️ Runner Race (2P)
        </button>
        <button
          onClick={() => startGame('SNAKE_DUEL')}
          disabled={activeGame === 'SNAKE_DUEL'}
          className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
        >
          🐍🐍 Snake Duel (2P)
        </button>
        {activeGame && (
          <button
            onClick={stopGame}
            className="px-5 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition"
          >
            ✕ Dừng
          </button>
        )}
      </div>

      {status && <p className="text-xs text-slate-500 mb-3">{status}</p>}

      {/* Canvas stage */}
      <div
        className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white"
        style={{ width: 'min(900px, 100%)', aspectRatio: '16/9' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full focus:outline-none"
          tabIndex={0}
        />

        {!activeGame && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none">
            <span className="text-5xl">🎮</span>
            <p className="text-slate-500 text-sm">Chọn một game ở trên để bắt đầu</p>
          </div>
        )}

        {/* Replay button once engine is done */}
        {finished && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button
              onClick={() => startGame(activeGame)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm shadow-lg transition"
            >
              🔄 Chơi lại
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="font-semibold mb-2 text-red-500">🏃 Mario Runner Quiz (1P)</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li><Kbd>← →</Kbd> Di chuyển</li>
            <li><Kbd>Space</Kbd> / <Kbd>↑</Kbd> Nhảy</li>
            <li><Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> <Kbd>4</Kbd> Chọn đáp án</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="font-semibold mb-2 text-emerald-500">🐍 Snake Quiz (1P)</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li><Kbd>← ↑ ↓ →</Kbd> Di chuyển rắn</li>
            <li><Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> <Kbd>4</Kbd> Chọn đáp án</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl p-4 border border-orange-200">
          <h3 className="font-semibold mb-2 text-orange-500">🏃‍♂️🏃‍♀️ Runner Race (2P)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-red-500 font-semibold mb-1">P1 (đỏ)</p>
              <ul className="text-sm text-slate-600 space-y-0.5">
                <li><Kbd>A</Kbd> <Kbd>D</Kbd> Di chuyển</li>
                <li><Kbd>W</Kbd> / <Kbd>Space</Kbd> Nhảy</li>
                <li><Kbd>Z</Kbd> <Kbd>X</Kbd> <Kbd>C</Kbd> <Kbd>V</Kbd> Đáp án</li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-blue-500 font-semibold mb-1">P2 (xanh)</p>
              <ul className="text-sm text-slate-600 space-y-0.5">
                <li><Kbd>←</Kbd> <Kbd>→</Kbd> Di chuyển</li>
                <li><Kbd>↑</Kbd> / <Kbd>Enter</Kbd> Nhảy</li>
                <li><Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> <Kbd>4</Kbd> Đáp án</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-cyan-200">
          <h3 className="font-semibold mb-2 text-cyan-500">🐍🐍 Snake Duel (2P)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-green-500 font-semibold mb-1">P1 (xanh lá)</p>
              <ul className="text-sm text-slate-600 space-y-0.5">
                <li><Kbd>A</Kbd> <Kbd>W</Kbd> <Kbd>S</Kbd> <Kbd>D</Kbd> Di chuyển</li>
                <li><Kbd>Z</Kbd> <Kbd>X</Kbd> <Kbd>C</Kbd> <Kbd>V</Kbd> Đáp án</li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-cyan-500 font-semibold mb-1">P2 (cyan)</p>
              <ul className="text-sm text-slate-600 space-y-0.5">
                <li><Kbd>←</Kbd> <Kbd>↑</Kbd> <Kbd>↓</Kbd> <Kbd>→</Kbd> Di chuyển</li>
                <li><Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> <Kbd>4</Kbd> Đáp án</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono mr-1 text-slate-800">
      {children}
    </kbd>
  );
}
