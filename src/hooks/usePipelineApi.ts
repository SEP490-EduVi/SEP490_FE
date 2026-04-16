// src/hooks/usePipelineApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pipelineService from '@/services/pipelineServices';
import * as videoService from '@/services/videoServices';
import type {
  LessonAnalysisInput,
  GenerateSlidesInput,
  GenerateVideoInput,
  CurriculumDto,
  TextbookDto,
  UploadCurriculumInput,
  UploadTextbookInput,
} from '@/types/api';
import {
  deleteCurriculumNeo4j,
  getCurricula,
  getCurriculumByCode,
  uploadCurriculum,
} from '@/services/curriculumServices';
import {
  deleteTextbookNeo4j,
  getTextbookByCode,
  getTextbooks,
  uploadTextbook,
} from '@/services/textbookServices';

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

export function useDeleteCurriculumNeo4j() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentCode: string) => deleteCurriculumNeo4j(documentCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curricula'] });
    },
  });
}

// ─── GET textbooks ─────────────────────────────────────────────
export function useTextbooks() {
  return useQuery<TextbookDto[]>({
    queryKey: ['textbooks'],
    queryFn: getTextbooks,
    staleTime: 5 * 60_000,
  });
}

// ─── GET textbook detail by documentCode ───────────────────────
export function useTextbook(documentCode?: string) {
  return useQuery({
    queryKey: ['textbooks', documentCode],
    queryFn: () => getTextbookByCode(documentCode!),
    enabled: !!documentCode,
  });
}

// ─── POST textbook upload ──────────────────────────────────────
export function useUploadTextbook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadTextbookInput) => uploadTextbook(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['textbooks'] });
    },
  });
}

export function useDeleteTextbookNeo4j() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentCode: string) => deleteTextbookNeo4j(documentCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['textbooks'] });
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

// ─── GET latest video by document ──────────────────────────────────────────
export function useLatestVideoByDocument(documentCode: string) {
  return useQuery({
    queryKey: ['video', 'latest', 'doc', documentCode],
    queryFn: () => videoService.getLatestVideoByDocument(documentCode),
    enabled: !!documentCode,
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
