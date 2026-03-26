export interface ApiResponse<T> {
  code: number;
  message: string | null;
  result: T;
}

export interface PagedResponse<T> {
  data?: T[];
  items?: T[];
  total?: number;
  totalItems?: number;
  totalCount?: number;
  page?: number;
  currentPage?: number;
  pageSize?: number;
  size?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface AdminRoleResponse {
  roleId: number;
  roleName: string;
  description?: string | null;
}

export interface AdminUserResponse {
  userId: number;
  userCode: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status: number;
  statusName?: string | null;
  isEmailVerified?: boolean;
  createdAt?: string | null;
  roleId?: number;
  roleName?: string | null;
  adminId?: number | null;
  teacherId?: number | null;
  expertId?: number | null;
  staffId?: number | null;
  role?: {
    roleId: number;
    roleName: string;
    description?: string | null;
  };
}

export interface AdminUserUpdateRequest {
  fullName?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangeUserRoleRequest {
  roleId: number;
}

export interface FinancialOverviewResponse {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalWallets: number;
  totalBalance: number;
  totalTopUpAmount: number;
  totalTopUpCount: number;
  subscriptionRevenue?: number;
  subscriptionCount?: number;
  totalSubscriptionRevenue?: number;
  totalSubscriptionCount?: number;
  totalOrders: number;
  completedOrders: number;
}

export interface AdminWalletResponse {
  walletId: number;
  userId: number;
  userCode?: string | null;
  fullName?: string | null;
  email?: string | null;
  balance: number;
  updatedAt?: string | null;
}

export interface AdminTransactionResponse {
  transactionId: number;
  userId: number;
  userCode?: string | null;
  fullName?: string | null;
  transactionType: string;
  status: string;
  amount: number;
  createdAt?: string | null;
  referenceCode?: string | null;
}

export interface AdminOrderResponse {
  orderId: number;
  orderCode?: string | null;
  teacherId?: number | null;
  teacherName?: string | null;
  status?: number | string;
  statusName?: string | null;
  paymentMethod?: string | null;
  amount?: number;
  totalAmount?: number;
  createdAt?: string | null;
  orderDate?: string | null;
}

export interface PlanResponse {
  planId: number;
  planName: string;
  description?: string | null;
  durationDays: number;
  price: number;
  quotaAmount: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreatePlanRequest {
  planName: string;
  description?: string;
  durationDays: number;
  price: number;
  quotaAmount: number;
}

export interface UpdatePlanRequest {
  planName?: string;
  description?: string;
  durationDays?: number;
  price?: number;
  quotaAmount?: number;
  isActive?: boolean;
}

export interface AdminGradeResponse {
  gradeCode: string;
  gradeName: string;
}

export interface CreateGradeRequest {
  gradeCode: string;
  gradeName: string;
}

export interface UpdateGradeRequest {
  gradeCode?: string;
  gradeName?: string;
}

export interface AdminSubjectResponse {
  subjectCode: string;
  subjectName: string;
  lessonCount?: number;
}

export interface CreateSubjectRequest {
  subjectCode: string;
  subjectName: string;
}

export interface UpdateSubjectRequest {
  subjectCode?: string;
  subjectName?: string;
}

export interface AdminLessonResponse {
  lessonCode: string;
  lessonName: string;
  subjectCode?: string;
  subjectName?: string;
}

export interface CreateLessonRequest {
  lessonCode: string;
  lessonName: string;
  subjectCode: string;
}

export interface UpdateLessonRequest {
  lessonCode?: string;
  lessonName?: string;
  subjectCode?: string;
}
