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
  subjectCode?: string;
  subjectName?: string;
  gradeCode?: string;
  gradeName?: string;
  status: number;
  createdAt?: string;
}

export interface ProjectGroupedGradeDto {
  gradeCode: string;
  gradeName: string;
  projects: ProjectDto[];
}

export interface ProjectGroupedSubjectDto {
  subjectCode: string;
  subjectName: string;
  grades: ProjectGroupedGradeDto[];
}

export interface CreateProjectInput {
  projectCode: string;
  projectName: string;
  subjectCode: string;
  gradeCode: string;
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
  documentCode: string;
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
  7: 'VIDEO_GENERATED',
};

// ─── Pipeline: Input Documents ─────────────────────────────────────────────
export interface InputDocumentDto {
  documentCode: string;
  title: string;
  filePath: string;
  projectCode: string;
  subjectCode: string;
  subjectName: string;
  gradeCode: string;
  gradeName: string;
  lessonCode: string;
  lessonName: string;
  uploadDate: string;
}

export interface GenerateVideoInput {
  productCode: string;
  slideEditedDocumentUrl: string;
  videoName?: string;
}

// ─── Video ─────────────────────────────────────────────────────────────────
export interface VideoInteraction {
  type: 'quiz' | 'flashcard' | 'fill_blank' | string;
  slide_index: number;
  card_index: number;
  start_time: number;
  end_time: number;
  pause_time: number;
  payload: {
    title: string;
    // quiz
    question?: string;
    options?: string[];
    correctIndex?: number;
    correctAnswer?: string;
    // flashcard
    front?: string;
    back?: string;
    // fill_blank
    sentence?: string;
    blanks?: string[];
    hint?: string;
  };
}

