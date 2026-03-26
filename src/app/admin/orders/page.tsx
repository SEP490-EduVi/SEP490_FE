'use client';

import React, { useEffect, useState } from 'react';
import Pagination from '@/components/admin/Pagination';
import { adminServices } from '@/services/adminServices';
import { AdminOrderResponse } from '@/types/admin';

const PAGE_SIZE = 10;
const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

const getOrderStatusLabel = (status?: number | string, statusName?: string | null) => {
  if (typeof status === 'number') {
    if (status === 1) return 'Hoàn tất';
    if (status === 0) return 'Đang xử lý';
    if (status === 2) return 'Đã hủy';
  }

  if (typeof status === 'string') {
    const s = status.toLowerCase();
    if (s === 'completed') return 'Hoàn tất';
    if (s === 'pending') return 'Đang xử lý';
    if (s === 'cancelled' || s === 'canceled') return 'Đã hủy';
  }

  if (statusName) {
    const sn = statusName.toLowerCase();
    if (sn === 'completed') return 'Hoàn tất';
    if (sn === 'pending') return 'Đang xử lý';
    if (sn === 'cancelled' || sn === 'canceled') return 'Đã hủy';
    return statusName;
  }

  return 'Không xác định';
};

const getOrderStatusClass = (status?: number | string, statusName?: string | null) => {
  const label = getOrderStatusLabel(status, statusName);
  if (label === 'Hoàn tất') return 'bg-emerald-50 text-emerald-700';
  if (label === 'Đang xử lý') return 'bg-amber-50 text-amber-700';
  if (label === 'Đã hủy') return 'bg-red-50 text-red-600';
  return 'bg-gray-100 text-gray-500';
};

export default function AdminOrdersPage() {
  const [items, setItems] = useState<AdminOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [teacherId, setTeacherId] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadOrders = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminServices.listOrders({
        teacherId: teacherId ? Number(teacherId) : undefined,
        status: status || undefined,
        paymentMethod: paymentMethod || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
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
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders(1);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="mt-1 text-sm text-gray-500">Bộ lọc: Giáo viên, trạng thái, phương thức thanh toán, khoảng thời gian</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <input
          type="number"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          placeholder="Mã giáo viên"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
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
          type="text"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          placeholder="Phương thức thanh toán"
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
            void loadOrders(1);
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
                <th className="px-5 py-3 text-left font-medium text-gray-500">Mã đơn</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Giáo viên</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Trạng thái</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Thanh toán</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Số tiền</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Ngày tạo</th>
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
                items.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{order.orderCode || `#${order.orderId}`}</td>
                    <td className="px-5 py-3 text-gray-700">{order.teacherName || (order.teacherId ? `GV ${order.teacherId}` : '-')}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getOrderStatusClass(order.status, order.statusName)}`}
                      >
                        {getOrderStatusLabel(order.status, order.statusName)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{order.paymentMethod || '-'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatVND(order.totalAmount ?? order.amount ?? 0)}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {(order.orderDate || order.createdAt)
                        ? new Date(order.orderDate || order.createdAt || '').toLocaleString('vi-VN')
                        : '-'}
                    </td>
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
            void loadOrders(nextPage);
          }}
        />
      </div>
    </div>
  );
}
