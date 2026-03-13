// src/hooks/usePipelineApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pipelineService from '@/services/pipelineServices';
import type { LessonAnalysisInput, GenerateSlidesInput } from '@/types/api';

const INPUT_DOCS_KEY = 'input-documents';

// ─── GET input documents ───────────────────────────────────────────────────
export function useInputDocuments() {
  return useQuery({
    queryKey: [INPUT_DOCS_KEY],
    queryFn: pipelineService.getInputDocuments,
  });
}

// ─── POST upload input document ────────────────────────────────────────────
export function useUploadInputDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pipelineService.uploadInputDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: [INPUT_DOCS_KEY] }),
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
