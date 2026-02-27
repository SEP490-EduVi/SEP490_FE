/**
 * Admin – User Management
 * =======================
 * Searchable table of all users with role badges and quick actions.
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  UserPlus,
  Mail,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive' | 'banned';
  presentations: number;
  creditsUsed: number;
  joinedAt: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  { id: '1', name: 'Nguyen Van A', email: 'a@edu.vn', role: 'admin', status: 'active', presentations: 42, creditsUsed: 12400, joinedAt: '2025-01-15' },
  { id: '2', name: 'Tran Thi B', email: 'b@edu.vn', role: 'teacher', status: 'active', presentations: 38, creditsUsed: 10800, joinedAt: '2025-02-20' },
  { id: '3', name: 'Le Van C', email: 'c@edu.vn', role: 'student', status: 'active', presentations: 31, creditsUsed: 9200, joinedAt: '2025-03-05' },
  { id: '4', name: 'Pham Thi D', email: 'd@edu.vn', role: 'teacher', status: 'inactive', presentations: 27, creditsUsed: 7600, joinedAt: '2025-03-18' },
  { id: '5', name: 'Hoang Van E', email: 'e@edu.vn', role: 'student', status: 'active', presentations: 24, creditsUsed: 6100, joinedAt: '2025-04-02' },
  { id: '6', name: 'Vo Thi F', email: 'f@edu.vn', role: 'student', status: 'banned', presentations: 3, creditsUsed: 800, joinedAt: '2025-04-10' },
  { id: '7', name: 'Dang Van G', email: 'g@edu.vn', role: 'teacher', status: 'active', presentations: 19, creditsUsed: 5400, joinedAt: '2025-05-01' },
  { id: '8', name: 'Bui Thi H', email: 'h@edu.vn', role: 'student', status: 'active', presentations: 15, creditsUsed: 4200, joinedAt: '2025-05-22' },
  { id: '9', name: 'Do Van I', email: 'i@edu.vn', role: 'student', status: 'inactive', presentations: 8, creditsUsed: 2100, joinedAt: '2025-06-15' },
  { id: '10', name: 'Ngo Thi K', email: 'k@edu.vn', role: 'teacher', status: 'active', presentations: 33, creditsUsed: 9500, joinedAt: '2025-07-03' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<User['role'], string> = {
  admin: 'bg-red-50 text-red-700',
  teacher: 'bg-blue-50 text-blue-700',
  student: 'bg-gray-100 text-gray-600',
};

const STATUS_STYLES: Record<User['status'], { dot: string; text: string }> = {
  active: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  inactive: { dot: 'bg-gray-400', text: 'text-gray-500' },
  banned: { dot: 'bg-red-500', text: 'text-red-600' },
};

type RoleFilter = 'all' | User['role'];
type StatusFilter = 'all' | User['status'];

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    let list = MOCK_USERS;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter);
    if (statusFilter !== 'all') list = list.filter((u) => u.status === statusFilter);
    return list;
  }, [search, roleFilter, statusFilter]);

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">
            {MOCK_USERS.length} người dùng đã đăng ký
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <UserPlus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="teacher">Giáo viên</option>
            <option value="student">Học sinh</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="banned">Bị cấm</option>
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
                <th className="text-left font-medium text-gray-500 px-5 py-3">Người dùng</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Vai trò</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Trạng thái</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Bài thuyết trình</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Tin chỉ đã dùng</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Ngày tham gia</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    Không tìm thấy người dùng.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const st = STATUS_STYLES[user.status];
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* User info */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                            {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[user.role]}`}
                        >
                          {user.role === 'admin' ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : user.role === 'teacher' ? (
                            <Shield className="w-3 h-3" />
                          ) : null}
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {user.status}
                        </span>
                      </td>

                      {/* Presentations */}
                      <td className="px-5 py-3 text-right font-medium text-gray-700">
                        {user.presentations}
                      </td>

                      {/* Credits */}
                      <td className="px-5 py-3 text-right text-gray-500">
                        {user.creditsUsed.toLocaleString()}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(user.joinedAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {user.status === 'banned' ? (
                            <button
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                              title="Bỏ cấm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                              title="Cấm người dùng"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                            title="Thêm thao tác"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
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
