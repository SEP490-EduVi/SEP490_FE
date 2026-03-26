// src/config/axios.ts

import axios from "axios";

const PUBLIC_AUTH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/google-login",
  "/api/auth/register",
  "/api/auth/verify-otp",
  "/api/auth/resend-otp",
  "/api/auth/forgot-password",
  "/api/auth/resend-reset-otp",
  "/api/auth/reset-password",
];

const isPublicAuthRequest = (url?: string) => {
  if (!url) return false;
  const normalizedUrl = url.toLowerCase();
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) =>
    normalizedUrl.includes(endpoint)
  );
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Đính kèm access token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const isPublic = isPublicAuthRequest(config.url);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────────────────────
// Xử lý lỗi 401 → xóa token → redirect về login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublic = isPublicAuthRequest(error.config?.url);

    if (error.response?.status === 401 && !isPublic && typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
