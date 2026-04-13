'use client';

// src/app/register/page.tsx

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useRegisterService } from '@/services/authServices';
import { RegisterInput } from '@/types/auth';

type RegisterForm = RegisterInput & { confirmPassword: string };

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const ROLES = [
  { id: 3, label: 'Chuyên gia' },
  { id: 4, label: 'Giáo viên' },
] as const;

const cleanUserError = (message?: string, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') => {
  if (!message) return fallback;
  const sanitized = message
    .replace(/\s*\(?\b\d{3}\b\)?\.?\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized || fallback;
};

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
  const [logoLoadError, setLogoLoadError] = useState(false);

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
            setErrorMsg(cleanUserError(res.message, 'Đăng ký thất bại.'));
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
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#9bbcff]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-8 h-72 w-72 rounded-full bg-[#c3d8ff]/25 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-[#d8e4ff] bg-white/90 shadow-[0_24px_80px_-24px_rgba(44,84,160,0.28)] backdrop-blur md:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden bg-[radial-gradient(circle_at_top_left,_#eaf1ff_0,_#f4f8ff_45%,_#e3ecff_100%)] p-10 md:flex md:flex-col md:justify-between">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e4ff] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2b4f93]">
            <Sparkles className="h-3.5 w-3.5" />
            Tạo tài khoản
          </div>
          <div className="space-y-4">
            <h2 className="max-w-md text-4xl font-semibold leading-tight text-[#173b7a]">
              Bắt đầu xây dựng bài giảng với quy trình mạch lạc.
            </h2>
            <p className="max-w-md text-sm leading-7 text-[#35588f]">
              Một tài khoản để quản lý slide, video và dự án dạy học trên cùng một hệ thống.
            </p>
          </div>
          <div className="space-y-2 text-sm text-[#35588f]">
            <p>• Không gian làm việc theo vai trò Giáo viên và Chuyên gia</p>
            <p>• Hỗ trợ quản lý mẫu nội dung và học liệu</p>
            <p>• Xác thực OTP khi tạo tài khoản</p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto w-full max-w-lg space-y-6">
            <div className="space-y-2 text-center md:text-left">
              {!logoLoadError ? (
                <img
                  src="/image.png"
                  alt="Eduvision"
                  className="mx-auto h-14 w-auto object-contain md:mx-0"
                  onError={() => setLogoLoadError(true)}
                />
              ) : (
                <h1 className="text-3xl font-bold tracking-tight text-[#204b93]">Eduvision</h1>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-[#173b7a]">Tạo tài khoản</h1>
              <p className="text-sm text-[#4b6693]">Hoàn thiện thông tin để bắt đầu sử dụng EduVi.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-[#274c8f]">
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
                    className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="username" className="text-sm font-medium text-[#274c8f]">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Từ 3 ký tự"
                    className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phoneNumber" className="text-sm font-medium text-[#274c8f]">
                    Số điện thoại
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    value={form.phoneNumber ?? ''}
                    onChange={handleChange}
                    placeholder="0912 345 678"
                    className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="email" className="text-sm font-medium text-[#274c8f]">
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
                    className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#274c8f]">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, roleId: r.id }));
                        setErrorMsg('');
                      }}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        form.roleId === r.id
                          ? 'border-[#2e5fb0] bg-[#edf3ff] text-[#1f4f9b]'
                          : 'border-[#d5e3ff] text-[#3f5f94] hover:bg-[#f3f7ff]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-[#274c8f]">
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
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-[#274c8f]">
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
              </div>

              <p className="text-xs text-[#5f78a4]">
                Mật khẩu phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).
              </p>

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
                    Đang đăng ký...
                  </>
                ) : (
                  <>
                    Đăng ký
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#4b6693]">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-semibold text-[#2e5fb0] hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
