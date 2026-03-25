// src/services/pipelineServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  LessonAnalysisInput,
  GenerateSlidesInput,
} from '@/types/api';

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

// ─── PUT save edited slide (GCS URL only) ─────────────────────────────────
// FE now uploads the JSON directly to GCS and only sends the resulting URL
// to the backend so it can store / reference the file.
export async function saveEditedSlideUrl(
  productCode: string,
  slideGcsUrl: string,
): Promise<void> {
  await api.put(
    API_ENDPOINTS.PIPELINE.SAVE_EDITED_SLIDE(productCode),
    { slideEditedDocumentUrl: slideGcsUrl },
    { timeout: 30_000 },
  );
}
