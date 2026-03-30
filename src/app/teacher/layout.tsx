'use client';

import { AuthGuard } from '@/components/auth';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
