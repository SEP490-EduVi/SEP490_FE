/**
 * Teacher Layout
 * ==============
 * Shared layout cho tất cả trang /teacher/*.
 * Bọc AuthGuard để đảm bảo chỉ role "teacher" mới truy cập được.
 * Các trang con (projects list, project detail, editor) tự quản lý UI của mình.
 */

'use client';

import { AuthGuard } from '@/components/auth';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
