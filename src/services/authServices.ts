// src/services/authServices.ts

import { createStandaloneMutationHook, createQueryHook } from "@/hooks/react-query.typed";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import {
  LoginInput,
  LoginResponse,
  GoogleLoginInput,
  RegisterInput,
  RegisterResponse,
  VerifyOtpInput,
  VerifyOtpResponse,
  ResendOtpInput,
  ResendOtpResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UserInfo,
} from "@/types/auth";
import { ApiResponse } from "@/types/api";

// ─── Login ─────────────────────────────────────────────────────────────────────
export const useLoginService = createStandaloneMutationHook<
  ApiResponse<LoginResponse>,
  LoginInput
>(API_ENDPOINTS.AUTH.LOGIN);

// ─── Google Login ──────────────────────────────────────────────────────────────
export const useGoogleLoginService = createStandaloneMutationHook<
  ApiResponse<LoginResponse>,
  GoogleLoginInput
>(API_ENDPOINTS.AUTH.GOOGLE_LOGIN);

// ─── Register ──────────────────────────────────────────────────────────────────
export const useRegisterService = createStandaloneMutationHook<
  ApiResponse<RegisterResponse>,
  RegisterInput
>(API_ENDPOINTS.AUTH.REGISTER);

// ─── Verify OTP (after register) ───────────────────────────────────────────────
export const useVerifyOtpService = createStandaloneMutationHook<
  ApiResponse<VerifyOtpResponse>,
  VerifyOtpInput
>(API_ENDPOINTS.AUTH.VERIFY_OTP);

// ─── Resend OTP (registration) ─────────────────────────────────────────────────
export const useResendOtpService = createStandaloneMutationHook<
  ApiResponse<ResendOtpResponse>,
  ResendOtpInput
>(API_ENDPOINTS.AUTH.RESEND_OTP);

// ─── Logout ────────────────────────────────────────────────────────────────────
export const useLogoutService = createStandaloneMutationHook<
  ApiResponse<boolean>,
  void
>(API_ENDPOINTS.AUTH.LOGOUT);

// ─── Get Current User (me) ─────────────────────────────────────────────────────
export const useGetMeService = createQueryHook<ApiResponse<UserInfo>>(
  "auth-me",
  API_ENDPOINTS.AUTH.ME
);

// ─── Forgot Password ───────────────────────────────────────────────────────────
export const useForgotPasswordService = createStandaloneMutationHook<
  ApiResponse<boolean>,
  ForgotPasswordInput
>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD);

// ─── Resend Reset OTP ──────────────────────────────────────────────────────────
export const useResendResetOtpService = createStandaloneMutationHook<
  ApiResponse<ResendOtpResponse>,
  ForgotPasswordInput
>(API_ENDPOINTS.AUTH.RESEND_RESET_OTP);

// ─── Reset Password ────────────────────────────────────────────────────────────
export const useResetPasswordService = createStandaloneMutationHook<
  ApiResponse<boolean>,
  ResetPasswordInput
>(API_ENDPOINTS.AUTH.RESET_PASSWORD);

// ─── Verify Session ────────────────────────────────────────────────────────────
export const useVerifySessionService = createStandaloneMutationHook<
  ApiResponse<boolean>,
  void
>(API_ENDPOINTS.AUTH.VERIFY_SESSION);

// ─── Change Password ───────────────────────────────────────────────────────────
// TODO: update ChangePasswordInput once schema is provided
export const useChangePasswordService = createStandaloneMutationHook<
  ApiResponse<boolean>,
  ChangePasswordInput
>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD);
