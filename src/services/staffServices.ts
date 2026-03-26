import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  MaterialDto,
  ReviewMaterialInput,
  ReviewVerificationInput,
  StaffVerificationDto,
} from '@/types/api';

export async function getPendingVerifications(): Promise<StaffVerificationDto[]> {
  const { data } = await api.get<ApiResponse<StaffVerificationDto[]>>(
    API_ENDPOINTS.STAFF.VERIFICATION_PENDING,
  );
  return data.result ?? [];
}

export async function getVerificationDetail(verificationCode: string): Promise<StaffVerificationDto> {
  const { data } = await api.get<ApiResponse<StaffVerificationDto>>(
    API_ENDPOINTS.STAFF.VERIFICATION_DETAIL(verificationCode),
  );
  return data.result;
}

export async function reviewVerification(
  verificationCode: string,
  input: ReviewVerificationInput,
): Promise<void> {
  await api.post(API_ENDPOINTS.STAFF.REVIEW_VERIFICATION(verificationCode), input);
}

export async function getPendingMaterials(): Promise<MaterialDto[]> {
  const { data } = await api.get<ApiResponse<MaterialDto[]>>(API_ENDPOINTS.MATERIAL.GET_PENDING);
  return data.result ?? [];
}

export async function getMaterialReviewDetail(materialCode: string): Promise<MaterialDto> {
  const { data } = await api.get<ApiResponse<MaterialDto>>(
    API_ENDPOINTS.MATERIAL.GET_REVIEW_DETAIL(materialCode),
  );
  return data.result;
}

export async function reviewMaterial(materialCode: string, input: ReviewMaterialInput): Promise<void> {
  await api.post(API_ENDPOINTS.MATERIAL.REVIEW(materialCode), input);
}