export interface VideoProductDto {
  productCode: string;
  productName: string;
  productVideoCode: string;
  videoName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  slideDocumentUrl: string | null;
  videoUrl: string | null;
  duration: number | null;
  interactions: VideoInteraction[];
  pausePoints: unknown;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface UploadInputDocumentInput {
  File: File;
  Title: string;
  ProjectCode: string;
  SubjectCode: string;
  GradeCode: string;
  LessonCode: string;
}

// ─── Metadata ─────────────────────────────────────────────────────────────
export interface SubjectDto {
  subjectCode: string;
  subjectName: string;
  lessonCount: number;
}

export interface GradeDto {
  gradeCode: string;
  gradeName: string;
}

export interface LessonDto {
  lessonCode: string;
  lessonName: string;
  subjectCode: string;
  subjectName: string;
}

export interface LessonAnalysisInput {
  documentCode: string;
  projectCode: string;
  productName: string;
  curriculumYear: number;
}

export interface GenerateSlidesInput {
  productCode: string;
  slideRange: 'short' | 'medium' | 'detailed';
}

// ─── Games ───────────────────────────────────────────────────────────────
export type GameTemplateId = 'HOVER_SELECT' | 'DRAG_DROP' | 'RUNNER_QUIZ' | 'SNAKE_QUIZ' | 'RUNNER_RACE' | 'SNAKE_DUEL';

export interface CreatePlayableGameTaskInput {
  productGameName: string;
  productCode: string;
  templateId: GameTemplateId;
  slideEditedDocumentUrl: string;
  roundCount?: number;
}

export interface GameTaskResponseDto {
  taskId: string;
  templateId: string;
  status: string;
}

export interface GameDto {
  gameCode: string;
  productGameCode: string;
  productCode: string;
  productGameName: string;
  templateCode: string;
  roundCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface GameDetailDto extends GameDto {
  taskId: string;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
}

export interface GameProgressDto {
  taskId: string;
  userId: string;
  templateId: string;
  status: string;
  step: string;
  progress: number;
  detail: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
}

export interface CurriculumDto {
  documentCode: string;
  subjectCode: string;
  educationLevel: string;
  curriculumYear: number;
  originalFileName: string;
  fileUrl?: string;
  note?: string | null;
  errorMessage?: string | null;
  warning?: string | null;
  status: number;
  statusName: string;
}

export interface UploadCurriculumInput {
  File: File;
  SubjectCode: string;
  EducationLevel: string;
  CurriculumYear: number;
  Note?: string;
}

export interface TextbookDto {
  documentCode: string;
  subjectCode: string;
  gradeCode: string;
  publishYear?: number | null;
  publisher?: string | null;
  originalFileName: string;
  fileUrl?: string;
  note?: string | null;
  errorMessage?: string | null;
  warning?: string | null;
  status: number;
  statusName: string;
  createdAt?: string;
}

export interface UploadTextbookInput {
  File: File;
  SubjectCode: string;
  GradeCode: string;
  PublishYear?: number;
  Publisher?: string;
  Note?: string;
}

// ─── Expert: Verification (Certificate) ────────────────────────────────────
export interface VerificationDto {
  verificationCode: string;
  fileType: string;
  description: string;
  status: number | string;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  fileUrl?: string;
}

export interface ExpertProfileDto {
  userCode: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean | null;
}

export interface UpdateExpertProfileInput {
  fullName?: string;
  phoneNumber?: string;
  bio?: string | null;
}

// ─── Expert: Material ──────────────────────────────────────────────────────
export interface MaterialDto {
  materialCode: string;
  title: string;
  description: string;
  type: string;
  price: number;
  previewUrl: string | null;
  resourceUrl: string | null;
  subjectCode: string;
  subjectName: string;
  gradeCode: string;
  gradeName: string;
  approvalStatus: number;
  expertCode: string;
  expertName: string;
  createdAt: string;
}

export interface UpdateMaterialInput {
  title: string;
  description: string;
  price: number;
  subjectCode: string;
  gradeCode: string;
}

export interface MaterialBrowseParams {
  subjectCode?: string;
  gradeCode?: string;
  type?: string;
  keyword?: string;
}

export interface PurchasedMaterialDto {
  materialCode: string;
  title: string;
  description: string;
  type: string;
  price: number;
  resourceUrl: string | null;
  previewUrl: string | null;
  subjectCode: string;
  subjectName: string;
  gradeCode: string;
  gradeName: string;
  expertCode: string;
  expertName: string;
  purchasedDate: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────
export interface SubscriptionPlanDto {
  planId: number;
  planName: string;
  price: number;
  durationDays?: number | null;
  analysisQuotaAmount: number;
  slideQuotaAmount: number;
  videoQuotaAmount: number;
  gameQuotaAmount?: number;
  description: string | null;
  isActive: boolean;
}

export interface WalletDto {
  walletId: number;
  userId: number;
  balance: number;
  lastUpdated: string | null;
}

export interface TopUpInput {
  amount: number;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface TopUpResponse {
  orderCode: number;
  checkoutUrl: string;
  amount: number;
  status: string;
}

export interface BuySubscriptionResponse {
  orderId: number;
  planName: string;
  amount: number;
  status: string;
  analysisQuotaAdded: number;
  slideQuotaAdded: number;
  videoQuotaAdded: number;
  gameQuotaAdded: number;
  availableAnalysisQuotaAfter: number;
  availableSlideQuotaAfter: number;
  availableVideoQuotaAfter: number;
  availableGameQuotaAfter: number;
  walletBalanceAfter: number;
  purchasedAt: string;
}

export interface TransactionHistoryDto {
  transactionId: number;
  orderCode: number;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  description: string | null;
  createdAt: string;
}

export interface UserQuotaDto {
  totalAnalysisQuota: number;
  availableAnalysisQuota: number;
  usedAnalysisQuota: number;
  totalSlideQuota: number;
  availableSlideQuota: number;
  usedSlideQuota: number;
  totalVideoQuota: number;
  availableVideoQuota: number;
  usedVideoQuota: number;
  totalGameQuota: number;
  availableGameQuota: number;
  usedGameQuota: number;
  updatedAt: string;
}

export interface InitiateWithdrawalInput {
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  amount: number;
}

export interface ConfirmWithdrawalOtpInput extends InitiateWithdrawalInput {
  otpCode: string;
}

export interface AdminProcessWithdrawalInput {
  approved: boolean;
  adminNote?: string;
}

export interface WithdrawalDto {
  withdrawalId: number;
  expertId?: number | null;
  expertName?: string | null;
  amount: number;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  status?: number | string;
  statusName?: string | null;
  adminNote?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WithdrawalListResult {
  items: WithdrawalDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Staff Review ─────────────────────────────────────────────────────────
export interface StaffVerificationDto {
  verificationCode: string;
  expertId: number;
  expertName: string;
  expertEmail: string;
  fileType: string;
  description: string | null;
  status: number;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  fileUrl: string | null;
}

export interface ReviewVerificationInput {
  approved: boolean;
  rejectionReason?: string;
}

export interface ReviewMaterialInput {
  approved: boolean;
  rejectionReason?: string;
}

export interface StaffProfileDto {
  userCode: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  department: string | null;
  hireDate: string | null;
}

export interface UpdateStaffProfileInput {
  fullName?: string;
  phoneNumber?: string;
  department?: string;
}

export interface TeacherProfileDto {
  userCode: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  schoolName: string | null;
}

export interface UpdateTeacherProfileInput {
  fullName?: string;
  phoneNumber?: string;
  schoolName?: string;
}

// ─── Card Template ────────────────────────────────────────────────────────
import type { ITemplateSkeleton } from './nodes';

export interface ICardTemplate {
  templateCode: string;
  name: string;
  description?: string;
  /** 'layout' = layout-based (columns); 'freeform' = special-purpose; 'admin' = admin-created custom templates */
  category: 'layout' | 'freeform' | 'admin' | string;
  skeleton: ITemplateSkeleton;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  category: 'layout' | 'freeform' | 'admin' | string;
  description?: string;
  skeleton: ITemplateSkeleton;
}

export interface UpdateTemplateInput {
  name: string;
  category: 'layout' | 'freeform' | 'admin' | string;
  description?: string;
  skeleton: ITemplateSkeleton;
}

// ─── Product Material ─────────────────────────────────────────────────────────
export interface ProductMaterialDto {
  productMaterialCode: string;
  productCode: string;
  sourceType: 'Marketplace' | 'Upload';
  materialCode: string | null;
  title: string;
  type: string;
  resourceUrl: string;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AddProductMaterialInput {
  sourceType: 'Marketplace' | 'Upload';
  materialCode?: string;
  title?: string;
  type?: string;
  resourceUrl?: string;
  previewUrl?: string;
}
