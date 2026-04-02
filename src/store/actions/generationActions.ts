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
const PROJECT_CODE_KEY = 'eduvi_project_code';
const IS_GENERATING_KEY = 'eduvi_is_generating';
const GENERATING_PRODUCT_CODE_KEY = 'eduvi_generating_product_code';

export function createGenerationActions(set: StoreSet, get: StoreGet) {
  return {
    /**
     * Begin a new generation session — clears the current document and
     * sets the editor into "generating" mode. Call this before navigating
     * to `/teacher/editor`.
     */
    startGeneration: (productCode: string, projectCode?: string) => {
      if (projectCode !== undefined) {
        try { sessionStorage.setItem(PROJECT_CODE_KEY, projectCode); } catch { /* ignore */ }
      }
      try {
        sessionStorage.setItem('eduvi_is_newly_generated', 'true');
        // Mark as generating so a page reload can restore the overlay instead
        // of showing the editor with a stale document.
        sessionStorage.setItem(IS_GENERATING_KEY, 'true');
        sessionStorage.setItem(GENERATING_PRODUCT_CODE_KEY, productCode);
        // Remove any cached slide document from a previous session so it
        // cannot be picked up by loadDocument on reload.
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(PRODUCT_CODE_KEY);
      } catch { /* ignore */ }
      set({
        isGenerating: true,
        generationStep: 'started',
        generationProgress: 0,
        generationProductCode: productCode,
        document: null,
        activeCardId: null,
        revealedCardCount: 0,
        currentProductCode: productCode,
        currentProjectCode: projectCode ?? null,
        isDirty: false,
        isSlideEdited: false,
        isNewlyGenerated: true,
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
      const projectCode = (() => {
        try { return sessionStorage.getItem(PROJECT_CODE_KEY) || null; } catch { return null; }
      })();

      // Persist so the editor survives a page reload after generation finishes
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(doc));
        if (productCode) {
          sessionStorage.setItem(PRODUCT_CODE_KEY, productCode);
        }
        // Generation is done — clear the in-progress flag
        sessionStorage.removeItem(IS_GENERATING_KEY);
        sessionStorage.removeItem(GENERATING_PRODUCT_CODE_KEY);
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
        currentProjectCode: projectCode,
        isDirty: false,
        isSlideEdited: false,
        history: [deepClone(doc)],
        historyIndex: 0,
      });
    },

    /** Abort / dismiss the generation overlay. */
    cancelGeneration: () => {
      try {
        sessionStorage.removeItem(IS_GENERATING_KEY);
        sessionStorage.removeItem(GENERATING_PRODUCT_CODE_KEY);
      } catch { /* ignore */ }
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
