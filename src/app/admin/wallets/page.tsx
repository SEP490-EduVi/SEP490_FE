/**
 * Admin – Wallet Management
 * =========================
 * View wallet balances for all users. Click a user to see their
 * deposit / withdrawal transaction history.
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  TrendingUp,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface UserWallet {
  id: string;
  userName: string;
  userEmail: string;
  balance: number;       // VND
  totalDeposit: number;
  totalWithdraw: number;
  lastActivity: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_WALLETS: UserWallet[] = [
  { id: '1', userName: 'Nguyen Van A', userEmail: 'a@edu.vn', balance: 1_250_000, totalDeposit: 2_500_000, totalWithdraw: 1_250_000, lastActivity: '2026-02-27T10:30:00' },
  { id: '2', userName: 'Tran Thi B', userEmail: 'b@edu.vn', balance: 450_000, totalDeposit: 800_000, totalWithdraw: 350_000, lastActivity: '2026-02-26T15:45:00' },
  { id: '3', userName: 'Le Van C', userEmail: 'c@edu.vn', balance: 3_100_000, totalDeposit: 5_000_000, totalWithdraw: 1_900_000, lastActivity: '2026-02-26T09:10:00' },
  { id: '4', userName: 'Pham Thi D', userEmail: 'd@edu.vn', balance: 0, totalDeposit: 200_000, totalWithdraw: 200_000, lastActivity: '2026-02-20T12:00:00' },
  { id: '5', userName: 'Hoang Van E', userEmail: 'e@edu.vn', balance: 780_000, totalDeposit: 1_000_000, totalWithdraw: 220_000, lastActivity: '2026-02-25T18:20:00' },
  { id: '6', userName: 'Vo Thi F', userEmail: 'f@edu.vn', balance: 50_000, totalDeposit: 100_000, totalWithdraw: 50_000, lastActivity: '2026-02-15T08:00:00' },
  { id: '7', userName: 'Dang Van G', userEmail: 'g@edu.vn', balance: 2_400_000, totalDeposit: 3_500_000, totalWithdraw: 1_100_000, lastActivity: '2026-02-27T07:55:00' },
  { id: '8', userName: 'Bui Thi H', userEmail: 'h@edu.vn', balance: 160_000, totalDeposit: 500_000, totalWithdraw: 340_000, lastActivity: '2026-02-24T20:10:00' },
  { id: '9', userName: 'Do Van I', userEmail: 'i@edu.vn', balance: 920_000, totalDeposit: 1_200_000, totalWithdraw: 280_000, lastActivity: '2026-02-22T14:30:00' },
  { id: '10', userName: 'Ngo Thi K', userEmail: 'k@edu.vn', balance: 5_000_000, totalDeposit: 7_000_000, totalWithdraw: 2_000_000, lastActivity: '2026-02-27T11:05:00' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminWalletsPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return MOCK_WALLETS;
    const q = search.toLowerCase();
    return MOCK_WALLETS.filter(
      (w) =>
        w.userName.toLowerCase().includes(q) ||
        w.userEmail.toLowerCase().includes(q)
    );
  }, [search]);

  const totalBalance = MOCK_WALLETS.reduce((s, w) => s + w.balance, 0);
  const totalDeposits = MOCK_WALLETS.reduce((s, w) => s + w.totalDeposit, 0);
  const totalWithdraws = MOCK_WALLETS.reduce((s, w) => s + w.totalWithdraw, 0);

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ví</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem số dư ví và lịch sử giao dịch của người dùng
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng số dư</p>
              <p className="text-xl font-bold text-gray-900">{formatVND(totalBalance)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng nạp</p>
              <p className="text-xl font-bold text-gray-900">{formatVND(totalDeposits)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50">
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng rút</p>
              <p className="text-xl font-bold text-gray-900">{formatVND(totalWithdraws)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left font-medium text-gray-500 px-5 py-3">Người dùng</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Số dư</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Tổng nạp</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Tổng rút</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Hoạt động gần nhất</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Không tìm thấy ví nào.
                  </td>
                </tr>
              ) : (
                filtered.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-gray-50 transition-colors">
                    {/* User */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                          {wallet.userName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{wallet.userName}</p>
                          <p className="text-xs text-gray-400">{wallet.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${wallet.balance > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {formatVND(wallet.balance)}
                      </span>
                    </td>

                    {/* Total deposit */}
                    <td className="px-5 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-emerald-600">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {formatVND(wallet.totalDeposit)}
                      </span>
                    </td>

                    {/* Total withdraw */}
                    <td className="px-5 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-red-500">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        {formatVND(wallet.totalWithdraw)}
                      </span>
                    </td>

                    {/* Last activity */}
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(wallet.lastActivity)}
                    </td>

                    {/* View history */}
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/wallets/${wallet.id}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lịch sử
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
