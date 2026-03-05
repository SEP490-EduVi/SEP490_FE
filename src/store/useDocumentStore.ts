/**
 * EduVi Document Store
 * ====================
 *
 * Zustand store for managing the entire document tree.
 * Implements immutable updates for React compatibility.
 *
 * This file composes action slices from:
 *   - actions/appModeActions      — Presentation mode & slide navigation
 *   - actions/documentActions     — Load, set, undo/redo, navigation, utilities
 *   - actions/cardActions         — Add cards (blank & template-based)
 *   - actions/nodeActions         — Update/delete nodes, blocks, card titles
 *   - actions/reorderActions      — Drag & drop reordering
 *   - actions/materialActions     — Drop materials, widget groups, wrap blocks
 *
 * Helpers live in:
 *   - helpers/treeUtils           — Tree traversal & immutable tree mutations
 *   - helpers/blockFactory        — Create blocks by BlockType
 *
 * Shared types live in:
 *   - types.ts                    — DocumentState, AppMode, StoreGet, etc.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { IDocument } from '@/types';

import { deepClone } from './helpers/treeUtils';
import type { DocumentState } from './types';

// Re-export types so existing `import { DocumentState, AppMode } from '@/store'` still works
export type { DocumentState } from './types';
export type { AppMode } from './types';

// Action slice creators
import { createAppModeActions } from './actions/appModeActions';
import { createDocumentActions } from './actions/documentActions';
import { createCardActions } from './actions/cardActions';
import { createNodeActions } from './actions/nodeActions';
import { createReorderActions } from './actions/reorderActions';
import { createMaterialActions } from './actions/materialActions';

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useDocumentStore = create<DocumentState>()(
  devtools(
    subscribeWithSelector((set, get) => {
      // -------------------------------------------------------------------
      // History-tracking wrapper shared by all action slices
      // -------------------------------------------------------------------
      const setDocumentWithHistory = (
        newDoc: IDocument,
        otherUpdates: Partial<Omit<DocumentState, 'document' | 'history' | 'historyIndex'>> = {},
      ) => {
        const { document: currentDoc, history, historyIndex } = get();

        // Remove future history (for redo support)
        const newHistory = history.slice(0, historyIndex + 1);

        // Only push if the document actually changed
        if (currentDoc) {
          const currentDocJson = JSON.stringify(currentDoc);
          const newDocJson = JSON.stringify(newDoc);
          if (currentDocJson !== newDocJson) {
            newHistory.push(deepClone(currentDoc));
          }
        }

        // Limit history to 50 items
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        set({
          document: newDoc,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          ...otherUpdates,
        });
      };

      return {
        // ================================================================
        // INITIAL STATE
        // ================================================================
        document: null,
        activeCardId: null,
        selectedNodeId: null,
        isLoading: false,
        error: null,

        // History
        history: [],
        historyIndex: -1,

        // Online users (mock data)
        onlineUsers: [
          { id: '1', name: 'You', avatar: 'P', color: 'bg-purple-500' },
          { id: '2', name: 'User 2', avatar: 'A', color: 'bg-blue-500' },
          { id: '3', name: 'User 3', avatar: 'B', color: 'bg-green-500' },
          { id: '4', name: 'User 4', avatar: 'C', color: 'bg-yellow-500' },
          { id: '5', name: 'User 5', avatar: 'D', color: 'bg-red-500' },
        ],

        // App mode
        appMode: 'EDITOR' as const,
        presentationSlideIndex: 0,

        // Editing node
        editingNodeId: null,

        // ================================================================
        // ACTIONS  (composed from slices)
        // ================================================================
        ...createAppModeActions(set, get),
        ...createDocumentActions(set, get, setDocumentWithHistory),
        ...createCardActions(set, get, setDocumentWithHistory),
        ...createNodeActions(set, get, setDocumentWithHistory),
        ...createReorderActions(set, get, setDocumentWithHistory),
        ...createMaterialActions(set, get, setDocumentWithHistory),
      };
    }),
    { name: 'eduvi-document-store' },
  ),
);

// ============================================================================
// SELECTORS (for optimized re-renders)
// ============================================================================

export const selectDocument = (state: DocumentState) => state.document;
export const selectActiveCardId = (state: DocumentState) => state.activeCardId;
export const selectSelectedNodeId = (state: DocumentState) => state.selectedNodeId;
export const selectIsLoading = (state: DocumentState) => state.isLoading;
export const selectError = (state: DocumentState) => state.error;
export const selectCards = (state: DocumentState) => state.document?.cards || [];

export default useDocumentStore;
