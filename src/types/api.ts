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

export interface PipelineProgress {
  taskId: string;
  userId: string;
  productId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  step: string;
  progress: number;
  detail: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
}
