// src/constants/apiEndpoints.ts

// ─── Helper ────────────────────────────────────────────────────────────────────
const buildAuthEndpoint = ( path: string) =>
  `/api/Auth${path}`;

// ─── Main API Endpoints ────────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN:           buildAuthEndpoint("/login"),
    REGISTER:        buildAuthEndpoint("/register"),
    LOGIN_GOOGLE:    buildAuthEndpoint("/login-google"),
    REFRESH_TOKEN:   buildAuthEndpoint("/refresh"),
    FORGOT_PASSWORD: buildAuthEndpoint("/forgot-password"),
    RESET_PASSWORD:  buildAuthEndpoint("/reset-password"),
    VERIFY:          buildAuthEndpoint("/verify"),
  },

} as const;



// ─── Combined convenience export ───────────────────────────────────────────────
export const ALL_API_ENDPOINTS = {
  MAIN:              API_ENDPOINTS,
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
export type ApiEndpoint    = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
