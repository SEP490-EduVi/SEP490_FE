// src/hooks/useExpertApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as expertService from '@/services/expertServices';
import * as materialService from '@/services/materialServices';
import type { UpdateMaterialInput } from '@/types/api';

// ─── Verifications ─────────────────────────────────────────────────────────

const VERIFICATION_KEY = 'verifications';

export function useVerifications() {
  return useQuery({
    queryKey: [VERIFICATION_KEY],
    queryFn: expertService.getVerifications,
  });
}

export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { file: File; fileType: string; description?: string }) =>
      expertService.submitVerification(input.file, input.fileType, input.description),
    onSuccess: () => qc.invalidateQueries({ queryKey: [VERIFICATION_KEY] }),
  });
}

export function useDeleteVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (verificationCode: string) => expertService.deleteVerification(verificationCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: [VERIFICATION_KEY] }),
  });
}

// ─── Materials ─────────────────────────────────────────────────────────────

const MATERIAL_KEY = 'my-materials';

export function useMyMaterials() {
  return useQuery({
    queryKey: [MATERIAL_KEY],
    queryFn: materialService.getMyMaterials,
  });
}

export function useUploadMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: materialService.uploadMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: [MATERIAL_KEY] }),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ materialCode, input }: { materialCode: string; input: UpdateMaterialInput }) =>
      materialService.updateMaterial(materialCode, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MATERIAL_KEY] }),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (materialCode: string) => materialService.deleteMaterial(materialCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MATERIAL_KEY] }),
  });
}
