// src/services/projectServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  ProjectDto,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/types/api';

// ─── GET all projects ──────────────────────────────────────────────────────
export async function getAllProjects(): Promise<ProjectDto[]> {
  const { data } = await api.get<ApiResponse<ProjectDto[]>>(
    API_ENDPOINTS.PROJECT.GET_ALL,
  );
  return data.result;
}

// ─── GET project by code ───────────────────────────────────────────────────
export async function getProjectByCode(projectCode: string): Promise<ProjectDto> {
  const { data } = await api.get<ApiResponse<ProjectDto>>(
    API_ENDPOINTS.PROJECT.GET_BY_ID(projectCode),
  );
  return data.result;
}

// ─── POST create project ──────────────────────────────────────────────────
export async function createProject(input: CreateProjectInput): Promise<ProjectDto> {
  const { data } = await api.post<ApiResponse<ProjectDto>>(
    API_ENDPOINTS.PROJECT.CREATE,
    input,
  );
  return data.result;
}

// ─── PUT update project ───────────────────────────────────────────────────
export async function updateProject(
  projectCode: string,
  input: UpdateProjectInput,
): Promise<ProjectDto> {
  const { data } = await api.put<ApiResponse<ProjectDto>>(
    API_ENDPOINTS.PROJECT.UPDATE(projectCode),
    input,
  );
  return data.result;
}

// ─── DELETE project ────────────────────────────────────────────────────────
export async function deleteProject(projectCode: string): Promise<ApiResponse<string>> {
  const { data } = await api.delete<ApiResponse<string>>(
    API_ENDPOINTS.PROJECT.DELETE(projectCode),
  );
  return data;
}
