/**
 * Admin – Order Management
 * ========================
 * View-only table of all orders. Admin can see purchase time, package, user,
 * materials, and click through to order details. NO editing allowed.
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  Eye,
  Clock,
  Package,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  orderCode: string;
  userName: string;
  userEmail: string;
  packageName: string;
  amount: number;           // VND
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  materialCount: number;
  purchasedAt: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  { id: '1', orderCode: 'ORD-20260227-001', userName: 'Nguyen Van A', userEmail: 'a@edu.vn', packageName: 'Premium', amount: 249000, status: 'completed', materialCount: 5, purchasedAt: '2026-02-27T09:15:00' },
  { id: '2', orderCode: 'ORD-20260226-012', userName: 'Tran Thi B', userEmail: 'b@edu.vn', packageName: 'Standard', amount: 99000, status: 'completed', materialCount: 3, purchasedAt: '2026-02-26T14:30:00' },
  { id: '3', orderCode: 'ORD-20260226-011', userName: 'Le Van C', userEmail: 'c@edu.vn', packageName: 'Premium', amount: 249000, status: 'pending', materialCount: 0, purchasedAt: '2026-02-26T12:45:00' },
  { id: '4', orderCode: 'ORD-20260225-008', userName: 'Pham Thi D', userEmail: 'd@edu.vn', packageName: 'Standard', amount: 99000, status: 'completed', materialCount: 2, purchasedAt: '2026-02-25T16:20:00' },
  { id: '5', orderCode: 'ORD-20260225-007', userName: 'Hoang Van E', userEmail: 'e@edu.vn', packageName: 'Premium', amount: 249000, status: 'failed', materialCount: 0, purchasedAt: '2026-02-25T10:00:00' },
  { id: '6', orderCode: 'ORD-20260224-005', userName: 'Vo Thi F', userEmail: 'f@edu.vn', packageName: 'Standard', amount: 99000, status: 'refunded', materialCount: 1, purchasedAt: '2026-02-24T08:10:00' },
  { id: '7', orderCode: 'ORD-20260224-004', userName: 'Dang Van G', userEmail: 'g@edu.vn', packageName: 'Enterprise', amount: 999000, status: 'completed', materialCount: 12, purchasedAt: '2026-02-24T07:55:00' },
  { id: '8', orderCode: 'ORD-20260223-003', userName: 'Bui Thi H', userEmail: 'h@edu.vn', packageName: 'Standard', amount: 99000, status: 'completed', materialCount: 4, purchasedAt: '2026-02-23T19:30:00' },
  { id: '9', orderCode: 'ORD-20260222-002', userName: 'Do Van I', userEmail: 'i@edu.vn', packageName: 'Premium', amount: 249000, status: 'completed', materialCount: 7, purchasedAt: '2026-02-22T11:15:00' },
  { id: '10', orderCode: 'ORD-20260221-001', userName: 'Ngo Thi K', userEmail: 'k@edu.vn', packageName: 'Standard', amount: 99000, status: 'pending', materialCount: 0, purchasedAt: '2026-02-21T13:40:00' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Order['status'], { bg: string; text: string }> = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  failed: { bg: 'bg-red-50', text: 'text-red-600' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type StatusFilter = 'all' | Order['status'];

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    let list = MOCK_ORDERS;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    return list;
  }, [search, statusFilter]);

  const totalRevenue = MOCK_ORDERS.filter((o) => o.status === 'completed').reduce(
    (s, o) => s + o.amount,
    0
  );

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
        <p className="text-sm text-gray-500 mt-1">
          {MOCK_ORDERS.length} đơn hàng &middot; Doanh thu: {formatVND(totalRevenue)}
        </p>
      </div>

      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>
          Đơn hàng <strong>chỉ để xem</strong>. Việc chỉnh sửa bị tắt để đảm bảo công bằng cho tất cả người dùng.
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Hoàn thành', value: MOCK_ORDERS.filter((o) => o.status === 'completed').length, color: 'emerald' },
          { label: 'Chờ xử lý', value: MOCK_ORDERS.filter((o) => o.status === 'pending').length, color: 'amber' },
          { label: 'Thất bại', value: MOCK_ORDERS.filter((o) => o.status === 'failed').length, color: 'red' },
          { label: 'Hoàn tiền', value: MOCK_ORDERS.filter((o) => o.status === 'refunded').length, color: 'gray' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã đơn, tên, email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành</option>
            <option value="pending">Chờ xử lý</option>
            <option value="failed">Thất bại</option>
            <option value="refunded">Hoàn tiền</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left font-medium text-gray-500 px-5 py-3">Đơn hàng</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Người dùng</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Gói</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Số tiền</th>
                <th className="text-center font-medium text-gray-500 px-5 py-3">Tài liệu</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Trạng thái</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Ngày mua</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    Không tìm thấy đơn hàng.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const st = STATUS_STYLES[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      {/* Order code */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-xs font-medium text-gray-700">
                            {order.orderCode}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{order.userName}</p>
                        <p className="text-xs text-gray-400">{order.userEmail}</p>
                      </td>

                      {/* Package */}
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                          <Package className="w-3 h-3" />
                          {order.packageName}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3 text-right font-medium text-gray-900">
                        {formatVND(order.amount)}
                      </td>

                      {/* Material count */}
                      <td className="px-5 py-3 text-center text-gray-500">
                        {order.materialCount}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Purchased time */}
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(order.purchasedAt)}
                        </span>
                      </td>

                      {/* View detail */}
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
