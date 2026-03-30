'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  BookOpen, User, LogOut, ChevronDown, Settings,
  FolderKanban, ShieldCheck, FileText, Layers, Film,
  LayoutDashboard, Users, Package, ShoppingCart, Wallet,
  Library, Store, Menu, X,
} from 'lucide-react';
import { useAuthStore, type AppRole } from '@/store/useAuthStore';
import { useLogoutService } from '@/services/authServices';
import { useQueryClient } from '@tanstack/react-query';

// ── Role nav config ────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const ROLE_NAV: Record<AppRole, NavItem[]> = {
  teacher: [
    { href: '/teacher',               label: 'Tổng quan',  icon: LayoutDashboard },
    { href: '/teacher/projects',      label: 'Dự án',      icon: FolderKanban    },
    { href: '/teacher/slides',        label: 'Slide',      icon: Layers          },
    { href: '/teacher/videos',        label: 'Video',      icon: Film            },
    { href: '/material-shop',         label: 'Cửa hàng',   icon: Store           },
    { href: '/teacher/material-lib',  label: 'Thư viện',   icon: Library         },
  ],
  expert: [
    { href: '/expert',             label: 'Tổng quan',  icon: LayoutDashboard },
    { href: '/profile?tab=certificate', label: 'Chứng chỉ',  icon: ShieldCheck     },
    { href: '/expert/material',    label: 'Tài liệu',      icon: FileText        },
  ],
  admin: [
    { href: '/admin',          label: 'Bảng điều khiển', icon: LayoutDashboard },
    { href: '/admin/users',    label: 'Người dùng',       icon: Users           },
    { href: '/admin/packages', label: 'Gói cước',         icon: Package         },
    { href: '/admin/orders',   label: 'Đơn hàng',         icon: ShoppingCart    },
    { href: '/admin/wallets',  label: 'Ví',               icon: Wallet          },
  ],
  staff: [
    { href: '/staff', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { href: '/staff/verifications', label: 'Duyệt hồ sơ', icon: ShieldCheck },
    { href: '/staff/materials', label: 'Duyệt học liệu', icon: FileText },
  ],
  guest: [],
};

const HOME_ROUTE: Record<AppRole, string> = {
  teacher: '/teacher',
  expert:  '/expert',
  admin:   '/admin',
  staff:   '/staff',
  guest:   '/login',
};

// ── Component ──────────────────────────────────────────────────────────────

export default function AppHeader() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, role, logout } = useAuthStore();
  const logoutService = useLogoutService();
  const queryClient = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile nav on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileNavOpen(false);
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleLogout = () => {
    logoutService.mutate(undefined, {
      onSettled: () => {
        queryClient.clear();
        logout();
        router.push('/login');
      },
    });
  };

  const navItems    = ROLE_NAV[role] ?? [];
  const homeRoute   = HOME_ROUTE[role] ?? '/';
  const displayName = user?.fullName || user?.username || 'Tài khoản';
  const email       = user?.email ?? '';
  const avatarUrl   = user?.avatarUrl;
  const initial     = displayName.charAt(0).toUpperCase();

  /** Active check: exact match for root role page, prefix for sub-pages */
  const isActive = (href: string) => {
    const path = href.split('?')[0]; // strip query string for comparison
    if (path === '/teacher' || path === '/expert' || path === '/admin' || path === '/') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Mobile hamburger ── */}
        {navItems.length > 0 && (
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={mobileNavOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {/* ── Logo ── */}
        <Link
          href={homeRoute}
          className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 hidden sm:block">EduVi</span>
        </Link>

        {/* ── Desktop role nav ── */}
        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 flex-1" aria-label="Điều hướng chính">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ── User menu ── */}
        <div className="relative flex-shrink-0 ml-auto" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Menu tài khoản"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-100"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initial}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-base font-semibold text-gray-900 leading-none">{displayName}</p>
              {email && (
                <p className="text-sm text-gray-400 mt-0.5 leading-none truncate max-w-[140px]">{email}</p>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-xl py-1.5 z-50" role="menu">
              <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
              </div>

              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
              >
                <User className="w-4 h-4 text-gray-400" />
                Hồ sơ cá nhân
              </button>

              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); router.push('/profile?tab=security'); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Đổi mật khẩu
              </button>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={logoutService.isPending}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile nav drawer ── */}
      {mobileNavOpen && navItems.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer */}
          <nav
            className="absolute left-0 right-0 top-16 bg-white border-b border-gray-200 shadow-lg z-40 md:hidden"
            aria-label="Menu di động"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
