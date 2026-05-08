'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { adminServices } from '@/services/adminServices';
import { AdminTransactionResponse } from '@/types/admin';

const PAGE_SIZE = 10;
const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;
const toStartOfDayIso = (date: string) => (date ? new Date(`${date}T00:00:00`).toISOString() : undefined);
const toEndOfDayIso = (date: string) => (date ? new Date(`${date}T23:59:59`).toISOString() : undefined);

const getTxStatusLabel = (status?: number | string, statusName?: string | null) => {
  if (typeof status === 'number') {
    if (status === 1) return 'Hoàn tất';
    if (status === 0) return 'Đang xử lý';
    if (status === 2) return 'Đã hủy';
  }

  if (typeof status === 'string' && status.trim()) {
    const s = status.trim().toLowerCase();
    if (s === 'completed' || s === 'success' || s === 'succeeded') return 'Hoàn tất';
    if (s === 'pending' || s === 'processing' || s === 'inprogress') return 'Đang xử lý';
    if (s === 'cancel' || s === 'cancelled' || s === 'canceled') return 'Đã hủy';
    return status;
  }

  return statusName || 'Không xác định';
};

const getTxStatusClass = (status?: number | string, statusName?: string | null) => {
  const label = getTxStatusLabel(status, statusName);
  if (label === 'Hoàn tất') return 'bg-emerald-50 text-emerald-700';
  if (label === 'Đang xử lý') return 'bg-amber-50 text-amber-700';
  if (label === 'Đã hủy') return 'bg-red-50 text-red-600';
  return 'bg-gray-100 text-gray-500';
};

const TX_TYPE_VI: Record<string, string> = {
  // transactionTypeCode values (actual from API)
  TOP_UP: 'Nạp EduCoin',
  WITHDRAWAL: 'Rút tiền',
  BUY_SUBSCRIPTION: 'Mua gói cước',
  BUY_MATERIAL: 'Mua học liệu',
  CLAIM_FREE_MATERIAL: 'Nhận học liệu miễn phí',
  MATERIAL_REVENUE: 'Doanh thu học liệu chuyên gia',
  MATERIAL_PLATFORM_FEE: 'Phí nền tảng học liệu',
  // lowercase fallback
  deposit: 'Nạp tiền',
  withdrawal: 'Rút tiền',
  withdraw: 'Rút tiền',
  payment: 'Thanh toán',
  purchase: 'Mua hàng',
  refund: 'Hoàn tiền',
  commission: 'Hoa hồng',
  bonus: 'Thưởng',
  transfer: 'Chuyển tiền',
  topup: 'Nạp tiền',
  'top-up': 'Nạp tiền',
  lock: 'Khóa tiền',
  unlock: 'Mở khóa',
};

const toTxTypeVi = (code?: string | null, type?: string | null) => {
  if (code) {
    const mapped = TX_TYPE_VI[code.trim()] ?? TX_TYPE_VI[code.trim().toLowerCase()];
    if (mapped) return mapped;
  }
  if (!type) return '-';
  const key = type.trim().toLowerCase();
  return TX_TYPE_VI[key] ?? type;
};

export default function AdminTransactionsPage() {
  const [items, setItems] = useState<AdminTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userId, setUserId] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ChevronsUpDown className="inline ml-1 h-3 w-3 text-gray-400" />;
    return sortDir === 'asc'
      ? <ChevronUp className="inline ml-1 h-3 w-3 text-blue-500" />
      : <ChevronDown className="inline ml-1 h-3 w-3 text-blue-500" />;
  };

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'transactionId') { av = a.transactionId; bv = b.transactionId; }
      else if (sortKey === 'fullName') { av = a.fullName ?? a.username ?? ''; bv = b.fullName ?? b.username ?? ''; }
      else if (sortKey === 'transactionType') { av = a.transactionType ?? ''; bv = b.transactionType ?? ''; }
      else if (sortKey === 'status') { av = Number(a.status ?? 0); bv = Number(b.status ?? 0); }
      else if (sortKey === 'amount') { av = a.amount ?? 0; bv = b.amount ?? 0; }
      else if (sortKey === 'createdAt') { av = a.createdAt ?? ''; bv = b.createdAt ?? ''; }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'vi')
        : String(bv).localeCompare(String(av), 'vi');
    });
  }, [items, sortKey, sortDir]);

  const loadTransactions = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminServices.listTransactions({
        userId: userId ? Number(userId) : undefined,
        type: transactionType || undefined,
        status: status ? Number(status) : undefined,
        fromDate: toStartOfDayIso(fromDate),
        toDate: toEndOfDayIso(toDate),
        page: targetPage,
        pageSize: PAGE_SIZE,
      });

      const result = res.result;
      const rows = result.data ?? result.items ?? [];
      setItems(rows);
      setTotal(result.total ?? result.totalItems ?? result.totalCount ?? rows.length);
      setPage(result.page ?? result.currentPage ?? targetPage);
      setPageSize(result.pageSize ?? result.size ?? PAGE_SIZE);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải danh sách giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions(1);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý giao dịch</h1>
        <p className="mt-1 text-sm text-gray-500">Bộ lọc: người dùng, loại giao dịch, trạng thái, khoảng thời gian</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <input
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Mã người dùng"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tất cả loại giao dịch</option>
          <option value="TOP_UP">Nạp EduCoin</option>
          <option value="WITHDRAWAL">Rút tiền</option>
          <option value="BUY_SUBSCRIPTION">Mua gói cước</option>
          <option value="BUY_MATERIAL">Mua học liệu</option>
          <option value="CLAIM_FREE_MATERIAL">Nhận học liệu miễn phí</option>
          <option value="MATERIAL_REVENUE">Doanh thu học liệu chuyên gia</option>
          <option value="MATERIAL_PLATFORM_FEE">Phí nền tảng học liệu</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Hoàn tất</option>
          <option value="0">Đang xử lý</option>
          <option value="2">Đã hủy</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => {
            setPage(1);
            void loadTransactions(1);
          }}
        >
          Lọc
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th onClick={() => toggleSort('transactionId')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Mã giao dịch<SortIcon col="transactionId" /></th>
                <th onClick={() => toggleSort('fullName')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Người dùng<SortIcon col="fullName" /></th>
                <th onClick={() => toggleSort('transactionType')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Loại<SortIcon col="transactionType" /></th>
                <th onClick={() => toggleSort('status')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Trạng thái<SortIcon col="status" /></th>
                <th onClick={() => toggleSort('amount')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Số tiền<SortIcon col="amount" /></th>
                <th onClick={() => toggleSort('createdAt')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Thời gian<SortIcon col="createdAt" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-400">Không có dữ liệu.</td>
                </tr>
              ) : (
                sortedItems.map((tx) => (
                  <tr key={tx.transactionId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">#{tx.transactionId}</td>
                    <td className="px-5 py-3 text-gray-700">{tx.fullName || tx.username || tx.userCode || (tx.userId ? `Người dùng ${tx.userId}` : '-')}</td>
                    <td className="px-5 py-3 text-gray-600">{toTxTypeVi(tx.transactionTypeCode, tx.transactionType)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTxStatusClass(tx.status, tx.statusName)}`}>
                        {getTxStatusLabel(tx.status, tx.statusName)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatVND(tx.amount ?? 0)}</td>
                    <td className="px-5 py-3 text-gray-500">{tx.createdAt ? new Date(new Date(tx.createdAt).getTime() + 7 * 60 * 60 * 1000).toLocaleString('vi-VN') : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={(nextPage) => {
            setPage(nextPage);
            void loadTransactions(nextPage);
          }}
        />
      </div>
    </div>
  );
}
