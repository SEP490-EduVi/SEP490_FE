// src/types/auth.ts

// ─── Login ─────────────────────────────────────────────────────────────────────
export interface LoginInput {
  username: string;
  password: string;
}

// ─── Google Login ──────────────────────────────────────────────────────────────
export interface GoogleLoginInput {
  idToken: string;
}

// ─── Register ──────────────────────────────────────────────────────────────────
export interface RegisterInput {
  username: string;       // 3–50 chars
  password: string;       // ≥8 chars, must have upper/lower/digit/special
  email: string;
  fullName: string;       // 0–100 chars
  phoneNumber?: string | null;
  roleId: number;         // 3 = Teacher, 4 = Expert
  avatarUrl?: string | null;
}

export interface RegisterResponse {
  userId: number;
  email: string | null;
  otpExpiresIn: number;   // seconds until OTP expires
}

// ─── Verify OTP (after register) ───────────────────────────────────────────────
export interface VerifyOtpInput {
  userId: number;
  otp: string;  // exactly 6 digits
}

export interface VerifyOtpResponse {
  userId: number;
  email: string | null;
  isVerified: boolean;
}

// ─── Resend OTP (registration) ─────────────────────────────────────────────────
export interface ResendOtpInput {
  userId: number;
}

export interface ResendOtpResponse {
  canResendAgainAt: string;  // ISO date-time
}

// ─── Forgot / Reset Password ───────────────────────────────────────────────────
export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  otp: string;        // exactly 6 digits
  newPassword: string; // ≥8 chars, must have upper/lower/digit/special
}

// ─── Change Password (authenticated) ──────────────────────────────────────────
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;    // ≥8 chars, must have upper/lower/digit/special
  confirmPassword: string;
}

// ─── Auth Response (Login / Google Login) ─────────────────────────────────────
export interface AuthRole {
  roleId: number;
  roleName: string;
  description: string;
}

export interface AuthUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  status: number;
  role: AuthRole;
  adminId: number | null;
  expertId: number | null;
  staffId: number | null;
  teacherId: number | null;
  expertIsVerified: boolean | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

// ─── Current User Info (GET /me) ───────────────────────────────────────────────
export interface UserInfo {
  userId: number;
  userCode: string | null;
  username: string | null;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: number;
  role: AuthRole;
  adminId: number | null;
  expertId: number | null;
  staffId: number | null;
  teacherId: number | null;
  expertIsVerified: boolean | null;
}
