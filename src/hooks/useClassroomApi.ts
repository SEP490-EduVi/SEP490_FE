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

export function useClassroom(studentListCode?: string) {
  return useQuery({
    queryKey: [KEY, studentListCode],
    queryFn: () => classroomServices.get(studentListCode!),
    enabled: !!studentListCode,
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
    mutationFn: ({ studentListCode, input }: { studentListCode: string; input: UpdateClassroomInput }) =>
      classroomServices.update(studentListCode, input),
    onSuccess: (_data, { studentListCode }) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, studentListCode] });
    },
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentListCode: string) => classroomServices.delete(studentListCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useImportStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentListCode, input }: { studentListCode: string; input: ImportStudentsInput }) =>
      classroomServices.importStudents(studentListCode, input),
    onSuccess: (_data, { studentListCode }) => {
      qc.invalidateQueries({ queryKey: [KEY, studentListCode] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
