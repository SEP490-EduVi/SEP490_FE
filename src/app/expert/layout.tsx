/**
 * Expert Layout
 * =============
 * Shared layout cho tất cả trang /expert/*.
 * Bọc AuthGuard để đảm bảo chỉ role "expert" mới truy cập được.
 */

'use client';

import { AuthGuard } from '@/components/auth';

export default function ExpertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
