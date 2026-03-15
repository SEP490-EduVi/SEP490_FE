'use client';

// src/app/forgot-password/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForgotPasswordService } from '@/services/authServices';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  const router = useRouter();
  const { mutate: forgotPassword, isPending } = useForgotPasswordService();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setErrorMsg('Vui lòng nhập địa chỉ email.'); return; }

    forgotPassword(
      { email },
      {
        onSuccess: (res) => {
          if (res.result) {
            setSent(true);
            setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1500);
          } else {
            setErrorMsg(res.message ?? 'Không thể gửi email, vui lòng thử lại.');
          }
        },
        onError: (err) => {
          setErrorMsg(
            (err.response?.data as { message?: string })?.message ??
              'Có lỗi xảy ra, vui lòng thử lại.'
          );
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Quên mật khẩu?</h1>
          <p className="text-sm text-slate-500">
            Nhập email đăng ký để nhận mã OTP đặt lại mật khẩu
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                'Gửi mã OTP'
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-3 py-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-slate-600">
              Email đã được gửi! Đang chuyển hướng...
            </p>
          </div>
        )}

        <p className="text-center text-sm text-slate-500">
          <a href="/login" className="text-indigo-600 hover:underline">
            ← Quay lại đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
