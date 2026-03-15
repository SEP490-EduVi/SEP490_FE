'use client';

// src/app/verify-otp/page.tsx

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyOtpService, useResendOtpService } from '@/services/authServices';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = Number(searchParams.get('userId'));

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate: verifyOtp, isPending } = useVerifyOtpService();
  const { mutate: resendOtp, isPending: isResending } = useResendOtpService();

  // Countdown timer
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpString.length < 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    verifyOtp(
      { userId, otp: otpString },
      {
        onSuccess: (res) => {
          if (res.result?.isVerified) {
            setSuccessMsg('Xác thực thành công! Đang chuyển hướng...');
            setTimeout(() => router.push('/login'), 1500);
          } else {
            setErrorMsg(res.message ?? 'OTP không hợp lệ.');
          }
        },
        onError: (err) => {
          setErrorMsg(
            (err.response?.data as { message?: string })?.message ??
              'OTP không hợp lệ hoặc đã hết hạn.'
          );
        },
      }
    );
  };

  const handleResend = () => {
    resendOtp(
      { userId },
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

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4">
        <p className="text-slate-500">
          Liên kết không hợp lệ.{' '}
          <a href="/register" className="text-indigo-600 hover:underline">Đăng ký lại</a>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Xác minh email</h1>
          <p className="text-sm text-slate-500">
            Chúng tôi đã gửi mã OTP 6 chữ số đến email của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* OTP Boxes */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-3 text-center">
              Nhập mã OTP
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
          </div>

          {errorMsg && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || otpString.length < 6}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang xác minh...
              </span>
            ) : (
              'Xác minh'
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="text-center">
          {secondsLeft > 0 ? (
            <p className="text-sm text-slate-500">
              Gửi lại sau{' '}
              <span className="font-semibold text-indigo-600">{secondsLeft}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-60"
            >
              {isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-slate-500">
          <a href="/login" className="text-indigo-600 hover:underline">
            ← Quay lại đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
