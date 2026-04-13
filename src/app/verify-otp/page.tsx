'use client';

// src/app/verify-otp/page.tsx

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { useVerifyOtpService, useResendOtpService } from '@/services/authServices';

const cleanUserError = (message?: string, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') => {
  if (!message) return fallback;
  const sanitized = message
    .replace(/\s*\(?\b\d{3}\b\)?\.?\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized || fallback;
};

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = Number(searchParams.get('userId'));

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: verifyOtp, isPending } = useVerifyOtpService();
  const { mutate: resendOtp, isPending: isResending } = useResendOtpService();

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const otpString = otp.join('');

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setErrorMsg('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    pasted.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    if (otpString.length < 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    verifyOtp(
      { userId, otp: otpString },
      {
        onSuccess: (res) => {
          const isVerified = res.code === 200 && res.result?.isVerified === true;

          if (isVerified) {
            setSuccessMsg('Xác thực thành công! Đang chuyển hướng...');
            redirectTimeoutRef.current = setTimeout(() => {
              router.push('/login');
            }, 1500);
          } else {
            setSuccessMsg('');
            setErrorMsg(cleanUserError(res.message, 'OTP không hợp lệ.'));
          }
        },
        onError: () => {
          setSuccessMsg('');
          setErrorMsg('OTP không hợp lệ hoặc đã hết hạn.');
        },
      }
    );
  };

  const handleResend = () => {
    resendOtp(
      { userId },
      {
        onSuccess: (res) => {
          if (res.code === 200 && res.result?.canResendAgainAt) {
            const diff = Math.ceil(
              (new Date(res.result.canResendAgainAt).getTime() - Date.now()) / 1000
            );
            setSecondsLeft(Math.max(0, diff));
            setSuccessMsg('OTP mới đã được gửi tới email của bạn.');
            setErrorMsg('');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
          } else {
            setSuccessMsg('');
            setErrorMsg(cleanUserError(res.message, 'Gửi lại OTP thất bại.'));
          }
        },
        onError: (err) => {
          setSuccessMsg('');
          setErrorMsg(cleanUserError((err.response?.data as { message?: string })?.message));
        },
      }
    );
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f7ff] px-4">
        <p className="text-[#4b6693]">
          Liên kết không hợp lệ.{' '}
          <Link href="/register" className="font-medium text-[#2e5fb0] hover:underline">Đăng ký lại</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f7ff] px-4 py-8">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#9bbcff]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-4 h-72 w-72 rounded-full bg-[#c3d8ff]/25 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#d8e4ff] bg-white/90 shadow-[0_24px_80px_-24px_rgba(44,84,160,0.28)] backdrop-blur md:grid-cols-[1fr_1fr]">
        <div className="hidden bg-[radial-gradient(circle_at_top_left,_#eaf1ff_0,_#f4f8ff_45%,_#e3ecff_100%)] p-10 md:flex md:flex-col md:justify-between">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e4ff] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2b4f93]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Xác minh tài khoản
          </div>
          <div className="space-y-4">
            <h2 className="max-w-sm text-4xl font-semibold leading-tight text-[#173b7a]">
              Hoàn tất đăng ký với mã OTP.
            </h2>
            <p className="max-w-sm text-sm leading-7 text-[#35588f]">
              Nhập mã 6 chữ số đã gửi qua email để kích hoạt tài khoản và bắt đầu sử dụng hệ thống.
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7e4ff] bg-white/80 p-4 text-sm text-[#35588f]">
            Nếu chưa nhận được mã, bạn có thể gửi lại sau khi bộ đếm kết thúc.
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f1ff] md:mx-0">
                <MailCheck className="h-7 w-7 text-[#2e5fb0]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#173b7a]">Xác minh email</h1>
              <p className="text-sm text-[#4b6693]">Chúng tôi đã gửi mã OTP 6 chữ số đến email của bạn.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-3 block text-center text-sm font-medium text-[#274c8f]">
                  Nhập mã OTP
                </label>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="h-12 w-11 rounded-xl border border-[#d5e3ff] text-center text-lg font-semibold outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                    />
                  ))}
                </div>
              </div>

              {errorMsg && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                  {errorMsg}
                </p>
              )}
              {successMsg && (
                <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-center text-sm text-green-700">
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending || otpString.length < 6}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#2e5fb0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#254f95] focus:outline-none focus:ring-2 focus:ring-[#9ab8f5] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xác minh...
                  </>
                ) : (
                  <>
                    Xác minh
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || secondsLeft > 0}
                className="text-sm font-medium text-[#2e5fb0] hover:underline disabled:opacity-60 disabled:no-underline"
              >
                {isResending
                  ? 'Đang gửi...'
                  : secondsLeft > 0
                    ? `Gửi lại mã OTP (${secondsLeft}s)`
                    : 'Gửi lại mã OTP'}
              </button>
              {secondsLeft > 0 && (
                <p className="mt-1 text-sm text-[#4b6693]">
                  Bạn có thể gửi lại sau <span className="font-semibold text-[#2e5fb0]">{secondsLeft}s</span>
                </p>
              )}
            </div>

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

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f3f7ff]">
          <Loader2 className="h-6 w-6 animate-spin text-[#2e5fb0]" />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
