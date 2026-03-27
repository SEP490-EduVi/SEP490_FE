import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  BuySubscriptionResponse,
  SubscriptionPlanDto,
  TopUpInput,
  TopUpResponse,
  TransactionHistoryDto,
  WalletDto,
} from '@/types/api';

export interface WalletTransactionListResult {
  items: TransactionHistoryDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function normalizeTransactionsResult(raw: unknown): WalletTransactionListResult {
  if (!raw || typeof raw !== 'object') {
    return { items: [], totalCount: 0, page: 1, pageSize: 20 };
  }

  const obj = raw as Record<string, unknown>;
  const items = Array.isArray(obj.items)
    ? (obj.items as TransactionHistoryDto[])
    : Array.isArray(obj.data)
      ? (obj.data as TransactionHistoryDto[])
      : [];

  return {
    items,
    totalCount: typeof obj.totalCount === 'number' ? obj.totalCount : items.length,
    page: typeof obj.page === 'number' ? obj.page : 1,
    pageSize: typeof obj.pageSize === 'number' ? obj.pageSize : items.length || 20,
  };
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlanDto[]> {
  const { data } = await api.get<ApiResponse<SubscriptionPlanDto[]>>(
    API_ENDPOINTS.PAYMENT.PLANS,
  );
  return data.result ?? [];
}

export async function getWalletInfo(): Promise<WalletDto> {
  const { data } = await api.get<ApiResponse<WalletDto>>(API_ENDPOINTS.PAYMENT.WALLET);
  return data.result;
}

export async function createTopUp(input: TopUpInput): Promise<TopUpResponse> {
  const { data } = await api.post<ApiResponse<TopUpResponse>>(
    API_ENDPOINTS.PAYMENT.TOP_UP,
    input,
  );
  return data.result;
}

export async function verifyTopUp(orderCode: number): Promise<TransactionHistoryDto> {
  const { data } = await api.get<ApiResponse<TransactionHistoryDto>>(
    API_ENDPOINTS.PAYMENT.VERIFY_TOP_UP(orderCode),
  );
  return data.result;
}

export async function buySubscription(planId: number): Promise<BuySubscriptionResponse> {
  const { data } = await api.post<ApiResponse<BuySubscriptionResponse>>(
    API_ENDPOINTS.PAYMENT.BUY_SUBSCRIPTION,
    { planId },
  );
  return data.result;
}

export async function getWalletTransactions(page = 1, pageSize = 20): Promise<WalletTransactionListResult> {
  const { data } = await api.get<ApiResponse<unknown>>(API_ENDPOINTS.PAYMENT.TRANSACTIONS, {
    params: { page, pageSize },
  });
  return normalizeTransactionsResult(data.result);
}
