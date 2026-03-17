// src/hooks/usePipelineApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pipelineService from '@/services/pipelineServices';
import * as videoService from '@/services/videoServices';
import type { LessonAnalysisInput, GenerateSlidesInput, GenerateVideoInput } from '@/types/api';

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

// ─── POST generate video ───────────────────────────────────────────────────
export function useGenerateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateVideoInput) =>
      videoService.generateVideo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ─── GET latest video by project ──────────────────────────────────────────
export function useLatestVideoByProject(projectCode: string) {
  return useQuery({
    queryKey: ['video', 'latest', projectCode],
    queryFn: () => videoService.getLatestVideoByProject(projectCode),
    enabled: !!projectCode,
    staleTime: 30_000,
    retry: false,
  });
}
