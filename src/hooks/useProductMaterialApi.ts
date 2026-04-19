// src/hooks/useProductMaterialApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/services/productMaterialServices';
import type { AddProductMaterialInput } from '@/types/api';

const KEY = (productCode: string) => ['product-materials', productCode];

export function useProductMaterials(productCode?: string) {
  return useQuery({
    queryKey: KEY(productCode ?? ''),
    queryFn: () => svc.getProductMaterials(productCode!),
    enabled: !!productCode,
    staleTime: 30_000,
  });
}

export function useAddProductMaterial(productCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddProductMaterialInput) =>
      svc.addProductMaterial(productCode, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(productCode) }),
  });
}

export function useDeleteProductMaterial(productCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productMaterialCode: string) =>
      svc.deleteProductMaterial(productCode, productMaterialCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(productCode) }),
  });
}
