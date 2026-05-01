'use client';

import Link from 'next/link';
import { ShieldCheck, FileText, ArrowRight, ClipboardList, Clock, CheckCircle2 } from 'lucide-react';
import AppHeader from '@/components/sidebar/AppHeader';
import { usePendingVerifications, usePendingMaterials } from '@/hooks/useStaffApi';
import { useAuthStore } from '@/store/useAuthStore';

export default function StaffDashboardPage() {
  const { data: verifications = [] } = usePendingVerifications();
  const { data: materials = [] } = usePendingMaterials();
  const user = useAuthStore((s) => s.user);

  const rawName =
    (user as { fullName?: string; email?: string } | null)?.fullName ||
    (user as { fullName?: string; email?: string } | null)?.email ||
    'Staff';
  const shortName = rawName.split(' ').at(-1) ?? 'Staff';
  const total = verifications.length + materials.length;

  const cards = [
    {
      href: '/staff/verifications',
      icon: ShieldCheck,
      badge: verifications.length,
      title: 'Duyệt hồ sơ xác minh Expert',
      desc: 'Xem danh sách hồ sơ chờ duyệt và phê duyệt / từ chối.',
      colors: {
        iconBg: 'bg-violet-50',
        iconColor: 'text-violet-600',
        badge: 'bg-violet-600',
        cardBorder: 'border-violet-100',
        cardHover: 'hover:border-violet-300 hover:shadow-violet-100',
        arrow: 'text-violet-600',
        statBorder: 'border-violet-100',
        dot: 'bg-violet-500',
      },
    },
    {
      href: '/staff/materials',
      icon: FileText,
      badge: materials.length,
      title: 'Duyệt học liệu',
      desc: 'Kiểm tra nội dung material và quyết định duyệt hoặc từ chối.',
      colors: {
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        badge: 'bg-blue-600',
        cardBorder: 'border-blue-100',
        cardHover: 'hover:border-blue-300 hover:shadow-blue-100',
        arrow: 'text-blue-600',
        statBorder: 'border-blue-100',
        dot: 'bg-blue-500',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-600 to-purple-700 p-7 text-white shadow-xl shadow-indigo-900/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(255,255,255,0.18),transparent_50%)]" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold">Xin chào, {shortName}</h1>
            <p className="text-indigo-100 text-sm mt-1.5 max-w-md">
              {total > 0
                ? `Có ${total} mục đang chờ bạn xử lý.`
                : 'Hiện không có mục nào chờ xử lý — tốt lắm!'}
            </p>
            {total > 0 && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-white/70">
                <Clock className="w-3.5 h-3.5" />
                Xử lý sớm để không để Expert chờ lâu
              </div>
            )}
            {total === 0 && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tất cả đã được xử lý
              </div>
            )}
          </div>
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -right-6 -bottom-12 w-60 h-60 bg-white/10 rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const c = card.colors;
            return (
              <div key={card.href} className={`bg-white rounded-2xl border ${c.statBorder} p-5 flex items-center gap-4 shadow-sm`}>
                <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${c.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-3xl font-extrabold text-gray-900 tabular-nums">{card.badge}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{card.title}</p>
                </div>
                {card.badge > 0 && (
                  <span className={`w-2.5 h-2.5 rounded-full ${c.dot} animate-pulse flex-shrink-0`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            const c = card.colors;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group relative bg-white rounded-2xl border ${c.cardBorder} ${c.cardHover} p-6 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${c.iconColor}`} />
                  </div>
                  {card.badge > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-full text-xs font-bold text-white ${c.badge}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-1.5">{card.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                <div className={`flex items-center gap-1 mt-5 text-xs font-semibold ${c.arrow} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Đi tới danh sách <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
