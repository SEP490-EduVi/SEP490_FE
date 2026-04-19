// src/services/classroomServices.ts

import api from '@/config/axios';

export interface ClassroomDto {
  studentListId: number;
  studentListCode: string;
  teacherId: number;
  description: string;
  students: string[];
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassroomInput {
  description: string;
}

export interface UpdateClassroomInput {
  description: string;
}

export interface ImportStudentsInput {
  students: string[];
}

const unwrap = <T>(res: { data: { result: T } }) => res.data.result;

export const classroomServices = {
  list: () =>
    api.get<{ result: ClassroomDto[] }>('/api/teacher/student-lists').then(unwrap<ClassroomDto[]>),

  get: (studentListCode: string) =>
    api.get<{ result: ClassroomDto }>(`/api/teacher/student-lists/${studentListCode}`).then(unwrap<ClassroomDto>),

  create: (input: CreateClassroomInput) =>
    api.post<{ result: ClassroomDto }>('/api/teacher/student-lists', input).then(unwrap<ClassroomDto>),

  update: (studentListCode: string, input: UpdateClassroomInput) =>
    api.put<{ result: ClassroomDto }>(`/api/teacher/student-lists/${studentListCode}`, input).then(unwrap<ClassroomDto>),

  delete: (studentListCode: string) =>
    api.delete(`/api/teacher/student-lists/${studentListCode}`),

  importStudents: (studentListCode: string, input: ImportStudentsInput) =>
    api.post(`/api/teacher/student-lists/${studentListCode}/students`, input),
};
