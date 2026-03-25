// src/services/metadataServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, SubjectDto, GradeDto, LessonDto } from '@/types/api';

export async function getSubjects(): Promise<SubjectDto[]> {
  const { data } = await api.get<ApiResponse<SubjectDto[]>>(API_ENDPOINTS.SUBJECT.GET_ALL);
  return data.result;
}

export async function getGrades(): Promise<GradeDto[]> {
  const { data } = await api.get<ApiResponse<GradeDto[]>>(API_ENDPOINTS.GRADE.GET_ALL);
  return data.result;
}

export async function getLessons(subjectCode: string): Promise<LessonDto[]> {
  const { data } = await api.get<ApiResponse<LessonDto[]>>(
    API_ENDPOINTS.LESSON.GET_BY_SUBJECT(subjectCode),
  );
  return data.result;
}
