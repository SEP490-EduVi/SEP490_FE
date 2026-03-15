'use client';

// src/app/reset-password/page.tsx

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useResetPasswordService, useResendResetOtpService } from '@/services/authServices';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
            setErrorMsg(res.message ?? 'OTP không hợp lệ hoặc đã hết hạn.');
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
            setErrorMsg(res.message ?? 'Gửi lại OTP thất bại.');
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

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4">
        <p className="text-slate-500">
          Liên kết không hợp lệ.{' '}
          <a href="/forgot-password" className="text-indigo-600 hover:underline">Thử lại</a>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Đặt lại mật khẩu</h1>
          <p className="text-sm text-slate-500">
            Nhập mã OTP đã gửi đến{' '}
            <span className="font-medium text-slate-700">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* OTP Boxes */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-3 text-center">
              Mã OTP
            </label>
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-slate-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              ))}
            </div>
            <div className="text-center mt-2">
              {secondsLeft > 0 ? (
                <p className="text-xs text-slate-500">
                  Gửi lại sau{' '}
                  <span className="font-semibold text-indigo-600">{secondsLeft}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-60"
                >
                  {isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Ít nhất 8 ký tự"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                aria-label="Toggle confirm password visibility"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {successMsg}
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
                Đang cập nhật...
              </span>
            ) : (
              'Đặt lại mật khẩu'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          <a href="/login" className="text-indigo-600 hover:underline">
            ← Quay lại đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
