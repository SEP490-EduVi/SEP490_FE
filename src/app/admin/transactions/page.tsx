'use client';

import React, { useEffect, useState } from 'react';
import Pagination from '@/components/admin/Pagination';
import { adminServices } from '@/services/adminServices';
import { AdminTransactionResponse } from '@/types/admin';

const PAGE_SIZE = 10;
const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

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

  const loadTransactions = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminServices.listTransactions({
        userId: userId ? Number(userId) : undefined,
        type: transactionType || undefined,
        status: status || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: targetPage,
        pageSize: PAGE_SIZE,
      });

      const result = res.result;
      const rows = result.data ?? result.items ?? [];
      setItems(rows);
      setTotal(result.total ?? result.totalItems ?? rows.length);
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
        <input
          type="text"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          placeholder="Loại giao dịch"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <input
          type="text"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Trạng thái"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
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
                <th className="px-5 py-3 text-left font-medium text-gray-500">Mã giao dịch</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Người dùng</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Loại</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Trạng thái</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Số tiền</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Thời gian</th>
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
                items.map((tx) => (
                  <tr key={tx.transactionId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">#{tx.transactionId}</td>
                    <td className="px-5 py-3 text-gray-700">{tx.fullName || tx.userCode || `Người dùng ${tx.userId}`}</td>
                    <td className="px-5 py-3 text-gray-600">{tx.transactionType}</td>
                    <td className="px-5 py-3 text-gray-600">{tx.status}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatVND(tx.amount)}</td>
                    <td className="px-5 py-3 text-gray-500">{tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '-'}</td>
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
