'use client';

import React, { useEffect, useState } from 'react';
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

  const loadWallets = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminServices.listWallets({ page: targetPage, pageSize: PAGE_SIZE });
      const result = res.result;
      const rows = result.data ?? result.items ?? [];
      setItems(rows);
      setTotal(result.total ?? result.totalItems ?? rows.length);
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
                <th className="px-5 py-3 text-left font-medium text-gray-500">Mã ví</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Người dùng</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Số dư</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Cập nhật</th>
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
                items.map((wallet) => (
                  <tr key={wallet.walletId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">#{wallet.walletId}</td>
                    <td className="px-5 py-3 text-gray-700">{wallet.fullName || wallet.userCode || `Người dùng ${wallet.userId}`}</td>
                    <td className="px-5 py-3 text-gray-500">{wallet.email || '-'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatVND(wallet.balance)}</td>
                    <td className="px-5 py-3 text-gray-500">{wallet.updatedAt ? new Date(wallet.updatedAt).toLocaleString('vi-VN') : '-'}</td>
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
