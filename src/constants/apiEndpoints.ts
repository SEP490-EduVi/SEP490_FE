// src/constants/apiEndpoints.ts

// ─── Helpers ───────────────────────────────────────────────────────────────────
const buildAuthEndpoint     = (path: string) => `/api/Auth${path}`;
const buildPipelineEndpoint = (path: string) => `/api/Pipeline${path}`;
const buildProjectEndpoint  = (path: string) => `/api/Project${path}`;
const buildProductEndpoint       = (path: string) => `/api/Product${path}`;
const buildInputDocumentEndpoint = (path: string) => `/api/InputDocument${path}`;
const buildCurriculumEndpoint    = (path: string) => `/api/curriculum-ingestion${path}`;

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
    // POST /api/InputDocument — Upload tài liệu đầu vào
    UPLOAD:         buildInputDocumentEndpoint(""),
    // GET  /api/InputDocument/project/{projectCode} — Lấy danh sách tài liệu theo project
    GET_BY_PROJECT: (projectCode: string) => buildInputDocumentEndpoint(`/project/${projectCode}`),
    // DELETE /api/InputDocument/{documentCode} — Xóa tài liệu
    DELETE:         (documentCode: string) => buildInputDocumentEndpoint(`/${documentCode}`),
  },

  // Video generation
  VIDEO: {
    // POST /api/Video/generate — Tạo video từ slide đã chỉnh sửa
    GENERATE: '/api/Video/generate',
    // GET  /api/Video/project/{projectCode}/latest
    GET_LATEST_BY_PROJECT: (projectCode: string) => `/api/Video/project/${projectCode}/latest`,
    // DELETE /api/Video/{productVideoCode}
    DELETE: (productVideoCode: string) => `/api/Video/${productVideoCode}`,
  },

  // Metadata
  SUBJECT: {
    GET_ALL: '/api/Subject',
  },
  GRADE: {
    GET_ALL: '/api/Grade',
  },
  LESSON: {
    GET_BY_SUBJECT: (subjectCode: string) => `/api/Lesson?subjectCode=${subjectCode}`,
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
    // Teacher-facing
    GET_BY_CODE: (code: string) => `/api/material/${code}`,
    BROWSE:      '/api/material/browse',
    PURCHASE:    (code: string) => `/api/material/${code}/purchase`,
    GET_PURCHASED: '/api/material/purchased',
  },

  // Curriculum Ingestion
  CURRICULUM: {
    // GET /api/curriculum-ingestion
    GET_ALL: buildCurriculumEndpoint(''),
  },

} as const;



// ─── Combined convenience export ───────────────────────────────────────────────
export const ALL_API_ENDPOINTS = {
  MAIN:              API_ENDPOINTS,
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
export type ApiEndpoint    = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
