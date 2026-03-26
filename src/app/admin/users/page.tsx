'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Eye, Pencil, Shield, Trash2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/admin/Pagination';
import StatusToast from '@/components/admin/StatusToast';
import { adminServices } from '@/services/adminServices';
import { AdminRoleResponse, AdminUserResponse } from '@/types/admin';

type ToastState = { kind: 'success' | 'error'; message: string } | null;

const PAGE_SIZE = 10;

const getStatusLabel = (status: number, statusName?: string | null) => {
  if (status === 1) return 'Hoat dong';
  if (status === 0) return 'Da khoa';
  return statusName || 'Khong xac dinh';
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [roles, setRoles] = useState<AdminRoleResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastState>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUserResponse | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const [roleChangingUser, setRoleChangingUser] = useState<AdminUserResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'ban' | 'unban' | 'delete'; user: AdminUserResponse } | null>(null);

  const [editForm, setEditForm] = useState({ fullName: '', phone: '', avatar: '' });
  const [roleForm, setRoleForm] = useState('');

  const parseErrorMessage = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

  const loadRoles = async () => {
    try {
      const res = await adminServices.getRoles();
      setRoles(res.result ?? []);
    } catch {
      setRoles([]);
    }
  };

  const loadUsers = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminServices.listUsers({
        page: targetPage,
        pageSize: PAGE_SIZE,
        search,
        roleId: roleId ? Number(roleId) : undefined,
        status: status ? Number(status) : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      const result = res.result;
      const rows = result.data ?? result.items ?? [];
      setUsers(rows);
      setTotal(result.total ?? result.totalItems ?? rows.length);
      setPage(result.page ?? result.currentPage ?? targetPage);
      setPageSize(result.pageSize ?? result.size ?? PAGE_SIZE);
    } catch (err) {
      setError(parseErrorMessage(err, 'Khong the tai danh sach nguoi dung.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
    void loadUsers(1);
  }, []);

  const applyFilters = async () => {
    setPage(1);
    await loadUsers(1);
  };

  const openEditModal = (user: AdminUserResponse) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName ?? '',
      phone: user.phoneNumber ?? '',
      avatar: user.avatarUrl ?? '',
    });
  };

  const handleViewDetail = async (userCode: string) => {
    setBusy(true);
    try {
      const res = await adminServices.getUserDetail(userCode);
      setDetailUser(res.result);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Khong the tai thong tin nguoi dung.') });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setBusy(true);
    try {
      await adminServices.updateUser(editingUser.userCode, {
        fullName: editForm.fullName,
        phone: editForm.phone,
        avatar: editForm.avatar,
      });
      setEditingUser(null);
      setToast({ kind: 'success', message: 'Cap nhat nguoi dung thanh cong.' });
      await loadUsers(page);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Khong the cap nhat nguoi dung.') });
    } finally {
      setBusy(false);
    }
  };

  const openChangeRoleModal = (user: AdminUserResponse) => {
    setRoleChangingUser(user);
    setRoleForm(String(user.roleId ?? user.role?.roleId ?? ''));
  };

  const handleChangeRole = async () => {
    if (!roleChangingUser || !roleForm) return;

    setBusy(true);
    try {
      await adminServices.changeUserRole(roleChangingUser.userCode, { roleId: Number(roleForm) });
      setRoleChangingUser(null);
      setToast({ kind: 'success', message: 'Doi vai tro thanh cong. Nguoi dung se phai dang nhap lai.' });
      await loadUsers(page);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Khong the doi vai tro.') });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!confirmAction) return;

    setBusy(true);
    try {
      if (confirmAction.type === 'ban') {
        await adminServices.banUser(confirmAction.user.userCode);
        setToast({ kind: 'success', message: 'Da khoa nguoi dung va thu hoi token.' });
      }

      if (confirmAction.type === 'unban') {
        await adminServices.unbanUser(confirmAction.user.userCode);
        setToast({ kind: 'success', message: 'Da mo khoa nguoi dung.' });
      }

      if (confirmAction.type === 'delete') {
        await adminServices.deleteUser(confirmAction.user.userCode);
        setToast({ kind: 'success', message: 'Da xoa nguoi dung (hard delete).' });
      }

      setConfirmAction(null);
      await loadUsers(page);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Thao tac that bai.') });
    } finally {
      setBusy(false);
    }
  };

  const summaryText = useMemo(() => `Tong ${total} nguoi dung`, [total]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      {toast && <StatusToast kind={toast.kind} message={toast.message} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quan ly nguoi dung</h1>
        <p className="mt-1 text-sm text-gray-500">{summaryText}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tim theo ten/email"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 md:col-span-2"
        />

        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tat ca vai tro</option>
          {roles.map((r) => (
            <option key={r.roleId} value={r.roleId}>
              {r.roleName}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tat ca trang thai</option>
          <option value="1">Hoat dong</option>
          <option value="0">Da khoa</option>
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
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setRoleId('');
            setStatus('');
            setFromDate('');
            setToDate('');
            void loadUsers(1);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => void applyFilters()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Loc
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3 text-left font-medium text-gray-500">Nguoi dung</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Vai tro</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Trang thai</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Ngay tao</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Hanh dong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-500">
                    Dang tai du lieu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400">
                    Khong co du lieu.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userCode} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{user.fullName || user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{user.roleName || user.role?.roleName || '-'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.status === 1
                            ? 'bg-emerald-50 text-emerald-700'
                            : user.status === 0
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {getStatusLabel(user.status, user.statusName)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                          onClick={() => {
                            setSelectedUser(user);
                            void handleViewDetail(user.userCode);
                          }}
                          title="Xem"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                          onClick={() => openEditModal(user)}
                          title="Sua"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-violet-600 hover:bg-violet-50"
                          onClick={() => openChangeRoleModal(user)}
                          title="Doi vai tro"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        {user.status === 0 ? (
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => setConfirmAction({ type: 'unban', user })}
                            title="Bo khoa"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                            onClick={() => setConfirmAction({ type: 'ban', user })}
                            title="Khoa"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmAction({ type: 'delete', user })}
                          title="Xoa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
            void loadUsers(nextPage);
          }}
        />
      </div>

      <Modal isOpen={!!selectedUser && !!detailUser} onClose={() => { setSelectedUser(null); setDetailUser(null); }} title="Chi tiet nguoi dung" size="lg">
        {busy && !detailUser ? (
          <p className="text-sm text-gray-500">Dang tai du lieu...</p>
        ) : detailUser ? (
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <p><strong>User Code:</strong> {detailUser.userCode}</p>
            <p><strong>Username:</strong> {detailUser.username}</p>
            <p><strong>Email:</strong> {detailUser.email}</p>
            <p><strong>Ho ten:</strong> {detailUser.fullName}</p>
            <p><strong>Phone:</strong> {detailUser.phoneNumber || '-'}</p>
            <p><strong>Vai tro:</strong> {detailUser.roleName || detailUser.role?.roleName || '-'}</p>
            <p><strong>Trang thai:</strong> {getStatusLabel(detailUser.status, detailUser.statusName)}</p>
            <p><strong>Ngay tao:</strong> {detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString('vi-VN') : '-'}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Khong co du lieu.</p>
        )}
      </Modal>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Cap nhat nguoi dung"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Huy
            </button>
            <button
              type="button"
              onClick={() => void handleUpdateUser()}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Dang xu ly...' : 'Luu'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">FullName</label>
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Avatar URL</label>
            <input
              type="text"
              value={editForm.avatar}
              onChange={(e) => setEditForm((prev) => ({ ...prev, avatar: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!roleChangingUser}
        onClose={() => setRoleChangingUser(null)}
        title="Doi vai tro nguoi dung"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRoleChangingUser(null)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Huy
            </button>
            <button
              type="button"
              onClick={() => void handleChangeRole()}
              disabled={busy || !roleForm}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Dang xu ly...' : 'Xac nhan'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Nguoi dung: <strong>{roleChangingUser?.fullName || roleChangingUser?.username}</strong>
          </p>
          <select
            value={roleForm}
            onChange={(e) => setRoleForm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Chon vai tro</option>
            {roles.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                {r.roleName}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Xac nhan thao tac"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Huy
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmedAction()}
              disabled={busy}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                confirmAction?.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {busy ? 'Dang xu ly...' : 'Xac nhan'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {confirmAction?.type === 'ban' && (
            <>Ban muon khoa tai khoan <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong>? He thong se thu hoi token ngay lap tuc.</>
          )}
          {confirmAction?.type === 'unban' && (
            <>Ban muon bo khoa tai khoan <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong>?</>
          )}
          {confirmAction?.type === 'delete' && (
            <>Ban muon xoa vinh vien tai khoan <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong>? Hanh dong nay khong the hoan tac.</>
          )}
        </p>
      </Modal>
    </div>
  );
}
