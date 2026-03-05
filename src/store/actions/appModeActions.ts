/**
 * App Mode & Presentation Actions
 * ================================
 * 
 * Controls editor/presentation mode switching and slide navigation.
 */

import { IDocument } from '@/types';
import { deepClone } from '../helpers/treeUtils';
import type { AppMode, StoreGet, StoreSet, SetDocumentWithHistory } from '../types';

export function createAppModeActions(
  set: StoreSet,
  get: StoreGet,
) {
  return {
    setAppMode: (mode: AppMode) => {
      set({ appMode: mode });
    },

    startPresentation: () => {
      const { document, activeCardId } = get();
      if (!document) return;

      const slideIndex = activeCardId 
        ? document.cards.findIndex((c) => c.id === activeCardId)
        : 0;

      set({
        appMode: 'PRESENT',
        presentationSlideIndex: Math.max(0, slideIndex),
        selectedNodeId: null,
      });
    },

    exitPresentation: () => {
      const { document, presentationSlideIndex } = get();
      if (!document) return;

      const currentCard = document.cards[presentationSlideIndex];
      set({
        appMode: 'EDITOR',
        activeCardId: currentCard?.id || document.cards[0]?.id || null,
      });
    },

    nextSlide: () => {
      const { document, presentationSlideIndex } = get();
      if (!document) return;

      const maxIndex = document.cards.length - 1;
      if (presentationSlideIndex < maxIndex) {
        set({ presentationSlideIndex: presentationSlideIndex + 1 });
      }
    },

    previousSlide: () => {
      const { presentationSlideIndex } = get();
      if (presentationSlideIndex > 0) {
        set({ presentationSlideIndex: presentationSlideIndex - 1 });
      }
    },

    goToSlide: (index: number) => {
      const { document } = get();
      if (!document) return;

      const clampedIndex = Math.max(0, Math.min(index, document.cards.length - 1));
      set({ presentationSlideIndex: clampedIndex });
    },
  };
}
