'use client';

import Link from 'next/link';
import AppHeader from '@/components/sidebar/AppHeader';

export default function StaffDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý hàng chờ kiểm duyệt hồ sơ và học liệu.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Link
            href="/staff/verifications"
            className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow"
          >
            <h2 className="text-base font-semibold text-gray-900">Duyệt hồ sơ xác minh Expert</h2>
            <p className="text-sm text-gray-500 mt-1">Xem danh sách hồ sơ chờ duyệt và phê duyệt/từ chối.</p>
          </Link>

          <Link
            href="/staff/materials"
            className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow"
          >
            <h2 className="text-base font-semibold text-gray-900">Duyệt học liệu</h2>
            <p className="text-sm text-gray-500 mt-1">Kiểm tra nội dung material và quyết định duyệt hoặc từ chối.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
