'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

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

  const handleGoDashboard = () => {
    if (role === 'admin') router.push('/admin');
    else if (role === 'teacher') router.push('/teacher');
    else if (role === 'expert') router.push('/expert');
    else router.push('/');
  };

  const handleLogout = () => {
    queryClient.clear();
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <BrandLogo href="/" compact className="shrink-0" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Trang của tôi
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                >
                  Đăng ký miễn phí
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Đăng nhập
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-gray-100" />
            {isHydrated && user ? (
              <>
                <button
                  onClick={() => { setMobileOpen(false); handleGoDashboard(); }}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-blue-50"
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
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-blue-50">
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
