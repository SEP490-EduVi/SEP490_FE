'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { adminServices } from '@/services/adminServices';
import { AdminWalletResponse } from '@/types/admin';

const PAGE_SIZE = 10;
const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

export default function AdminWalletsPage() {
  const [items, setItems] = useState<AdminWalletResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      if (sortKey === 'walletId') { av = a.walletId; bv = b.walletId; }
      else if (sortKey === 'fullName') { av = a.fullName ?? a.username ?? ''; bv = b.fullName ?? b.username ?? ''; }
      else if (sortKey === 'email') { av = a.email ?? ''; bv = b.email ?? ''; }
      else if (sortKey === 'balance') { av = a.balance; bv = b.balance; }
      else if (sortKey === 'lastUpdated') { av = a.lastUpdated ?? a.updatedAt ?? ''; bv = b.lastUpdated ?? b.updatedAt ?? ''; }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'vi')
        : String(bv).localeCompare(String(av), 'vi');
    });
  }, [items, sortKey, sortDir]);

  const loadWallets = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminServices.listWallets({ page: targetPage, pageSize: PAGE_SIZE });
      const result = res.result;
      const rows = result.data ?? result.items ?? [];
      setItems(rows);
      setTotal(result.total ?? result.totalItems ?? result.totalCount ?? rows.length);
      setPage(result.page ?? result.currentPage ?? targetPage);
      setPageSize(result.pageSize ?? result.size ?? PAGE_SIZE);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải danh sách ví.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWallets(1);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý ví</h1>
        <p className="mt-1 text-sm text-gray-500">Danh sách ví hệ thống, mặc định sắp xếp theo số dư giảm dần .</p>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th onClick={() => toggleSort('walletId')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Mã ví<SortIcon col="walletId" /></th>
                <th onClick={() => toggleSort('fullName')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Người dùng<SortIcon col="fullName" /></th>
                <th onClick={() => toggleSort('email')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Email<SortIcon col="email" /></th>
                <th onClick={() => toggleSort('balance')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Số dư<SortIcon col="balance" /></th>
                <th onClick={() => toggleSort('lastUpdated')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Cập nhật<SortIcon col="lastUpdated" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400">Không có dữ liệu.</td>
                </tr>
              ) : (
                sortedItems.map((wallet) => (
                  <tr key={wallet.walletId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">#{wallet.walletId}</td>
                    <td className="px-5 py-3 text-gray-700">{wallet.fullName || wallet.username || wallet.userCode || `Người dùng ${wallet.userId}`}</td>
                    <td className="px-5 py-3 text-gray-500">{wallet.email || '-'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatVND(wallet.balance)}</td>
                    <td className="px-5 py-3 text-gray-500">{(wallet.lastUpdated || wallet.updatedAt) ? new Date(new Date(wallet.lastUpdated || wallet.updatedAt || '').getTime() + 7 * 60 * 60 * 1000).toLocaleString('vi-VN') : '-'}</td>
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
            void loadWallets(nextPage);
          }}
        />
      </div>
    </div>
  );
}
