'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

const getRoleHomeRoute = (role: string) => {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  if (role === 'expert') return '/expert';
  if (role === 'staff') return '/staff';
  return '/';
};

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/subscription', label: 'Bảng giá' },
  { href: '/about', label: 'Về chúng tôi' },
  { href: '/policy', label: 'Chính sách' },
];

export default function PublicHeader() {
  const router = useRouter();
  const { user, role, isHydrated, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoHref = isHydrated && user ? getRoleHomeRoute(role) : '/';

  const handleGoDashboard = () => {
    router.push(getRoleHomeRoute(role));
  };

  const handleLogout = () => {
    queryClient.clear();
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#d5e3ff] bg-white/92 backdrop-blur-md shadow-[0_16px_40px_-30px_rgba(44,84,160,0.45)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <BrandLogo href={logoHref} compact className="shrink-0" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-[#3f5f95] hover:text-[#1f4f9c] rounded-lg hover:bg-[#edf3ff] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {isHydrated && user ? (
              <>
                <button
                  onClick={handleGoDashboard}
                  className="px-4 py-2 text-sm font-medium text-[#355688] hover:text-[#1f4f9c] rounded-lg hover:bg-[#edf3ff] transition-colors"
                >
                  Trang của tôi
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-[#607aa6] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#2f62b4] to-[#4b79c8] rounded-lg hover:from-[#2a58a3] hover:to-[#426bb1] transition-all shadow-sm"
                >
                  Đăng ký miễn phí
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#355688] hover:text-[#1f4f9c] rounded-lg hover:bg-[#edf3ff] transition-colors"
                >
                  Đăng nhập
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#5a77a3] hover:text-[#1f4f9c]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#d5e3ff] shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-[#355688] hover:text-[#1f4f9c] rounded-lg hover:bg-[#edf3ff]"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-[#dbe7ff]" />
            {isHydrated && user ? (
              <>
                <button
                  onClick={() => { setMobileOpen(false); handleGoDashboard(); }}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#355688] hover:text-[#1f4f9c] rounded-lg hover:bg-[#edf3ff]"
                >
                  Trang của tôi
                </button>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  Đăng ký miễn phí
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-[#355688] hover:text-[#1f4f9c] rounded-lg hover:bg-[#edf3ff]">
                  Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
