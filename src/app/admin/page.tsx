'use client';

import React, { useEffect, useState } from 'react';
import { Coins, ShoppingCart, Target, Users, Wallet } from 'lucide-react';
import { adminServices } from '@/services/adminServices';
import { FinancialOverviewResponse } from '@/types/admin';

const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`;

const EMPTY_OVERVIEW: FinancialOverviewResponse = {
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  totalWallets: 0,
  totalBalance: 0,
  totalTopUpAmount: 0,
  totalTopUpCount: 0,
  subscriptionRevenue: 0,
  subscriptionCount: 0,
  totalOrders: 0,
  completedOrders: 0,
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<FinancialOverviewResponse>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalRevenue = overview.totalSubscriptionRevenue ?? overview.subscriptionRevenue ?? 0;
  const totalOrders = overview.totalOrders ?? 0;
  const successfulOrders = overview.completedOrders ?? 0;
  const conversionRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

  const inactiveUsers = Math.max(0, overview.totalUsers - overview.activeUsers - overview.bannedUsers);
  const activeRate = overview.totalUsers > 0 ? (overview.activeUsers / overview.totalUsers) * 100 : 0;
  const bannedRate = overview.totalUsers > 0 ? (overview.bannedUsers / overview.totalUsers) * 100 : 0;
  const completionRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError('');
      try {
        const overviewRes = await adminServices.getFinancialOverview();
        setOverview(overviewRes.result ?? EMPTY_OVERVIEW);
      } catch (err) {
        setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải tổng quan admin overview.');
      } finally {
        setLoading(false);
      }
    };

    void loadOverview();
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-500">Dashboard doanh thu và đơn hàng theo gói dịch vụ</p>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-600">
            <Coins className="h-5 w-5" />
            <p className="text-sm font-medium">Tổng doanh thu</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : formatVND(totalRevenue)}</p>
          <p className="text-xs text-gray-500">Từ endpoint /financial/overview</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-600">
            <ShoppingCart className="h-5 w-5" />
            <p className="text-sm font-medium">Tổng đơn hàng</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalOrders.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-gray-500">Đơn hoàn tất: {successfulOrders.toLocaleString('vi-VN')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-600">
            <Target className="h-5 w-5" />
            <p className="text-sm font-medium">Đơn thành công</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : successfulOrders.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-gray-500">Hoàn tất thanh toán</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-600">
            <Target className="h-5 w-5" />
            <p className="text-sm font-medium">Tỷ lệ chuyển đổi</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : formatPercent(conversionRate)}</p>
          <p className="text-xs text-gray-500">{successfulOrders}/{totalOrders || 0} đơn hoàn tất</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900">Phân bổ người dùng</h2>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-600">Đang hoạt động</span>
                <span className="font-semibold text-slate-900">{overview.activeUsers.toLocaleString('vi-VN')} ({formatPercent(activeRate)})</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, activeRate))}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-600">Bị khóa</span>
                <span className="font-semibold text-slate-900">{overview.bannedUsers.toLocaleString('vi-VN')} ({formatPercent(bannedRate)})</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-rose-500" style={{ width: `${Math.max(0, Math.min(100, bannedRate))}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-600">Khác</span>
                <span className="font-semibold text-slate-900">{inactiveUsers.toLocaleString('vi-VN')}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-slate-400"
                  style={{
                    width: `${
                      overview.totalUsers > 0
                        ? Math.max(0, Math.min(100, (inactiveUsers / overview.totalUsers) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900">Thông tin ví và nạp tiền</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Wallet className="h-4 w-4" />
                <span>Tổng số ví</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{overview.totalWallets.toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
              <span className="text-slate-600">Tổng số dư ví</span>
              <span className="text-lg font-bold text-slate-900">{formatVND(overview.totalBalance)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
              <span className="text-slate-600">Tổng nạp tiền</span>
              <span className="text-lg font-bold text-slate-900">{formatVND(overview.totalTopUpAmount)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
              <span className="text-slate-600">Số giao dịch nạp</span>
              <span className="text-lg font-bold text-slate-900">{overview.totalTopUpCount.toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900">Tổng quan chỉ số từ API</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <th className="px-2 py-2">Chỉ số</th>
                <th className="px-2 py-2">Giá trị</th>
                <th className="px-2 py-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3 font-medium text-slate-900">Tổng người dùng</td>
                <td className="px-2 py-3 text-slate-700">{overview.totalUsers.toLocaleString('vi-VN')}</td>
                <td className="px-2 py-3 text-slate-500">Bao gồm hoạt động và bị khóa</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3 font-medium text-slate-900">Người dùng hoạt động</td>
                <td className="px-2 py-3 text-slate-700">{overview.activeUsers.toLocaleString('vi-VN')}</td>
                <td className="px-2 py-3 text-slate-500">Có thể đăng nhập và sử dụng</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3 font-medium text-slate-900">Người dùng bị khóa</td>
                <td className="px-2 py-3 text-slate-700">{overview.bannedUsers.toLocaleString('vi-VN')}</td>
                <td className="px-2 py-3 text-slate-500">Đã bị admin khóa</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3 font-medium text-slate-900">Doanh thu subscription</td>
                <td className="px-2 py-3 text-slate-700">{formatVND(totalRevenue)}</td>
                <td className="px-2 py-3 text-slate-500">Tổng doanh thu đăng ký</td>
              </tr>
              <tr>
                <td className="px-2 py-3 font-medium text-slate-900">Số subscription thành công</td>
                <td className="px-2 py-3 text-slate-700">{(overview.totalSubscriptionCount ?? overview.subscriptionCount ?? 0).toLocaleString('vi-VN')}</td>
                <td className="px-2 py-3 text-slate-500">Tổng số đăng kí thành công</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900">Hiệu suất đơn hàng</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Tiến độ hoàn tất đơn hàng</span>
            <span className="font-semibold text-slate-900">{formatPercent(completionRate)}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, completionRate))}%` }} />
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-3">
            <div className="rounded-lg border border-slate-100 px-3 py-3">
              <p className="text-xs text-slate-500">Tổng đơn hàng</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{totalOrders.toLocaleString('vi-VN')}</p>
            </div>
            <div className="rounded-lg border border-slate-100 px-3 py-3">
              <p className="text-xs text-slate-500">Hoàn tất</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{successfulOrders.toLocaleString('vi-VN')}</p>
            </div>
            <div className="rounded-lg border border-slate-100 px-3 py-3">
              <p className="text-xs text-slate-500">Subscription thành công</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{(overview.totalSubscriptionCount ?? overview.subscriptionCount ?? 0).toLocaleString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
