'use client';

import React from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';
import { GameEngine, MediaPipeTracker } from '@/mediapipe-game/mediapipe-engine.js';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  playable: any;
  onEnd?: () => void;
  onReplay?: () => void;
};

type GameResult = { correct: number; total: number; rounds?: { correct: number; total: number }[] };
type RoundInfo = { current: number; total: number };

const ROUND_TIMER_SECONDS = 90;
const TIMER_RADIUS = 28;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

// ── Component ─────────────────────────────────────────────────────────────────

export function DragDropGamePlayer({ playable, onEnd, onReplay }: Props) {
  const videoRef   = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef  = React.useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const engineRef  = React.useRef<any>(null);
  const streakToastTimerRef    = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptWarningTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus]             = React.useState<string>('Đang khởi tạo...');
  const [gameResult, setGameResult]     = React.useState<GameResult | null>(null);
  const [cameraError, setCameraError]   = React.useState<string | null>(null);
  const [cameraReady, setCameraReady]   = React.useState(false);
  const [roundInfo, setRoundInfo]       = React.useState<RoundInfo | null>(null);
  const [timeLeft, setTimeLeft]         = React.useState(0);
  const [streakCount, setStreakCount]   = React.useState(0);
  const [streakToastVisible, setStreakToastVisible] = React.useState(false);
  const [pipMinimized, setPipMinimized] = React.useState(false);
  const [showEndConfirm, setShowEndConfirm] = React.useState(false);
  const [attemptWarning, setAttemptWarning] = React.useState<string | null>(null);
  const [score, setScore]               = React.useState(0);

  const handleRoundChange = React.useCallback(
    (roundIndex: number, totalRounds: number, lastResult: GameResult | null) => {
      setRoundInfo({ current: roundIndex + 1, total: totalRounds });
      setTimeLeft(ROUND_TIMER_SECONDS);
      setAttemptWarning(null);
      if (lastResult !== null) {
        if (lastResult.correct === lastResult.total && lastResult.total > 0) {
          setScore((prev) => prev + 100);
          setStreakCount((prev) => prev + 1);
          setStreakToastVisible(true);
          if (streakToastTimerRef.current) clearTimeout(streakToastTimerRef.current);
          streakToastTimerRef.current = setTimeout(() => setStreakToastVisible(false), 2200);
        } else {
          setStreakCount(0);
          setStreakToastVisible(false);
        }
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!roundInfo || gameResult || cameraError) return;
    if (timeLeft <= 0) {
      engineRef.current?.skipCurrentRound();
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, roundInfo, gameResult, cameraError]);

  React.useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setGameResult(null);
    setStatus('Đang khởi tạo...');
    setCameraError(null);
    setCameraReady(false);
    setRoundInfo(null);
    setTimeLeft(0);
    setStreakCount(0);
    setStreakToastVisible(false);
    setShowEndConfirm(false);
    setAttemptWarning(null);
    setScore(0);

    const tracker = new MediaPipeTracker({ videoEl: videoRef.current, onFrame: () => {} });

    const engine = new GameEngine({
      canvasEl: canvasRef.current,
      videoEl: videoRef.current,
      playable,
      tracker,
      onStatus: (msg: string) => setStatus(msg),
      onFinish: (result: GameResult) => setGameResult(result),
      onRoundChange: handleRoundChange,
      onAttemptWarning: (msg: string) => {
        setAttemptWarning(msg);
        if (attemptWarningTimerRef.current) clearTimeout(attemptWarningTimerRef.current);
        attemptWarningTimerRef.current = setTimeout(() => setAttemptWarning(null), 2800);
      },
    });

    engineRef.current = engine;
    let cancelled = false;

    (async () => {
      try {
        await engine.init();
        if (!cancelled && videoRef.current?.srcObject && pipVideoRef.current) {
          pipVideoRef.current.srcObject = videoRef.current.srcObject;
          await pipVideoRef.current.play().catch(() => {});
          setCameraReady(true);
        }
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        const msg = e instanceof Error ? e.message : 'Failed to start game';
        const isPermission =
          (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')) ||
          msg.toLowerCase().includes('permission') ||
          msg.toLowerCase().includes('not allowed');
        setCameraError(isPermission ? 'camera_denied' : msg);
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current = null;
      engine.dispose();
      if (streakToastTimerRef.current) clearTimeout(streakToastTimerRef.current);
      if (attemptWarningTimerRef.current) clearTimeout(attemptWarningTimerRef.current);
    };
  }, [playable, handleRoundChange]);

  const timerPct = roundInfo ? timeLeft / ROUND_TIMER_SECONDS : 1;
  const timerColor = timerPct > 0.6 ? '#22c55e' : timerPct > 0.3 ? '#f59e0b' : '#ef4444';
  const timerDashOffset = TIMER_CIRCUMFERENCE * (1 - timerPct);
  const progressPct = roundInfo ? ((roundInfo.current - 1) / roundInfo.total) * 100 : 0;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">

      {/* ── Header ── */}
      <div
        className="relative z-20 flex items-center h-14 shrink-0 px-5"
        style={{ background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none select-none">🎮</span>
          <span className="text-white font-semibold text-sm tracking-wide">Mini Game</span>
          {status && !gameResult && !cameraError && !roundInfo && (
            <span className="text-white/35 text-xs ml-1 truncate">— {status}</span>
          )}
          {roundInfo && !gameResult && (
            <div
              className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
            >
              {score} pts
            </div>
          )}
        </div>

        {roundInfo && !gameResult && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {Array.from({ length: roundInfo.total }, (_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i + 1 === roundInfo.current ? 20 : 7,
                  height: 7,
                  background:
                    i + 1 < roundInfo.current
                      ? '#3b82f6'
                      : i + 1 === roundInfo.current
                      ? '#60a5fa'
                      : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
            <span className="text-white/50 text-xs font-semibold ml-1.5 tabular-nums">
              {roundInfo.current} / {roundInfo.total}
            </span>
          </div>
        )}

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-white text-xs font-semibold transition-all duration-150 hover:brightness-110"
            style={{ background: 'rgba(239,68,68,0.22)', border: '1px solid rgba(239,68,68,0.45)' }}
          >
            <X size={13} strokeWidth={2.5} />
            Kết thúc
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-[3px] shrink-0 z-20" style={{ background: 'rgba(255,255,255,0.07)' }}>
        {roundInfo && !gameResult && (
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, progressPct))}%`,
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            }}
          />
        )}
      </div>

      {/* ── Game area ── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Canvas — full area, engine draws everything */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -scale-x-100 z-10" />

        <video
          ref={videoRef}
          className="absolute pointer-events-none opacity-0 w-px h-px"
          autoPlay playsInline muted
        />

        {/* Countdown timer — top-right corner */}
        {roundInfo && !gameResult && !cameraError && (
          <div
            className="absolute top-2 right-3 z-20"
            style={{ filter: `drop-shadow(0 0 10px ${timerColor}66)` }}
          >
            <svg width={72} height={72}>
              <circle cx={36} cy={36} r={TIMER_RADIUS} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.1)" strokeWidth={4} />
              <circle
                cx={36} cy={36} r={TIMER_RADIUS}
                fill="none"
                stroke={timerColor}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={TIMER_CIRCUMFERENCE}
                strokeDashoffset={timerDashOffset}
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
              />
              <text
                x={36} y={36}
                textAnchor="middle" dominantBaseline="central"
                fill={timerColor} fontSize={19} fontWeight={900}
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{ transition: 'fill 0.4s ease' }}
              >
                {timeLeft}
              </text>
            </svg>
          </div>
        )}

        {/* Streak toast */}
        {streakToastVisible && streakCount >= 2 && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-2xl font-bold text-sm text-white pointer-events-none select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(251,146,60,0.92), rgba(220,38,38,0.9))',
              border: '1px solid rgba(251,191,36,0.4)',
              boxShadow: '0 0 24px rgba(251,146,60,0.55)',
            }}
          >
            🔥 {streakCount} câu đúng liên tiếp!
          </div>
        )}

        {/* Attempt warning */}
        {attemptWarning && (
          <div
            className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm text-white pointer-events-none select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(239,68,68,0.92))',
              border: '1px solid rgba(245,158,11,0.5)',
              boxShadow: '0 0 20px rgba(245,158,11,0.5)',
            }}
          >
            ⚠️ {attemptWarning}
          </div>
        )}

        {/* Camera PiP */}
        {!pipMinimized && (
          <div
            className="absolute bottom-4 right-4 z-30 rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-500"
            style={{
              width: 'clamp(130px, 20%, 220px)',
              aspectRatio: '16/9',
              border: '1.5px solid rgba(255,255,255,0.18)',
              background: '#000',
              opacity: cameraReady && !cameraError ? 1 : 0,
              pointerEvents: cameraReady && !cameraError ? 'auto' : 'none',
            }}
          >
            <video ref={pipVideoRef} className="w-full h-full object-cover -scale-x-100" autoPlay playsInline muted />
            <button
              type="button"
              onClick={() => setPipMinimized(true)}
              className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-colors text-xs font-bold"
              title="Ẩn camera"
            >
              −
            </button>
          </div>
        )}
        {pipMinimized && cameraReady && !cameraError && (
          <button
            type="button"
            onClick={() => setPipMinimized(false)}
            className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-white font-semibold transition-colors hover:brightness-125"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            📷 Camera
          </button>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
            <div
              className="flex flex-col items-center gap-5 px-10 py-9 rounded-3xl text-center"
              style={{
                minWidth: 340,
                background: 'linear-gradient(175deg, rgba(15,23,42,0.99) 0%, rgba(10,0,20,0.99) 100%)',
                border: '1px solid rgba(139,92,246,0.35)',
                boxShadow: '0 0 80px rgba(139,92,246,0.15), inset 0 1px 0 rgba(139,92,246,0.2)',
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.12)', border: '2px solid rgba(139,92,246,0.3)' }}
              >
                <Camera size={28} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl mb-2">
                  {cameraError === 'camera_denied' ? 'Camera bị chặn' : 'Không thể khởi tạo camera'}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed max-w-[280px]">
                  {cameraError === 'camera_denied'
                    ? 'Trình duyệt đã từ chối truy cập camera. Hãy cho phép camera trong cài đặt trình duyệt rồi thử lại.'
                    : cameraError}
                </p>
              </div>
              {cameraError === 'camera_denied' && (
                <div
                  className="rounded-xl px-4 py-3 text-left text-xs text-white/40 w-full"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="font-semibold text-white/60 mb-1.5">Cách cấp quyền:</p>
                  <p>• Nhấn vào biểu tượng 🔒 / 📷 trên thanh địa chỉ</p>
                  <p className="mt-1">• Chọn &quot;Cho phép&quot; với Camera</p>
                  <p className="mt-1">• Tải lại trang và thử lại</p>
                </div>
              )}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={onEnd}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Quay về
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
                  }}
                >
                  <RefreshCw size={14} />
                  Tải lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result overlay */}
        {gameResult && (
          <DragDropResultScreen result={gameResult} score={score} onEnd={onEnd} onReplay={onReplay} />
        )}

        {/* End confirm dialog */}
        {showEndConfirm && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.75)' }}
          >
            <div
              className="flex flex-col items-center gap-4 px-8 py-7 rounded-2xl text-center"
              style={{
                minWidth: 300,
                background: 'rgba(15,23,42,0.98)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              <p className="text-white font-semibold text-base">Kết thúc game?</p>
              <p className="text-white/45 text-sm leading-relaxed max-w-[240px]">
                Tiến trình hiện tại sẽ không được lưu.
              </p>
              <div className="flex gap-3 w-full mt-1">
                <button
                  type="button"
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  Tiếp tục chơi
                </button>
                <button
                  type="button"
                  onClick={onEnd}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.03]"
                  style={{
                    background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
                    boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
                  }}
                >
                  Kết thúc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────────────────────────

type Tier = {
  label: string; emoji: string;
  accentColor: string; glowColor: string; bgColor: string; borderColor: string;
  titleGrad: string;
};

function getTier(pct: number): Tier {
  if (pct >= 1.0) return { label: 'Hoàn hảo!',    emoji: '🌟', accentColor: '#fbbf24', glowColor: 'rgba(251,191,36,0.22)', bgColor: 'rgba(251,191,36,0.1)',  borderColor: 'rgba(251,191,36,0.35)', titleGrad: 'linear-gradient(180deg,#fef9c3 0%,#fbbf24 40%,#d97706 100%)' };
  if (pct >= 0.8) return { label: 'Xuất sắc!',    emoji: '🎉', accentColor: '#22c55e', glowColor: 'rgba(34,197,94,0.18)',   bgColor: 'rgba(34,197,94,0.1)',   borderColor: 'rgba(34,197,94,0.3)',   titleGrad: 'linear-gradient(180deg,#bbf7d0 0%,#22c55e 40%,#15803d 100%)' };
  if (pct >= 0.6) return { label: 'Khá tốt!',     emoji: '💪', accentColor: '#60a5fa', glowColor: 'rgba(59,130,246,0.18)',  bgColor: 'rgba(59,130,246,0.1)',  borderColor: 'rgba(59,130,246,0.3)',  titleGrad: 'linear-gradient(180deg,#bfdbfe 0%,#60a5fa 40%,#2563eb 100%)' };
  if (pct >= 0.4) return { label: 'Cần ôn thêm',  emoji: '📚', accentColor: '#f59e0b', glowColor: 'rgba(245,158,11,0.18)',  bgColor: 'rgba(245,158,11,0.1)',  borderColor: 'rgba(245,158,11,0.3)',  titleGrad: 'linear-gradient(180deg,#fde68a 0%,#f59e0b 40%,#b45309 100%)' };
  return           { label: 'Hãy thử lại!', emoji: '🔄', accentColor: '#94a3b8', glowColor: 'rgba(148,163,184,0.14)', bgColor: 'rgba(148,163,184,0.08)', borderColor: 'rgba(148,163,184,0.25)', titleGrad: 'linear-gradient(180deg,#e2e8f0 0%,#94a3b8 40%,#475569 100%)' };
}

function DragDropResultScreen({
  result, score, onEnd, onReplay,
}: {
  result: GameResult; score: number; onEnd?: () => void; onReplay?: () => void;
}) {
  const pct  = result.total > 0 ? result.correct / result.total : 0;
  const tier = getTier(pct);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${tier.glowColor} 0%, rgba(0,0,0,0.93) 70%)`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="relative flex flex-col items-center gap-4 px-10 py-8 rounded-3xl text-center"
        style={{
          minWidth: 360, maxWidth: 460,
          background: 'linear-gradient(175deg, rgba(15,23,42,0.99) 0%, rgba(5,5,20,0.99) 100%)',
          border: `1px solid ${tier.borderColor}`,
          boxShadow: `0 0 80px ${tier.glowColor}, inset 0 1px 0 ${tier.borderColor}`,
        }}
      >
        <div className="text-5xl leading-none select-none">{tier.emoji}</div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-1.5" style={{ color: `${tier.accentColor}99` }}>
            Kết quả
          </p>
          <h1
            className="text-[42px] font-black tracking-widest leading-none"
            style={{ background: tier.titleGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {tier.label}
          </h1>
        </div>
        <div
          className="flex items-center gap-5 rounded-2xl px-6 py-3"
          style={{ background: tier.bgColor, border: `1px solid ${tier.borderColor}` }}
        >
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Câu đúng</span>
            <span className="text-white font-bold text-2xl">
              {result.correct}
              <span className="text-white/40 text-sm font-normal"> / {result.total}</span>
            </span>
          </div>
          <div className="w-px h-9 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Điểm</span>
            <span className="font-bold text-2xl" style={{ color: tier.accentColor }}>{score}</span>
          </div>
        </div>
        {result.rounds && result.rounds.length > 0 && (
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 justify-center px-2">
            {result.rounds.map((r, i) => (
              <span
                key={i}
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: r.correct === r.total ? '#4ade80' : '#f87171' }}
              >
                {r.correct === r.total ? '✓' : '✗'} Câu {i + 1}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-3 w-full mt-1">
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/65 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Thử lại
            </button>
          )}
          <button
            type="button"
            onClick={onEnd}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${tier.accentColor}33 0%, ${tier.accentColor}66 100%)`,
              border: `1px solid ${tier.accentColor}55`,
              boxShadow: `0 4px 16px ${tier.glowColor}`,
            }}
          >
            Quay về
          </button>
        </div>
      </div>
    </div>
  );
}
