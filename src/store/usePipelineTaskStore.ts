/**
 * usePipelineTaskStore
 * ====================
 * Persists active pipeline taskIds to localStorage so that on reconnect we
 * can call GET /api/Pipeline/status/{taskId} and resume the progress modal
 * instead of firing a new request against the server.
 *
 * Storage is SCOPED BY USER so that different accounts on the same browser
 * never share or pollute each other's task lists.
 *
 * Key format stored in localStorage:
 *   "pipeline-tasks-{userId}"  →  Record<taskKey, taskId>
 *
 * taskKey examples:
 *   "eval:{productCode}"    – lesson analysis
 *   "slides:{productCode}"  – slide generation
 *   "video:{productCode}"   – video generation
 */

import { create } from 'zustand';

// ─── Helpers ──────────────────────────────────────────────────────────────

const LS_KEY_PREFIX = 'pipeline-tasks';
const LEGACY_LS_KEY = 'pipeline-tasks'; // un-scoped key from old code — cleaned up on hydrate
const PC_KEY_PREFIX = 'pipeline-task-projects'; // taskKey → projectCode

/** Resolve the localStorage key for a given userId. */
function lsKey(userId: string | number | null): string {
  return userId ? `${LS_KEY_PREFIX}-${userId}` : LS_KEY_PREFIX;
}

/** Read userId from the auth user stored in localStorage (avoids circular store import). */
function readCurrentUserId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: number | string };
    return parsed?.userId != null ? String(parsed.userId) : null;
  } catch {
    return null;
  }
}

function readFromStorage(userId: string | null): Record<string, string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(lsKey(userId)) : null;
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function readProjectCodesFromStorage(userId: string | null): Record<string, string> {
  try {
    const key = userId ? `${PC_KEY_PREFIX}-${userId}` : PC_KEY_PREFIX;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeProjectCodesToStorage(projectCodes: Record<string, string>, userId: string | null) {
  try {
    if (typeof window !== 'undefined') {
      const key = userId ? `${PC_KEY_PREFIX}-${userId}` : PC_KEY_PREFIX;
      if (Object.keys(projectCodes).length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(projectCodes));
      }
    }
  } catch { /* ignore */ }
}

function writeToStorage(tasks: Record<string, string>, userId: string | null) {
  try {
    if (typeof window !== 'undefined') {
      const key = lsKey(userId);
      if (Object.keys(tasks).length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(tasks));
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
  /** In-memory mirror of localStorage pipeline-tasks-{userId} */
  tasks: Record<string, string>; // taskKey → taskId

  /** taskKey → projectCode (so nav pill knows where to go) */
  projectCodes: Record<string, string>;

  /** Currently scoped userId (set during hydrate) */
  userId: string | null;

  /** Persist a new taskId when a pipeline starts */
  saveTask: (type: PipelineTaskType, productCode: string, taskId: string) => void;

  /** Persist a new taskId AND the owning projectCode */
  saveTaskWithProject: (type: PipelineTaskType, productCode: string, taskId: string, projectCode: string) => void;

  /** Remove a taskId when the pipeline completes or fails */
  clearTask: (type: PipelineTaskType, productCode: string) => void;

  /** Remove all tasks for the current user (e.g. on logout) */
  clearAll: () => void;

  /** Get a single taskId (or null) */
  getTaskId: (type: PipelineTaskType, productCode: string) => string | null;

  /** Get the projectCode associated with a task (or null) */
  getProjectCode: (type: PipelineTaskType, productCode: string) => string | null;

  /** Get all active tasks as an array of { key, taskId } */
  getAllTasks: () => { key: string; taskId: string }[];

  /**
   * Hydrate in-memory state from localStorage (call once on mount).
   * Automatically resolves userId from the stored auth user — no parameter needed.
   * Also removes the legacy un-scoped key if it exists.
   */
  hydrate: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const usePipelineTaskStore = create<PipelineTaskState>()((set, get) => ({
  tasks: {},
  projectCodes: {},
  userId: null,

  hydrate: () => {
    const userId = readCurrentUserId();

    // Clean up the old un-scoped key left by previous code versions
    if (typeof window !== 'undefined' && userId) {
      try { localStorage.removeItem(LEGACY_LS_KEY); } catch { /* ignore */ }
    }

    set({
      tasks: readFromStorage(userId),
      projectCodes: readProjectCodesFromStorage(userId),
      userId,
    });
  },

  saveTask: (type, productCode, taskId) => {
    const key = makeTaskKey(type, productCode);
    const next = { ...get().tasks, [key]: taskId };
    writeToStorage(next, get().userId);
    set({ tasks: next });
  },

  saveTaskWithProject: (type, productCode, taskId, projectCode) => {
    const key = makeTaskKey(type, productCode);
    const nextTasks = { ...get().tasks, [key]: taskId };
    const nextPc = { ...get().projectCodes, [key]: projectCode };
    writeToStorage(nextTasks, get().userId);
    writeProjectCodesToStorage(nextPc, get().userId);
    set({ tasks: nextTasks, projectCodes: nextPc });
  },

  clearTask: (type, productCode) => {
    const key = makeTaskKey(type, productCode);
    const nextTasks = { ...get().tasks };
    const nextPc = { ...get().projectCodes };
    delete nextTasks[key];
    delete nextPc[key];
    writeToStorage(nextTasks, get().userId);
    writeProjectCodesToStorage(nextPc, get().userId);
    set({ tasks: nextTasks, projectCodes: nextPc });
  },

  clearAll: () => {
    writeToStorage({}, get().userId);
    writeProjectCodesToStorage({}, get().userId);
    set({ tasks: {}, projectCodes: {} });
  },

  getTaskId: (type, productCode) => {
    return get().tasks[makeTaskKey(type, productCode)] ?? null;
  },

  getProjectCode: (type, productCode) => {
    return get().projectCodes[makeTaskKey(type, productCode)] ?? null;
  },

  getAllTasks: () => {
    return Object.entries(get().tasks).map(([key, taskId]) => ({ key, taskId }));
  },
}));
