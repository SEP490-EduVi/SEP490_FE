'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, Loader2, Clock, Film,
  CheckCircle, XCircle, HelpCircle, Volume2, VolumeX, Maximize, Minimize,
  BookOpen, PenLine,
} from 'lucide-react';
import type { VideoProductDto, VideoInteraction } from '@/types/api';
import { getVideoSignedUrl } from '@/services/videoServices';

interface VideoPlayerModalProps {
  video: VideoProductDto;
  onClose: () => void;
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Quiz Overlay ──────────────────────────────────────────────────────────

interface QuizOverlayProps {
  interaction: VideoInteraction;
  onAnswer: () => void;
}

function QuizOverlay({ interaction, onAnswer }: QuizOverlayProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const { payload } = interaction;
  const correctIdx = payload.correctIndex;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(onAnswer, 1600);
  };

  const getOptionClass = (idx: number) => {
    if (selected === null)
      return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700';
    if (correctIdx !== undefined) {
      if (idx === correctIdx) return 'bg-green-50 border-green-400 text-green-700 ring-2 ring-green-200';
      if (idx === selected)   return 'bg-red-50 border-red-400 text-red-700 ring-2 ring-red-200';
    } else if (idx === selected) {
      return 'bg-violet-50 border-violet-400 text-violet-700 ring-2 ring-violet-200';
    }
    return 'bg-gray-50 border-gray-200 text-gray-400 cursor-default';
  };

  const getBadgeClass = (idx: number) => {
    if (selected === null) return 'border-gray-300 text-gray-400 bg-white';
    if (correctIdx !== undefined) {
      if (idx === correctIdx) return 'bg-green-600 border-green-600 text-white';
      if (idx === selected)   return 'bg-red-500 border-red-500 text-white';
    } else if (idx === selected) {
      return 'bg-violet-600 border-violet-600 text-white';
    }
    return 'border-gray-200 text-gray-400 bg-white';
  };

  const getBadgeContent = (idx: number) => {
    if (selected !== null) {
      if (correctIdx !== undefined && idx === correctIdx)
        return <CheckCircle className="w-3.5 h-3.5" />;
      if (idx === selected)
        return correctIdx !== undefined ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />;
    }
    return String.fromCharCode(65 + idx);
  };

  const isCorrect = selected !== null && correctIdx !== undefined && selected === correctIdx;

  return (
    <motion.div
      key="quiz-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 text-left"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-sm font-semibold text-violet-600">{payload.title}</p>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-4 leading-relaxed">
          {payload.question}
        </h3>

        <div className="space-y-2.5">
          {(payload.options ?? []).map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${getOptionClass(idx)}`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${getBadgeClass(idx)}`}>
                  {getBadgeContent(idx)}
                </span>
                {option}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selected !== null && correctIdx !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2 ${
                isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {isCorrect
                ? <><CheckCircle className="w-4 h-4" /> Chính xác! Video sẽ tiếp tục...</>
                : <><XCircle className="w-4 h-4" /> Chưa đúng. Video sẽ tiếp tục...</>}
            </motion.div>
          )}
        </AnimatePresence>

