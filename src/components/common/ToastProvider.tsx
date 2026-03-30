'use client';

/**
 * ToastProvider
 * =============
 * Import this component once at the bottom of any page (or in layout.tsx) to:
 *   1. Render the react-hot-toast Toaster UI
 *   2. Register an Axios interceptor that auto-shows error messages from the API
 *
 * API error shape expected:
 *   { code: number; message: string; result: null }
 *
 * Usage:
 *   import { ToastProvider } from '@/components/common';
 *   // At the bottom of your page JSX:
 *   <ToastProvider />
 *
 * Manual toasts (import `notify` wherever you need):
 *   import { notify } from '@/components/common';
 *   notify.success('Tạo dự án thành công!')
 *   notify.error('Có lỗi xảy ra')
 *   notify.info('Đang xử lý...')
 *   notify.loading('Đang tải...')   // returns toast id
 *   notify.dismiss(id)
 */

import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import api from '@/config/axios';

// ─── Interceptor registration ──────────────────────────────────────────────
// Register eagerly at module load time (not in useEffect) so the interceptor
// is in place before React Query fires its first request during render.
let _interceptorRegistered = false;

function registerApiInterceptor() {
  if (_interceptorRegistered) return;
  _interceptorRegistered = true;

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Skip 401 — axios.ts already handles redirect for those
      const status: number | undefined = error?.response?.status;
      if (status === 401) return Promise.reject(error);

      // Only toast errors from mutating requests (POST, PUT, PATCH, DELETE).
      // GET failures (loading resources) are silent — components handle their
      // own empty/error states in the UI.
      const method: string = (error?.config?.method ?? 'get').toUpperCase();
      if (method === 'GET') return Promise.reject(error);

      const apiMessage: string | undefined = error?.response?.data?.message;
      const message = apiMessage ?? 'Có lỗi không xác định. Vui lòng thử lại.';
      toast.error(message, { duration: 4500 });

      return Promise.reject(error);
    },
  );
}

// Register immediately when this module is imported on the client
if (typeof window !== 'undefined') {
  registerApiInterceptor();
}

// ─── Notify helpers ────────────────────────────────────────────────────────
/**
 * `notify` — pre-styled manual toast helpers.
 * Import and call from any file to show a toast.
 *
 * @example
 * import { notify } from '@/components/common';
 * notify.success('Lưu thành công!');
 * notify.error('Xóa thất bại');
 * const id = notify.loading('Đang tạo video...');
 * notify.dismiss(id);
 */
export const notify = {
  /** Green checkmark — operation succeeded */
  success: (message: string) =>
    toast.success(message, { duration: 3500 }),

  /** Red X — something went wrong (manual, not from API) */
  error: (message: string) =>
    toast.error(message, { duration: 4500 }),

  /** Blue info — neutral information */
  info: (message: string) =>
    toast(message, {
      duration: 3500,
      icon: 'ℹ️',
    }),

  /** Spinner — use for async operations; call notify.dismiss(id) when done */
  loading: (message: string) =>
    toast.loading(message),

  /** Dismiss a specific toast by id */
  dismiss: (id: string) => toast.dismiss(id),

  /** Dismiss all toasts */
  dismissAll: () => toast.dismiss(),
};

// ─── Component ─────────────────────────────────────────────────────────────
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        // Default styles shared across all types
        style: {
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
          maxWidth: '380px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        },
        // Per-type overrides
        success: {
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
          },
          iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
        },
        error: {
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          },
          iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
          duration: 5000,
        },
        loading: {
          style: {
            background: '#f8fafc',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
          },
        },
      }}
    />
  );
}
