'use client';

/**
 * PresentationLayer Component
 * ===========================
 * 
 * Full-screen overlay for Presentation Mode.
 * Displays slides one at a time with navigation and keyboard controls.
 * 
 * Features:
 * - Full-screen dark overlay
 * - Current slide centered
 * - Navigation buttons (Next/Previous)
 * - Keyboard navigation (Arrow keys, Escape)
 * - Slide counter
 * - Exit button
 * 
 * All interactive blocks automatically switch to Player mode.
 * Tiptap editors are read-only in this mode.
 */

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { NodeRenderer, ActiveSlideProvider } from '@/components/renderer/NodeRenderer';
import { ILayout, IBlock, BlockType, isBlock } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

// ============================================================================
// HELPERS
// ============================================================================

const INTERACTIVE_TYPES = new Set([
  BlockType.QUIZ,
  BlockType.FLASHCARD,
  BlockType.FILL_BLANK,
  BlockType.VIDEO,
]);

function hasInteractiveBlock(nodes: (ILayout | IBlock)[]): boolean {
  for (const node of nodes) {
    if (isBlock(node) && INTERACTIVE_TYPES.has(node.content.type)) return true;
    if (!isBlock(node) && node.children && hasInteractiveBlock(node.children)) return true;
  }
  return false;
}

// ============================================================================
// SLIDE TRANSITION VARIANTS
// ============================================================================

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// ============================================================================
// PRESENTATION LAYER
// ============================================================================

export function PresentationLayer() {
  const appMode = useDocumentStore((state) => state.appMode);
  const document = useDocumentStore((state) => state.document);
  const presentationSlideIndex = useDocumentStore((state) => state.presentationSlideIndex);
  const exitPresentation = useDocumentStore((state) => state.exitPresentation);
  const nextSlide = useDocumentStore((state) => state.nextSlide);
  const previousSlide = useDocumentStore((state) => state.previousSlide);


  const directionRef = React.useRef(0);
  const prevIndexRef = React.useRef(presentationSlideIndex);

  // Compute direction synchronously during render (no useEffect delay)
  if (prevIndexRef.current !== presentationSlideIndex) {
    directionRef.current = presentationSlideIndex > prevIndexRef.current ? 1 : -1;
    prevIndexRef.current = presentationSlideIndex;
  }
  const direction = directionRef.current;

  // Compute isInteractive before handleKeyDown so it's in scope for the callback
  const currentCard = document?.cards[presentationSlideIndex];
  const isInteractive = currentCard ? hasInteractiveBlock(currentCard.children ?? []) : false;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextSlide();
        break;
      case ' ':
        // Block Space navigation on interactive slides so users can type/click freely
        if (!isInteractive) {
          e.preventDefault();
          nextSlide();
        }
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        previousSlide();
        break;
      case 'Escape':
        e.preventDefault();
        exitPresentation();
        break;
    }
  }, [nextSlide, previousSlide, exitPresentation, isInteractive]);

  useEffect(() => {
    if (appMode === 'PRESENT') {
      window.document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      if (window.document.fullscreenElement) {
        window.document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [appMode]);

  useEffect(() => {
    if (appMode === 'PRESENT') {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [appMode, handleKeyDown]);


  // Don't render if not in presentation mode
  if (appMode !== 'PRESENT' || !document) return null;

  const totalSlides = document.cards.length;
  const canGoBack = presentationSlideIndex > 0;
  const canGoForward = presentationSlideIndex < totalSlides - 1;

  return (
    <AnimatePresence>
      {appMode === 'PRESENT' && (
        <motion.div
          key="presentation-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-[#f8f8f6] flex flex-col"
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-sm flex items-center justify-between px-5 z-20 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                onClick={exitPresentation}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Thoát (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
              <h1 className="text-white/70 text-sm font-medium truncate max-w-[280px]">
                {document.title}
              </h1>
            </div>
            <div className="pointer-events-auto text-white/50 text-sm font-medium pr-1">
              {presentationSlideIndex + 1} / {totalSlides}
            </div>
          </div>

          {/* Slide content — fills full screen */}
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={presentationSlideIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'tween', duration: 0.3, ease: 'easeInOut' },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                }}
                className={cn(
                  'absolute inset-0 bg-[#f8f8f6]',
                  !isInteractive && 'select-none'
                )}
              >
                {currentCard ? (
                  <div className={cn(
                    'min-h-full flex flex-col justify-center px-20 py-10 pt-16',
                    isInteractive ? 'pointer-events-auto' : 'pointer-events-none'
                  )}>
                    <div
                      className="w-full space-y-6 [&_.flex-row]:items-stretch [&_.flex-row>div]:flex [&_.flex-row>div]:flex-col [&_.flex-row_figure]:flex-1 [&_.flex-row_figure]:h-full [&_.flex-row_.aspect-video]:aspect-auto [&_.flex-row_.aspect-video]:h-full [&_.flex-row_figure_img]:h-full [&_.flex-row_figure_img]:w-full [&_.flex-row_figure_img]:object-cover"
                      style={{ fontSize: '1.35rem' }}
                    >
                      {currentCard.children && currentCard.children.length > 0 ? (
                        <ActiveSlideProvider>
                          {currentCard.children.map((child) => (
                            <NodeRenderer key={child.id} node={child} depth={0} />
                          ))}
                        </ActiveSlideProvider>
                      ) : (
                        <div className="text-center text-gray-400 py-12">
                          <p className="text-lg">Slide này chưa có nội dung</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="min-h-full flex items-center justify-center text-gray-400">
                    <p className="text-lg">Không tìm thấy slide</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Left click zone overlay */}
          <div
            onClick={canGoBack ? previousSlide : undefined}
            className={cn(
              'absolute left-0 top-12 bottom-10 w-[5%] z-10 flex items-center justify-start pl-2 group',
              canGoBack ? 'cursor-pointer' : 'pointer-events-none'
            )}
          >
            {canGoBack && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-black/60" />
              </div>
            )}
          </div>

          {/* Right click zone overlay */}
          <div
            onClick={canGoForward ? nextSlide : undefined}
            className={cn(
              'absolute right-0 top-12 bottom-10 w-[5%] z-10 flex items-center justify-end pr-2 group',
              canGoForward ? 'cursor-pointer' : 'pointer-events-none'
            )}
          >
            {canGoForward && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-black/60" />
              </div>
            )}
          </div>

          {/* Bottom progress dots */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
            {document.cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => useDocumentStore.getState().goToSlide(index)}
                className={cn(
                  'rounded-full transition-all duration-200',
                  index === presentationSlideIndex
                    ? 'w-6 h-2 bg-gray-600'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-500'
                )}
                title={card.title}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PresentationLayer;
