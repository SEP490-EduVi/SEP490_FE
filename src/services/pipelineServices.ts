// src/services/pipelineServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  InputDocumentDto,
  LessonAnalysisInput,
  GenerateSlidesInput,
} from '@/types/api';

// ─── GET input documents ───────────────────────────────────────────────────
export async function getInputDocuments(): Promise<InputDocumentDto[]> {
  const { data } = await api.get<ApiResponse<InputDocumentDto[]>>(
    API_ENDPOINTS.PIPELINE.GET_INPUT_DOCUMENTS,
  );
  return data.result;
}

// ─── POST upload input document ────────────────────────────────────────────
export async function uploadInputDocument(input: {
  File: File;
  Title: string;
  SubjectCode: string;
  GradeCode: string;
  LessonCode?: string;
}): Promise<InputDocumentDto> {
  const formData = new FormData();
  formData.append('File', input.File);
  formData.append('Title', input.Title);
  formData.append('SubjectCode', input.SubjectCode);
  formData.append('GradeCode', input.GradeCode);
  if (input.LessonCode) {
    formData.append('LessonCode', input.LessonCode);
  }

  const { data } = await api.post<ApiResponse<InputDocumentDto>>(
    API_ENDPOINTS.PIPELINE.UPLOAD_INPUT_DOCUMENT,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.result;
}

// ─── POST lesson analysis (triggers evaluation pipeline via RabbitMQ) ──────
export async function startLessonAnalysis(
  input: LessonAnalysisInput,
): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.PIPELINE.LESSON_ANALYSIS, input);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosErr = error as { response?: { data?: unknown } };
      console.error('[lesson-analysis] Server response:', axiosErr.response?.data);
    }
    throw error;
  }
}

// ─── POST generate slides (triggers slide generation pipeline) ─────────────
export async function generateSlides(
  input: GenerateSlidesInput,
): Promise<void> {
  await api.post(API_ENDPOINTS.PIPELINE.GENERATE_SLIDES, input);
}

// ─── PUT save edited slide ─────────────────────────────────────────────────
export async function saveEditedSlide(
  productCode: string,
  slideDocument: string,
): Promise<void> {
  await api.put(API_ENDPOINTS.PIPELINE.SAVE_EDITED_SLIDE(productCode), {
    slideDocument,
  });
}
