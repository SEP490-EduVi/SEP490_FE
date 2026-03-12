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

// ─── Project ───────────────────────────────────────────────────────────────
export interface ProjectDto {
  projectCode: string;
  projectName: string;
  status: number;
}

export interface CreateProjectInput {
  projectCode: string;
  projectName: string;
}

export interface UpdateProjectInput {
  projectCode: string;
  projectName: string;
  status: number;
}

// ─── Product ───────────────────────────────────────────────────────────────
export interface ProductDto {
  productCode: string;
  productName: string;
  description: string;
  status: number;
  statusName: string;
  evaluatedAt: string | null;
  slideGeneratedAt: string | null;
  slideEditedAt: string | null;
  hasEvaluation: boolean;
  hasSlide: boolean;
  hasEditedSlide: boolean;
}

export interface ProductDetailDto extends ProductDto {
  evaluationResult: Record<string, unknown> | null;
  lessonPlanText: string | null;
  textbookSections: { heading: string; content: string }[] | null;
  slideDocument: Record<string, unknown> | null;
  slideEditedDocument: Record<string, unknown> | null;
}

export interface ProductEvaluationResponse {
  evaluationResult: {
    subject: string;
    grade: string;
    evaluation: {
      detected_lesson_name: string;
      objectives: string[];
      activities: string[];
      coverage_score: number;
      covered_concepts: Array<{ concept?: string; explanation?: string }>;
      missing_concepts: Array<{ concept?: string; explanation?: string; importance?: string }>;
      extra_concepts: unknown[];
      comment: string;
      suggestions: string[];
    };
    lesson_plan_text: string;
    textbook_sections: Array<{ heading: string; content: string }>;
  } | null;
  evaluatedAt: string | null;
}

// ─── Product status mapping (from backend int) ─────────────────────────────
export const PRODUCT_STATUS_MAP: Record<number, string> = {
  0: 'NEW',
  1: 'EVALUATING',
  2: 'EVALUATED',
  3: 'EVALUATION_FAILED',
  4: 'GENERATING_SLIDES',
  5: 'SLIDES_GENERATED',
  6: 'SLIDES_FAILED',
};
