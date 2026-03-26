'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Wallet, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { adminServices } from '@/services/adminServices';
import { FinancialOverviewResponse } from '@/types/admin';

const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

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

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<FinancialOverviewResponse>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const subscriptionRevenue = overview.totalSubscriptionRevenue ?? overview.subscriptionRevenue ?? 0;
  const subscriptionCount = overview.totalSubscriptionCount ?? overview.subscriptionCount ?? 0;

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminServices.getFinancialOverview();
        setOverview(res.result ?? EMPTY_OVERVIEW);
      } catch (err) {
        setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Khong the tai tong quan tai chinh.');
      } finally {
        setLoading(false);
      }
    };

    void loadOverview();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Tong quan so lieu he thong theo API /api/Admin/financial/overview</p>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-blue-600">
            <Users className="h-5 w-5" />
            <p className="text-sm font-medium">Nguoi dung</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : overview.totalUsers.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-gray-500">Active: {overview.activeUsers} - Banned: {overview.bannedUsers}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-600">
            <Wallet className="h-5 w-5" />
            <p className="text-sm font-medium">Vi va so du</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : formatVND(overview.totalBalance)}</p>
          <p className="text-xs text-gray-500">Tong vi: {overview.totalWallets.toLocaleString('vi-VN')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-violet-600">
            <ArrowUpRight className="h-5 w-5" />
            <p className="text-sm font-medium">Top-up</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : formatVND(overview.totalTopUpAmount)}</p>
          <p className="text-xs text-gray-500">So giao dich: {overview.totalTopUpCount.toLocaleString('vi-VN')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-600">
            <ShoppingCart className="h-5 w-5" />
            <p className="text-sm font-medium">Don hang</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : overview.totalOrders.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-gray-500">Completed: {overview.completedOrders.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Subscription Revenue</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{loading ? '...' : formatVND(subscriptionRevenue)}</p>
          <p className="text-xs text-gray-500">So dang ky: {subscriptionCount.toLocaleString('vi-VN')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm text-gray-500">Quick Links</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Users</Link>
            <Link href="/admin/wallets" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Wallets</Link>
            <Link href="/admin/orders" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Orders</Link>
            <Link href="/admin/transactions" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Transactions</Link>
            <Link href="/admin/packages" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Plans</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
