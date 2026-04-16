import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  ExpertProfileDto,
  UpdateExpertProfileInput,
  VerificationDto,
} from '@/types/api';

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
