'use client';

/**
 * SlideGenerationOverlay
 * ======================
 *
 * Full-screen overlay displayed while AI generates slides.
 * Shows pipeline steps with animated progress, then orchestrates
 * the staggered card-reveal animation when slides are ready.
 *
 * Even if SignalR delivers all data at once the overlay queues
 * cards and reveals them one-by-one with a configurable delay.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileSearch,
  Layers,
  Database,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useDocumentStore } from '@/store';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import * as productService from '@/services/productServices';
import type { PipelineProgress } from '@/types/api';

// ── Step mapping (mirrors PipelineProgressModal for consistency) ────────

interface StepInfo {
  label: string;
  icon: React.ElementType;
}

const SLIDE_STEPS: Record<string, StepInfo> = {
  started: { label: 'Bắt đầu tạo slide', icon: Sparkles },
  planning: { label: 'Lên kế hoạch cấu trúc', icon: FileSearch },
  generating_slides: { label: 'Đang tạo slides', icon: Layers },
  assembling: { label: 'Đang tổng hợp', icon: Database },
  slides_completed: { label: 'Hoàn thành', icon: CheckCircle },
};

const ORDERED_STEPS = ['started', 'planning', 'generating_slides', 'assembling', 'slides_completed'];

/** Delay (ms) between revealing each card */
const CARD_REVEAL_DELAY = 800;

// ── Component ──────────────────────────────────────────────────────────────

export default function SlideGenerationOverlay() {
  const isGenerating = useDocumentStore((s) => s.isGenerating);
  const generationStep = useDocumentStore((s) => s.generationStep);
  const generationProgress = useDocumentStore((s) => s.generationProgress);
  const generationProductCode = useDocumentStore((s) => s.generationProductCode);
  const document = useDocumentStore((s) => s.document);
  const revealedCardCount = useDocumentStore((s) => s.revealedCardCount);

  const setGenerationProgress = useDocumentStore((s) => s.setGenerationProgress);
  const completeGeneration = useDocumentStore((s) => s.completeGeneration);
  const cancelGeneration = useDocumentStore((s) => s.cancelGeneration);
  const revealNextCard = useDocumentStore((s) => s.revealNextCard);
  const finishReveal = useDocumentStore((s) => s.finishReveal);

  const [error, setError] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);

  // ── SignalR connection (only active while generating) ──────────────────

  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setAccessToken(localStorage.getItem('accessToken'));
    }
  }, [isGenerating]);

  const handlePipelineProgress = useCallback(
    (event: PipelineProgress) => {
      if (!isGenerating) return;

      if (event.status === 'failed') {
        setError(event.error || 'Pipeline thất bại');
        return;
      }

      setGenerationProgress(event.step, event.progress ?? 0);

      // When the pipeline reports completion, fetch the slide document
      if (event.step === 'slides_completed' && !fetchingRef.current) {
        fetchingRef.current = true;
        productService
          .getProductSlide(generationProductCode!)
          .then((result) => {
            completeGeneration(result.slideDocument);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Không thể tải slide');
          })
          .finally(() => {
            fetchingRef.current = false;
          });
      }
    },
    [isGenerating, generationProductCode, setGenerationProgress, completeGeneration],
  );

  usePipelineHub({ accessToken: isGenerating ? accessToken : null, onProgress: handlePipelineProgress });

  // ── Progressive card reveal timer ─────────────────────────────────────

  useEffect(() => {
    // Start revealing once document has been set AND step is completed
    if (!document || generationStep !== 'slides_completed' || !isGenerating) return;

    const totalCards = document.cards.length;

    if (revealedCardCount < totalCards && !isRevealing) {
      setIsRevealing(true);
    }

    if (isRevealing && revealedCardCount < totalCards) {
      revealTimerRef.current = setTimeout(() => {
        revealNextCard();
      }, CARD_REVEAL_DELAY);
    }

    // All cards revealed → finish
    if (revealedCardCount >= totalCards && totalCards > 0) {
      setIsRevealing(false);
      // Small delay so the user can appreciate the last card before clearing the overlay
      const t = setTimeout(() => finishReveal(), 600);
      return () => clearTimeout(t);
    }

    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [document, generationStep, isGenerating, revealedCardCount, isRevealing, revealNextCard, finishReveal]);

  // ── Don't render when not generating ──────────────────────────────────

  if (!isGenerating) return null;

  // ── Derived state ─────────────────────────────────────────────────────

  const currentStepIdx = generationStep ? ORDERED_STEPS.indexOf(generationStep) : 0;
  const slidesReady = !!document && generationStep === 'slides_completed';

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isGenerating && (
        <motion.div
          key="gen-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            slidesReady ? 'pointer-events-none' : 'backdrop-blur-sm'
          }`}
          style={{
            background: slidesReady
              ? 'transparent'
              : 'rgba(0,0,0,0.25)',
            transition: 'background 0.8s ease',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{
              scale: slidesReady ? 0.85 : 1,
              y: slidesReady ? -300 : 0,
              opacity: slidesReady ? 0 : 1,
            }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-lg w-full mx-4 text-center"
          >
            {/* Animated sparkle icon */}
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6"
            >
              <Sparkles className="w-10 h-10 text-indigo-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AI đang tạo slide cho bạn
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Vui lòng đợi khi hệ thống xử lý…
            </p>

            {/* Error state */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-2 bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
                <button
                  onClick={() => { setError(null); cancelGeneration(); }}
                  className="ml-auto text-xs underline hover:no-underline"
                >
                  Đóng
                </button>
              </motion.div>
            )}

            {/* Step list */}
            <div className="space-y-3 mb-8">
              {ORDERED_STEPS.map((stepKey, idx) => {
                const info = SLIDE_STEPS[stepKey];
                const Icon = info.icon;
                const isPast = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <motion.div
                    key={stepKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center gap-3 text-left rounded-lg px-4 py-2.5 transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50 text-indigo-700'
                        : isPast
                          ? 'bg-green-50 text-green-600'
                          : 'text-gray-400'
                    }`}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center">
                      {isPast ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        >
                          <Loader2 className="w-5 h-5 text-indigo-600" />
                        </motion.div>
                      ) : (
                        <Icon className="w-5 h-5 opacity-40" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{info.label}</span>

                    {isCurrent && generationProgress > 0 && (
                      <span className="ml-auto text-xs font-mono text-indigo-500">
                        {Math.round(generationProgress)}%
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ width: `${generationProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
