'use client';

// src/app/forgot-password/page.tsx

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { useForgotPasswordService } from '@/services/authServices';

const cleanUserError = (message?: string, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') => {
  if (!message) return fallback;
  const sanitized = message
    .replace(/\s*\(?\b\d{3}\b\)?\.?\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized || fallback;
};

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
            setErrorMsg(cleanUserError(res.message, 'Không thể gửi email, vui lòng thử lại.'));
          }
        },
        onError: (err) => {
          setErrorMsg(cleanUserError((err.response?.data as { message?: string })?.message));
        },
      }
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f7ff] px-4 py-8">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#9bbcff]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-4 h-72 w-72 rounded-full bg-[#c3d8ff]/25 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#d8e4ff] bg-white/90 shadow-[0_24px_80px_-24px_rgba(44,84,160,0.28)] backdrop-blur md:grid-cols-[1fr_1fr]">
        <div className="hidden bg-[radial-gradient(circle_at_top_left,_#eaf1ff_0,_#f4f8ff_45%,_#e3ecff_100%)] p-10 md:flex md:flex-col md:justify-between">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e4ff] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2b4f93]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Bảo mật tài khoản
          </div>
          <div className="space-y-4">
            <h2 className="max-w-sm text-4xl font-semibold leading-tight text-[#173b7a]">
              Khôi phục quyền truy cập một cách an toàn.
            </h2>
            <p className="max-w-sm text-sm leading-7 text-[#35588f]">
              Hệ thống sẽ gửi mã OTP đến email đã đăng ký để bạn đặt lại mật khẩu.
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7e4ff] bg-white/80 p-4 text-sm text-[#35588f]">
            Gợi ý: nếu chưa nhận OTP, hãy kiểm tra thêm thư mục Spam/Junk.
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f1ff] md:mx-0">
                <MailCheck className="h-7 w-7 text-[#2e5fb0]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#173b7a]">Quên mật khẩu?</h1>
              <p className="text-sm text-[#4b6693]">Nhập email để nhận OTP đặt lại mật khẩu.</p>
            </div>

            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-[#274c8f]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                  />
                </div>

                {errorMsg && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#2e5fb0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#254f95] focus:outline-none focus:ring-2 focus:ring-[#9ab8f5] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      Gửi mã OTP
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50/80 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-700">OTP đã được gửi, đang chuyển hướng...</p>
              </div>
            )}

            <p className="text-center text-sm text-[#4b6693]">
              <Link href="/login" className="font-semibold text-[#2e5fb0] hover:underline">
                ← Quay lại đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
