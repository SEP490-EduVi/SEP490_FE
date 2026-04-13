import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import {
  AdminGradeResponse,
  AdminUserCreateRequest,
  AdminLessonResponse,
  AdminOrderResponse,
  AdminRoleResponse,
  AdminWithdrawalResponse,
  AdminSubjectResponse,
  AdminTransactionResponse,
  AdminUserResponse,
  AdminUserUpdateRequest,
  AdminWalletResponse,
  ApiResponse,
  ChangeUserRoleRequest,
  CreateGradeRequest,
  CreateLessonRequest,
  CreatePlanRequest,
  CreateSubjectRequest,
  FinancialOverviewResponse,
  PagedResponse,
  PlanResponse,
  UpdateGradeRequest,
  UpdateLessonRequest,
  UpdatePlanRequest,
  UpdateSubjectRequest,
} from '@/types/admin';

interface ListUsersParams {
  roleId?: number;
  status?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

interface ListWalletsParams {
  page?: number;
  pageSize?: number;
}

interface ListTransactionsParams {
  userId?: number;
  type?: string;
  transactionType?: string;
  status?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

interface ListOrdersParams {
  teacherId?: number;
  status?: number;
  paymentMethod?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

interface ListPlansParams {
  page?: number;
  pageSize?: number;
}

interface ListWithdrawalsParams {
  status?: number;
  page?: number;
  pageSize?: number;
}

const normalizeParams = <T extends object>(params: T) => {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
};

export const adminServices = {
  getGrades: async () => {
    const res = await api.get<ApiResponse<AdminGradeResponse[]>>(API_ENDPOINTS.GRADE.GET_ALL);
    return res.data;
  },

  createGrade: async (payload: CreateGradeRequest) => {
    const res = await api.post<ApiResponse<AdminGradeResponse>>(API_ENDPOINTS.GRADE.CREATE, payload);
    return res.data;
  },

  updateGrade: async (gradeCode: string, payload: UpdateGradeRequest) => {
    const res = await api.put<ApiResponse<AdminGradeResponse>>(API_ENDPOINTS.GRADE.UPDATE(gradeCode), payload);
    return res.data;
  },

  deleteGrade: async (gradeCode: string) => {
    const res = await api.delete<ApiResponse<string | boolean>>(API_ENDPOINTS.GRADE.DELETE(gradeCode));
    return res.data;
  },

  getSubjects: async () => {
    const res = await api.get<ApiResponse<AdminSubjectResponse[]>>(API_ENDPOINTS.SUBJECT.GET_ALL);
    return res.data;
  },

  createSubject: async (payload: CreateSubjectRequest) => {
    const res = await api.post<ApiResponse<AdminSubjectResponse>>(API_ENDPOINTS.SUBJECT.CREATE, payload);
    return res.data;
  },

  updateSubject: async (subjectCode: string, payload: UpdateSubjectRequest) => {
    const res = await api.put<ApiResponse<AdminSubjectResponse>>(API_ENDPOINTS.SUBJECT.UPDATE(subjectCode), payload);
    return res.data;
  },

  deleteSubject: async (subjectCode: string) => {
    const res = await api.delete<ApiResponse<string | boolean>>(API_ENDPOINTS.SUBJECT.DELETE(subjectCode));
    return res.data;
  },

  getLessons: async (subjectCode?: string) => {
    const endpoint = subjectCode ? API_ENDPOINTS.LESSON.GET_BY_SUBJECT(subjectCode) : API_ENDPOINTS.LESSON.GET_ALL;
    const res = await api.get<ApiResponse<AdminLessonResponse[]>>(endpoint);
    return res.data;
  },

  createLesson: async (payload: CreateLessonRequest) => {
    const res = await api.post<ApiResponse<AdminLessonResponse>>(API_ENDPOINTS.LESSON.CREATE, payload);
    return res.data;
  },

  updateLesson: async (lessonCode: string, payload: UpdateLessonRequest) => {
    const res = await api.put<ApiResponse<AdminLessonResponse>>(API_ENDPOINTS.LESSON.UPDATE(lessonCode), payload);
    return res.data;
  },

  deleteLesson: async (lessonCode: string) => {
    const res = await api.delete<ApiResponse<string | boolean>>(API_ENDPOINTS.LESSON.DELETE(lessonCode));
    return res.data;
  },

  listUsers: async (params: ListUsersParams) => {
    const { roleId, status, search, fromDate, toDate, page, pageSize } = params;
    const res = await api.get<ApiResponse<PagedResponse<AdminUserResponse>>>(API_ENDPOINTS.ADMIN.USERS, {
      params: normalizeParams({
        RoleId: roleId,
        Status: status,
        Search: search,
        FromDate: fromDate,
        ToDate: toDate,
        Page: page,
        PageSize: pageSize,
      }),
    });
    return res.data;
  },

  getUserDetail: async (userCode: string) => {
    const res = await api.get<ApiResponse<AdminUserResponse>>(API_ENDPOINTS.ADMIN.USER_BY_CODE(userCode));
    return res.data;
  },

  createUser: async (payload: AdminUserCreateRequest) => {
    const res = await api.post<ApiResponse<AdminUserResponse>>(API_ENDPOINTS.ADMIN.USERS, payload);
    return res.data;
  },

  updateUser: async (userCode: string, payload: AdminUserUpdateRequest) => {
    const { fullName, phoneNumber, avatarUrl } = payload;
    const res = await api.put<ApiResponse<AdminUserResponse>>(
      API_ENDPOINTS.ADMIN.USER_BY_CODE(userCode),
      normalizeParams({ fullName, phoneNumber, avatarUrl })
    );
    return res.data;
  },

  deleteUser: async (userCode: string) => {
    const res = await api.delete<ApiResponse<boolean>>(API_ENDPOINTS.ADMIN.USER_BY_CODE(userCode));
    return res.data;
  },

  banUser: async (userCode: string) => {
    const res = await api.post<ApiResponse<boolean>>(API_ENDPOINTS.ADMIN.USER_BAN(userCode));
    return res.data;
  },

  unbanUser: async (userCode: string) => {
    const res = await api.post<ApiResponse<boolean>>(API_ENDPOINTS.ADMIN.USER_UNBAN(userCode));
    return res.data;
  },

  changeUserRole: async (userCode: string, payload: ChangeUserRoleRequest) => {
    const res = await api.put<ApiResponse<string>>(
      API_ENDPOINTS.ADMIN.USER_CHANGE_ROLE(userCode),
      payload
    );
    return res.data;
  },

  getRoles: async () => {
    const res = await api.get<ApiResponse<AdminRoleResponse[]>>(API_ENDPOINTS.ADMIN.ROLES);
    return res.data;
  },

  getFinancialOverview: async () => {
    const res = await api.get<ApiResponse<FinancialOverviewResponse>>(API_ENDPOINTS.ADMIN.FINANCIAL_OVERVIEW);
    return res.data;
  },

  listWallets: async (params: ListWalletsParams) => {
    const res = await api.get<ApiResponse<PagedResponse<AdminWalletResponse>>>(
      API_ENDPOINTS.ADMIN.FINANCIAL_WALLETS,
      { params: normalizeParams(params) }
    );
    return res.data;
  },

  listTransactions: async (params: ListTransactionsParams) => {
    const { transactionType, type, ...rest } = params;
    const res = await api.get<ApiResponse<PagedResponse<AdminTransactionResponse>>>(
      API_ENDPOINTS.ADMIN.FINANCIAL_TRANSACTIONS,
      {
        params: normalizeParams({
          UserId: rest.userId,
          TransactionType: type ?? transactionType,
          Status: rest.status,
          FromDate: rest.fromDate,
          ToDate: rest.toDate,
          Page: rest.page,
          PageSize: rest.pageSize,
        }),
      }
    );
    return res.data;
  },

  listOrders: async (params: ListOrdersParams) => {
    const { teacherId, status, paymentMethod, fromDate, toDate, page, pageSize } = params;
    const res = await api.get<ApiResponse<PagedResponse<AdminOrderResponse>>>(
      API_ENDPOINTS.ADMIN.FINANCIAL_ORDERS,
      {
        params: normalizeParams({
          TeacherId: teacherId,
          Status: status,
          PaymentMethod: paymentMethod,
          FromDate: fromDate,
          ToDate: toDate,
          Page: page,
          PageSize: pageSize,
        }),
      }
    );
    return res.data;
  },

  listWithdrawals: async (params: ListWithdrawalsParams) => {
    const res = await api.get<ApiResponse<PagedResponse<AdminWithdrawalResponse>>>(
      API_ENDPOINTS.WITHDRAWAL.LIST,
      {
        params: normalizeParams({
          status: params.status,
          page: params.page,
          pageSize: params.pageSize,
        }),
      }
    );
    return res.data;
  },

  processWithdrawal: async (withdrawalId: number, approved: boolean, adminNote?: string) => {
    const res = await api.post<ApiResponse<AdminWithdrawalResponse>>(
      API_ENDPOINTS.WITHDRAWAL.PROCESS(withdrawalId),
      normalizeParams({ approved, adminNote })
    );
    return res.data;
  },

  listPlans: async (params: ListPlansParams) => {
    const res = await api.get<ApiResponse<PagedResponse<PlanResponse> | PlanResponse[]>>(API_ENDPOINTS.ADMIN.PLANS, {
      params: normalizeParams(params),
    });
    return res.data;
  },

  getPlanById: async (planId: number) => {
    const res = await api.get<ApiResponse<PlanResponse>>(API_ENDPOINTS.ADMIN.PLAN_BY_ID(planId));
    return res.data;
  },

  createPlan: async (payload: CreatePlanRequest) => {
    const res = await api.post<ApiResponse<PlanResponse>>(API_ENDPOINTS.ADMIN.PLANS, payload);
    return res.data;
  },

  updatePlan: async (planId: number, payload: UpdatePlanRequest) => {
    const res = await api.put<ApiResponse<PlanResponse>>(API_ENDPOINTS.ADMIN.PLAN_BY_ID(planId), payload);
    return res.data;
  },

  softDeletePlan: async (planId: number) => {
    const res = await api.delete<ApiResponse<boolean>>(API_ENDPOINTS.ADMIN.PLAN_BY_ID(planId));
    return res.data;
  },
};
