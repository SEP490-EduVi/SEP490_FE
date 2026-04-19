// src/services/productMaterialServices.ts
import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, ProductMaterialDto, AddProductMaterialInput } from '@/types/api';

export async function getProductMaterials(productCode: string): Promise<ProductMaterialDto[]> {
  const { data } = await api.get<ApiResponse<ProductMaterialDto[]>>(
    API_ENDPOINTS.PRODUCT_MATERIAL.GET_ALL(productCode),
  );
  return data.result;
}

export async function addProductMaterial(
  productCode: string,
  input: AddProductMaterialInput,
): Promise<ProductMaterialDto> {
  const { data } = await api.post<ApiResponse<ProductMaterialDto>>(
    API_ENDPOINTS.PRODUCT_MATERIAL.ADD(productCode),
    input,
  );
  return data.result;
}

export async function deleteProductMaterial(
  productCode: string,
  productMaterialCode: string,
): Promise<void> {
  await api.delete(
    API_ENDPOINTS.PRODUCT_MATERIAL.DELETE(productCode, productMaterialCode),
  );
}
