// src/hooks/react-query.typed.ts

import { AxiosError } from "axios";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import api from "@/config/axios";

type ApiError = AxiosError<{ message: string }>;

// ─── GET list ─────────────────────────────────────────────────────────────────
export const createQueryHook =
  <TResponse>(queryKey: string, url: string) =>
  (options?: object, params?: object): UseQueryResult<TResponse, ApiError> =>
    useQuery({
      queryKey: [queryKey],
      queryFn: async () => (await api.get<TResponse>(url, { params })).data,
      ...options,
    });

// ─── GET by ID ────────────────────────────────────────────────────────────────
export const createQueryWithPathParamHook =
  <TResponse>(queryKey: string, url: string) =>
  (id?: string, options?: object): UseQueryResult<TResponse, ApiError> =>
    useQuery({
      queryKey: id ? [queryKey, id] : [queryKey],
      queryFn: async () => (await api.get<TResponse>(`${url}/${id}`)).data,
      enabled: !!id,
      ...options,
    });

// ─── POST ─────────────────────────────────────────────────────────────────────
export const createMutationHook =
  <TResponse, TInput = unknown>(queryKey: string, url: string) =>
  (): UseMutationResult<TResponse, ApiError, TInput> => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: TInput) =>
        api.post<TResponse>(url, data).then((r) => r.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  };

// ─── PUT ──────────────────────────────────────────────────────────────────────
export const updateMutationHook =
  <TResponse, TInput = unknown>(queryKey: string, url: string) =>
  (): UseMutationResult<TResponse, ApiError, { id: string; data: TInput }> => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TInput }) =>
        api.put<TResponse>(`${url}/${id}`, data).then((r) => r.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  };

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteMutationHook =
  <TResponse = void>(queryKey: string, url: string) =>
  (): UseMutationResult<TResponse, ApiError, string> => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) =>
        api.delete<TResponse>(`${url}/${id}`).then((r) => r.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  };

// ─── POST không có invalidate (ví dụ: login, upload) ─────────────────────────
export const createStandaloneMutationHook =
  <TResponse, TInput = unknown>(url: string) =>
  (): UseMutationResult<TResponse, ApiError, TInput> =>
    useMutation({
      mutationFn: (data: TInput) =>
        api.post<TResponse>(url, data).then((r) => r.data),
    });
