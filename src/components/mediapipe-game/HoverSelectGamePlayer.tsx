'use client';

import React from 'react';
import { X, Camera, RefreshCw, Pause, Play, Dices } from 'lucide-react';
import { GameEngine, MediaPipeTracker } from '@/mediapipe-game/mediapipe-engine.js';
import { ClassRollPanel } from './ClassRollPanel';

// ── Types ────────────────────────────────────────────────────────────────────

type Props = {
  playable: any;
  onEnd?: () => void;
  onReplay?: () => void;
};

type GameResult = { correct: number; total: number; rounds?: { correct: number; total: number }[] };
type RoundInfo = { current: number; total: number };
type SelectedState = { choiceId: string; isCorrect: boolean } | null;

// ── Kahoot-style constants ───────────────────────────────────────────────────

/** Must match HOVER_SELECT_HTML_ZONES in mediapipe-engine.js */
const CHOICE_ZONES = [
  { top: '44%', left: '0%',    width: '49.5%', height: '27%' }, // A
  { top: '44%', left: '50.5%', width: '49.5%', height: '27%' }, // B
  { top: '72.5%', left: '0%',    width: '49.5%', height: '27%' }, // C
  { top: '72.5%', left: '50.5%', width: '49.5%', height: '27%' }, // D
] as const;

/** Kahoot signature colors */
const KAHOOT_COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'] as const;

const CHOICE_LABELS = ['A', 'B', 'C', 'D'] as const;

const ROUND_TIMER_SECONDS = 20;
const TIMER_RADIUS = 30;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

// ── Component ─────────────────────────────────────────────────────────────────

