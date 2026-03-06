// src/types/api.ts

// Shape khớp với backend: { code, message, result }
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
