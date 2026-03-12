// src/hooks/useProjectApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput, UpdateProjectInput } from '@/types/api';
import * as projectService from '@/services/projectServices';

const QUERY_KEY = 'projects';

// ─── GET all projects ──────────────────────────────────────────────────────
export function useProjects() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: projectService.getAllProjects,
  });
}

// ─── GET project by code ───────────────────────────────────────────────────
export function useProject(projectCode?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, projectCode],
    queryFn: () => projectService.getProjectByCode(projectCode!),
    enabled: !!projectCode,
  });
}

// ─── POST create project ──────────────────────────────────────────────────
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectService.createProject(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

// ─── PUT update project ───────────────────────────────────────────────────
export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectCode,
      input,
    }: {
      projectCode: string;
      input: UpdateProjectInput;
    }) => projectService.updateProject(projectCode, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

// ─── DELETE project ────────────────────────────────────────────────────────
export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectCode: string) => projectService.deleteProject(projectCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
