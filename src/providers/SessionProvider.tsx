'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse } from '@/types/api';
import type { UserInfo } from '@/types/auth';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { setUser, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    api.get<ApiResponse<UserInfo>>(API_ENDPOINTS.AUTH.ME)
      .then((res) => {
        if (res.data?.result) {
          setUser(res.data.result);
        }
      })
      .catch(() => {
        // 401 is handled by axios interceptor (clears tokens, redirects to /login)
      });
  }, [isHydrated, setUser]);

  return <>{children}</>;
}
