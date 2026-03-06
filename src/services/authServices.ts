// src/services/authServices.ts

import { createStandaloneMutationHook } from "@/hooks/react-query.typed";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { LoginInput, LoginResponse, RegisterInput, AuthUser } from "@/types/auth";
import { ApiResponse } from "@/types/api";

// ─── Login ─────────────────────────────────────────────────────────────────────
// POST /identity-service/api/login
// IDE tự biết: mutate(LoginInput) → data: ApiResponse<LoginResponse>
export const useLoginService = createStandaloneMutationHook<
  ApiResponse<LoginResponse>,
  LoginInput
>(API_ENDPOINTS.AUTH.LOGIN);

// ─── Register ──────────────────────────────────────────────────────────────────
// POST /identity-service/api/register
export const useRegisterService = createStandaloneMutationHook<
  ApiResponse<AuthUser>,
  RegisterInput
>(API_ENDPOINTS.AUTH.REGISTER);

// ─── Forgot Password ───────────────────────────────────────────────────────────
// POST /identity-service/api/forgot-password
export const useForgotPasswordService = createStandaloneMutationHook<
  ApiResponse<{ message: string }>,
  { email: string }
>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD);

// ─── Reset Password ────────────────────────────────────────────────────────────
// POST /identity-service/api/reset-password
export const useResetPasswordService = createStandaloneMutationHook<
  ApiResponse<{ message: string }>,
  { token: string; newPassword: string }
>(API_ENDPOINTS.AUTH.RESET_PASSWORD);
