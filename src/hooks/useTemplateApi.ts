// src/hooks/useTemplateApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTemplateInput, UpdateTemplateInput } from '@/types/api';
import * as templateService from '@/services/templateServices';

const QUERY_KEY = 'templates';

// ─── GET all templates ─────────────────────────────────────────────────────
export function useTemplates() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: templateService.getAllTemplates,
    staleTime: 60_000, // 1 min — templates change infrequently
  });
}

// ─── GET template by code ──────────────────────────────────────────────────
export function useTemplate(templateCode?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, templateCode],
    queryFn: () => templateService.getTemplateByCode(templateCode!),
    enabled: !!templateCode,
  });
}

// ─── POST create template ──────────────────────────────────────────────────
export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => templateService.createTemplate(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

// ─── PUT update template ───────────────────────────────────────────────────
export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateCode,
      input,
    }: {
      templateCode: string;
      input: UpdateTemplateInput;
    }) => templateService.updateTemplate(templateCode, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

// ─── DELETE template ───────────────────────────────────────────────────────
export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateCode: string) => templateService.deleteTemplate(templateCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
