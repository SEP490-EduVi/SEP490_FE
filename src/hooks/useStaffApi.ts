import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as staffService from '@/services/staffServices';
import type { ReviewMaterialInput, ReviewVerificationInput } from '@/types/api';

const STAFF_VERIFICATION_KEY = 'staff-verifications';
const STAFF_MATERIAL_KEY = 'staff-materials';

export function usePendingVerifications() {
  return useQuery({
    queryKey: [STAFF_VERIFICATION_KEY],
    queryFn: staffService.getPendingVerifications,
  });
}

export function useReviewVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ verificationCode, input }: { verificationCode: string; input: ReviewVerificationInput }) =>
      staffService.reviewVerification(verificationCode, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STAFF_VERIFICATION_KEY] });
    },
  });
}

export function usePendingMaterials() {
  return useQuery({
    queryKey: [STAFF_MATERIAL_KEY],
    queryFn: staffService.getPendingMaterials,
  });
}

export function useReviewMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ materialCode, input }: { materialCode: string; input: ReviewMaterialInput }) =>
      staffService.reviewMaterial(materialCode, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STAFF_MATERIAL_KEY] });
    },
  });
}
