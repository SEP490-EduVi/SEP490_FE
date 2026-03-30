// src/services/productServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, ProductDto, ProductDetailDto, ProductEvaluationResponse } from '@/types/api';
import type { IDocument } from '@/types';

// ─── GET products by project ───────────────────────────────────────────────
export async function getProductsByProject(projectCode: string): Promise<ProductDto[]> {
  const { data } = await api.get<ApiResponse<ProductDto[]>>(
    API_ENDPOINTS.PRODUCT.GET_BY_PROJECT(projectCode),
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

// ─── GET product slide document ────────────────────────────────────────────
export async function getProductSlide(productCode: string): Promise<{ slideDocument: IDocument; slideGeneratedAt: string }> {
  const { data } = await api.get<ApiResponse<{ slideDocument: IDocument; slideGeneratedAt: string }>>(
    API_ENDPOINTS.PRODUCT.GET_SLIDE(productCode),
  );
  return data.result;
}

// ─── GET raw GCS URL of the edited slide (without fetching content) ─────────
// Returns the gs:// URL the backend stored, or null if stored as inline JSON.
export async function getEditedSlideGcsUrl(productCode: string): Promise<string | null> {
  const { data } = await api.get<ApiResponse<{ slideEditedDocument: IDocument | string; slideEditedAt: string }>>(
    API_ENDPOINTS.PRODUCT.GET_EDITED_SLIDE(productCode),
  );
  const ref = data.result.slideEditedDocument;
  return typeof ref === 'string' ? ref : null;
}

// ─── GET product edited slide document ────────────────────────────────────
// BE now stores the slide as a GCS file and returns a gs:// URL.
// We proxy-read via /api/gcs/read so the browser doesn't need GCS access.
export async function getProductEditedSlide(
  productCode: string,
): Promise<{ slideEditedDocument: IDocument; slideEditedAt: string }> {
  const { data } = await api.get<ApiResponse<{ slideEditedDocument: IDocument | string; slideEditedAt: string }>>(
    API_ENDPOINTS.PRODUCT.GET_EDITED_SLIDE(productCode),
  );

  const result = data.result;
  let slideEditedDocument = result.slideEditedDocument;

  // If BE returned a gs:// URL instead of the document object, fetch from GCS
  if (typeof slideEditedDocument === 'string' && slideEditedDocument.startsWith('gs://')) {
    const res = await fetch(
      `/api/gcs/read?objectUrl=${encodeURIComponent(slideEditedDocument)}`,
    );
    if (!res.ok) {
      throw new Error(`Failed to load edited slide from GCS (${res.status})`);
    }
    slideEditedDocument = await res.json() as IDocument;
  }

  return {
    slideEditedDocument: slideEditedDocument as IDocument,
    slideEditedAt: result.slideEditedAt,
  };
}

// ─── GET all products for current user ────────────────────────────────────
export async function getAllProducts(): Promise<ProductDto[]> {
  const { data } = await api.get<ApiResponse<ProductDto[]>>(API_ENDPOINTS.PRODUCT.GET_ALL);
  return data.result;
}
