// src/hooks/useInputDocumentApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as inputDocService from '@/services/inputDocumentServices';
import type { UploadInputDocumentInput } from '@/types/api';

const INPUT_DOCS_KEY = 'input-documents';

// ─── GET all input documents ─────────────────────────────────────────────
export function useAllInputDocuments() {
  return useQuery({
    queryKey: [INPUT_DOCS_KEY, 'all'],
    queryFn: () => inputDocService.getAllInputDocuments(),
  });
}

// ─── GET input documents by project ───────────────────────────────────────
export function useInputDocumentsByProject(projectCode?: string) {
  return useQuery({
    queryKey: [INPUT_DOCS_KEY, projectCode],
    queryFn: () => inputDocService.getInputDocumentsByProject(projectCode!),
    enabled: !!projectCode,
  });
}

// ─── GET input document by code ──────────────────────────────────────────
export function useInputDocument(documentCode?: string) {
  return useQuery({
    queryKey: [INPUT_DOCS_KEY, 'detail', documentCode],
    queryFn: () => inputDocService.getInputDocumentByCode(documentCode!),
    enabled: !!documentCode,
  });
}

// ─── POST upload input document ────────────────────────────────────────────
export function useUploadInputDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadInputDocumentInput) => inputDocService.uploadInputDocument(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INPUT_DOCS_KEY] }),
  });
}

// ─── DELETE input document ─────────────────────────────────────────────────
export function useDeleteInputDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentCode: string) => inputDocService.deleteInputDocument(documentCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INPUT_DOCS_KEY] }),
  });
}
