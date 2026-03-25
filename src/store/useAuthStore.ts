/**
 * Auth Store
 * ==========
 * 
 * Zustand store quản lý thông tin người dùng đăng nhập và phân quyền.
 * 
 * Roles:
 *   - guest:   Chưa đăng nhập (mặc định)
 *   - admin:   Chỉ truy cập được các trang /admin/*
 *   - teacher: Truy cập được /projects, /editor
 *   - staff:   (Chuẩn bị cho tương lai)
 *   - expert:  (Chuẩn bị cho tương lai)
 */

import { create } from 'zustand';
import type { AuthUser, UserInfo } from '@/types/auth';

// ─── Role definitions ──────────────────────────────────────────────────────
export type AppRole = 'guest' | 'admin' | 'teacher' | 'staff' | 'expert';

/** Map backend roleName (case-insensitive) → AppRole */
function resolveRole(roleName?: string | null): AppRole {
  if (!roleName) return 'guest';
  const lower = roleName.toLowerCase();
  if (lower === 'admin') return 'admin';
  if (lower === 'teacher') return 'teacher';
  if (lower === 'staff') return 'staff';
  if (lower === 'expert') return 'expert';
  return 'guest';
}

// ─── Route permission config ───────────────────────────────────────────────
/**
 * Định nghĩa role nào được phép truy cập nhóm route nào.
 * Mở rộng thêm tại đây khi có role mới.
 */
const ROUTE_PERMISSIONS: Record<string, AppRole[]> = {
  '/admin':          ['admin'],
  '/teacher':        ['teacher'],
  '/expert':         ['expert'],
  // '/manage':     ['staff'],
};

// ─── Store interface ───────────────────────────────────────────────────────
interface AuthState {
  user: AuthUser | UserInfo | null;
  role: AppRole;
  isHydrated: boolean;          // đã đọc xong từ localStorage chưa

  // Actions
  setUser: (user: AuthUser | UserInfo) => void;
  logout: () => void;
  hydrate: () => void;          // khôi phục user từ localStorage khi app load
  hasAccess: (pathname: string) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  role: 'guest',
  isHydrated: false,

  setUser: (user) => {
    const role = resolveRole(user.role?.roleName);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, role, isHydrated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, role: 'guest' });
  },

  hydrate: () => {
    if (get().isHydrated) return;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (raw) {
        const user = JSON.parse(raw) as AuthUser;
        const role = resolveRole(user.role?.roleName);
        set({ user, role, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      localStorage.removeItem('user');
      set({ isHydrated: true });
    }
  },

  hasAccess: (pathname: string) => {
    const { role } = get();

    // Tìm rule khớp nhất (prefix match)
    const matchedPrefix = Object.keys(ROUTE_PERMISSIONS)
      .filter((prefix) => pathname.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0]; // chọn prefix dài nhất

    // Nếu không có rule → public route, ai cũng vào được
    if (!matchedPrefix) return true;

    return ROUTE_PERMISSIONS[matchedPrefix].includes(role);
  },
}));