export function HoverSelectGamePlayer({ playable, onEnd, onReplay }: Props) {
  const videoRef  = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const engineRef = React.useRef<any>(null);
  const streakToastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptWarningTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus]             = React.useState<string>('Đang khởi tạo...');
  const [gameResult, setGameResult]     = React.useState<GameResult | null>(null);
  const [cameraError, setCameraError]   = React.useState<string | null>(null);
  const [cameraReady, setCameraReady]   = React.useState(false);
  const [roundInfo, setRoundInfo]       = React.useState<RoundInfo | null>(null);
  const [roundIndex, setRoundIndex]     = React.useState(0);
  const [timeLeft, setTimeLeft]         = React.useState(0);
  const [streakCount, setStreakCount]   = React.useState(0);
  const [streakToastVisible, setStreakToastVisible] = React.useState(false);
  const [pipMinimized, setPipMinimized] = React.useState(false);
  const [showEndConfirm, setShowEndConfirm] = React.useState(false);
  const [attemptWarning, setAttemptWarning] = React.useState<string | null>(null);
  const [score, setScore]               = React.useState(0);
  const [hoveredChoiceId, setHoveredChoiceId]   = React.useState<string | null>(null);
  const [selectedState, setSelectedState]       = React.useState<SelectedState>(null);
  const [scorePlus, setScorePlus]               = React.useState<{ amount: number; key: number } | null>(null);
  const scorePlusTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeLeftRef = React.useRef(ROUND_TIMER_SECONDS);
  const [isPaused, setIsPaused]         = React.useState(false);
  const [showRoll, setShowRoll]         = React.useState(false);

  // Current round data from playable
  const rounds: any[] = React.useMemo(
    () => (Array.isArray(playable?.payload) ? playable.payload : [playable?.payload]),
    [playable],
  );
  const currentRound = rounds[roundIndex] ?? null;

  // ── Round change ────────────────────────────────────────────────────────────

  const handleRoundChange = React.useCallback(
    (idx: number, total: number, lastResult: GameResult | null) => {
      setRoundIndex(idx);
      setRoundInfo({ current: idx + 1, total });
      setTimeLeft(ROUND_TIMER_SECONDS);
      setHoveredChoiceId(null);
      setSelectedState(null);
      setAttemptWarning(null);

      if (lastResult !== null) {
        if (lastResult.correct === lastResult.total && lastResult.total > 0) {
          // Score is added immediately in handleChoiceSelected; only update streak here
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

  // ── Hover / selection callbacks from engine ─────────────────────────────────

  const handleHoverChange = React.useCallback((choiceId: string | null) => {
    setHoveredChoiceId(choiceId);
    // If user moves to a new hover target, clear previous wrong feedback
    if (choiceId !== null) setSelectedState(null);
  }, []);

  const handleChoiceSelected = React.useCallback((choiceId: string, isCorrect: boolean) => {
    setSelectedState({ choiceId, isCorrect });
    if (isCorrect) {
      const base = 100;
      const timeBonus = Math.round((timeLeftRef.current / ROUND_TIMER_SECONDS) * 50);
      const total = base + timeBonus;
      setScore((prev) => prev + total);
      setScorePlus({ amount: total, key: Date.now() });
      if (scorePlusTimerRef.current) clearTimeout(scorePlusTimerRef.current);
      scorePlusTimerRef.current = setTimeout(() => setScorePlus(null), 1600);
    }
  }, []);

  // Keep timeLeftRef synced for scoring bonus calculation
  React.useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // ── Timer countdown ─────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!roundInfo || gameResult || cameraError || isPaused) return;
    if (timeLeft <= 0) {
      engineRef.current?.skipCurrentRound();
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, roundInfo, gameResult, cameraError, isPaused]);

  // ── Engine init ─────────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setGameResult(null);
    setStatus('Đang khởi tạo...');
    setCameraError(null);
    setCameraReady(false);
    setRoundInfo(null);
    setRoundIndex(0);
    setTimeLeft(0);
    setStreakCount(0);
    setStreakToastVisible(false);
    setShowEndConfirm(false);
    setAttemptWarning(null);
    setScore(0);
    setHoveredChoiceId(null);
    setSelectedState(null);

    const tracker = new MediaPipeTracker({
      videoEl: videoRef.current,
      onFrame: () => {},
    });

    const engine = new GameEngine({
      canvasEl: canvasRef.current,
      videoEl: videoRef.current,
      playable,
      tracker,
      htmlMode: true,
      onStatus: (msg: string) => setStatus(msg),
      onFinish: (result: GameResult) => setGameResult(result),
      onRoundChange: handleRoundChange,
      onHoverChange: handleHoverChange,
      onChoiceSelected: handleChoiceSelected,
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
        // AbortError means a new srcObject load interrupted play() — not a real error
        if (e instanceof DOMException && e.name === 'AbortError') return;
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
      if (scorePlusTimerRef.current) clearTimeout(scorePlusTimerRef.current);
    };
  }, [playable, handleRoundChange, handleHoverChange, handleChoiceSelected]);

  // ── Derived UI values ───────────────────────────────────────────────────────

  const timerPct = roundInfo ? timeLeft / ROUND_TIMER_SECONDS : 1;
  const timerColor = timerPct > 0.6 ? '#22c55e' : timerPct > 0.3 ? '#f59e0b' : '#ef4444';
  const timerDashOffset = TIMER_CIRCUMFERENCE * (1 - timerPct);
  const progressPct = roundInfo ? ((roundInfo.current - 1) / roundInfo.total) * 100 : 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col" style={{ background: '#1a1035' }}>

      {/* ── Header ── */}
      <div
        className="relative z-20 flex items-center h-14 shrink-0 px-5"
        style={{ background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Left: brand + score */}
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

        {/* Center: dot indicators */}
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

        {/* Right: end button */}
        <div className="ml-auto flex items-center gap-2">
          {/* Dice — class roll */}
          {roundInfo && !gameResult && (
            <button
              type="button"
              title="Quay số ngẫu nhiên"
              onClick={() => setShowRoll(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white transition-colors"
              style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)' }}
            >
              <Dices size={15} strokeWidth={2} />
            </button>
          )}

          {/* Pause / Resume */}
          {roundInfo && !gameResult && (
            <button
              type="button"
              title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
              onClick={() => setIsPaused((p) => !p)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white transition-colors"
              style={{ background: isPaused ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.08)', border: isPaused ? '1px solid rgba(34,197,94,0.45)' : '1px solid rgba(255,255,255,0.12)' }}
            >
              {isPaused ? <Play size={14} strokeWidth={2.5} /> : <Pause size={14} strokeWidth={2.5} />}
            </button>
          )}

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

        {/* Canvas — cursor-only (htmlMode), full-screen, mirrored */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -scale-x-100 z-20 pointer-events-none" />

        {/* Hidden camera video for MediaPipe tracking */}
        <video
          ref={videoRef}
          className="absolute pointer-events-none opacity-0 w-px h-px"
          autoPlay playsInline muted
        />

        {/* ── Question box (Kahoot-style, top 44%) ── */}
        {roundInfo && currentRound && !gameResult && !cameraError && (
          <div className="absolute left-0 right-0 top-0 z-10 flex flex-col items-stretch" style={{ height: '44%' }}>
            <div
              className="flex-1 flex flex-col items-center justify-center px-6 py-3 gap-2"
              style={{
                background: 'linear-gradient(180deg, #2d1b69 0%, #1a1035 100%)',
                borderBottom: '2px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Question text — primary focal point */}
              <p
                className="text-white text-center leading-snug select-none"
                style={{
                  fontSize: 'clamp(20px, 3vw, 28px)',
                  fontWeight: 700,
                  maxWidth: '85%',
                  textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                }}
              >
                {currentRound.prompt}
              </p>

              {/* Timer — centered below question */}
              <div style={{ filter: `drop-shadow(0 0 10px ${timerColor}88)` }}>
                <svg width={60} height={60}>
                  <circle cx={30} cy={30} r={24} fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.12)" strokeWidth={3.5} />
                  <circle
                    cx={30} cy={30} r={24}
                    fill="none"
                    stroke={timerColor}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - timerPct)}
                    transform="rotate(-90 30 30)"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
                  />
                  <text
                    x={30} y={30}
                    textAnchor="middle" dominantBaseline="central"
                    fill={timerColor} fontSize={17} fontWeight={900}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    style={{ transition: 'fill 0.4s ease' }}
                  >
                    {timeLeft}
                  </text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ── Answer buttons (Kahoot 2×2 grid) ── */}
        {roundInfo && currentRound && !gameResult && !cameraError &&
          (currentRound.choices as any[]).map((choice: any, ci: number) => {
            const zone = CHOICE_ZONES[ci];
            if (!zone) return null;

            const isHovered  = hoveredChoiceId === choice.id;
            const isSelected = selectedState?.choiceId === choice.id;
            const isCorrect  = isSelected && selectedState?.isCorrect;
            const isWrong    = isSelected && !selectedState?.isCorrect;

            let bgColor = KAHOOT_COLORS[ci] as string;
            if (isCorrect) bgColor = '#16a34a';
            else if (isWrong) bgColor = '#dc2626';

            return (
              <div
                key={choice.id}
                className="absolute flex items-center gap-3 select-none transition-all duration-150"
                style={{
                  ...zone,
                  padding: '8px 12px',
                  background: bgColor,
                  border: isHovered ? '3px solid rgba(255,255,255,0.9)' : '3px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  zIndex: 10,
                  boxSizing: 'border-box',
                  boxShadow: isHovered
                    ? `0 0 0 3px rgba(255,255,255,0.35), 0 8px 24px rgba(0,0,0,0.4)`
                    : '0 4px 12px rgba(0,0,0,0.3)',
                  transform: isHovered ? 'scale(1.018)' : 'scale(1)',
                  filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
                }}
              >
                {/* Letter badge */}
                <div
                  className="flex items-center justify-center shrink-0 rounded-lg font-black text-white"
                  style={{
                    width: 'clamp(32px, 4vw, 42px)',
                    height: 'clamp(32px, 4vw, 42px)',
                    background: 'rgba(0,0,0,0.25)',
                    fontSize: 'clamp(16px, 2vw, 22px)',
                  }}
                >
                  {CHOICE_LABELS[ci]}
                </div>

                {/* Answer text */}
                <span
                  className="text-white font-semibold leading-tight"
                  style={{ fontSize: 'clamp(14px, 1.8vw, 20px)' }}
                >
                  {choice.text}
                </span>

                {/* Correct / wrong icon */}
                {isCorrect && (
                  <span className="ml-auto text-2xl">✓</span>
                )}
                {isWrong && (
                  <span className="ml-auto text-2xl">✗</span>
                )}
              </div>
            );
          })
        }

        {/* ── Floating score bonus ── */}
        {scorePlus && <ScorePlusToast key={scorePlus.key} amount={scorePlus.amount} />}

        {/* ── Streak toast ── */}
        {streakToastVisible && streakCount >= 2 && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 rounded-2xl font-bold text-sm text-white pointer-events-none select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(251,146,60,0.95), rgba(220,38,38,0.92))',
              border: '1px solid rgba(251,191,36,0.4)',
              boxShadow: '0 0 24px rgba(251,146,60,0.55)',
            }}
          >
            🔥 {streakCount} câu đúng liên tiếp!
          </div>
        )}

        {/* ── Attempt warning ── */}
        {attemptWarning && (
          <div
            className="absolute z-30 flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm text-white pointer-events-none select-none"
            style={{
              top: '46%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.97), rgba(239,68,68,0.95))',
              border: '1px solid rgba(245,158,11,0.5)',
              boxShadow: '0 0 20px rgba(245,158,11,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            ⚠️ {attemptWarning}
          </div>
        )}

        {/* ── Camera PiP — top-right of question zone (never overlaps answer cards) ── */}
        {!pipMinimized && (
          <div
            className="absolute top-2 right-2 z-30 rounded-xl overflow-hidden shadow-2xl transition-opacity duration-500"
            style={{
              width: 'clamp(150px, 20%, 220px)',
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
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-colors text-xs font-bold"
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
            className="absolute top-2 right-2 z-30 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white font-semibold hover:brightness-125 transition-colors"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            📷
          </button>
        )}

        {/* ── Camera permission error ── */}
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

        {/* ── Result overlay ── */}
        {gameResult && (
          <HoverResultScreen result={gameResult} score={score} onEnd={onEnd} onReplay={onReplay} />
        )}

        {/* ── Pause overlay ── */}
        {isPaused && !gameResult && !cameraError && (
          <div
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}
            >
              <Pause size={28} className="text-white" />
            </div>
            <p className="text-white font-bold text-xl">Đã tạm dừng</p>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }}
            >
              <Play size={15} strokeWidth={2.5} />
              Tiếp tục
            </button>
          </div>
        )}

        {/* ── End confirm dialog ── */}
        {showEndConfirm && (          <div
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

      {/* Class roll panel */}
      {showRoll && <ClassRollPanel onClose={() => setShowRoll(false)} />}
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

// ── Floating score bonus animation ──────────────────────────────────────────

function ScorePlusToast({ amount }: { amount: number }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="pointer-events-none select-none absolute z-40 font-black tabular-nums"
      style={{
        left: '50%',
        top: mounted ? '30%' : '42%',
        transform: 'translateX(-50%)',
        opacity: mounted ? 0 : 1,
        transition: 'top 1.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 1.5s ease-out',
        fontSize: 38,
        color: '#fbbf24',
        textShadow: '0 0 24px rgba(251,191,36,0.85), 0 2px 8px rgba(0,0,0,0.9)',
        whiteSpace: 'nowrap',
      }}
    >
      +{amount}
    </div>
  );
}

function HoverResultScreen({
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
          <button
            type="button"
            onClick={onEnd}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/65 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Quay về
          </button>
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${tier.accentColor}33 0%, ${tier.accentColor}66 100%)`,
                border: `1px solid ${tier.accentColor}55`,
                boxShadow: `0 4px 16px ${tier.glowColor}`,
              }}
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
