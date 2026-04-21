'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, ChevronDown, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/admin/Pagination';
import { notify, MSGS } from '@/components/common';
import { adminServices } from '@/services/adminServices';
import { AdminRoleResponse, AdminUserResponse } from '@/types/admin';

const PAGE_SIZE = 10;

const toStartOfDayIso = (date: string) => (date ? new Date(`${date}T00:00:00`).toISOString() : undefined);
const toEndOfDayIso = (date: string) => (date ? new Date(`${date}T23:59:59`).toISOString() : undefined);

const getStatusLabel = (status: number, statusName?: string | null) => {
  if (status === 1) return 'Hoạt động';
  if (status === 0) return 'Đã khóa';
  return statusName || 'Không xác định';
};

const toCsvValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return '""';
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [roles, setRoles] = useState<AdminRoleResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedUserCodes, setSelectedUserCodes] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'ban' | 'unban' | 'export' | ''>('');
  const [bulkConfirmAction, setBulkConfirmAction] = useState<{ type: 'ban' | 'unban' } | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUserResponse | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const [actionMenuUserCode, setActionMenuUserCode] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'ban' | 'unban' | 'delete'; user: AdminUserResponse } | null>(null);

  const [editForm, setEditForm] = useState({ fullName: '', phone: '', avatar: '' });

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    roleId: '',
    phoneNumber: '',
    avatarUrl: '',
  });

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
        fromDate: toStartOfDayIso(fromDate),
        toDate: toEndOfDayIso(toDate),
      });

      const result = res.result;
      const rows = result.data ?? result.items ?? [];
      setUsers(rows);
      setTotal(result.total ?? result.totalItems ?? result.totalCount ?? rows.length);
      setPage(result.page ?? result.currentPage ?? targetPage);
      setPageSize(result.pageSize ?? result.size ?? PAGE_SIZE);
      setSelectedUserCodes((prev) => prev.filter((code) => rows.some((u) => u.userCode === code)));
    } catch (err) {
      setError(parseErrorMessage(err, 'Không thể tải danh sách người dùng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
    void loadUsers(1);
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-action-menu]')) {
        setActionMenuUserCode(null);
      }
    };

    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const applyFilters = async () => {
    setPage(1);
    await loadUsers(1);
  };

  const resetFilters = () => {
    setSearch('');
    setRoleId('');
    setStatus('');
    setFromDate('');
    setToDate('');
    setSelectedUserCodes([]);
    setPage(1);
    void loadUsers(1);
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
      notify.error(MSGS.admin.user.loadError);
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
        phoneNumber: editForm.phone,
        avatarUrl: editForm.avatar,
      });
      setEditingUser(null);
      notify.success(MSGS.admin.user.updateSuccess);
      await loadUsers(page);
    } catch (err) {
      notify.error(MSGS.admin.user.updateError);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.email || !createForm.password || !createForm.fullName || !createForm.roleId) {
      notify.error(MSGS.admin.user.requiredFields);
      return;
    }

    setBusy(true);
    try {
      await adminServices.createUser({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        fullName: createForm.fullName.trim(),
        roleId: Number(createForm.roleId),
        phoneNumber: createForm.phoneNumber.trim() || undefined,
        avatarUrl: createForm.avatarUrl.trim() || undefined,
      });

      setCreateUserOpen(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        fullName: '',
        roleId: '',
        phoneNumber: '',
        avatarUrl: '',
      });
      notify.success(MSGS.admin.user.addSuccess);
      await loadUsers(1);
    } catch (err) {
      notify.error(MSGS.admin.user.addError);
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
        notify.success(MSGS.admin.user.lockSuccess);
      }

      if (confirmAction.type === 'unban') {
        await adminServices.unbanUser(confirmAction.user.userCode);
        notify.success(MSGS.admin.user.unlockSuccess);
      }

      if (confirmAction.type === 'delete') {
        await adminServices.deleteUser(confirmAction.user.userCode);
        notify.success(MSGS.admin.user.hardDeleteSuccess);
      }

      setConfirmAction(null);
      setActionMenuUserCode(null);
      await loadUsers(page);
    } catch (err) {
      notify.error(MSGS.admin.user.actionError);
    } finally {
      setBusy(false);
    }
  };

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedUserCodes.includes(u.userCode)),
    [users, selectedUserCodes]
  );

  const allSelectedOnPage = users.length > 0 && selectedUserCodes.length === users.length;

  const toggleSelectAllOnPage = () => {
    if (allSelectedOnPage) {
      setSelectedUserCodes([]);
      return;
    }
    setSelectedUserCodes(users.map((u) => u.userCode));
  };

  const toggleSelectUser = (userCode: string) => {
    setSelectedUserCodes((prev) =>
      prev.includes(userCode) ? prev.filter((code) => code !== userCode) : [...prev, userCode]
    );
  };

  const exportSelectedUsersCsv = () => {
    if (selectedUsers.length === 0) {
      notify.error(MSGS.admin.user.exportRequireSelection);
      return;
    }

    const header = ['UserCode', 'Username', 'FullName', 'Email', 'Role', 'Status', 'CreatedAt'];
    const rows = selectedUsers.map((user) => [
      toCsvValue(user.userCode),
      toCsvValue(user.username),
      toCsvValue(user.fullName),
      toCsvValue(user.email),
      toCsvValue(user.roleName || user.role?.roleName || ''),
      toCsvValue(getStatusLabel(user.status, user.statusName)),
      toCsvValue(user.createdAt ? new Date(user.createdAt).toISOString() : ''),
    ]);

    const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyBulkAction = () => {
    if (!bulkAction) {
      notify.error(MSGS.admin.user.bulkActionRequired);
      return;
    }

    if (selectedUsers.length === 0) {
      notify.error(MSGS.admin.user.selectionRequired);
      return;
    }

    if (bulkAction === 'export') {
      exportSelectedUsersCsv();
      return;
    }

    setBulkConfirmAction({ type: bulkAction });
  };

  const handleConfirmBulkAction = async () => {
    if (!bulkConfirmAction) return;

    const candidates =
      bulkConfirmAction.type === 'ban'
        ? selectedUsers.filter((user) => user.status !== 0)
        : selectedUsers.filter((user) => user.status === 0);

    if (candidates.length === 0) {
      notify.error(
        bulkConfirmAction.type === 'ban'
          ? MSGS.admin.user.bulkNoLockTarget
          : MSGS.admin.user.bulkNoUnlockTarget
      );
      setBulkConfirmAction(null);
      return;
    }

    setBusy(true);
    try {
      for (const user of candidates) {
        if (bulkConfirmAction.type === 'ban') {
          await adminServices.banUser(user.userCode);
        } else {
          await adminServices.unbanUser(user.userCode);
        }
      }

      notify.success(
        bulkConfirmAction.type === 'ban'
          ? MSGS.admin.user.bulkLockSuccess(candidates.length)
          : MSGS.admin.user.bulkUnlockSuccess(candidates.length)
      );
      setSelectedUserCodes([]);
      setBulkConfirmAction(null);
      await loadUsers(page);
    } catch (err) {
      notify.error(MSGS.admin.user.bulkActionError);
    } finally {
      setBusy(false);
    }
  };

  const summaryText = useMemo(() => {
    if (selectedUserCodes.length === 0) return `Tổng ${total} người dùng`;
    return `Tổng ${total} người dùng - Đã chọn ${selectedUserCodes.length}`;
  }, [selectedUserCodes.length, total]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-gray-500">{summaryText}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên/email"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 md:col-span-2"
        />

        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tất cả vai trò</option>
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
          <option value="">Tất cả trạng thái</option>
          <option value="1">Hoạt động</option>
          <option value="0">Đã khóa</option>
        </select>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500">Từ ngày</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500">Đến ngày</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as 'ban' | 'unban' | 'export' | '')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Hành động hàng loạt</option>
            <option value="ban">Khóa người dùng đã chọn</option>
            <option value="unban">Mở khóa người dùng đã chọn</option>
            <option value="export">Xuất CSV người dùng đã chọn</option>
          </select>
          <button
            type="button"
            onClick={handleApplyBulkAction}
            disabled={!bulkAction || selectedUserCodes.length === 0 || busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Thực hiện
          </button>
          <span className="text-sm text-gray-500">Đã chọn {selectedUserCodes.length} người dùng</span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setCreateUserOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Thêm người dùng
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Đặt lại
          </button>
          <button
            type="button"
            onClick={() => void applyFilters()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Lọc
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={toggleSelectAllOnPage}
                    aria-label="Chọn tất cả người dùng trong trang"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Người dùng</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Vai trò</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Trạng thái</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Ngày tạo</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userCode} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUserCodes.includes(user.userCode)}
                        onChange={() => toggleSelectUser(user.userCode)}
                        aria-label={`Chọn người dùng ${user.username}`}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
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
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block text-left" data-action-menu>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuUserCode((prev) => (prev === user.userCode ? null : user.userCode));
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Hành động
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>

                        {actionMenuUserCode === user.userCode && (
                          <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setActionMenuUserCode(null);
                                setSelectedUser(user);
                                void handleViewDetail(user.userCode);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Xem chi tiết
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setActionMenuUserCode(null);
                                openEditModal(user);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Sửa thông tin
                            </button>
                            {user.status === 0 ? (
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                                onClick={() => {
                                  setActionMenuUserCode(null);
                                  setConfirmAction({ type: 'unban', user });
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Mở khóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50"
                                onClick={() => {
                                  setActionMenuUserCode(null);
                                  setConfirmAction({ type: 'ban', user });
                                }}
                              >
                                <Ban className="h-4 w-4" />
                                Khóa tài khoản
                              </button>
                            )}
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setActionMenuUserCode(null);
                                setConfirmAction({ type: 'delete', user });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa vĩnh viễn
                            </button>
                          </div>
                        )}
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

      <Modal isOpen={!!selectedUser && !!detailUser} onClose={() => { setSelectedUser(null); setDetailUser(null); }} title="Chi tiết người dùng" size="lg">
        {busy && !detailUser ? (
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        ) : detailUser ? (
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <p><strong>User Code:</strong> {detailUser.userCode}</p>
            <p><strong>Tên đăng nhập:</strong> {detailUser.username}</p>
            <p><strong>Email:</strong> {detailUser.email}</p>
            <p><strong>Họ tên:</strong> {detailUser.fullName}</p>
            <p><strong>Số điện thoại:</strong> {detailUser.phoneNumber || '-'}</p>
            <p><strong>Vai trò:</strong> {detailUser.roleName || detailUser.role?.roleName || '-'}</p>
            <p><strong>Trạng thái:</strong> {getStatusLabel(detailUser.status, detailUser.statusName)}</p>
            <p><strong>Ngày tạo:</strong> {detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString('vi-VN') : '-'}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Không có dữ liệu.</p>
        )}
      </Modal>

      <Modal
        isOpen={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        title="Thêm người dùng"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateUserOpen(false)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleCreateUser()}
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? 'Đang xử lý...' : 'Thêm'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              value={createForm.fullName}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vai trò</label>
            <select
              value={createForm.roleId}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, roleId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Chọn vai trò</option>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {r.roleName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại (tùy chọn)</label>
            <input
              type="text"
              value={createForm.phoneNumber}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Avatar URL (tùy chọn)</label>
            <input
              type="text"
              value={createForm.avatarUrl}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Cập nhật người dùng"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleUpdateUser()}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Đang xử lý...' : 'Lưu'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">URL ảnh đại diện</label>
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
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Xác nhận thao tác"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmedAction()}
              disabled={busy}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                confirmAction?.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {busy ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {confirmAction?.type === 'ban' && (
            <>Bạn muốn khóa tài khoản <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong>? Hệ thống sẽ thu hồi token ngay lập tức.</>
          )}
          {confirmAction?.type === 'unban' && (
            <>Bạn muốn mở khóa tài khoản <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong>?</>
          )}
          {confirmAction?.type === 'delete' && (
            <>Bạn muốn xóa vĩnh viễn tài khoản <strong>{confirmAction.user.fullName || confirmAction.user.username}</strong>? Hành động này không thể hoàn tác.</>
          )}
        </p>
      </Modal>

      <Modal
        isOpen={!!bulkConfirmAction}
        onClose={() => setBulkConfirmAction(null)}
        title="Xác nhận thao tác hàng loạt"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setBulkConfirmAction(null)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmBulkAction()}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {bulkConfirmAction?.type === 'ban' && (
            <>Bạn muốn khóa {selectedUsers.length} người dùng đã chọn? Hành động này sẽ thu hồi token của các tài khoản đó.</>
          )}
          {bulkConfirmAction?.type === 'unban' && (
            <>Bạn muốn mở khóa {selectedUsers.length} người dùng đã chọn?</>
          )}
        </p>
      </Modal>
    </div>
  );
}
