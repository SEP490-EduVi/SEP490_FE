/**
 * AuthGuard
 * =========
 * 
 * Client component bọc các trang cần phân quyền.
 * - Hydrate auth store từ localStorage khi lần đầu render
 * - Kiểm tra role của user có được phép truy cập pathname hiện tại không
 * - Nếu không → redirect về /login (guest) hoặc trang phù hợp với role
 * 
 * Usage:
 *   <AuthGuard>{children}</AuthGuard>
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, type AppRole } from '@/store/useAuthStore';

/** Khi user không có quyền, redirect về đâu tùy role */
function getFallbackRoute(role: AppRole): string {
  switch (role) {
    case 'admin':   return '/admin';
    case 'teacher': return '/teacher';
    case 'staff':   return '/staff';
    case 'expert':  return '/expert';
    case 'guest':
    default:        return '/login';
  }
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, isHydrated, hydrate, hasAccess } = useAuthStore();

  // Hydrate auth state từ localStorage (chỉ lần đầu)
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Check quyền sau khi đã hydrate
  useEffect(() => {
    if (!isHydrated) return;

    if (!hasAccess(pathname)) {
      const fallback = getFallbackRoute(role);
      // Tránh redirect loop
      if (fallback !== pathname) {
        router.replace(fallback);
      }
    }
  }, [isHydrated, pathname, role, hasAccess, router]);

  // Đang hydrate → show loading
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Không có quyền → show loading (đang redirect)
  if (!hasAccess(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
