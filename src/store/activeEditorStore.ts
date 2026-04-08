/**
 * Active Editor Store
 * ===================
 * 
 * Holds a reference to the currently-focused Tiptap editor
 * so the global ContextualTextToolbar can read from it.
 * 
 * The Editor instance is kept in a module-level variable (not in Zustand)
 * to avoid serialization concerns. Zustand only tracks hasSelection and
 * editorVersion to trigger re-renders.
 */

import { create } from 'zustand';
import type { Editor } from '@tiptap/react';

// Module-level reference — not serializable, not tracked by Zustand
let _activeEditor: Editor | null = null;

export const getActiveEditor = (): Editor | null => _activeEditor;

interface ActiveEditorState {
  hasSelection: boolean;
  /** Bumped on every editor transaction so ContextualTextToolbar reflects fresh isActive() state */
  editorVersion: number;
  setActiveEditor: (editor: Editor | null, hasSelection: boolean) => void;
  bumpEditorVersion: () => void;
}

export const useActiveEditorStore = create<ActiveEditorState>((set) => ({
  hasSelection: false,
  editorVersion: 0,
  setActiveEditor: (editor, hasSelection) => {
    _activeEditor = editor;
    set({ hasSelection });
  },
  bumpEditorVersion: () => set((state) => ({ editorVersion: state.editorVersion + 1 })),
}));
