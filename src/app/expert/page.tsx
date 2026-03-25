/**
 * Expert Dashboard
 * ================
 * Trang mặc định khi expert đăng nhập.
 * Hiển thị tổng quan: chứng chỉ, tài liệu và các hành động nhanh.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Upload,
  ArrowRight,
  Home,
  DollarSign,
  Package,
  Star,
} from 'lucide-react';

import { useVerifications, useMyMaterials } from '@/hooks/useExpertApi';
import { useAuthStore } from '@/store/useAuthStore';
import type { VerificationDto, MaterialDto } from '@/types/api';
import { AppHeader } from '@/components';

// ── Status helpers ─────────────────────────────────────────────────────────

const VERIFICATION_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  approved: { label: 'Đã duyệt',  color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  rejected: { label: 'Từ chối',   color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
};

const APPROVAL_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700' },
  1: { label: 'Đã duyệt',  color: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Từ chối',   color: 'bg-red-50 text-red-700' },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ExpertDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: verifications = [], isLoading: verificationsLoading } = useVerifications();
  const { data: materials = [], isLoading: materialsLoading } = useMyMaterials();

  const displayName =
    (user && 'fullName' in user && user.fullName) ||
    (user && 'email' in user && user.email) ||
    'Chuyên gia';

  // Derived stats
  const approvedVerifications = verifications.filter((v) => v.status === 'Approved').length;
  const pendingVerifications = verifications.filter((v) => v.status === 'Pending').length;
  const approvedMaterials = materials.filter((m) => m.approvalStatus === 1).length;
  const totalRevenue = materials.reduce((sum, m) => sum + (m.price > 0 ? m.price : 0), 0);

  const recentVerifications = verifications.slice(0, 3);
  const recentMaterials = materials.slice(0, 4);

  const stats = [
    {
      label: 'Chứng chỉ',
      value: verifications.length,
      sub: `${approvedVerifications} đã duyệt`,
      icon: ShieldCheck,
      color: 'text-indigo-600 bg-indigo-50',
      href: '/expert/certificate',
    },
    {
      label: 'Tài liệu',
      value: materials.length,
      sub: `${approvedMaterials} đã duyệt`,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50',
      href: '/expert/material',
    },
    {
      label: 'Chờ xét duyệt',
      value: pendingVerifications + materials.filter((m) => m.approvalStatus === 0).length,
      sub: 'chứng chỉ & tài liệu',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
      href: '/expert/certificate',
    },
    {
      label: 'Tổng giá niêm yết',
      value: totalRevenue > 0 ? `${(totalRevenue / 1000).toFixed(0)}K ₫` : '—',
      sub: `${materials.filter((m) => m.price > 0).length} tài liệu có phí`,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50',
      href: '/expert/material',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Welcome Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20"
        >
          <div className="relative z-10">
            <p className="text-blue-100 text-sm mb-1">Chào mừng trở lại</p>
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-blue-200 text-sm mt-1">
              Quản lý chứng chỉ và tài liệu của bạn tại đây.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Link
                href="/expert/certificate"
                className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Nộp chứng chỉ
              </Link>
              <Link
                href="/expert/material"
                className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                Tải lên tài liệu
              </Link>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -right-4 -bottom-10 w-56 h-56 bg-white/5 rounded-full" />
        </motion.div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  href={stat.href}
                  className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(verificationsLoading || materialsLoading) && typeof stat.value === 'number' ? '—' : stat.value}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── Two-column section ── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Verifications */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Chứng chỉ gần đây</h3>
              </div>
              <Link
                href="/expert/certificate"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {verificationsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentVerifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Chưa có chứng chỉ nào</p>
                <Link href="/expert/certificate" className="mt-3 text-xs text-blue-600 hover:underline">
                  Nộp chứng chỉ đầu tiên →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentVerifications.map((v: VerificationDto) => {
                  const cfg = VERIFICATION_STATUS[v.status] ?? VERIFICATION_STATUS['Pending'];
                  const StatusIcon = cfg.icon;
                  return (
                    <li key={v.verificationCode} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate capitalize">{v.fileType}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(v.uploadedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Recent Materials */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Tài liệu gần đây</h3>
              </div>
              <Link
                href="/expert/material"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {materialsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BookOpen className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Chưa có tài liệu nào</p>
                <Link href="/expert/material" className="mt-3 text-xs text-blue-600 hover:underline">
                  Tải lên tài liệu đầu tiên →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentMaterials.map((m: MaterialDto) => {
                  const status = APPROVAL_STATUS_MAP[m.approvalStatus] ?? APPROVAL_STATUS_MAP[0];
                  return (
                    <li key={m.materialCode} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {m.previewUrl ? (
                          <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                        <p className="text-xs text-gray-400">
                          {m.subjectName || '—'} · {m.price > 0 ? `${m.price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Hành động nhanh</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/expert/certificate"
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Nộp chứng chỉ</p>
                <p className="text-xs text-gray-500">Xác minh tài khoản chuyên gia của bạn</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </Link>

            <Link
              href="/expert/material"
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Tải lên tài liệu</p>
                <p className="text-xs text-gray-500">Chia sẻ tài liệu chất lượng cao</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
