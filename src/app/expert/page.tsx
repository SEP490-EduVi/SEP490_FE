/**
 * Expert Dashboard
 * ================
 * Trang mặc định khi expert đăng nhập.
 * Hiển thị tổng quan: chứng chỉ, tài liệu và các hành động nhanh.
 */

'use client';

import React, { useState } from 'react';
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
  DollarSign,
  Package,
  Sparkles,
  Rocket,
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

import { useVerifications, useMyMaterials, useExpertSalesOverview, useExpertMaterialSales } from '@/hooks/useExpertApi';
import type { ExpertSalesFilterParams } from '@/types/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { VerificationDto, MaterialDto, ExpertMaterialSalesItem } from '@/types/api';
import { AppHeader } from '@/components';
import { GcsImage } from '@/components/common';

// ── Status helpers ─────────────────────────────────────────────────────────

const VERIFICATION_STATUS: Record<number, { label: string; color: string; icon: React.ElementType }> = {
  0: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  1: { label: 'Đã duyệt',  color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  2: { label: 'Từ chối',   color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
};

function normalizeVerificationStatus(status: number | string | null | undefined): 0 | 1 | 2 {
  if (typeof status === 'number') {
    if (status === 1) return 1;
    if (status === 2) return 2;
    return 0;
  }
  const value = (status ?? '').toString().trim().toLowerCase();
  if (value === 'approved' || value === '1') return 1;
  if (value === 'rejected' || value === '2') return 2;
  return 0;
}

const APPROVAL_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700' },
  1: { label: 'Đã duyệt',  color: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Từ chối',   color: 'bg-red-50 text-red-700' },
  3: { label: 'Bị cấm',    color: 'bg-gray-100 text-gray-600' },
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

// ── Helpers ────────────────────────────────────────────────────────────────

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const formatVNDShort = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
};

const RevenueTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-emerald-600 font-medium">{formatVND(payload[0].value)}</p>
    </div>
  );
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ExpertDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: verifications = [], isLoading: verificationsLoading } = useVerifications();
  const { data: materials = [], isLoading: materialsLoading } = useMyMaterials();

  // Sales filters – default to last 30 days so the material table shows data on first render
  const defaultSalesTo = () => new Date().toISOString().split('T')[0];
  const defaultSalesFrom = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };
  const [salesFrom, setSalesFrom] = useState(defaultSalesFrom);
  const [salesTo, setSalesTo] = useState(defaultSalesTo);
  const salesParams: ExpertSalesFilterParams = {
    // DB stores UTC (Vietnam time - 7h). Append time components so the backend
    // includes the full UTC day, not just from midnight.
    ...(salesFrom ? { fromDate: `${salesFrom}T00:00:00` } : {}),
    ...(salesTo ? { toDate: `${salesTo}T23:59:59` } : {}),
    pageSize: 20,
  };
  const { data: salesOverview, isLoading: overviewLoading } = useExpertSalesOverview(salesParams);
  const { data: materialSalesPage, isLoading: matSalesLoading } = useExpertMaterialSales(salesParams);
  // API returns direct array in result
  const materialSales: ExpertMaterialSalesItem[] = materialSalesPage ?? [];

  const displayName =
    (user && 'fullName' in user && user.fullName) ||
    (user && 'email' in user && user.email) ||
    'Chuyên gia';
  const formattedName = (displayName as string).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Derived stats
  const approvedVerifications = verifications.filter((v) => normalizeVerificationStatus(v.status) === 1).length;
  const pendingVerifications = verifications.filter((v) => normalizeVerificationStatus(v.status) === 0).length;
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
      border: 'border-indigo-100',
      href: '/expert/certificate',
    },
    {
      label: 'Tài liệu',
      value: materials.length,
      sub: `${approvedMaterials} đã duyệt`,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50',
      border: 'border-blue-100',
      href: '/expert/material',
    },
    {
      label: 'Chờ xét duyệt',
      value: pendingVerifications + materials.filter((m) => m.approvalStatus === 0).length,
      sub: 'chứng chỉ & tài liệu',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
      border: 'border-amber-100',
      href: '/expert/certificate',
    },
    {
      label: 'Tổng giá niêm yết',
      value: totalRevenue > 0 ? `${totalRevenue.toLocaleString('vi-VN')} ₫` : '—',
      sub: `${materials.filter((m) => m.price > 0).length} tài liệu có phí`,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50',
      border: 'border-emerald-100',
      href: '/expert/material',
    },
  ];

  // Chart data
  const revenueCompareData = [
    { name: 'Kỳ trước', value: salesOverview?.previousRevenue ?? 0 },
    { name: 'Kỳ này',   value: salesOverview?.currentRevenue ?? 0 },
    { name: 'Dự báo',   value: salesOverview?.forecastRevenue ?? 0 },
  ];

  const materialBarData = materialSales.slice(0, 6).map((m) => ({
    name: m.title.length > 14 ? `${m.title.slice(0, 14)}…` : m.title,
    revenue: m.grossRevenue,
  }));

  // Mini area-chart data for sold count trend (current vs previous)
  const soldTrendData = [
    { name: 'Kỳ trước', sold: salesOverview?.previousSoldCount ?? 0 },
    { name: 'Kỳ này',   sold: salesOverview?.currentSoldCount ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#dbeafe_0%,#f8fafc_45%,#eef2ff_100%)]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl p-7 sm:p-8 text-white shadow-xl shadow-blue-900/25 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.24),transparent_45%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-50 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Expert Control Center
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">Xin chào {formattedName}</h2>
            <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-2xl">
              Theo dõi trạng thái duyệt hồ sơ, quản lý học liệu và tối ưu chất lượng nội dung của bạn.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <Link
                href="/expert/certificate"
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-semibold transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Nộp chứng chỉ
              </Link>
              <Link
                href="/expert/material"
                className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/25 rounded-xl text-sm font-medium transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                Tải lên tài liệu
              </Link>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -right-6 -bottom-12 w-60 h-60 bg-white/10 rounded-full" />
        </motion.div>

        {/* Stat Cards */}
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
                  className={`block rounded-2xl border ${stat.border} bg-white/90 backdrop-blur p-5 hover:shadow-lg hover:shadow-blue-100 transition-all group`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(verificationsLoading || materialsLoading) && typeof stat.value === 'number' ? '—' : stat.value}
                  </p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Two-column section: recent certs + materials */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent verifications */}
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Chứng chỉ gần đây</h3>
              </div>
              <Link href="/expert/certificate" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
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
                <Link href="/expert/certificate" className="mt-3 text-xs text-blue-600 hover:underline">Nộp chứng chỉ đầu tiên →</Link>
              </div>
            ) : (
              <ul className="divide-y divide-blue-50">
                {recentVerifications.map((v: VerificationDto) => {
                  const cfg = VERIFICATION_STATUS[normalizeVerificationStatus(v.status)] ?? VERIFICATION_STATUS[0];
                  const StatusIcon = cfg.icon;
                  return (
                    <li key={v.verificationCode} className="flex items-center gap-3 px-5 py-3.5 hover:bg-blue-50/50 transition-colors">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate capitalize">{v.fileType}</p>
                        <p className="text-xs text-gray-400">{new Date(v.uploadedAt).toLocaleDateString('vi-VN')}</p>
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

          {/* Recent materials */}
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Tài liệu gần đây</h3>
              </div>
              <Link href="/expert/material" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
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
                <Link href="/expert/material" className="mt-3 text-xs text-blue-600 hover:underline">Tải lên tài liệu đầu tiên →</Link>
              </div>
            ) : (
              <ul className="divide-y divide-blue-50">
                {recentMaterials.map((m: MaterialDto) => {
                  const status = APPROVAL_STATUS_MAP[m.approvalStatus] ?? APPROVAL_STATUS_MAP[0];
                  return (
                    <li key={m.materialCode} className="flex items-center gap-3 px-5 py-3.5 hover:bg-blue-50/50 transition-colors">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {m.previewUrl ? (
                          <GcsImage src={m.previewUrl} alt="" className="w-full h-full object-cover" />
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

        {/* Sales Overview */}
        <div className="space-y-5">
          {/* Section header + date filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">Doanh thu &amp; Bán hàng</h3>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={salesFrom}
                onChange={(e) => setSalesFrom(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-xs text-gray-400">—</span>
              <input
                type="date"
                value={salesTo}
                onChange={(e) => setSalesTo(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Doanh thu hiện tại',
                value: overviewLoading ? '...' : formatVND(salesOverview?.currentRevenue ?? 0),
                sub: overviewLoading ? '' : `Kỳ trước: ${formatVND(salesOverview?.previousRevenue ?? 0)}`,
                icon: DollarSign,
                color: 'text-emerald-600 bg-emerald-50',
                border: 'border-emerald-100',
              },
              {
                label: 'Tăng trưởng',
                value: overviewLoading
                  ? '...'
                  : `${(salesOverview?.revenueGrowthRatePercent ?? 0) >= 0 ? '+' : ''}${(salesOverview?.revenueGrowthRatePercent ?? 0).toFixed(1)}%`,
                sub: 'So với kỳ trước',
                icon: (salesOverview?.revenueGrowthRatePercent ?? 0) >= 0 ? TrendingUp : TrendingDown,
                color: (salesOverview?.revenueGrowthRatePercent ?? 0) >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50',
                border: (salesOverview?.revenueGrowthRatePercent ?? 0) >= 0 ? 'border-emerald-100' : 'border-red-100',
              },
              {
                label: 'Dự báo doanh thu',
                value: overviewLoading ? '...' : formatVND(salesOverview?.forecastRevenue ?? 0),
                sub: overviewLoading ? '' : `TB/ngày: ${formatVND(salesOverview?.averageDailyRevenue ?? 0)}`,
                icon: BarChart3,
                color: 'text-blue-600 bg-blue-50',
                border: 'border-blue-100',
              },
              {
                label: 'Lượt bán',
                value: overviewLoading ? '...' : (salesOverview?.currentSoldCount ?? 0).toLocaleString('vi-VN'),
                sub: overviewLoading ? '' : `Kỳ trước: ${(salesOverview?.previousSoldCount ?? 0).toLocaleString('vi-VN')}`,
                icon: ShoppingCart,
                color: 'text-indigo-600 bg-indigo-50',
                border: 'border-indigo-100',
              },
              {
                label: 'Người mua',
                value: overviewLoading ? '...' : (salesOverview?.currentUniqueBuyerCount ?? 0).toLocaleString('vi-VN'),
                sub: overviewLoading ? '' : `Kỳ trước: ${(salesOverview?.previousUniqueBuyerCount ?? 0).toLocaleString('vi-VN')}`,
                icon: Users,
                color: 'text-violet-600 bg-violet-50',
                border: 'border-violet-100',
              },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className={`rounded-2xl border ${kpi.border} bg-white/90 backdrop-blur p-5 shadow-sm`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-700 font-semibold mt-0.5">{kpi.label}</p>
                  {kpi.sub && <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>}
                </div>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue comparison bar chart */}
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">So sánh doanh thu</h3>
              </div>
              {overviewLoading ? (
                <div className="h-44 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={revenueCompareData} barSize={44}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatVNDShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#8b5cf6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Material revenue horizontal bar */}
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Doanh thu theo tài liệu</h3>
              </div>
              {matSalesLoading ? (
                <div className="h-44 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : materialBarData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={materialBarData} layout="vertical" barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tickFormatter={formatVNDShort} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                      {materialBarData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sold count area trend + detail table */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Trend mini chart */}
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-indigo-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Xu hướng lượt bán</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">Kỳ trước so với kỳ này</p>
              {overviewLoading ? (
                <div className="h-28 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={110}>
                  <AreaChart data={soldTrendData}>
                    <defs>
                      <linearGradient id="soldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sold" stroke="#6366f1" strokeWidth={2} fill="url(#soldGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Detail table */}
            <div className="lg:col-span-2 bg-white/90 backdrop-blur rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-blue-50">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Chi tiết doanh thu</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 bg-slate-50/50">
                      <th className="px-5 py-3">Tài liệu</th>
                      <th className="px-4 py-3 text-right">Lượt bán</th>
                      <th className="px-4 py-3 text-right">Người mua</th>
                      <th className="px-4 py-3 text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matSalesLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i} className="border-b border-slate-50">
                            {[...Array(4)].map((__, j) => (
                              <td key={j} className="px-5 py-3">
                                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : materialSales.length === 0
                      ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                              Chưa có dữ liệu bán hàng cho khoảng thời gian này.
                            </td>
                          </tr>
                        )
                      : materialSales.map((item, i) => (
                          <tr key={item.materialCode} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="font-medium text-slate-800 line-clamp-1">{item.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{item.soldCount.toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{item.uniqueBuyerCount.toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatVND(item.grossRevenue)}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Quick action links */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { href: '/expert/certificate', title: 'Nộp chứng chỉ mới', desc: 'Bổ sung hồ sơ xác minh để tăng độ tin cậy.', icon: BadgeCheck, style: 'from-indigo-500 to-blue-600' },
            { href: '/expert/material',    title: 'Đăng tài liệu mới',  desc: 'Chia sẻ nội dung chất lượng cho cộng đồng giáo viên.', icon: Rocket, style: 'from-blue-500 to-cyan-500' },
          ].map((ql) => {
            const Icon = ql.icon;
            return (
              <Link
                key={ql.href}
                href={ql.href}
                className={`flex items-center gap-4 rounded-2xl p-5 bg-gradient-to-r ${ql.style} text-white hover:opacity-90 transition-opacity shadow-md`}
              >
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{ql.title}</p>
                  <p className="text-sm text-white/80 mt-0.5">{ql.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto opacity-70" />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

