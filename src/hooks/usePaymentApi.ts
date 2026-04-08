import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as paymentService from '@/services/paymentServices';
import type { TopUpInput } from '@/types/api';

const PLAN_QUERY_KEY = 'payment-plans';
const WALLET_QUERY_KEY = 'payment-wallet';
const TX_QUERY_KEY = 'payment-transactions';
const QUOTA_QUERY_KEY = 'payment-user-quota';

interface PaymentQueryOptions {
  enabled?: boolean;
}

export function useSubscriptionPlans(options?: PaymentQueryOptions) {
  return useQuery({
    queryKey: [PLAN_QUERY_KEY],
    queryFn: paymentService.getSubscriptionPlans,
    enabled: options?.enabled ?? true,
  });
}

export function useWalletInfo(options?: PaymentQueryOptions) {
  return useQuery({
    queryKey: [WALLET_QUERY_KEY],
    queryFn: paymentService.getWalletInfo,
    enabled: options?.enabled ?? true,
  });
}

export function useWalletTransactions(page = 1, pageSize = 10, options?: PaymentQueryOptions) {
  return useQuery({
    queryKey: [TX_QUERY_KEY, page, pageSize],
    queryFn: () => paymentService.getWalletTransactions(page, pageSize),
    enabled: options?.enabled ?? true,
  });
}

export function useTopUpWallet() {
  return useMutation({
    mutationFn: (input: TopUpInput) => paymentService.createTopUp(input),
  });
}

export function useVerifyTopUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderCode: number) => paymentService.verifyTopUp(orderCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WALLET_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [TX_QUERY_KEY] });
    },
  });
}

export function useBuySubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: number) => paymentService.buySubscription(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WALLET_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [TX_QUERY_KEY] });
    },
  });
}

export function useUserQuota(options?: PaymentQueryOptions) {
  return useQuery({
    queryKey: [QUOTA_QUERY_KEY],
    queryFn: paymentService.getUserQuota,
    enabled: options?.enabled ?? true,
  });
}
