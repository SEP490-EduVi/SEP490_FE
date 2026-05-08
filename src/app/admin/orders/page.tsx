'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { adminServices } from '@/services/adminServices';
import { AdminOrderResponse } from '@/types/admin';

const PAGE_SIZE = 10;
const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;
const toStartOfDayIso = (date: string) => (date ? new Date(`${date}T00:00:00`).toISOString() : undefined);
const toEndOfDayIso = (date: string) => (date ? new Date(`${date}T23:59:59`).toISOString() : undefined);

const addVnTz = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return new Date(d.getTime() + 7 * 60 * 60 * 1000);
};
const fmtVnDateTime = (dateStr?: string | null) => {
  const d = addVnTz(dateStr);
  return d ? d.toLocaleString('vi-VN') : '-';
};

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
  const [orderType, setOrderType] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
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
      if (sortKey === 'orderId') { av = a.orderId; bv = b.orderId; }
      else if (sortKey === 'teacherName') { av = a.teacherName ?? ''; bv = b.teacherName ?? ''; }
      else if (sortKey === 'orderType') { av = a.orderType ?? ''; bv = b.orderType ?? ''; }
      else if (sortKey === 'status') { av = Number(a.status ?? 0); bv = Number(b.status ?? 0); }
      else if (sortKey === 'paymentMethod') { av = a.paymentMethod ?? ''; bv = b.paymentMethod ?? ''; }
      else if (sortKey === 'totalAmount') { av = a.totalAmount ?? 0; bv = b.totalAmount ?? 0; }
      else if (sortKey === 'createdAt') { av = a.orderDate ?? ''; bv = b.orderDate ?? ''; }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'vi')
        : String(bv).localeCompare(String(av), 'vi');
    });
  }, [items, sortKey, sortDir]);

  const loadOrders = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminServices.listOrders({
        teacherId: teacherId ? Number(teacherId) : undefined,
        orderType: orderType || undefined,
        status: status ? Number(status) : undefined,
        paymentMethod: paymentMethod || undefined,
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
        <p className="mt-1 text-sm text-gray-500">Bộ lọc: Giáo viên, loại đơn, trạng thái, phương thức thanh toán, khoảng thời gian</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        <input
          type="number"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          placeholder="Mã giáo viên"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tất cả loại đơn</option>
          <option value="PLAN">Mua gói</option>
          <option value="MATERIAL">Mua học liệu</option>
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
                <th onClick={() => toggleSort('orderId')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Mã đơn<SortIcon col="orderId" /></th>
                <th onClick={() => toggleSort('teacherName')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Giáo viên<SortIcon col="teacherName" /></th>
                <th onClick={() => toggleSort('orderType')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Loại đơn<SortIcon col="orderType" /></th>
                <th onClick={() => toggleSort('status')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Trạng thái<SortIcon col="status" /></th>
                <th onClick={() => toggleSort('paymentMethod')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Thanh toán<SortIcon col="paymentMethod" /></th>
                <th onClick={() => toggleSort('totalAmount')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Số tiền<SortIcon col="totalAmount" /></th>
                <th onClick={() => toggleSort('createdAt')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Ngày tạo<SortIcon col="createdAt" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-400">Không có dữ liệu.</td>
                </tr>
              ) : (
                sortedItems.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">#{order.orderId}</td>
                    <td className="px-5 py-3 text-gray-700">{order.teacherName || (order.teacherId ? `GV ${order.teacherId}` : '-')}</td>
                    <td className="px-5 py-3">
                      {order.orderTypeName || order.orderType
                        ? <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.orderType === 'MATERIAL'
                              ? 'bg-violet-50 text-violet-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {order.orderTypeName
                              || (order.orderType === 'PLAN' ? 'Mua gói'
                                : order.orderType === 'MATERIAL' ? 'Mua học liệu'
                                : order.orderType)}
                          </span>
                        : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getOrderStatusClass(order.status, order.statusName)}`}
                      >
                        {getOrderStatusLabel(order.status, order.statusName)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{order.paymentMethod || '-'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatVND(order.totalAmount ?? 0)}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {order.orderDate ? fmtVnDateTime(order.orderDate) : '-'}
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
