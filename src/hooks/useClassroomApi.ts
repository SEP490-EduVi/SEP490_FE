// src/hooks/useClassroomApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classroomServices, CreateClassroomInput, UpdateClassroomInput, ImportStudentsInput } from '@/services/classroomServices';

const KEY = 'classrooms';

export function useClassrooms() {
  return useQuery({
    queryKey: [KEY],
    queryFn: classroomServices.list,
  });
}

export function useClassroom(classroomCode?: string) {
  return useQuery({
    queryKey: [KEY, classroomCode],
    queryFn: () => classroomServices.get(classroomCode!),
    enabled: !!classroomCode,
  });
}

export function useCreateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClassroomInput) => classroomServices.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classroomCode, input }: { classroomCode: string; input: UpdateClassroomInput }) =>
      classroomServices.update(classroomCode, input),
    onSuccess: (_data, { classroomCode }) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, classroomCode] });
    },
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classroomCode: string) => classroomServices.delete(classroomCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useImportStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classroomCode, input }: { classroomCode: string; input: ImportStudentsInput }) =>
      classroomServices.importStudents(classroomCode, input),
    onSuccess: (_data, { classroomCode }) => {
      qc.invalidateQueries({ queryKey: [KEY, classroomCode] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
