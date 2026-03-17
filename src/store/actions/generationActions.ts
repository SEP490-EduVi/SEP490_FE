/**
 * Generation Actions
 * ==================
 *
 * Manages the slide-generation lifecycle:
 *   startGeneration → setGenerationProgress → completeGeneration → revealNextCard → finishReveal
 *
 * When generation completes, cards are revealed one-by-one via a progressive
 * animation controlled by `revealedCardCount` in the store.
 */

import { IDocument } from '@/types';
import { deepClone } from '../helpers/treeUtils';
import type { StoreGet, StoreSet } from '../types';

const SESSION_KEY = 'eduvi_slide_document';
const PRODUCT_CODE_KEY = 'eduvi_product_code';

export function createGenerationActions(set: StoreSet, get: StoreGet) {
  return {
    /**
     * Begin a new generation session — clears the current document and
     * sets the editor into "generating" mode. Call this before navigating
     * to `/teacher/editor`.
     */
    startGeneration: (productCode: string) => {
      set({
        isGenerating: true,
        generationStep: 'started',
        generationProgress: 0,
        generationProductCode: productCode,
        document: null,
        activeCardId: null,
        revealedCardCount: 0,
        currentProductCode: productCode,
        error: null,
      });
    },

    /** Update the current pipeline step + percentage shown in the overlay. */
    setGenerationProgress: (step: string, progress: number) => {
      set({ generationStep: step, generationProgress: progress });
    },

    /**
     * Called when the full slide document has been fetched after generation.
     * Sets the document but keeps `isGenerating = true` so the progressive
     * card-reveal animation can run.
     */
    completeGeneration: (doc: IDocument) => {
      const productCode = get().generationProductCode;

      // Persist so the editor survives a page reload
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(doc));
        if (productCode) {
          sessionStorage.setItem(PRODUCT_CODE_KEY, productCode);
        }
      } catch {
        // quota exceeded – ignore
      }

      set({
        document: doc,
        activeCardId: doc.cards[0]?.id || null,
        generationStep: 'slides_completed',
        generationProgress: 100,
        revealedCardCount: 0,
        currentProductCode: productCode,
        history: [deepClone(doc)],
        historyIndex: 0,
      });
    },

    /** Abort / dismiss the generation overlay. */
    cancelGeneration: () => {
      set({
        isGenerating: false,
        generationStep: null,
        generationProgress: 0,
        generationProductCode: null,
        revealedCardCount: 0,
      });
    },

    /**
     * Increment the visible card count by 1 and auto-select the newly
     * revealed card so the MainStage keeps up.
     */
    revealNextCard: () => {
      const { document, revealedCardCount } = get();
      if (!document) return;
      const total = document.cards.length;
      if (revealedCardCount >= total) return;

      const next = revealedCardCount + 1;
      const newActiveCard = document.cards[next - 1];
      set({
        revealedCardCount: next,
        activeCardId: newActiveCard?.id || get().activeCardId,
      });
    },

    /** Called after the last card is revealed – exits generation mode. */
    finishReveal: () => {
      set({
        isGenerating: false,
        generationStep: null,
        generationProgress: 0,
        generationProductCode: null,
        revealedCardCount: 0,
      });
    },
  };
}
