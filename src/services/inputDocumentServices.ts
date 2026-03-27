// src/services/inputDocumentServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, InputDocumentDto, UploadInputDocumentInput } from '@/types/api';

// ─── GET all input documents ──────────────────────────────────────────────
export async function getAllInputDocuments(): Promise<InputDocumentDto[]> {
  const { data } = await api.get<ApiResponse<InputDocumentDto[]>>(
    API_ENDPOINTS.INPUT_DOCUMENT.GET_ALL,
  );
  return data.result;
}

// ─── GET input documents by project ───────────────────────────────────────
export async function getInputDocumentsByProject(projectCode: string): Promise<InputDocumentDto[]> {
  const { data } = await api.get<ApiResponse<InputDocumentDto[]>>(
    API_ENDPOINTS.INPUT_DOCUMENT.GET_BY_PROJECT(projectCode),
  );
  return data.result;
}
    
// ─── GET input document by code ───────────────────────────────────────────
export async function getInputDocumentByCode(documentCode: string): Promise<InputDocumentDto> {
  const { data } = await api.get<ApiResponse<InputDocumentDto>>(
    API_ENDPOINTS.INPUT_DOCUMENT.GET_BY_CODE(documentCode),
  );
  return data.result;
}

// ─── POST upload input document ────────────────────────────────────────────
export async function uploadInputDocument(input: UploadInputDocumentInput): Promise<InputDocumentDto> {
  const formData = new FormData();
  formData.append('File', input.File);
  formData.append('Title', input.Title);
  formData.append('ProjectCode', input.ProjectCode);
  formData.append('SubjectCode', input.SubjectCode);
  formData.append('GradeCode', input.GradeCode);
  formData.append('LessonCode', input.LessonCode);

  const { data } = await api.post<ApiResponse<InputDocumentDto>>(
    API_ENDPOINTS.INPUT_DOCUMENT.UPLOAD,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.result;
}

// ─── DELETE input document ─────────────────────────────────────────────────
export async function deleteInputDocument(documentCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.INPUT_DOCUMENT.DELETE(documentCode));
}
