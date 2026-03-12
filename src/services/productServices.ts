// src/services/productServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, ProductDto, ProductDetailDto, ProductEvaluationResponse } from '@/types/api';

// ─── GET all products ──────────────────────────────────────────────────────
export async function getAllProducts(): Promise<ProductDto[]> {
  const { data } = await api.get<ApiResponse<ProductDto[]>>(
    API_ENDPOINTS.PRODUCT.GET_ALL,
  );
  return data.result;
}

// ─── GET product by code ───────────────────────────────────────────────────
export async function getProductByCode(productCode: string): Promise<ProductDetailDto> {
  const { data } = await api.get<ApiResponse<ProductDetailDto>>(
    API_ENDPOINTS.PRODUCT.GET_BY_ID(productCode),
  );
  return data.result;
}

// ─── GET product evaluation ───────────────────────────────────────────────
export async function getProductEvaluation(productCode: string): Promise<ProductEvaluationResponse> {
  const { data } = await api.get<ApiResponse<ProductEvaluationResponse>>(
    API_ENDPOINTS.PRODUCT.GET_EVALUATION(productCode),
  );
  return data.result;
}

// ─── DELETE product ────────────────────────────────────────────────────────
export async function deleteProduct(productCode: string): Promise<ApiResponse<string>> {
  const { data } = await api.delete<ApiResponse<string>>(
    API_ENDPOINTS.PRODUCT.DELETE(productCode),
  );
  return data;
}
