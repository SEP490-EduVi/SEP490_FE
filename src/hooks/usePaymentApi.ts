import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as paymentService from '@/services/paymentServices';
import type {
  AdminProcessWithdrawalInput,
  ConfirmWithdrawalOtpInput,
  InitiateWithdrawalInput,
  TopUpInput,
} from '@/types/api';

const PLAN_QUERY_KEY = 'payment-plans';
const WALLET_QUERY_KEY = 'payment-wallet';
const TX_QUERY_KEY = 'payment-transactions';
const QUOTA_QUERY_KEY = 'payment-user-quota';
const WITHDRAWAL_MY_QUERY_KEY = 'payment-withdrawal-my';
const WITHDRAWAL_ADMIN_QUERY_KEY = 'payment-withdrawal-admin';

interface PaymentQueryOptions {
  enabled?: boolean;
  refetchIntervalMs?: number;
  staleTimeMs?: number;
  refetchInBackground?: boolean;
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
    refetchInterval: options?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: options?.refetchInBackground ?? false,
    staleTime: options?.staleTimeMs ?? 0,
  });
}

export function useWalletTransactions(page = 1, pageSize = 10, options?: PaymentQueryOptions) {
  return useQuery({
    queryKey: [TX_QUERY_KEY, page, pageSize],
    queryFn: () => paymentService.getWalletTransactions(page, pageSize),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: options?.refetchInBackground ?? false,
    staleTime: options?.staleTimeMs ?? 0,
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

export function useInitiateWithdrawal() {
  return useMutation({
    mutationFn: (input: InitiateWithdrawalInput) => paymentService.initiateWithdrawal(input),
  });
}

export function useConfirmWithdrawalOtp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmWithdrawalOtpInput) => paymentService.confirmWithdrawalOtp(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WALLET_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [TX_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [WITHDRAWAL_MY_QUERY_KEY] });
    },
  });
}

export function useMyWithdrawals(page = 1, pageSize = 10, options?: PaymentQueryOptions) {
  return useQuery({
    queryKey: [WITHDRAWAL_MY_QUERY_KEY, page, pageSize],
    queryFn: () => paymentService.getMyWithdrawals(page, pageSize),
    enabled: options?.enabled ?? true,
  });
}

export function useAdminWithdrawals(page = 1, pageSize = 10, status?: number, options?: PaymentQueryOptions) {
  return useQuery({
    queryKey: [WITHDRAWAL_ADMIN_QUERY_KEY, page, pageSize, status ?? null],
    queryFn: () => paymentService.getAdminWithdrawals(page, pageSize, status),
    enabled: options?.enabled ?? true,
  });
}

export function useProcessWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ withdrawalId, payload }: { withdrawalId: number; payload: AdminProcessWithdrawalInput }) =>
      paymentService.processWithdrawal(withdrawalId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WITHDRAWAL_ADMIN_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [WALLET_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [TX_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [WITHDRAWAL_MY_QUERY_KEY] });
    },
  });
}
