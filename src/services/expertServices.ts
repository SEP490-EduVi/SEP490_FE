import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, VerificationDto } from '@/types/api';

export async function submitVerification(file: File, fileType: string, description?: string): Promise<VerificationDto> {
  const formData = new FormData();
  formData.append('File', file);
  formData.append('FileType', fileType);
  if (description) formData.append('Description', description);

  const { data } = await api.post<ApiResponse<VerificationDto>>(
    API_ENDPOINTS.EXPERT_VERIFICATION.SUBMIT,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.result;
}

export async function getVerifications(): Promise<VerificationDto[]> {
  const { data } = await api.get<ApiResponse<VerificationDto[]>>(
    API_ENDPOINTS.EXPERT_VERIFICATION.GET_ALL,
  );
  return data.result;
}

export async function deleteVerification(verificationCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.EXPERT_VERIFICATION.DELETE(verificationCode));
}
