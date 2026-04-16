import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  TeacherProfileDto,
  UpdateTeacherProfileInput,
} from '@/types/api';

export async function getTeacherProfile(): Promise<TeacherProfileDto> {
  const { data } = await api.get<ApiResponse<TeacherProfileDto>>(API_ENDPOINTS.TEACHER.PROFILE);
  return data.result;
}

export async function updateTeacherProfile(input: UpdateTeacherProfileInput): Promise<unknown> {
  const { data } = await api.put<ApiResponse<unknown>>(API_ENDPOINTS.TEACHER.PROFILE, input);
  return data.result;
}
