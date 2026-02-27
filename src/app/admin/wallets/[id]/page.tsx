/**
 * Admin – Wallet Transaction History (View Only)
 * ================================================
 * Shows the deposit / withdrawal history of a specific user.
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  ChevronDown,
  Filter,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  method: string;
  description: string;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

interface WalletUser {
  id: string;
  userName: string;
  userEmail: string;
  balance: number;
  transactions: Transaction[];
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_WALLET_USERS: Record<string, WalletUser> = {
  '1': {
    id: '1',
    userName: 'Nguyen Van A',
    userEmail: 'a@edu.vn',
    balance: 1_250_000,
    transactions: [
      { id: 't1', type: 'deposit', amount: 500_000, method: 'Momo', description: 'Top-up via Momo', status: 'success', createdAt: '2026-02-27T10:30:00' },
      { id: 't2', type: 'withdraw', amount: 249_000, method: 'Package Purchase', description: 'Purchased Premium package', status: 'success', createdAt: '2026-02-27T09:15:00' },
      { id: 't3', type: 'deposit', amount: 1_000_000, method: 'VNPay', description: 'Top-up via VNPay', status: 'success', createdAt: '2026-02-25T14:20:00' },
      { id: 't4', type: 'withdraw', amount: 99_000, method: 'Package Purchase', description: 'Purchased Standard package', status: 'success', createdAt: '2026-02-24T16:30:00' },
      { id: 't5', type: 'deposit', amount: 500_000, method: 'Bank Transfer', description: 'Top-up via bank transfer', status: 'success', createdAt: '2026-02-20T08:00:00' },
      { id: 't6', type: 'withdraw', amount: 249_000, method: 'Package Purchase', description: 'Purchased Premium package', status: 'success', createdAt: '2026-02-18T11:45:00' },
      { id: 't7', type: 'deposit', amount: 500_000, method: 'Momo', description: 'Top-up via Momo', status: 'success', createdAt: '2026-02-15T09:30:00' },
      { id: 't8', type: 'withdraw', amount: 653_000, method: 'Withdrawal', description: 'Withdraw to bank', status: 'pending', createdAt: '2026-02-14T17:00:00' },
    ],
  },
  '3': {
    id: '3',
    userName: 'Le Van C',
    userEmail: 'c@edu.vn',
    balance: 3_100_000,
    transactions: [
      { id: 't9', type: 'deposit', amount: 2_000_000, method: 'VNPay', description: 'Top-up via VNPay', status: 'success', createdAt: '2026-02-26T09:10:00' },
      { id: 't10', type: 'withdraw', amount: 249_000, method: 'Package Purchase', description: 'Purchased Premium package', status: 'success', createdAt: '2026-02-25T10:20:00' },
      { id: 't11', type: 'deposit', amount: 3_000_000, method: 'Bank Transfer', description: 'Top-up via bank', status: 'success', createdAt: '2026-02-20T14:00:00' },
      { id: 't12', type: 'withdraw', amount: 1_651_000, method: 'Withdrawal', description: 'Withdraw to bank', status: 'failed', createdAt: '2026-02-18T16:30:00' },
    ],
  },
};

function getWalletUser(id: string): WalletUser | null {
  return MOCK_WALLET_USERS[id] ?? null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TX_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  failed: { bg: 'bg-red-50', text: 'text-red-600' },
};

type TypeFilter = 'all' | 'deposit' | 'withdraw';

// ── Component ──────────────────────────────────────────────────────────────

export default function WalletHistoryPage() {
  const params = useParams();
  const userId = params.id as string;
  const walletUser = getWalletUser(userId);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredTx = useMemo(() => {
    if (!walletUser) return [];
    if (typeFilter === 'all') return walletUser.transactions;
    return walletUser.transactions.filter((t) => t.type === typeFilter);
  }, [walletUser, typeFilter]);

  if (!walletUser) {
    return (
      <div className="px-8 py-6 max-w-4xl mx-auto">
        <Link
          href="/admin/wallets"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại ví
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wallet className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy ví</h2>
          <p className="text-sm text-gray-500">
            Không có dữ liệu ví cho người dùng mã &quot;{userId}&quot;.
          </p>
        </div>
      </div>
    );
  }

  const totalDeposit = walletUser.transactions
    .filter((t) => t.type === 'deposit' && t.status === 'success')
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdraw = walletUser.transactions
    .filter((t) => t.type === 'withdraw' && t.status === 'success')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="px-8 py-6 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/admin/wallets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại ví
      </Link>

      {/* User header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
          {walletUser.userName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{walletUser.userName}</h1>
          <p className="text-sm text-gray-500">{walletUser.userEmail}</p>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Wallet className="w-3.5 h-3.5" />
            Số dư hiện tại
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatVND(walletUser.balance)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs text-emerald-600 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Tổng đã nạp
          </div>
          <p className="text-2xl font-bold text-emerald-700">{formatVND(totalDeposit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs text-red-500 mb-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Tổng đã rút
          </div>
          <p className="text-2xl font-bold text-red-600">{formatVND(totalWithdraw)}</p>
        </div>
      </div>

      {/* Filter + heading */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Lịch sử giao dịch ({filteredTx.length})
        </h2>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả loại</option>
            <option value="deposit">Nạp tiền</option>
            <option value="withdraw">Rút tiền</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredTx.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            Không tìm thấy giao dịch nào.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredTx.map((tx) => {
              const isDeposit = tx.type === 'deposit';
              const st = TX_STATUS_STYLES[tx.status];
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDeposit ? 'bg-emerald-50' : 'bg-red-50'
                    }`}
                  >
                    {isDeposit ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(tx.createdAt)}
                      <span className="mx-1">·</span>
                      {tx.method}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        isDeposit ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {isDeposit ? '+' : '-'}{formatVND(tx.amount)}
                    </p>
                    <span
                      className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${st.bg} ${st.text}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
