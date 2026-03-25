import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, MaterialDto, UpdateMaterialInput } from '@/types/api';

export async function uploadMaterial(form: {
  File: File;
  PreviewFile?: File;
  Title: string;
  Description?: string;
  Type: string;
  Price?: number;
  SubjectCode?: string;
  GradeCode?: string;
}): Promise<MaterialDto> {
  const formData = new FormData();
  formData.append('File', form.File);
  if (form.PreviewFile) formData.append('PreviewFile', form.PreviewFile);
  formData.append('Title', form.Title);
  if (form.Description) formData.append('Description', form.Description);
  formData.append('Type', form.Type);
  if (form.Price !== undefined) formData.append('Price', String(form.Price));
  if (form.SubjectCode) formData.append('SubjectCode', form.SubjectCode);
  if (form.GradeCode) formData.append('GradeCode', form.GradeCode);

  const { data } = await api.post<ApiResponse<MaterialDto>>(
    API_ENDPOINTS.MATERIAL.UPLOAD,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.result;
}

export async function getMyMaterials(): Promise<MaterialDto[]> {
  const { data } = await api.get<ApiResponse<MaterialDto[]>>(
    API_ENDPOINTS.MATERIAL.GET_MY,
  );
  return data.result;
}

export async function updateMaterial(materialCode: string, input: UpdateMaterialInput): Promise<MaterialDto> {
  const { data } = await api.put<ApiResponse<MaterialDto>>(
    API_ENDPOINTS.MATERIAL.UPDATE(materialCode),
    input,
  );
  return data.result;
}

export async function deleteMaterial(materialCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.MATERIAL.DELETE(materialCode));
}
