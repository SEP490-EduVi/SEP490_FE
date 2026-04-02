// src/hooks/useMaterialShopApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as materialService from '@/services/materialServices';
import type { MaterialBrowseParams } from '@/types/api';

const BROWSE_KEY = 'material-browse';
const PURCHASED_KEY = 'material-purchased';
const MATERIAL_DETAIL_KEY = 'material-detail';

export function useBrowseMaterials(params?: MaterialBrowseParams) {
  return useQuery({
    queryKey: [BROWSE_KEY, params],
    queryFn: () => materialService.browseMaterials(params),
    staleTime: 30_000,
  });
}

export function usePurchaseMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (materialCode: string) => materialService.purchaseMaterial(materialCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PURCHASED_KEY] });
      qc.invalidateQueries({ queryKey: [BROWSE_KEY] });
    },
  });
}

export function usePurchasedMaterials() {
  return useQuery({
    queryKey: [PURCHASED_KEY],
    queryFn: materialService.getPurchasedMaterials,
    staleTime: 30_000,
  });
}

export function useMaterialDetail(materialCode?: string) {
  return useQuery({
    queryKey: [MATERIAL_DETAIL_KEY, materialCode],
    queryFn: () => materialService.getMaterialByCode(materialCode!),
    enabled: !!materialCode,
    staleTime: 60_000,
  });
}
