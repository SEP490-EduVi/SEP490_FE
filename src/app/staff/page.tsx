'use client';

import Link from 'next/link';
import { ShieldCheck, FileText, ArrowRight, ClipboardList } from 'lucide-react';
import AppHeader from '@/components/sidebar/AppHeader';
import { usePendingVerifications, usePendingMaterials } from '@/hooks/useStaffApi';

export default function StaffDashboardPage() {
  const { data: verifications = [] } = usePendingVerifications();
  const { data: materials = [] } = usePendingMaterials();

  const cards = [
    {
      href: '/staff/verifications',
      icon: ShieldCheck,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      borderColor: 'hover:border-violet-200',
      badge: verifications.length,
      badgeColor: 'bg-violet-600',
      title: 'Duyệt hồ sơ xác minh Expert',
      desc: 'Xem danh sách hồ sơ chờ duyệt và phê duyệt / từ chối.',
    },
    {
      href: '/staff/materials',
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'hover:border-blue-200',
      badge: materials.length,
      badgeColor: 'bg-blue-600',
      title: 'Duyệt học liệu',
      desc: 'Kiểm tra nội dung material và quyết định duyệt hoặc từ chối.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
            <p className="text-sm text-gray-500">Quản lý hàng chờ kiểm duyệt hồ sơ và học liệu.</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{verifications.length}</p>
              <p className="text-xs text-gray-500">Hồ sơ chờ duyệt</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
              <p className="text-xs text-gray-500">Học liệu chờ duyệt</p>
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200 ${card.borderColor}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  {card.badge > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold text-white ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">{card.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                  Xem danh sách <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
