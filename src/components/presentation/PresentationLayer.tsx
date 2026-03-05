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
import { NodeRenderer } from '@/components/renderer/NodeRenderer';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';

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

  const [direction, setDirection] = React.useState(0);
  const prevIndexRef = React.useRef(presentationSlideIndex);

  // Track direction based on slide index changes
  useEffect(() => {
    if (prevIndexRef.current !== presentationSlideIndex) {
      setDirection(presentationSlideIndex > prevIndexRef.current ? 1 : -1);
      prevIndexRef.current = presentationSlideIndex;
    }
  }, [presentationSlideIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        nextSlide();
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
  }, [nextSlide, previousSlide, exitPresentation]);

  useEffect(() => {
    if (appMode === 'PRESENT') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [appMode, handleKeyDown]);

  // Don't render if not in presentation mode
  if (appMode !== 'PRESENT' || !document) return null;

  const currentCard = document.cards[presentationSlideIndex];
  const totalSlides = document.cards.length;
  const canGoBack = presentationSlideIndex > 0;
  const canGoForward = presentationSlideIndex < totalSlides - 1;

  // Debug logging
  console.log('Presentation Debug:', {
    presentationSlideIndex,
    totalSlides,
    currentCard: currentCard ? {
      id: currentCard.id,
      title: currentCard.title,
      childrenCount: currentCard.children?.length || 0,
    } : null,
  });

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
          className="fixed inset-0 z-50 bg-gray-900 flex flex-col"
        >
          {/* Header Bar */}
          <div className="absolute top-0 left-0 right-0 h-14 bg-black/50 backdrop-blur-sm flex items-center justify-between px-4 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={exitPresentation}
                className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title="Exit Presentation (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-white font-medium truncate max-w-[300px]">
                {document.title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Slide Counter */}
              <div className="text-white/80 text-sm font-medium">
                {presentationSlideIndex + 1} / {totalSlides}
              </div>
            </div>
          </div>

          {/* Main Slide Area */}
          <div className="flex-1 flex items-center justify-center p-8 pt-20 pb-20">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentCard?.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                }}
                className={cn(
                  'w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden',
                  'max-h-[calc(100vh-12rem)]'
                )}
              >
                {currentCard ? (
                  <div className="p-8 overflow-y-auto max-h-[calc(100vh-12rem)]">
                    {/* Slide Content */}
                    <div className="space-y-6">
                      {currentCard.children && currentCard.children.length > 0 ? (
                        currentCard.children.map((child) => (
                          <NodeRenderer
                            key={child.id}
                            node={child}
                            depth={0}
                          />
                        ))
                      ) : (
                        <div className="text-center text-gray-400 py-12">
                          <p className="text-lg">Slide này chưa có nội dung</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-lg">Không tìm thấy slide</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center gap-4 pb-4">
            {/* Previous */}
            <motion.button
              onClick={previousSlide}
              disabled={!canGoBack}
              whileHover={canGoBack ? { scale: 1.1 } : {}}
              whileTap={canGoBack ? { scale: 0.95 } : {}}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                'transition-all duration-200',
                canGoBack
                  ? 'bg-white/20 hover:bg-white/30 text-white cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              )}
              title="Previous Slide (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            {/* Progress Dots */}
            <div className="flex items-center gap-2 px-4">
              {document.cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => useDocumentStore.getState().goToSlide(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    index === presentationSlideIndex
                      ? 'w-8 bg-white'
                      : 'bg-white/30 hover:bg-white/50'
                  )}
                  title={card.title}
                />
              ))}
            </div>

            {/* Next */}
            <motion.button
              onClick={nextSlide}
              disabled={!canGoForward}
              whileHover={canGoForward ? { scale: 1.1 } : {}}
              whileTap={canGoForward ? { scale: 0.95 } : {}}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                'transition-all duration-200',
                canGoForward
                  ? 'bg-white/20 hover:bg-white/30 text-white cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              )}
              title="Next Slide (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Keyboard Hints */}
          <div className="absolute bottom-4 left-4 text-white/40 text-xs">
            <span className="inline-block px-2 py-1 bg-white/10 rounded mr-2">←</span>
            <span className="inline-block px-2 py-1 bg-white/10 rounded mr-2">→</span>
            Navigate
            <span className="mx-2">|</span>
            <span className="inline-block px-2 py-1 bg-white/10 rounded mr-2">Esc</span>
            Exit
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PresentationLayer;
