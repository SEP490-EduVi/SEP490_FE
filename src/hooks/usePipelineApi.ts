// src/hooks/usePipelineApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pipelineService from '@/services/pipelineServices';
import * as videoService from '@/services/videoServices';
import type { LessonAnalysisInput, GenerateSlidesInput, GenerateVideoInput, CurriculumDto, UploadCurriculumInput } from '@/types/api';
import { getCurricula, getCurriculumByCode, uploadCurriculum } from '@/services/curriculumServices';

// ─── GET curricula ─────────────────────────────────────────────
export function useCurricula() {
  return useQuery<CurriculumDto[]>({
    queryKey: ['curricula'],
    queryFn: getCurricula,
    staleTime: 5 * 60_000,
  });
}

// ─── GET curriculum detail by documentCode ───────────────────────────────
export function useCurriculum(documentCode?: string) {
  return useQuery({
    queryKey: ['curricula', documentCode],
    queryFn: () => getCurriculumByCode(documentCode!),
    enabled: !!documentCode,
  });
}

// ─── POST curriculum upload ───────────────────────────────────────────────
export function useUploadCurriculum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadCurriculumInput) => uploadCurriculum(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curricula'] });
    },
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

// ─── GET all videos by project ───────────────────────────────────────────
export function useVideosByProject(projectCode: string) {
  return useQuery({
    queryKey: ['video', 'project', projectCode],
    queryFn: () => videoService.getVideosByProject(projectCode),
    enabled: !!projectCode,
    staleTime: 30_000,
    retry: false,
  });
}

// ─── GET pipeline status by task id ──────────────────────────────────────
export function usePipelineTaskStatus(taskId?: string, enabled = true) {
  return useQuery({
    queryKey: ['pipeline-task-status', taskId],
    queryFn: () => pipelineService.getPipelineTaskStatus(taskId!),
    enabled: !!taskId && enabled,
    refetchInterval: 5_000,
  });
}

// ─── GET all videos for current user ────────────────────────────────────────
export function useAllVideos() {
  return useQuery({
    queryKey: ['video', 'all'],
    queryFn: videoService.getAllVideos,
    staleTime: 30_000,
  });
}

// ─── DELETE video ──────────────────────────────────────────────────────────
export function useDeleteVideo(projectCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productVideoCode: string) => videoService.deleteVideo(productVideoCode),
    onSuccess: () => {
      // Set cache to null immediately so the UI reflects deletion without a
      // refetch race-condition (a GET fired right after DELETE may race against
      // the backend and return the old record before it is fully removed).
      qc.setQueryData(['video', 'latest', projectCode], null);
      // Invalidate the products list (used for status badges / other views).
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['video', 'all'] });
    },
  });
}
