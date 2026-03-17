/**
 * Document & History Actions
 * ==========================
 * 
 * Core document loading/setting, undo/redo, online users, and navigation.
 */

import { IDocument, INode } from '@/types';
import { deepClone, findNode } from '../helpers/treeUtils';
import type { StoreGet, StoreSet, SetDocumentWithHistory } from '../types';
import { saveEditedSlideUrl } from '@/services/pipelineServices';
import { uploadSlideToGcs } from '@/services/gcsServices';

const SESSION_KEY = 'eduvi_slide_document';
const PRODUCT_CODE_KEY = 'eduvi_product_code';

export function createDocumentActions(
  set: StoreSet,
  get: StoreGet,
  setDocumentWithHistory: SetDocumentWithHistory,
) {
  return {
    // ======================================================================
    // DOCUMENT ACTIONS
    // ======================================================================

    loadDocument: async () => {
      // If a document was already set (e.g. via setDocument before navigating to editor), skip loading
      const { document: existing } = get();
      if (existing) {
        set({ error: null }); // clear any stale error from a previous failed load
        return;
      }

      // Restore from sessionStorage on reload (avoids re-fetching after F5)
      try {
        const cached = sessionStorage.getItem(SESSION_KEY);
        if (cached) {
          const doc: IDocument = JSON.parse(cached);
          const productCode = sessionStorage.getItem(PRODUCT_CODE_KEY) || null;
          set({
            document: doc,
            activeCardId: doc.activeCardId || doc.cards[0]?.id || null,
            history: [deepClone(doc)],
            historyIndex: 0,
            isLoading: false,
            error: null,
            currentProductCode: productCode,
          });
          return;
        }
      } catch {
        // Corrupted cache — fall through to API
        sessionStorage.removeItem(SESSION_KEY);
      }

      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/project');
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.statusText}`);
        }
        
        const data: IDocument = await response.json();
        
        const newHistory = [deepClone(data)];
        
        set({
          document: data,
          activeCardId: data.activeCardId || data.cards[0]?.id || null,
          history: newHistory,
          historyIndex: 0,
          isLoading: false,
        });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false,
        });
      }
    },

    setDocument: (doc: IDocument, productCode?: string) => {
      const newHistory = [deepClone(doc)];

      // Persist so the editor survives a page reload
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(doc));
        if (productCode !== undefined) {
          sessionStorage.setItem(PRODUCT_CODE_KEY, productCode);
        }
      } catch {
        // sessionStorage unavailable (e.g. private browsing quota) — ignore
      }

      set({
        document: doc,
        activeCardId: doc.activeCardId || doc.cards?.[0]?.id || null,
        history: newHistory,
        historyIndex: 0,
        error: null,
        ...(productCode !== undefined ? { currentProductCode: productCode } : {}),
      });
    },

    saveSlide: async () => {
      const { document, currentProductCode } = get();
      if (!document || !currentProductCode) return;
      set({ isSaving: true, error: null });
      try {
        // Capture rendered HTML for each card from the live DOM.
        // BE (Playwright) uses this HTML directly to render slide screenshots.
        const cardsWithHtml = await Promise.all(document.cards.map(async (card) => {
          const el = window.document.querySelector<HTMLElement>(`[data-card-id="${card.id}"]`);
          if (!el) return card;

          // Clone so we can strip editor-only chrome without mutating the live DOM
          const clone = el.cloneNode(true) as HTMLElement;

          // Remove editor-only elements: drag handles, floating toolbars, action buttons
          clone.querySelectorAll(
            '[data-editor-only], [data-drag-handle], [data-toolbar], .editor-ui'
          ).forEach((n) => n.remove());

          // Inline all external stylesheets so the HTML is self-contained.
          // Using absolute href (http://localhost:3000/...) would break when
          // BE (Playwright) renders the slide on a different server/environment.
          const styleSheetTexts = await Promise.all(
            Array.from(
              window.document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
            ).map(async (link) => {
              try {
                const res = await fetch(link.href);
                return res.ok ? await res.text() : '';
              } catch {
                return '';
              }
            })
          );

          const inlineStyles = Array.from(
            window.document.querySelectorAll('style')
          ).map((s) => s.textContent ?? '').join('\n');

          const allCss = [...styleSheetTexts, inlineStyles].join('\n');

          const fullHtml =
            `<html><head>` +
            `<style>${allCss}</style>` +
            `</head><body style="margin:0;background:transparent">` +
            clone.outerHTML +
            `</body></html>`;

          return { ...card, renderedHtml: fullHtml };
        }));

        const docWithHtml = { ...document, cards: cardsWithHtml };

        // 1. Upload slide JSON to GCS via Next.js server (no CORS, key stays server-side)
        const gcsObjectUrl = await uploadSlideToGcs(currentProductCode, docWithHtml);

        // 2. Notify BE with the GCS URL so it can reference/download the file
        await saveEditedSlideUrl(currentProductCode, gcsObjectUrl);
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Lưu slide thất bại, vui lòng thử lại.';
        console.error('[saveSlide]', err);
        set({ error: msg });
      } finally {
        set({ isSaving: false });
      }
    },

    // ======================================================================
    // UNDO/REDO ACTIONS
    // ======================================================================

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        set({
          document: deepClone(history[newIndex]),
          historyIndex: newIndex,
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        set({
          document: deepClone(history[newIndex]),
          historyIndex: newIndex,
        });
      }
    },

    canUndo: () => {
      const { historyIndex } = get();
      return historyIndex > 0;
    },

    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },

    // ======================================================================
    // ONLINE USERS ACTIONS
    // ======================================================================

    setOnlineUsers: (users: Array<{ id: string; name: string; avatar: string; color: string }>) => {
      set({ onlineUsers: users });
    },

    // ======================================================================
    // NAVIGATION ACTIONS
    // ======================================================================

    setActiveCard: (cardId: string) => {
      const { document } = get();
      if (!document) return;

      const cardExists = document.cards.some((card) => card.id === cardId);
      if (cardExists) {
        set({
          activeCardId: cardId,
          selectedNodeId: null,
        });
      }
    },

    setSelectedNode: (nodeId: string | null) => {
      set({ selectedNodeId: nodeId });
    },

    setEditingNodeId: (nodeId: string | null) => {
      set({ editingNodeId: nodeId });
    },

    // ======================================================================
    // UTILITY METHODS
    // ======================================================================

    getActiveCard: () => {
      const { document, activeCardId } = get();
      if (!document || !activeCardId) return null;
      return document.cards.find((card) => card.id === activeCardId) || null;
    },

    findNodeById: (nodeId: string) => {
      const { document } = get();
      if (!document) return null;

      const card = document.cards.find((c) => c.id === nodeId);
      if (card) return card;

      for (const cardItem of document.cards) {
        const found = findNode(cardItem.children as INode[], nodeId);
        if (found) return found;
      }

      return null;
    },
  };
}
