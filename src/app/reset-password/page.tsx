'use client';

// src/app/reset-password/page.tsx

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useResetPasswordService, useResendResetOtpService } from '@/services/authServices';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const cleanUserError = (message?: string, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') => {
  if (!message) return fallback;
  const sanitized = message
    .replace(/\s*\(?\b\d{3}\b\)?\.?\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized || fallback;
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = decodeURIComponent(searchParams.get('email') ?? '');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate: resetPassword, isPending } = useResetPasswordService();
  const { mutate: resendOtp, isPending: isResending } = useResendResetOtpService();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

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

  const validate = (): string => {
    if (otpString.length < 6) return 'Vui lòng nhập đủ 6 chữ số OTP.';
    if (!PASSWORD_PATTERN.test(newPassword)) {
      return 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).';
    }
    if (newPassword !== confirmPassword) return 'Mật khẩu xác nhận không khớp.';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    resetPassword(
      { email, otp: otpString, newPassword },
      {
        onSuccess: (res) => {
          if (res.result) {
            setSuccessMsg('Đặt lại mật khẩu thành công! Đang chuyển hướng...');
            setTimeout(() => router.push('/login'), 1500);
          } else {
            setErrorMsg(cleanUserError(res.message, 'OTP không hợp lệ hoặc đã hết hạn.'));
          }
        },
        onError: (err) => {
          setErrorMsg(cleanUserError((err.response?.data as { message?: string })?.message));
        },
      }
    );
  };

  const handleResend = () => {
    resendOtp(
      { email },
      {
        onSuccess: (res) => {
          if (res.code === 200) {
            const diff = Math.ceil(
              (new Date(res.result.canResendAgainAt).getTime() - Date.now()) / 1000
            );
            setSecondsLeft(Math.max(0, diff));
            setSuccessMsg('OTP mới đã được gửi tới email của bạn.');
            setErrorMsg('');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
          } else {
            setErrorMsg(cleanUserError(res.message, 'Gửi lại OTP thất bại.'));
          }
        },
        onError: (err) => {
          setErrorMsg(cleanUserError((err.response?.data as { message?: string })?.message));
        },
      }
    );
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f7ff] px-4">
        <p className="text-[#4b6693]">
          Liên kết không hợp lệ.{' '}
          <Link href="/forgot-password" className="font-medium text-[#2e5fb0] hover:underline">Thử lại</Link>
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
            Bảo mật tài khoản
          </div>
          <div className="space-y-4">
            <h2 className="max-w-sm text-4xl font-semibold leading-tight text-[#173b7a]">
              Đặt lại mật khẩu nhanh và an toàn.
            </h2>
            <p className="max-w-sm text-sm leading-7 text-[#35588f]">
              Nhập mã OTP đã nhận qua email để cập nhật mật khẩu mới cho tài khoản của bạn.
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
                <KeyRound className="h-7 w-7 text-[#2e5fb0]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#173b7a]">Đặt lại mật khẩu</h1>
              <p className="text-sm text-[#4b6693]">
                Nhập mã OTP đã gửi đến <span className="font-semibold text-[#2b4f93]">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="mb-3 block text-center text-sm font-medium text-[#274c8f]">
                  Mã OTP
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
                <div className="mt-2 text-center">
                  {secondsLeft > 0 ? (
                    <p className="text-xs text-[#4b6693]">
                      Gửi lại sau <span className="font-semibold text-[#2e5fb0]">{secondsLeft}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-xs font-medium text-[#2e5fb0] hover:underline disabled:opacity-60"
                    >
                      {isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-sm font-medium text-[#274c8f]">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Ít nhất 8 ký tự"
                    className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 pr-10 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#5f78a4]">
                  Bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-[#274c8f]">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 pr-10 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                  />
                  <button
                    type="button"
                    aria-label="Toggle confirm password visibility"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errorMsg}
                </p>
              )}
              {successMsg && (
                <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {successMsg}
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
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    Đặt lại mật khẩu
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f3f7ff]">
          <Loader2 className="h-6 w-6 animate-spin text-[#2e5fb0]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
