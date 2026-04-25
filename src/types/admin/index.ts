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
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface AdminUserCreateRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roleId: number;
  phoneNumber?: string;
  avatarUrl?: string;
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
  username?: string | null;
  userCode?: string | null;
  fullName?: string | null;
  email?: string | null;
  balance: number;
  lastUpdated?: string | null;
  updatedAt?: string | null;
}

export interface AdminTransactionResponse {
  transactionId: number;
  orderCode?: number | null;
  walletId?: number | null;
  userId?: number | null;
  username?: string | null;
  userCode?: string | null;
  fullName?: string | null;
  transactionType: string;
  status?: number | string;
  statusName?: string | null;
  amount: number | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  description?: string | null;
  planId?: number | null;
  planName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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

export interface AdminWithdrawalResponse {
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

export interface PlanResponse {
  planId: number;
  planName: string;
  description?: string | null;
  price: number;
  analysisQuotaAmount: number;
  slideQuotaAmount: number;
  videoQuotaAmount: number;
  gameQuotaAmount: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreatePlanRequest {
  planName: string;
  description?: string;
  price: number;
  analysisQuotaAmount: number;
  slideQuotaAmount: number;
  videoQuotaAmount: number;
  gameQuotaAmount: number;
}

export interface UpdatePlanRequest {
  planName?: string;
  description?: string;
  price?: number;
  analysisQuotaAmount?: number;
  slideQuotaAmount?: number;
  videoQuotaAmount?: number;
  gameQuotaAmount?: number;
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

export interface AdminMaterialResponse {
  materialCode: string;
  title: string;
  description?: string | null;
  type: string;
  price: number;
  previewUrl?: string | null;
  resourceUrl?: string | null;
  subjectCode?: string | null;
  subjectName?: string | null;
  gradeCode?: string | null;
  gradeName?: string | null;
  approvalStatus: number;
  rejectionReason?: string | null;
  expertCode?: string | null;
  expertName?: string | null;
  createdAt?: string | null;
}

export interface AdminCreateMaterialRequest {
  expertCode?: string;
  title: string;
  description?: string;
  type: string;
  price: number;
  resourceUrl: string;
  previewUrl?: string;
  subjectCode?: string;
  gradeCode?: string;
  approvalStatus: number;
  rejectionReason?: string;
}

export interface AdminUpdateMaterialRequest {
  expertCode?: string;
  title?: string;
  description?: string;
  type?: string;
  price?: number;
  resourceUrl?: string;
  previewUrl?: string;
  subjectCode?: string;
  gradeCode?: string;
  approvalStatus?: number;
  rejectionReason?: string;
}

export interface ListAdminMaterialsParams {
  approvalStatus?: number;
  type?: string;
  subjectCode?: string;
  gradeCode?: string;
  expertCode?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── Revenue / Sales types ─────────────────────────────────────────────────────

export interface RevenueFilterParams {
  fromDate?: string;
  toDate?: string;
  subjectCode?: string;
  gradeCode?: string;
  expertCode?: string;
  materialCode?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminRevenueForecastResponse {
  fromDate?: string;
  toDate?: string;
  periodDays?: number;
  forecastDays?: number;
  currentRevenue: number;
  previousRevenue: number;
  revenueGrowthRatePercent: number;
  averageDailyRevenue: number;
  forecastRevenue: number;
  currentSoldCount: number;
  previousSoldCount?: number;
  currentUniqueBuyerCount: number;
  previousUniqueBuyerCount?: number;
}

export interface AdminMaterialSalesItem {
  materialCode: string;
  title: string;
  subjectCode?: string;
  gradeCode?: string;
  expertCode?: string;
  expertName?: string;
  soldCount: number;
  uniqueBuyerCount: number;
  grossRevenue: number;
  lastPurchasedDate?: string;
}

export interface AdminExpertSalesItem {
  expertCode: string;
  expertName: string;
  soldMaterialCount: number;
  soldCount: number;
  uniqueBuyerCount?: number;
  grossRevenue: number;
  lastPurchasedDate?: string;
}
