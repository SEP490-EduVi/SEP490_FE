'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  BookOpen, User, LogOut, ChevronDown, Settings,
  FolderKanban, ShieldCheck, FileText, Layers, Film,
  LayoutDashboard, Users, Package, ShoppingCart, Wallet,
  Library, Store, Menu, X, CreditCard, Zap, Loader2, Bell,
} from 'lucide-react';
import { useAuthStore, type AppRole } from '@/store/useAuthStore';
import { useLogoutService } from '@/services/authServices';
import { useQueryClient } from '@tanstack/react-query';
import { useUserQuota, useWalletInfo, useWalletTransactions } from '@/hooks/usePaymentApi';

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
    { href: '/teacher/class',       label: 'Lớp học',    icon: BookOpen        },
    { href: '/material-shop',         label: 'Cửa hàng',   icon: Store           },
    { href: '/subscription',          label: 'Gói dịch vụ', icon: CreditCard      },
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
  const isTeacher = role === 'teacher';
  const { data: userQuota, isLoading: quotaLoading } = useUserQuota({ enabled: isTeacher });
  const { data: walletInfo, isLoading: walletLoading } = useWalletInfo({ enabled: isTeacher });
  const { data: txData, isLoading: txLoading } = useWalletTransactions(1, 5, { enabled: isTeacher });

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerAvatarErr, setHeaderAvatarErr] = useState(false);
  const [headerLogoErr, setHeaderLogoErr] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const quotaRef = useRef<HTMLDivElement>(null);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (quotaRef.current && !quotaRef.current.contains(e.target as Node)) {
        setQuotaOpen(false);
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
      setNotifOpen(false);
      setQuotaOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => { setHeaderAvatarErr(false); }, [user?.avatarUrl]);

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
  const latestTransactions = txData?.items?.slice(0, 5) ?? [];
  const notificationCount = latestTransactions.length;

  const quotaSummary = {
    analysisAvailable: userQuota?.availableAnalysisQuota ?? 0,
    analysisTotal: userQuota?.totalAnalysisQuota ?? 0,
    slideAvailable: userQuota?.availableSlideQuota ?? 0,
    slideTotal: userQuota?.totalSlideQuota ?? 0,
    videoAvailable: userQuota?.availableVideoQuota ?? 0,
    videoTotal: userQuota?.totalVideoQuota ?? 0,
  };

  const quotaDetailRows = [
    {
      key: 'ai',
      label: 'AI',
      available: quotaSummary.analysisAvailable,
      total: quotaSummary.analysisTotal,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
    },
    {
      key: 'slide',
      label: 'Slide',
      available: quotaSummary.slideAvailable,
      total: quotaSummary.slideTotal,
      color: 'bg-violet-500',
      textColor: 'text-violet-700',
    },
    {
      key: 'video',
      label: 'Video',
      available: quotaSummary.videoAvailable,
      total: quotaSummary.videoTotal,
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
    },
  ].map((item) => {
    const total = Math.max(0, item.total);
    const available = Math.max(0, item.available);
    const used = Math.max(0, total - available);
    const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return { ...item, total, available, used, percentUsed };
  });

  const formatTxAmount = (amount: number) => {
    const sign = amount > 0 ? '+' : '';
    return `${sign}${amount.toLocaleString('vi-VN')}`;
  };

  const formatBalance = (amount?: number) => {
    const safe = Number.isFinite(amount) ? Number(amount) : 0;
    return `${safe.toLocaleString('vi-VN')} xu`;
  };

  const formatTxTime = (createdAt: string) => {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return createdAt;
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

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
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          {!headerLogoErr ? (
            <img
              src="/image.png"
              alt="Eduvision"
              className="h-10 w-auto object-contain hidden sm:block"
              onError={() => setHeaderLogoErr(true)}
            />
          ) : (
            <>
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:block">Eduvision</span>
            </>
          )}
          {!headerLogoErr && (
            <img
              src="/image.png"
              alt="Eduvision"
              className="h-9 w-auto object-contain sm:hidden"
              onError={() => setHeaderLogoErr(true)}
            />
          )}
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

        {isTeacher && (
          <div className="relative hidden sm:block" ref={quotaRef}>
            <button
              onClick={() => setQuotaOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              aria-label="Xem quota"
              aria-expanded={quotaOpen}
            >
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                {quotaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              </span>
              Xem quota
            </button>

            {quotaOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-900">Chi tiết quota</p>
                  <p className="text-xs text-slate-500">Còn lại / tổng và tỉ lệ đã dùng</p>
                </div>

                {quotaLoading ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải quota...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quotaDetailRows.map((item) => (
                      <div key={item.key} className="rounded-xl border border-slate-100 p-2.5">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className={`font-semibold ${item.textColor}`}>{item.label}</span>
                          <span className="text-slate-600 tabular-nums">
                            {item.available.toLocaleString('vi-VN')}/{item.total.toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.percentUsed}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 tabular-nums">Đã dùng: {item.used.toLocaleString('vi-VN')} ({item.percentUsed}%)</p>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setQuotaOpen(false);
                        router.push('/profile?tab=payment');
                      }}
                      className="w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Mở trang thanh toán
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isTeacher && (
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50/60"
            title="Số dư ví"
          >
            <Wallet className="w-4 h-4 text-emerald-700" />
            {walletLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            ) : (
              <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                Số dư: {formatBalance(walletInfo?.balance)}
              </span>
            )}
          </div>
        )}

        {isTeacher && (
          <div className="relative hidden sm:block" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-11 h-11 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
              aria-label="Thông báo thanh toán"
              aria-expanded={notifOpen}
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Thông báo giao dịch</p>
                  <p className="text-xs text-gray-400">5 giao dịch mới nhất</p>
                </div>

                {txLoading ? (
                  <div className="px-4 py-6 flex items-center justify-center text-sm text-gray-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải thông báo...
                  </div>
                ) : latestTransactions.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500 text-center">Chưa có thông báo mới.</p>
                ) : (
                  <div className="max-h-80 overflow-auto">
                    {latestTransactions.map((tx) => (
                      <button
                        key={tx.transactionId}
                        onClick={() => {
                          setNotifOpen(false);
                          router.push('/profile?tab=payment');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tx.description || tx.transactionType}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatTxTime(tx.createdAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatTxAmount(tx.amount)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{tx.status}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
            {avatarUrl && !headerAvatarErr ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-100"
                onError={() => setHeaderAvatarErr(true)}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initial}
              </div>
            )}
            <p className="hidden sm:block text-base font-semibold text-gray-900 leading-none">{displayName}</p>
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

              {role === 'teacher' && (
                <>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/teacher/slides'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
                  >
                    <Layers className="w-4 h-4 text-violet-400" />
                    Slide của tôi
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/teacher/videos'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
                  >
                    <Film className="w-4 h-4 text-rose-400" />
                    Video của tôi
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/teacher/material-lib'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
                  >
                    <Library className="w-4 h-4 text-emerald-400" />
                    Thư viện
                  </button>
                </>
              )}

              {role === 'staff' && (
                <>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/staff/verifications'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    Duyệt hồ sơ
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/staff/materials'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    Duyệt học liệu
                  </button>
                </>
              )}

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
