/**
 * usePipelineProgressStore
 * ========================
 * Global in-memory store for the current live pipeline progress event.
 * Any page that receives SignalR events writes here.
 * The GlobalPipelinePill reads from this store to show progress on ALL pages.
 */

import { create } from 'zustand';
import type { PipelineProgress } from '@/types/api';

interface PipelineProgressState {
  progress: PipelineProgress | null;
  pipelineType: 'evaluation' | 'slides' | 'video';
  /** projectCode of the project that owns the running task */
  projectCode: string | null;
  setProgress: (
    p: PipelineProgress,
    type: 'evaluation' | 'slides' | 'video',
    projectCode: string | null
  ) => void;
  clear: () => void;
}

export const usePipelineProgressStore = create<PipelineProgressState>()((set) => ({
  progress: null,
  pipelineType: 'evaluation',
  projectCode: null,
  setProgress: (progress, pipelineType, projectCode) =>
    set({ progress, pipelineType, projectCode }),
  clear: () => set({ progress: null, projectCode: null }),
}));
