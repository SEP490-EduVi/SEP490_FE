import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as paymentService from '@/services/paymentServices';
import type { TopUpInput } from '@/types/api';

const PLAN_QUERY_KEY = 'payment-plans';
const WALLET_QUERY_KEY = 'payment-wallet';
const TX_QUERY_KEY = 'payment-transactions';

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: [PLAN_QUERY_KEY],
    queryFn: paymentService.getSubscriptionPlans,
  });
}

export function useWalletInfo() {
  return useQuery({
    queryKey: [WALLET_QUERY_KEY],
    queryFn: paymentService.getWalletInfo,
  });
}

export function useWalletTransactions(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: [TX_QUERY_KEY, page, pageSize],
    queryFn: () => paymentService.getWalletTransactions(page, pageSize),
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