        {selected === null && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Chọn đáp án để tiếp tục video
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Flashcard Overlay ─────────────────────────────────────────────────────

function FlashcardOverlay({ interaction, onAnswer }: { interaction: VideoInteraction; onAnswer: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const { payload } = interaction;

  return (
    <motion.div
      key="flashcard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-blue-600">{payload.title}</p>
        </div>

        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          {flipped ? 'Mặt sau' : 'Mặt trước'}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? 'back' : 'front'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`min-h-[72px] flex items-center justify-center rounded-xl px-5 py-5 mb-5 text-base font-medium leading-relaxed ${
              flipped
                ? 'bg-blue-50 text-blue-800 border border-blue-100'
                : 'bg-gray-50 text-gray-800 border border-gray-200'
            }`}
          >
            {flipped ? payload.back : payload.front}
          </motion.div>
        </AnimatePresence>

        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Lật thẻ →
          </button>
        ) : (
          <button
            onClick={onAnswer}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Tiếp tục video →
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Fill in Blank Overlay ─────────────────────────────────────────────────

function FillBlankOverlay({ interaction, onAnswer }: { interaction: VideoInteraction; onAnswer: () => void }) {
  const { payload } = interaction;
  const correctBlanks = payload.blanks ?? [];
  // parts alternates: [text, blank_label, text, blank_label, text, ...]
  const parts = (payload.sentence ?? '').split(/\[([^\]]+)\]/);
  const blankCount = Math.floor(parts.length / 2);

  const [inputs, setInputs] = useState<string[]>(Array(blankCount).fill(''));
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(onAnswer, 2200);
  };

  const isCorrect = (idx: number) =>
    (inputs[idx] ?? '').trim().toLowerCase() === (correctBlanks[idx] ?? '').trim().toLowerCase();

  return (
    <motion.div
      key="fill-blank-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 text-left"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <PenLine className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-amber-600">{payload.title}</p>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-3">Điền vào chỗ trống:</h3>

        <div className="bg-gray-50 rounded-xl px-4 py-4 mb-4 text-sm text-gray-700 leading-loose border border-gray-100">
          {parts.map((part, idx) => {
            if (idx % 2 === 0) return <span key={idx}>{part}</span>;
            const blankIdx = Math.floor(idx / 2);
            if (submitted) {
              const correct = isCorrect(blankIdx);
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center mx-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                    correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {inputs[blankIdx] || '___'}
                  {!correct && <span className="ml-1 opacity-70">({correctBlanks[blankIdx]})</span>}
                </span>
              );
            }
            return (
              <input
                key={idx}
                value={inputs[blankIdx]}
                onChange={(e) => {
                  const next = [...inputs];
                  next[blankIdx] = e.target.value;
                  setInputs(next);
                }}
                className="inline-block mx-1 w-28 border-0 border-b-2 border-amber-400 bg-transparent text-center text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-600 transition-colors"
                placeholder="..."
              />
            );
          })}
        </div>

        {payload.hint && !submitted && (
          <p className="text-xs text-gray-400 mb-3">💡 Gợi ý: {payload.hint}</p>
        )}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={inputs.some((v) => !v.trim())}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Kiểm tra
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Video sẽ tiếp tục...
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const [signedUrl, setSignedUrl]   = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [urlError, setUrlError]     = useState<string | null>(null);

  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekBarRef   = useRef<HTMLDivElement>(null);
  const hideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying]       = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [isMuted, setIsMuted]           = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [activeQuiz, setActiveQuiz] = useState<VideoInteraction | null>(null);
  const triggeredRef = useRef<Set<number>>(new Set());
  const [answered, setAnswered]     = useState<ReadonlyArray<number>>([]);

  // URL fetch
  useEffect(() => {
    if (!video.videoUrl) { setLoadingUrl(false); setUrlError('Không tìm thấy URL video.'); return; }
    setLoadingUrl(true);
    getVideoSignedUrl(video.videoUrl)
      .then((url) => { setSignedUrl(url); setLoadingUrl(false); })
      .catch(() => { setUrlError('Không thể tải video. Vui lòng thử lại.'); setLoadingUrl(false); });
  }, [video.videoUrl]);

  // Fullscreen change
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (activeQuiz) return;
      if (e.key === 'Escape' && !isFullscreen) { onClose(); return; }
      if (e.key === ' ') { e.preventDefault(); const el = videoRef.current; if (el) { el.paused ? el.play() : el.pause(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, activeQuiz, isFullscreen]);

  // Auto-hide controls
  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (!activeQuiz) setShowControls(false); }, 3000);
  }, [activeQuiz]);

  useEffect(() => {
    if (!isPlaying || activeQuiz) { setShowControls(true); if (hideTimer.current) clearTimeout(hideTimer.current); }
    else revealControls();
  }, [isPlaying, activeQuiz, revealControls]);

  // Time update + pause point detection
  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    if (activeQuiz || !video.interactions?.length) return;
    for (const interaction of video.interactions) {
      const pauseAt = interaction.pause_time;
      if (el.currentTime >= pauseAt - 0.5 && el.currentTime <= pauseAt + 0.5 && !triggeredRef.current.has(pauseAt)) {
        triggeredRef.current.add(pauseAt);
        el.pause();
        setActiveQuiz(interaction);
        setShowControls(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        break;
      }
    }
  }, [activeQuiz, video.interactions]);

  const handleQuizAnswer = useCallback(() => {
    setActiveQuiz((prev) => {
      if (prev) setAnswered((a) => [...a, prev.pause_time]);
      return null;
    });
    videoRef.current?.play();
  }, []);

  // Controls
  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.paused ? el.play() : el.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    const bar = seekBarRef.current;
    if (!el || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    el.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
  }, [duration]);

  const progressPct  = duration > 0 ? (currentTime / duration) * 100 : 0;
  const interactions = video.interactions ?? [];

  return (
    <AnimatePresence>
      <motion.div
        key="video-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => { if (!activeQuiz && !isFullscreen) onClose(); }}
      >
        <motion.div
          className="relative bg-gray-950 rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl"
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-900/80 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Film className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{video.productName}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  {video.duration != null && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(video.duration)}</span>
                  )}
                  {interactions.length > 0 && <span>{interactions.length} hoạt động tương tác</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-4 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video container — fullscreen target */}
          <div
            ref={containerRef}
            className={`relative bg-black flex items-center justify-center ${isFullscreen ? 'w-full h-full' : 'aspect-video'}`}
            onMouseMove={revealControls} onMouseEnter={revealControls}
          >
            {loadingUrl && (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Đang tải video...</span>
              </div>
            )}
            {!loadingUrl && urlError && (
              <div className="flex flex-col items-center gap-3">
                <Film className="w-10 h-10 text-gray-600 opacity-40" />
                <span className="text-sm text-red-400">{urlError}</span>
              </div>
            )}
            {!loadingUrl && signedUrl && (
              <video
                ref={videoRef}
                src={signedUrl}
                autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />
            )}

            {/* Interaction overlay */}
            <AnimatePresence>
              {activeQuiz && (
                activeQuiz.type === 'flashcard' ? (
                  <FlashcardOverlay interaction={activeQuiz} onAnswer={handleQuizAnswer} />
                ) : activeQuiz.type === 'fill_blank' ? (
                  <FillBlankOverlay interaction={activeQuiz} onAnswer={handleQuizAnswer} />
                ) : (
                  <QuizOverlay interaction={activeQuiz} onAnswer={handleQuizAnswer} />
                )
              )}
            </AnimatePresence>

            {/* Custom controls */}
            <AnimatePresence>
              {signedUrl && !activeQuiz && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showControls ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-10 pointer-events-none"
                >
                  {/* Seekbar */}
                  <div
                    ref={seekBarRef}
                    className="relative w-full rounded-full mb-3 cursor-pointer pointer-events-auto group/seek"
                    style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.25)' }}
                    onClick={seek}
                  >
                    <div className="h-full bg-white/90 rounded-full" style={{ width: `${progressPct}%` }} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow -translate-x-1/2 scale-0 group-hover/seek:scale-100 transition-transform"
                      style={{ left: `${progressPct}%` }}
                    />
                    {/* Pause-point markers */}
                    {duration > 0 && interactions.map((item, idx) => {
                      const isAnswered = answered.includes(item.pause_time);
                      return (
                        <div
                          key={idx}
                          title={item.type === 'flashcard' ? item.payload.front : item.type === 'fill_blank' ? item.payload.sentence : item.payload.question}
                          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-black shadow -translate-x-1/2 z-10 transition-colors"
                          style={{
                            left: `${(item.pause_time / duration) * 100}%`,
                            backgroundColor: isAnswered ? '#10b981' : '#facc15',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Buttons row */}
                  <div className="flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="text-white hover:text-gray-200 transition-colors p-1">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button onClick={toggleMute} className="text-white hover:text-gray-200 transition-colors p-1">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <span className="text-white text-xs tabular-nums select-none">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <button onClick={toggleFullscreen} className="text-white hover:text-gray-200 transition-colors p-1">
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactions timeline */}
          {interactions.length > 0 && (
            <div className="px-5 py-4 bg-gray-900/60 border-t border-white/10 max-h-44 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Hoạt động tương tác ({interactions.length})
              </p>
              <div className="space-y-1">
                {interactions.map((item, idx) => {
                  const isAnswered = answered.includes(item.pause_time);
                  return (
                    <button
                      key={idx}
                      onClick={() => { if (videoRef.current) { videoRef.current.currentTime = Math.max(0, item.start_time); videoRef.current.play(); } }}
                      className="flex items-center gap-3 text-xs w-full text-left hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
                        style={{ backgroundColor: isAnswered ? '#10b981' : '#facc15' }}
                      />
                      <span className="w-12 text-gray-500 flex-shrink-0 tabular-nums">{formatTime(item.pause_time)}</span>
                      <span className="text-gray-300 line-clamp-1 flex-1">
                        {item.type === 'flashcard'
                          ? (item.payload.front ?? item.payload.title)
                          : item.type === 'fill_blank'
                          ? (item.payload.sentence ?? item.payload.title)
                          : (item.payload.question ?? item.payload.title)}
                      </span>
                      {isAnswered && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
