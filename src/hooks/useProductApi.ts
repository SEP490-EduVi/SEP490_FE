// src/hooks/useProductApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productService from '@/services/productServices';

const QUERY_KEY = 'products';

// ─── GET products by project ───────────────────────────────────────────────
export function useProductsByProject(projectCode?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'project', projectCode],
    queryFn: () => productService.getProductsByProject(projectCode!),
    enabled: !!projectCode,
  });
}

// ─── GET product by code ───────────────────────────────────────────────────
export function useProduct(productCode?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, productCode],
    queryFn: () => productService.getProductByCode(productCode!),
    enabled: !!productCode,
  });
}

// ─── GET product evaluation ───────────────────────────────────────────────
export function useProductEvaluation(productCode?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, productCode, 'evaluation'],
    queryFn: () => productService.getProductEvaluation(productCode!),
    enabled: !!productCode,
  });
}

// ─── DELETE product ────────────────────────────────────────────────────────
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productCode: string) => productService.deleteProduct(productCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
