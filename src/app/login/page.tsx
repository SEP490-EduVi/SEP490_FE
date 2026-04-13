'use client';

// src/app/login/page.tsx

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleLoginService, useLoginService } from '@/services/authServices';
import { LoginInput, LoginResponse } from '@/types/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { ApiResponse } from '@/types/api';
import BrandLogo from '@/components/common/BrandLogo';

type GoogleCredentialResponse = {
  credential?: string;
};

export default function LoginPage() {
  const [form, setForm] = useState<LoginInput>({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const googleInitializedRef = useRef(false);
  const initializedClientIdRef = useRef<string | null>(null);

  const router = useRouter();
  const { mutate: login, isPending } = useLoginService();
  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLoginService();
  const setUser = useAuthStore((s) => s.setUser);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleLoginSuccess = (res: ApiResponse<LoginResponse>) => {
    if (res.code === 200) {
      localStorage.setItem('accessToken', res.result.accessToken);
      setUser(res.result.user);

      const roleName = res.result.user.role?.roleName?.toLowerCase();
      if (roleName === 'admin') {
        router.push('/admin');
      } else if (roleName === 'teacher') {
        router.push('/teacher');
      } else if (roleName === 'expert') {
        router.push('/expert');
      } else if (roleName === 'staff') {
        router.push('/staff');
      } else {
        router.push('/');
      }
      return;
    }

    setErrorMsg('Đăng nhập thất bại.');
  };

  const handleGoogleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      const idToken = response.credential;
      if (!idToken) {
        setErrorMsg('Không nhận được thông tin xác thực từ Google.');
        return;
      }

      setErrorMsg('');
      googleLogin(
        { idToken },
        {
          onSuccess: handleLoginSuccess,
          onError: (_err) => {
            setErrorMsg(
                'Đăng nhập Google thất bại, vui lòng thử lại.'
            );
          },
        }
      );
    },
    [googleLogin]
  );

  const handleGoogleButtonClick = useCallback(() => {
    if (!googleClientId) {
      setErrorMsg('Thiếu cấu hình Google Client ID. Vui lòng kiểm tra biến môi trường.');
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.id) {
      if (!gsiLoaded) {
        setErrorMsg('Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau vài giây.');
      } else {
        setErrorMsg('Không thể tải Google Sign-In. Vui lòng kiểm tra mạng hoặc tắt ad-block.');
      }
      return;
    }

    const isSameClient = initializedClientIdRef.current === googleClientId;
    if (!googleInitializedRef.current || !isSameClient) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      googleInitializedRef.current = true;
      initializedClientIdRef.current = googleClientId;
    }

    setErrorMsg('');
    google.accounts.id.prompt();
  }, [googleClientId, handleGoogleCredential, gsiLoaded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    login(form, {
      onSuccess: handleLoginSuccess,
      onError: (_err) => {
        setErrorMsg(
          // (err.response?.data as { message?: string })?.message ??
            'Sai tên đăng nhập hoặc mật khẩu. Vui lòng thử lại.'
        );
      },
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f7ff] px-4 py-8">
      <motion.div
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#9bbcff]/35 blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#c3d8ff]/35 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 16, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiLoaded(true)}
        onError={() => setErrorMsg('Không tải được Google Sign-In. Vui lòng thử lại sau.')}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-[#d8e4ff] bg-white/90 shadow-[0_24px_80px_-24px_rgba(44,84,160,0.28)] backdrop-blur md:grid-cols-[1.1fr_0.9fr]"
      >
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="hidden bg-[radial-gradient(circle_at_top_right,_#eaf1ff_0,_#f4f8ff_45%,_#e3ecff_100%)] p-10 md:flex md:flex-col md:justify-between"
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e4ff] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2b4f93]">
            <Sparkles className="h-3.5 w-3.5" />
            EduVi 
          </div>
          <div className="space-y-4">
            <h2 className="max-w-md text-4xl font-semibold leading-tight text-[#173b7a]">
              Soạn bài hiện đại với quy trình gọn gàng, dễ kiểm soát.
            </h2>
            <p className="max-w-lg text-sm leading-7 text-[#35588f]">
              Đăng nhập để tiếp tục tạo slide, video và học liệu trên một không gian làm việc thống nhất.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-[#35588f]">
            <div className="rounded-2xl border border-[#d7e4ff] bg-white/80 p-4">
              <p className="text-sm font-semibold text-[#173b7a]">Quy trình rõ ràng</p>
              Soạn, chỉnh sửa và xuất nội dung theo từng bước.
            </div>
            <div className="rounded-2xl border border-[#d7e4ff] bg-white/80 p-4">
              <p className="text-sm font-semibold text-[#173b7a]">Đồng bộ an toàn</p>
              Dữ liệu dự án được lưu và đồng bộ trên hệ thống.
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="p-6 sm:p-10"
        >
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2 text-center md:text-left">
              <BrandLogo className="mx-auto md:mx-0" />
              <h1 className="text-3xl font-bold tracking-tight text-[#173b7a]">Đăng nhập</h1>
              <p className="text-sm text-[#4b6693]">Chào mừng bạn quay lại nền tảng EduVi.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium text-[#274c8f]">
                  Tên đăng nhập
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-[#274c8f]">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-[#2e5fb0] hover:underline"
                    onClick={() => router.push('/forgot-password')}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#d5e3ff] bg-white px-3.5 py-2.5 pr-10 text-sm outline-none transition focus:border-[#2e5fb0] focus:ring-2 focus:ring-[#a8c4ff]/60"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#dbe6ff]" />
              </div>
              <div className="relative flex justify-center text-xs text-[#6b83ac]">
                <span className="bg-white px-2">hoặc</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isGooglePending}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#d5e3ff] bg-white px-4 py-2.5 text-sm font-medium text-[#274c8f] transition hover:bg-[#f3f7ff] focus:outline-none focus:ring-2 focus:ring-[#b8cdf9] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleGoogleButtonClick}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isGooglePending ? 'Đang đăng nhập với Google...' : 'Đăng nhập với Google'}
            </button>

            <p className="text-center text-sm text-[#4b6693]">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-semibold text-[#2e5fb0] hover:underline">
                Đăng ký ngay
              </Link>
            </p>

            <p className="text-center text-sm text-[#4b6693]">
              <Link href="/" className="font-semibold text-[#2e5fb0] hover:underline">
                ← Về trang chủ
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
