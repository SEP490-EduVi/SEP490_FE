'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BarChart3,
  DollarSign,
  BookOpen,
  UserCheck,
  CalendarDays,
  Users,
} from 'lucide-react';
import { adminServices } from '@/services/adminServices';
import type {
  AdminRevenueForecastResponse,
  AdminMaterialSalesItem,
  AdminExpertSalesItem,
  RevenueFilterParams,
} from '@/types/admin';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const EMPTY_FORECAST: AdminRevenueForecastResponse = {
  currentRevenue: 0,
  previousRevenue: 0,
  revenueGrowthRatePercent: 0,
  forecastRevenue: 0,
  averageDailyRevenue: 0,
  currentSoldCount: 0,
  currentUniqueBuyerCount: 0,
};

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { fromDate: fmt(from), toDate: fmt(to) };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const defaults = defaultDateRange();
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [subjectCode, setSubjectCode] = useState('');
  const [gradeCode, setGradeCode] = useState('');

  const [forecast, setForecast] = useState<AdminRevenueForecastResponse>(EMPTY_FORECAST);
  const [materialSales, setMaterialSales] = useState<AdminMaterialSalesItem[]>([]);
  const [expertSales, setExpertSales] = useState<AdminExpertSalesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    // DB stores UTC (Vietnam time - 7h). Sending only a date string is parsed as T00:00:00
    // by the backend, which cuts off same-day purchases. Always send full datetime to cover
    // the entire day in UTC.
    const params: RevenueFilterParams = {
      fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
      toDate: toDate ? `${toDate}T23:59:59` : undefined,
      subjectCode: subjectCode || undefined,
      gradeCode: gradeCode || undefined,
      pageSize: 50,
    };
    try {
      const [forecastRes, materialRes, expertRes] = await Promise.all([
        adminServices.getRevenueForecast(params),
        adminServices.getRevenueByMaterial(params),
        adminServices.getRevenueByExpert(params),
      ]);
      setForecast(forecastRes.result ?? EMPTY_FORECAST);
      setMaterialSales(materialRes.result?.items ?? materialRes.result?.data ?? []);
      setExpertSales(expertRes.result?.items ?? expertRes.result?.data ?? []);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Không thể tải dữ liệu doanh thu.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const growthPositive = forecast.revenueGrowthRatePercent >= 0;

  const kpiCards = [
    {
      label: 'Doanh thu kỳ này',
      value: formatVND(forecast.currentRevenue),
      sub: `Kỳ trước: ${formatVND(forecast.previousRevenue)}`,
      icon: DollarSign,
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Tăng trưởng',
      value: formatPercent(forecast.revenueGrowthRatePercent),
      sub: 'So với kỳ trước',
      icon: growthPositive ? TrendingUp : TrendingDown,
      accent: growthPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
    },
    {
      label: 'Dự báo doanh thu',
      value: formatVND(forecast.forecastRevenue),
      sub: `TB ngày: ${formatVND(forecast.averageDailyRevenue)}`,
      icon: BarChart3,
      accent: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Lượt mua',
      value: forecast.currentSoldCount.toLocaleString('vi-VN'),
      sub: `Kỳ trước: ${(forecast.previousSoldCount ?? 0).toLocaleString('vi-VN')} • ${forecast.currentUniqueBuyerCount.toLocaleString('vi-VN')} người mua`,
      icon: ShoppingCart,
      accent: 'text-violet-600 bg-violet-50',
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-8 py-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan doanh thu</h1>
        <p className="mt-1 text-sm text-gray-500">Thống kê doanh thu tài liệu theo kỳ</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Từ ngày
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Đến ngày
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Môn học</label>
          <input
            type="text"
            placeholder="Mã môn..."
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Khối lớp</label>
          <input
            type="text"
            placeholder="Mã khối..."
            value={gradeCode}
            onChange={(e) => setGradeCode(e.target.value)}
            className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Đang tải...' : 'Áp dụng'}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${card.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">
                {loading ? (
                  <span className="inline-block h-7 w-28 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  card.value
                )}
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-700">{card.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Two data tables */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Revenue by Material */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Doanh thu theo tài liệu</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-5 py-3">Tài liệu</th>
                  <th className="px-4 py-3 text-right">Lượt bán</th>
                  <th className="px-4 py-3 text-right">Người mua</th>
                  <th className="px-4 py-3 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-5 py-3">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-10 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-10 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-24 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : materialSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                      Không có dữ liệu trong khoảng thời gian này
                    </td>
                  </tr>
                ) : (
                  materialSales.map((m) => (
                    <tr key={m.materialCode} className="border-b border-slate-50 transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="line-clamp-1 font-medium text-slate-900">{m.title}</p>
                        {m.expertName && <p className="text-xs text-slate-400">{m.expertName}</p>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {m.soldCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {m.uniqueBuyerCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">
                        {formatVND(m.grossRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue by Expert */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <UserCheck className="h-4 w-4 text-violet-600" />
            <h2 className="font-semibold text-gray-900">Doanh thu theo chuyên gia</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-5 py-3">Chuyên gia</th>
                  <th className="px-4 py-3 text-right">Tài liệu</th>
                  <th className="px-4 py-3 text-right">Lượt bán</th>
                  <th className="px-4 py-3 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-5 py-3">
                        <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-8 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-10 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-24 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : expertSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                      Không có dữ liệu trong khoảng thời gian này
                    </td>
                  </tr>
                ) : (
                  expertSales.map((e) => (
                    <tr key={e.expertCode} className="border-b border-slate-50 transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{e.expertName}</p>
                        <p className="text-xs text-slate-400">{e.expertCode}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {e.soldMaterialCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {e.soldCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-violet-700">
                        {formatVND(e.grossRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom stat row */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
            <div className="rounded-xl bg-sky-50 p-3">
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {forecast.currentUniqueBuyerCount.toLocaleString('vi-VN')}
              </p>
              <p className="text-sm text-slate-500">Người mua trong kỳ</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
            <div className="rounded-xl bg-amber-50 p-3">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {forecast.currentSoldCount.toLocaleString('vi-VN')}
              </p>
              <p className="text-sm text-slate-500">Tổng lượt mua</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
            <div className="rounded-xl bg-teal-50 p-3">
              <BarChart3 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatVND(forecast.averageDailyRevenue)}</p>
              <p className="text-sm text-slate-500">TB doanh thu / ngày</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
