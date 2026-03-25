// src/services/curriculumServices.ts
// Curriculum ingestion API

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { CurriculumDto } from '@/types/api';

export async function getCurricula(): Promise<CurriculumDto[]> {
  const res = await api.get<{ result: CurriculumDto[] }>(API_ENDPOINTS.CURRICULUM.GET_ALL);
  return res.data.result ?? [];
}
