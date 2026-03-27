'use client';

import { AuthGuard } from '@/components/auth';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
