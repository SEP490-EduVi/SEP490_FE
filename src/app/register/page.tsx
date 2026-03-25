'use client';

// src/app/register/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useRegisterService } from '@/services/authServices';
import { RegisterInput } from '@/types/auth';

type RegisterForm = RegisterInput & { confirmPassword: string };

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const ROLES = [
  { id: 3, label: 'Giáo viên' },
  { id: 4, label: 'Chuyên gia' },
] as const;

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    roleId: 3,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
  const { mutate: register, isPending } = useRegisterService();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const validate = (): string => {
    if (!form.username || !form.email || !form.fullName || !form.password || !form.confirmPassword) {
      return 'Vui lòng điền đầy đủ thông tin bắt buộc.';
    }
    if (form.username.length < 3 || form.username.length > 50) {
      return 'Tên đăng nhập phải từ 3 đến 50 ký tự.';
    }
    if (!PASSWORD_PATTERN.test(form.password)) {
      return 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).';
    }
    if (form.password !== form.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    const { confirmPassword: _confirmPassword, ...payload } = form;
    register(
      { ...payload, phoneNumber: payload.phoneNumber || null },
      {
        onSuccess: (res) => {
          if (res.result?.userId) {
            router.push(`/verify-otp?userId=${res.result.userId}`);
          } else {
            setErrorMsg(res.message ?? 'Đăng ký thất bại.');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-indigo-600 tracking-tight">EduVi</h1>
          <p className="text-sm text-slate-500">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label htmlFor="username" className="text-sm font-medium text-slate-700">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Ít nhất 3 ký tự"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Phone (optional) */}
          <div className="space-y-1">
            <label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">
              Số điện thoại{' '}
              <span className="text-slate-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              value={form.phoneNumber ?? ''}
              onChange={handleChange}
              placeholder="0912 345 678"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setForm((prev) => ({ ...prev, roleId: r.id })); setErrorMsg(''); }}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    form.roleId === r.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
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
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
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

          {/* Error */}
          {errorMsg && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          {/* Submit */}
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
                Đang đăng ký...
              </span>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:underline">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
