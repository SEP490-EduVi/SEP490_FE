// src/services/curriculumServices.ts
// Curriculum ingestion API

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, CurriculumDto, UploadCurriculumInput } from '@/types/api';

export async function uploadCurriculum(input: UploadCurriculumInput): Promise<CurriculumDto> {
  const formData = new FormData();
  formData.append('File', input.File);
  formData.append('SubjectCode', input.SubjectCode);
  formData.append('EducationLevel', input.EducationLevel);
  formData.append('CurriculumYear', String(input.CurriculumYear));
  if (input.Note) formData.append('Note', input.Note);

  const { data } = await api.post<ApiResponse<CurriculumDto>>(
    API_ENDPOINTS.CURRICULUM.UPLOAD,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data.result;
}

export async function getCurricula(): Promise<CurriculumDto[]> {
  const { data } = await api.get<ApiResponse<CurriculumDto[]>>(API_ENDPOINTS.CURRICULUM.GET_ALL);
  return data.result ?? [];
}

export async function getCurriculumByCode(documentCode: string): Promise<CurriculumDto> {
  const { data } = await api.get<ApiResponse<CurriculumDto>>(
    API_ENDPOINTS.CURRICULUM.GET_BY_CODE(documentCode),
  );
  return data.result;
}
