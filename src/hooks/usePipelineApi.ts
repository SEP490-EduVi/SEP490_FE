// src/hooks/usePipelineApi.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as pipelineService from '@/services/pipelineServices';
import type { LessonAnalysisInput, GenerateSlidesInput } from '@/types/api';

// ─── POST lesson analysis ──────────────────────────────────────────────────
export function useLessonAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LessonAnalysisInput) =>
      pipelineService.startLessonAnalysis(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ─── POST generate slides ──────────────────────────────────────────────────
export function useGenerateSlides() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateSlidesInput) =>
      pipelineService.generateSlides(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
