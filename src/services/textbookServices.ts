import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, TextbookDto, UploadTextbookInput } from '@/types/api';

export async function uploadTextbook(input: UploadTextbookInput): Promise<TextbookDto> {
  const formData = new FormData();
  formData.append('File', input.File);
  formData.append('SubjectCode', input.SubjectCode);
  formData.append('GradeCode', input.GradeCode);

  if (input.PublishYear !== undefined) formData.append('PublishYear', String(input.PublishYear));
  if (input.Publisher) formData.append('Publisher', input.Publisher);
  if (input.Note) formData.append('Note', input.Note);

  const { data } = await api.post<ApiResponse<TextbookDto>>(
    API_ENDPOINTS.TEXTBOOK.UPLOAD,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data.result;
}

export async function getTextbooks(): Promise<TextbookDto[]> {
  const { data } = await api.get<ApiResponse<TextbookDto[]>>(API_ENDPOINTS.TEXTBOOK.GET_ALL);
  return data.result ?? [];
}

export async function getTextbookByCode(documentCode: string): Promise<TextbookDto> {
  const { data } = await api.get<ApiResponse<TextbookDto>>(
    API_ENDPOINTS.TEXTBOOK.GET_BY_CODE(documentCode),
  );
  return data.result;
}

export async function deleteTextbookNeo4j(documentCode: string): Promise<unknown> {
  const { data } = await api.delete<ApiResponse<unknown>>(
    API_ENDPOINTS.TEXTBOOK.DELETE_NEO4J(documentCode),
  );
  return data.result;
}
