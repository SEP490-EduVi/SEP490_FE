// src/services/classroomServices.ts

import api from '@/config/axios';

export interface ClassroomDto {
  classroomCode: string;
  name: string;
  gradeLabel: string;
  schoolYear: string;
  students: string[];
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassroomInput {
  name: string;
  gradeLabel: string;
  schoolYear: string;
}

export interface UpdateClassroomInput {
  name: string;
  gradeLabel: string;
  schoolYear: string;
}

export interface ImportStudentsInput {
  students: string[];
}

const unwrap = <T>(res: { data: { result: T } }) => res.data.result;

export const classroomServices = {
  list: () =>
    api.get<{ result: ClassroomDto[] }>('/api/teacher/classrooms').then(unwrap<ClassroomDto[]>),

  get: (classroomCode: string) =>
    api.get<{ result: ClassroomDto }>(`/api/teacher/classrooms/${classroomCode}`).then(unwrap<ClassroomDto>),

  create: (input: CreateClassroomInput) =>
    api.post<{ result: ClassroomDto }>('/api/teacher/classrooms', input).then(unwrap<ClassroomDto>),

  update: (classroomCode: string, input: UpdateClassroomInput) =>
    api.put<{ result: ClassroomDto }>(`/api/teacher/classrooms/${classroomCode}`, input).then(unwrap<ClassroomDto>),

  delete: (classroomCode: string) =>
    api.delete(`/api/teacher/classrooms/${classroomCode}`),

  importStudents: (classroomCode: string, input: ImportStudentsInput) =>
    api.post(`/api/teacher/classrooms/${classroomCode}/students`, input),
};
