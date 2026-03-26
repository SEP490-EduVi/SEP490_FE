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
  page?: number;
  currentPage?: number;
  pageSize?: number;
  size?: number;
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
  orderCode: string;
  teacherId?: number | null;
  teacherName?: string | null;
  status: string;
  paymentMethod?: string | null;
  amount: number;
  createdAt?: string | null;
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
