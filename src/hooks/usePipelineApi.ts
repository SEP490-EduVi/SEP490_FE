// src/hooks/usePipelineApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pipelineService from '@/services/pipelineServices';
import * as videoService from '@/services/videoServices';
import type { LessonAnalysisInput, GenerateSlidesInput, GenerateVideoInput, CurriculumDto } from '@/types/api';
import { getCurricula } from '@/services/curriculumServices';

// ─── GET curricula ─────────────────────────────────────────────
export function useCurricula() {
  return useQuery<CurriculumDto[]>({
    queryKey: ['curricula'],
    queryFn: getCurricula,
    staleTime: 5 * 60_000,
  });
}

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

// ─── DELETE video ──────────────────────────────────────────────────────────
export function useDeleteVideo(projectCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productVideoCode: string) => videoService.deleteVideo(productVideoCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['video', 'latest', projectCode] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
