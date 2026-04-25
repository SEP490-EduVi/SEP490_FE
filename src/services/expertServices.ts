import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  ExpertProfileDto,
  UpdateExpertProfileInput,
  VerificationDto,
  ExpertSalesFilterParams,
  ExpertSalesOverviewResponse,
  ExpertMaterialSalesItem,
} from '@/types/api';
import type { PagedResponse } from '@/types/admin';

function unwrapApiResponse<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (response.code !== 200) {
    throw new Error(response.message || fallbackMessage);
  }
  return response.result;
}

export async function submitVerification(file: File, fileType: string, description?: string): Promise<VerificationDto> {
  const formData = new FormData();
  formData.append('File', file);
  formData.append('FileType', fileType);
  if (description) formData.append('Description', description);

  const { data } = await api.post<ApiResponse<VerificationDto>>(
    API_ENDPOINTS.EXPERT_VERIFICATION.SUBMIT,
    formData,
  );
  return data.result;
}

export async function getVerifications(): Promise<VerificationDto[]> {
  const { data } = await api.get<ApiResponse<VerificationDto[]>>(
    API_ENDPOINTS.EXPERT_VERIFICATION.GET_ALL,
  );
  return data.result;
}

export async function getVerificationFile(verificationCode: string, fileUrl?: string): Promise<{ blob: Blob; contentType?: string; contentDisposition?: string }> {
  const endpoint = fileUrl?.trim()
    ? fileUrl
    : API_ENDPOINTS.EXPERT_VERIFICATION.GET_FILE(verificationCode);

  const { data, headers } = await api.get<Blob>(endpoint, {
    responseType: 'blob',
    headers: { Accept: '*/*' },
  });

  return {
    blob: data,
    contentType: headers['content-type'],
    contentDisposition: headers['content-disposition'],
  };
}

export async function deleteVerification(verificationCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.EXPERT_VERIFICATION.DELETE(verificationCode));
}

export async function getExpertProfile(): Promise<ExpertProfileDto> {
  const { data } = await api.get<ApiResponse<ExpertProfileDto>>(
    API_ENDPOINTS.EXPERT_PROFILE.GET,
  );
  return unwrapApiResponse(data, 'Không thể tải thông tin Expert.');
}

export async function updateExpertProfile(input: UpdateExpertProfileInput): Promise<unknown> {
  const { data } = await api.put<ApiResponse<unknown>>(
    API_ENDPOINTS.EXPERT_PROFILE.UPDATE,
    input,
  );
  return unwrapApiResponse(data, 'Cập nhật hồ sơ Expert thất bại.');
}

const normalizeParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );

export async function getExpertSalesOverview(params?: ExpertSalesFilterParams): Promise<ExpertSalesOverviewResponse> {
  const { data } = await api.get<ApiResponse<ExpertSalesOverviewResponse>>(
    API_ENDPOINTS.EXPERT_SALES.OVERVIEW,
    { params: params ? normalizeParams(params) : undefined },
  );
  return unwrapApiResponse(data, 'Không thể tải tổng quan doanh số.');
}

export async function getExpertMaterialSales(params?: ExpertSalesFilterParams): Promise<ExpertMaterialSalesItem[]> {
  const { data } = await api.get<ApiResponse<ExpertMaterialSalesItem[]>>(
    API_ENDPOINTS.EXPERT_SALES.MATERIALS,
    { params: params ? normalizeParams(params) : undefined },
  );
  return unwrapApiResponse(data, 'Không thể tải doanh số tài liệu.');
}

