// src/types/auth.ts

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

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
