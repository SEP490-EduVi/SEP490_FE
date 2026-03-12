// src/constants/apiEndpoints.ts

// ─── Helpers ───────────────────────────────────────────────────────────────────
const buildAuthEndpoint     = (path: string) => `/api/Auth${path}`;
const buildPipelineEndpoint = (path: string) => `/api/Pipeline${path}`;
const buildProjectEndpoint  = (path: string) => `/api/Project${path}`;
const buildProductEndpoint  = (path: string) => `/api/Product${path}`;

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

  // Pipeline (AI generation)
  PIPELINE: {
    // POST /api/Pipeline/input-documents — Upload file bài giảng → lưu vào GCS → lưu metadata vào DB
    UPLOAD_INPUT_DOCUMENT:  buildPipelineEndpoint("/input-documents"),
    // GET  /api/Pipeline/input-documents — Lấy danh sách InputDocuments của Teacher hiện tại
    GET_INPUT_DOCUMENTS:    buildPipelineEndpoint("/input-documents"),
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

} as const;



// ─── Combined convenience export ───────────────────────────────────────────────
export const ALL_API_ENDPOINTS = {
  MAIN:              API_ENDPOINTS,
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
export type ApiEndpoint    = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
