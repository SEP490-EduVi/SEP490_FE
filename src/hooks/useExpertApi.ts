// src/hooks/useExpertApi.ts

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as expertService from '@/services/expertServices';
import * as materialService from '@/services/materialServices';
import type { UpdateExpertProfileInput, UpdateMaterialInput, VerificationDto, MaterialDto } from '@/types/api';
import { notify, MSGS } from '@/components/common';

// ─── Verifications ─────────────────────────────────────────────────────────

const VERIFICATION_KEY = 'verifications';
const EXPERT_PROFILE_KEY = 'expert-profile';

interface ProfileQueryOptions {
  enabled?: boolean;
}

export function useExpertProfile(options?: ProfileQueryOptions) {
  return useQuery({
    queryKey: [EXPERT_PROFILE_KEY],
    queryFn: expertService.getExpertProfile,
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateExpertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateExpertProfileInput) => expertService.updateExpertProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EXPERT_PROFILE_KEY] }),
  });
}

export function useVerifications() {
  const prevDataRef = useRef<VerificationDto[] | undefined>(undefined);

  const query = useQuery({
    queryKey: [VERIFICATION_KEY],
    queryFn: expertService.getVerifications,
    // Poll every 5 s while the BE is processing (status 0 = pending).
    // Stops automatically once all verifications are resolved.
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.some((v) => {
        const s = typeof v.status === 'number' ? v.status : Number(v.status);
        return s === 0;
      })
        ? 5_000
        : false;
    },
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const prev = prevDataRef.current;
    const curr = query.data;
    if (prev && curr) {
      curr.forEach((v) => {
        const prevV = prev.find((p) => p.verificationCode === v.verificationCode);
        const prevStatus = prevV != null
          ? (typeof prevV.status === 'number' ? prevV.status : Number(prevV.status))
          : null;
        const currStatus = typeof v.status === 'number' ? v.status : Number(v.status);
        if (prevStatus === 0 && currStatus === 2) {
          notify.error(MSGS.cert.autoRejected);
        }
      });
    }
    prevDataRef.current = curr;
  }, [query.data]);

  return query;
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
  const prevDataRef = useRef<MaterialDto[] | undefined>(undefined);

  const query = useQuery({
    queryKey: [MATERIAL_KEY],
    queryFn: materialService.getMyMaterials,
    // Poll every 5 s while the BE is processing (approvalStatus 0 = pending).
    // Stops automatically once all materials are approved or rejected.
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.some((m) => m.approvalStatus === 0) ? 5_000 : false;
    },
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const prev = prevDataRef.current;
    const curr = query.data;
    if (prev && curr) {
      curr.forEach((m) => {
        const prevM = prev.find((p) => p.materialCode === m.materialCode);
        if (prevM?.approvalStatus === 0 && m.approvalStatus === 2) {
          notify.error(MSGS.material.expert.autoRejected(m.title));
        }
      });
    }
    prevDataRef.current = curr;
  }, [query.data]);

  return query;
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
