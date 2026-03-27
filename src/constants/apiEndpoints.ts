// src/constants/apiEndpoints.ts

// ─── Helpers ───────────────────────────────────────────────────────────────────
const buildAuthEndpoint     = (path: string) => `/api/Auth${path}`;
const buildPipelineEndpoint = (path: string) => `/api/Pipeline${path}`;
const buildProjectEndpoint  = (path: string) => `/api/Project${path}`;
const buildProductEndpoint       = (path: string) => `/api/Product${path}`;
const buildInputDocumentEndpoint = (path: string) => `/api/InputDocument${path}`;
const buildCurriculumEndpoint    = (path: string) => `/api/curriculum-ingestion${path}`;
const buildAdminEndpoint         = (path: string) => `/api/Admin${path}`;
const buildPaymentEndpoint       = (path: string) => `/api/Payment${path}`;
const buildStaffEndpoint         = (path: string) => `/api/staff${path}`;

// ─── Main API Endpoints ────────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN:            buildAuthEndpoint("/login"),
    GOOGLE_LOGIN:     buildAuthEndpoint("/google-login"),
    REGISTER:         buildAuthEndpoint("/register"),
    VERIFY_OTP:       buildAuthEndpoint("/verify-otp"),
    RESEND_OTP:       buildAuthEndpoint("/resend-otp"),
    LOGOUT:           buildAuthEndpoint("/logout"),
    ME:               buildAuthEndpoint("/me"),
    FORGOT_PASSWORD:  buildAuthEndpoint("/forgot-password"),
    RESEND_RESET_OTP: buildAuthEndpoint("/resend-reset-otp"),
    RESET_PASSWORD:   buildAuthEndpoint("/reset-password"),
    VERIFY_SESSION:   buildAuthEndpoint("/verify-session"),
    CHANGE_PASSWORD:  buildAuthEndpoint("/change-password"),
  },

  // Pipeline (AI generation)
  PIPELINE: {
    // POST /api/Pipeline/lesson-analysis — Tạo Product (NEW) → gửi RabbitMQ
    LESSON_ANALYSIS:        buildPipelineEndpoint("/lesson-analysis"),
    // POST /api/Pipeline/generate-slides — Trigger tạo slide từ Product đã evaluate
    GENERATE_SLIDES:        buildPipelineEndpoint("/generate-slides"),
    // PUT  /api/Pipeline/products/{productCode}/slide — Lưu bản slide chỉnh sửa cuối cùng
    SAVE_EDITED_SLIDE: (productCode: string) =>
      buildPipelineEndpoint(`/products/${productCode}/slide`),
    // GET  /api/Pipeline/status/{taskId} — Kiểm tra trạng thái task (fallback SignalR)
    GET_TASK_STATUS: (taskId: string) =>
      buildPipelineEndpoint(`/status/${taskId}`),
  },

  // Project
  PROJECT: {
    // GET    /api/Project
    GET_ALL:   buildProjectEndpoint(""),
    // POST   /api/Project
    CREATE:    buildProjectEndpoint(""),
    // GET    /api/Project/{projectCode}
    GET_BY_ID: (projectCode: string) => buildProjectEndpoint(`/${projectCode}`),
    // PUT    /api/Project/{projectCode}
    UPDATE:    (projectCode: string) => buildProjectEndpoint(`/${projectCode}`),
    // DELETE /api/Project/{projectCode}
    DELETE:    (projectCode: string) => buildProjectEndpoint(`/${projectCode}`),
  },

  // Product
  PRODUCT: {
    // GET    /api/Product — Lấy danh sách tất cả Products (không bao gồm đã xóa)
    GET_ALL:    buildProductEndpoint(""),
    // GET    /api/Product/project/{projectCode} — Lấy danh sách Products theo project
    GET_BY_PROJECT: (projectCode: string) => buildProductEndpoint(`/project/${projectCode}`),
    // GET    /api/Product/{productCode} — Lấy chi tiết đầy đủ của một Product
    GET_BY_ID:  (productCode: string) => buildProductEndpoint(`/${productCode}`),
    // DELETE /api/Product/{productCode} — Xóa mềm Product
    DELETE:     (productCode: string) => buildProductEndpoint(`/${productCode}`),
    // GET    /api/Product/{productCode}/evaluation — Lấy kết quả đánh giá AI
    GET_EVALUATION: (productCode: string) => buildProductEndpoint(`/${productCode}/evaluation`),
    // GET    /api/Product/{productCode}/slide — Lấy slide do AI tạo ra (bản gốc)
    GET_SLIDE:  (productCode: string) => buildProductEndpoint(`/${productCode}/slide`),
    // GET    /api/Product/{productCode}/slide/edited — Lấy slide Teacher đã chỉnh sửa lần cuối
    GET_EDITED_SLIDE: (productCode: string) => buildProductEndpoint(`/${productCode}/slide/edited`),
  },

  // InputDocument
  INPUT_DOCUMENT: {
    // GET  /api/InputDocument — Lấy tất cả InputDocuments của Teacher hiện tại
    GET_ALL:        buildInputDocumentEndpoint(""),
    // POST /api/InputDocument — Upload tài liệu đầu vào
    UPLOAD:         buildInputDocumentEndpoint(""),
    // GET  /api/InputDocument/project/{projectCode} — Lấy danh sách tài liệu theo project
    GET_BY_PROJECT: (projectCode: string) => buildInputDocumentEndpoint(`/project/${projectCode}`),
    // GET  /api/InputDocument/{documentCode}
    GET_BY_CODE:    (documentCode: string) => buildInputDocumentEndpoint(`/${documentCode}`),
    // DELETE /api/InputDocument/{documentCode} — Xóa tài liệu
    DELETE:         (documentCode: string) => buildInputDocumentEndpoint(`/${documentCode}`),
  },

  // Video generation
  VIDEO: {
    // GET  /api/Video — Lấy tất cả video của user hiện tại
    GET_ALL: '/api/Video',
    // POST /api/Video/generate — Tạo video từ slide đã chỉnh sửa
    GENERATE: '/api/Video/generate',
    // GET  /api/Video/project/{projectCode}
    GET_BY_PROJECT: (projectCode: string) => `/api/Video/project/${projectCode}`,
    // GET  /api/Video/project/{projectCode}/latest
    GET_LATEST_BY_PROJECT: (projectCode: string) => `/api/Video/project/${projectCode}/latest`,
    // DELETE /api/Video/{productVideoCode}
    DELETE: (productVideoCode: string) => `/api/Video/${productVideoCode}`,
  },

  // Metadata
  SUBJECT: {
    GET_ALL: '/api/Subject',
    GET_BY_CODE: (subjectCode: string) => `/api/Subject/${subjectCode}`,
    CREATE: '/api/Subject',
    UPDATE: (subjectCode: string) => `/api/Subject/${subjectCode}`,
    DELETE: (subjectCode: string) => `/api/Subject/${subjectCode}`,
  },
  GRADE: {
    GET_ALL: '/api/Grade',
    GET_BY_CODE: (gradeCode: string) => `/api/Grade/${gradeCode}`,
    CREATE: '/api/Grade',
    UPDATE: (gradeCode: string) => `/api/Grade/${gradeCode}`,
    DELETE: (gradeCode: string) => `/api/Grade/${gradeCode}`,
  },
  LESSON: {
    GET_ALL: '/api/Lesson',
    GET_BY_SUBJECT: (subjectCode: string) => `/api/Lesson?subjectCode=${subjectCode}`,
    GET_BY_CODE: (lessonCode: string) => `/api/Lesson/${lessonCode}`,
    CREATE: '/api/Lesson',
    UPDATE: (lessonCode: string) => `/api/Lesson/${lessonCode}`,
    DELETE: (lessonCode: string) => `/api/Lesson/${lessonCode}`,
  },

  // Expert Verification (Certificate)
  EXPERT_VERIFICATION: {
    SUBMIT:   '/api/expert/verifications',
    GET_ALL:  '/api/expert/verifications',
    DELETE:   (code: string) => `/api/expert/verifications/${code}`,
  },

  // Material (Expert)
  MATERIAL: {
    UPLOAD:   '/api/material/file',
    GET_MY:   '/api/material/my',
    UPDATE:   (code: string) => `/api/material/${code}`,
    DELETE:   (code: string) => `/api/material/${code}`,
    GET_PENDING: '/api/material/pending',
    GET_REVIEW_DETAIL: (code: string) => `/api/material/review/${code}`,
    REVIEW: (code: string) => `/api/material/${code}/review`,
    // Teacher-facing
    GET_BY_CODE: (code: string) => `/api/material/${code}`,
    BROWSE:      '/api/material/browse',
    PURCHASE:    (code: string) => `/api/material/${code}/purchase`,
    GET_PURCHASED: '/api/material/purchased',
  },

  // Curriculum Ingestion
  CURRICULUM: {
    // POST /api/curriculum-ingestion
    UPLOAD: buildCurriculumEndpoint(''),
    // GET /api/curriculum-ingestion
    GET_ALL: buildCurriculumEndpoint(''),
    // GET /api/curriculum-ingestion/{documentCode}
    GET_BY_CODE: (documentCode: string) => buildCurriculumEndpoint(`/${documentCode}`),
  },

  // Admin
  ADMIN: {
    USERS: buildAdminEndpoint('/users'),
    USER_BY_CODE: (userCode: string) => buildAdminEndpoint(`/users/${userCode}`),
    USER_BAN: (userCode: string) => buildAdminEndpoint(`/users/${userCode}/ban`),
    USER_UNBAN: (userCode: string) => buildAdminEndpoint(`/users/${userCode}/unban`),
    USER_CHANGE_ROLE: (userCode: string) => buildAdminEndpoint(`/users/${userCode}/role`),
    ROLES: buildAdminEndpoint('/roles'),

    FINANCIAL_OVERVIEW: buildAdminEndpoint('/financial/overview'),
    FINANCIAL_WALLETS: buildAdminEndpoint('/financial/wallets'),
    FINANCIAL_TRANSACTIONS: buildAdminEndpoint('/financial/transactions'),
    FINANCIAL_ORDERS: buildAdminEndpoint('/financial/orders'),

    PLANS: buildAdminEndpoint('/plans'),
    PLAN_BY_ID: (planId: number) => buildAdminEndpoint(`/plans/${planId}`),
  },

  // Staff
  STAFF: {
    VERIFICATION_PENDING: buildStaffEndpoint('/verifications/pending'),
    VERIFICATION_DETAIL: (code: string) => buildStaffEndpoint(`/verifications/${code}`),
    VERIFICATION_FILE: (code: string) => buildStaffEndpoint(`/verifications/${code}/file`),
    REVIEW_VERIFICATION: (code: string) => buildStaffEndpoint(`/verifications/${code}/review`),
  },

  // Payment
  PAYMENT: {
    PLANS: buildPaymentEndpoint('/plans'),
    WALLET: buildPaymentEndpoint('/wallet'),
    TOP_UP: buildPaymentEndpoint('/top-up'),
    VERIFY_TOP_UP: (orderCode: number) => buildPaymentEndpoint(`/top-up/verify/${orderCode}`),
    BUY_SUBSCRIPTION: buildPaymentEndpoint('/buy-subscription'),
    TRANSACTIONS: buildPaymentEndpoint('/transactions'),
  },

} as const;



// ─── Combined convenience export ───────────────────────────────────────────────
export const ALL_API_ENDPOINTS = {
  MAIN:              API_ENDPOINTS,
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
export type ApiEndpoint    = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
