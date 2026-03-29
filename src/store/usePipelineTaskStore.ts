/**
 * usePipelineTaskStore
 * ====================
 * Persists active pipeline taskIds to localStorage so that on reconnect we
 * can call GET /api/Pipeline/status/{taskId} and resume the progress modal
 * instead of firing a new request against the server.
 *
 * Key format stored in localStorage:
 *   "pipeline-tasks"  →  Record<taskKey, taskId>
 *
 * taskKey examples:
 *   "eval:{productCode}"    – lesson analysis
 *   "slides:{productCode}"  – slide generation
 *   "video:{productCode}"   – video generation
 */

import { create } from 'zustand';

// ─── Helpers ──────────────────────────────────────────────────────────────

const LS_KEY = 'pipeline-tasks';

function readFromStorage(): Record<string, string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeToStorage(tasks: Record<string, string>) {
  try {
    if (typeof window !== 'undefined') {
      if (Object.keys(tasks).length === 0) {
        localStorage.removeItem(LS_KEY);
      } else {
        localStorage.setItem(LS_KEY, JSON.stringify(tasks));
      }
    }
  } catch { /* ignore */ }
}

// ─── Types ────────────────────────────────────────────────────────────────

export type PipelineTaskType = 'eval' | 'slides' | 'video';

export function makeTaskKey(type: PipelineTaskType, productCode: string): string {
  return `${type}:${productCode}`;
}

interface PipelineTaskState {
  /** In-memory mirror of localStorage pipeline-tasks */
  tasks: Record<string, string>; // taskKey → taskId

  /** Persist a new taskId when a pipeline starts */
  saveTask: (type: PipelineTaskType, productCode: string, taskId: string) => void;

  /** Remove a taskId when the pipeline completes or fails */
  clearTask: (type: PipelineTaskType, productCode: string) => void;

  /** Remove all tasks (e.g. on logout) */
  clearAll: () => void;

  /** Get a single taskId (or null) */
  getTaskId: (type: PipelineTaskType, productCode: string) => string | null;

  /** Get all active tasks as an array of { key, taskId } */
  getAllTasks: () => { key: string; taskId: string }[];

  /** Hydrate in-memory state from localStorage (call once on mount) */
  hydrate: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const usePipelineTaskStore = create<PipelineTaskState>()((set, get) => ({
  tasks: {},

  hydrate: () => {
    set({ tasks: readFromStorage() });
  },

  saveTask: (type, productCode, taskId) => {
    const key = makeTaskKey(type, productCode);
    const next = { ...get().tasks, [key]: taskId };
    writeToStorage(next);
    set({ tasks: next });
  },

  clearTask: (type, productCode) => {
    const key = makeTaskKey(type, productCode);
    const next = { ...get().tasks };
    delete next[key];
    writeToStorage(next);
    set({ tasks: next });
  },

  clearAll: () => {
    writeToStorage({});
    set({ tasks: {} });
  },

  getTaskId: (type, productCode) => {
    return get().tasks[makeTaskKey(type, productCode)] ?? null;
  },

  getAllTasks: () => {
    return Object.entries(get().tasks).map(([key, taskId]) => ({ key, taskId }));
  },
}));
