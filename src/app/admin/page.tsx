/**
 * Admin Dashboard
 * ===============
 * Overview stats, recent activity, and quick actions.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  ShoppingCart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MoreHorizontal,
} from 'lucide-react';

// ── Mock data ──────────────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Tổng người dùng',
    value: '1,248',
    change: '+12%',
    up: true,
    icon: Users,
    color: 'blue',
  },
  {
    label: 'Gói đang hoạt động',
    value: '3',
    change: '+1',
    up: true,
    icon: Package,
    color: 'purple',
  },
  {
    label: 'Đơn hàng (tháng này)',
    value: '284',
    change: '+23%',
    up: true,
    icon: ShoppingCart,
    color: 'amber',
  },
  {
    label: 'Số dư ví',
    value: '14.1M ₫',
    change: '+8%',
    up: true,
    icon: Wallet,
    color: 'emerald',
  },
] as const;

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const RECENT_ACTIVITY = [
  { id: 1, user: 'Nguyễn Văn A', action: 'đã mua gói', target: 'Premium', time: '2 phút trước' },
  { id: 2, user: 'Trần Thị B', action: 'đã nạp tiền', target: '500.000 ₫', time: '15 phút trước' },
  { id: 3, user: 'Lê Văn C', action: 'đã mua gói', target: 'Standard', time: '32 phút trước' },
  { id: 4, user: 'Phạm Thị D', action: 'đã rút tiền', target: '200.000 ₫', time: '1 giờ trước' },
  { id: 5, user: 'Hoàng Văn E', action: 'đã đăng ký', target: '', time: '2 giờ trước' },
  { id: 6, user: 'Võ Thị F', action: 'đã mua gói', target: 'Standard', time: '3 giờ trước' },
];

const TOP_USERS = [
  { name: 'Nguyen Van A', email: 'a@edu.vn', orders: 8, balance: 1_250_000 },
  { name: 'Tran Thi B', email: 'b@edu.vn', orders: 6, balance: 450_000 },
  { name: 'Le Van C', email: 'c@edu.vn', orders: 5, balance: 3_100_000 },
  { name: 'Pham Thi D', email: 'd@edu.vn', orders: 4, balance: 0 },
  { name: 'Hoang Van E', email: 'e@edu.vn', orders: 3, balance: 780_000 },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  return (
    <div className="px-8 py-6 max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tổng quan hoạt động nền tảng EduVi
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const colors = COLOR_MAP[stat.color];
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    stat.up ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {stat.up ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Two‑column section ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Hoạt động gần đây</h2>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {RECENT_ACTIVITY.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar placeholder */}
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  {item.user
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    <span className="font-medium">{item.user}</span>{' '}
                    {item.action}
                    {item.target && (
                      <span className="font-medium"> &quot;{item.target}&quot;</span>
                    )}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Người dùng hàng đầu</h2>
            <Link
              href="/admin/users"
              className="text-xs text-blue-600 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {TOP_USERS.map((user) => (
              <li
                key={user.email}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                  {user.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.orders} đơn hàng
                  </p>
                  <p className="text-xs text-gray-400">{user.balance.toLocaleString('vi-VN')} ₫</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
