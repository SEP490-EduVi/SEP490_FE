'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { adminServices } from '@/services/adminServices';
import { notify, MSGS } from '@/components/common';
import type { AdminWithdrawalResponse } from '@/types/admin';

const PAGE_SIZE = 10;

const formatVND = (value?: number | null) => `${Number(value ?? 0).toLocaleString('vi-VN')} đ`;

// Status (theo guide): 1=CONFIRMED (chờ xử lý), 2=SUCCESS (đã duyệt), 3=REJECTED (từ chối)
const mapWithdrawalStatus = (status?: number | string, statusName?: string | null) => {
  if (typeof status === 'number') {
    if (status === 1) return 'CONFIRMED';
    if (status === 2) return 'SUCCESS';
    if (status === 3) return 'REJECTED';
  }

  if (typeof status === 'string' && status.trim()) {
    return status.toUpperCase();
  }

  return (statusName ?? 'UNKNOWN').toUpperCase();
};

const statusClassName = (status: string) => {
  if (status === 'CONFIRMED') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  if (status === 'SUCCESS')   return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  if (status === 'REJECTED')  return 'bg-red-50 text-red-700 ring-1 ring-red-200';
  return 'bg-gray-100 text-gray-500';
};

const statusLabel = (status: string) => {
  if (status === 'CONFIRMED') return 'Chờ xử lý';
  if (status === 'SUCCESS')   return 'Thành công';
  if (status === 'REJECTED')  return 'Từ chối';
  return status;
};

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<AdminWithdrawalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AdminWithdrawalResponse | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');

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
      if (sortKey === 'withdrawalId') { av = a.withdrawalId; bv = b.withdrawalId; }
      else if (sortKey === 'accountHolderName') { av = a.accountHolderName ?? ''; bv = b.accountHolderName ?? ''; }
      else if (sortKey === 'amount') { av = a.amount; bv = b.amount; }
      else if (sortKey === 'bankName') { av = a.bankName ?? ''; bv = b.bankName ?? ''; }
      else if (sortKey === 'status') { av = Number(a.status ?? 0); bv = Number(b.status ?? 0); }
      else if (sortKey === 'createdAt') { av = a.createdAt ?? ''; bv = b.createdAt ?? ''; }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'vi')
        : String(bv).localeCompare(String(av), 'vi');
    });
  }, [items, sortKey, sortDir]);

  const normalizedStatus = useMemo(() => {
    if (status === 'CONFIRMED') return 1;
    if (status === 'SUCCESS')   return 2;
    if (status === 'REJECTED')  return 3;
    return undefined;
  }, [status]);

  const loadWithdrawals = async (targetPage = page) => {
    setLoading(true);
    setError('');

    try {
      const res = await adminServices.listWithdrawals({
        status: normalizedStatus,
        page: targetPage,
        pageSize: PAGE_SIZE,
      });

      const result = res.result;
      const rows = result.items ?? [];

      setItems(rows);
      setTotal(result.totalCount ?? rows.length);
      setPage(result.page ?? targetPage);
      setPageSize(result.pageSize ?? PAGE_SIZE);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải danh sách rút tiền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWithdrawals(1);
  }, [status]);

  const handleProcess = async () => {
    if (!selected) return;

    if (decision === 'reject' && !adminNote.trim()) {
      setError(MSGS.withdrawal.noteRequired);
      notify.error(MSGS.withdrawal.noteRequired);
      return;
    }

    setProcessingId(selected.withdrawalId);
    setError('');

    try {
      await adminServices.processWithdrawal(
        selected.withdrawalId,
        decision === 'approve',
        adminNote.trim() || undefined,
      );

      setSelected(null);
      setAdminNote('');
      setDecision('approve');
      notify.success(decision === 'approve' ? MSGS.withdrawal.approveSuccess : MSGS.withdrawal.rejectSuccess);
      await loadWithdrawals(page);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? MSGS.withdrawal.processError;
      setError(msg);
      notify.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý rút tiền</h1>
        <p className="mt-1 text-sm text-gray-500">Duyệt hoặc từ chối yêu cầu rút tiền từ chuyên gia.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="CONFIRMED">Chờ xử lý (CONFIRMED)</option>
          <option value="SUCCESS">Thành công (SUCCESS)</option>
          <option value="REJECTED">Từ chối (REJECTED)</option>
        </select>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => void loadWithdrawals(1)}
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
                <th onClick={() => toggleSort('withdrawalId')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">ID<SortIcon col="withdrawalId" /></th>
                <th onClick={() => toggleSort('accountHolderName')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Chuyên gia<SortIcon col="accountHolderName" /></th>
                <th onClick={() => toggleSort('amount')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Số tiền<SortIcon col="amount" /></th>
                <th onClick={() => toggleSort('bankName')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Ngân hàng<SortIcon col="bankName" /></th>
                <th onClick={() => toggleSort('status')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Trạng thái<SortIcon col="status" /></th>
                <th onClick={() => toggleSort('createdAt')} className="cursor-pointer select-none px-5 py-3 text-left font-medium text-gray-500 hover:text-gray-700">Thời gian<SortIcon col="createdAt" /></th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Hành động</th>
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
                sortedItems.map((w) => {
                  const mappedStatus = mapWithdrawalStatus(w.status, w.statusName);
                  const canProcess = mappedStatus === 'CONFIRMED';

                  return (
                    <tr key={w.withdrawalId} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">#{w.withdrawalId}</td>
                      <td className="px-5 py-3 text-gray-700">{w.accountHolderName || '-'}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">{formatVND(w.amount)}</td>
                      <td className="px-5 py-3 text-gray-600">
                        <p className="font-medium">{w.bankName}</p>
                        <p className="text-xs text-gray-500">{w.accountHolderName} · {w.bankAccountNumber}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClassName(mappedStatus)}`}>
                          {statusLabel(mappedStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{w.createdAt ? new Date(new Date(w.createdAt).getTime() + 7 * 60 * 60 * 1000).toLocaleString('vi-VN') : '-'}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          disabled={!canProcess || processingId === w.withdrawalId}
                          onClick={() => {
                            setSelected(w);
                            setDecision('approve');
                            setAdminNote('');
                          }}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {processingId === w.withdrawalId ? 'Đang xử lý...' : 'Xử lý'}
                        </button>
                      </td>
                    </tr>
                  );
                })
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
            void loadWithdrawals(nextPage);
          }}
        />
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Xử lý yêu cầu rút tiền #{selected.withdrawalId}</h3>
            <p className="mt-1 text-sm text-gray-500">{selected.accountHolderName} - {formatVND(selected.amount)}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approve')}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${decision === 'approve' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Duyệt
              </button>
              <button
                type="button"
                onClick={() => setDecision('reject')}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${decision === 'reject' ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Từ chối
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-500">Ghi chú admin {decision === 'reject' ? '(bắt buộc)' : '(tuỳ chọn)'}</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Nhập ghi chú xử lý..."
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleProcess()}
                disabled={processingId !== null}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId !== null ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
