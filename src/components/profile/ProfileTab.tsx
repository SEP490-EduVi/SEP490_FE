'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Loader2, FileText, Mail, Phone, BadgeCheck,
  PencilLine, X, Check, ShieldCheck, Camera, Clock,
} from 'lucide-react';
import type { UserInfo as AuthUserInfo } from '@/types/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useUpdateMeService } from '@/services/authServices';
import { uploadAvatarToGcs } from '@/services/gcsServices';
import { useUpdateExpertProfile } from '@/hooks/useExpertApi';
import { useUpdateStaffProfile } from '@/hooks/useStaffApi';
import { useUpdateTeacherProfile } from '@/hooks/useTeacherApi';
import { notify } from '@/components/common';

interface ProfileTabProps {
  info: {
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    username?: string | null;
    userId?: number;
    role?: { roleName?: string | null };
    status?: number;
    expertId?: number | null;
  };
  isProfileLoading: boolean;
  isStaff: boolean;
  isTeacher: boolean;
  isExpert: boolean;
  roleExtraLabel: string | null;
  roleExtraValue: string | null;
  staffHireDate: string | null;
  expertUserCode: string | null;
  expertVerificationText: string | null;
  expertIsVerified: boolean;
  roleLabel: string;
  initial: string;
  refetchExpertProfile: () => void;
}

export default function ProfileTab({
  info, isProfileLoading, isStaff, isTeacher, isExpert,
  roleExtraLabel, roleExtraValue, staffHireDate,
  expertUserCode, expertVerificationText, expertIsVerified,
  roleLabel, initial, refetchExpertProfile,
}: ProfileTabProps) {
  const { setUser } = useAuthStore();

  // ── Edit state ──
  const [isEditing, setIsEditing]         = useState(false);
  const [editFullName, setEditFullName]    = useState('');
  const [editPhone, setEditPhone]          = useState('');
  const [editAvatarUrl, setEditAvatarUrl]  = useState('');
  const [editRoleExtra, setEditRoleExtra]  = useState('');
  const [avatarLocalPreview, setAvatarLocalPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const updateMe             = useUpdateMeService();
  const updateExpertProfile  = useUpdateExpertProfile();
  const updateStaffProfile   = useUpdateStaffProfile();
  const updateTeacherProfile = useUpdateTeacherProfile();

  const canUpdateAvatar = !isStaff && !isTeacher && !isExpert;
  const profileUpdatePending =
    updateMe.isPending ||
    updateExpertProfile.isPending ||
    updateStaffProfile.isPending ||
    updateTeacherProfile.isPending;

  const openEdit = () => {
    setEditFullName(info?.fullName ?? '');
    setEditPhone(info?.phoneNumber ?? '');
    setEditAvatarUrl(info?.avatarUrl ?? '');
    setEditRoleExtra(roleExtraValue ?? '');
    setAvatarLocalPreview(null);
    setIsEditing(true);
  };

  const handleAvatarFileSelect = (file: File) => {
    if (!canUpdateAvatar) {
      notify.error('Vai trò hiện tại không hỗ trợ cập nhật ảnh đại diện tại màn này.');
      return;
    }
    if (!file.type.startsWith('image/')) { notify.error('Chỉ chấp nhận file ảnh.'); return; }
    if (file.size > 5 * 1024 * 1024) { notify.error('File ảnh tối đa 5 MB.'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarLocalPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    uploadAvatarToGcs(file, info?.userId)
      .then((publicUrl) => setEditAvatarUrl(publicUrl))
      .catch((err: unknown) => {
        const msg = (err instanceof Error ? err.message : null) ?? 'Upload ảnh thất bại.';
        notify.error(msg);
        setAvatarLocalPreview(null);
      })
      .finally(() => setAvatarUploading(false));
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) { notify.error('Họ và tên không được để trống.'); return; }
    if (avatarUploading) { notify.error('Vui lòng chờ ảnh tải lên xong.'); return; }

    const fullName    = editFullName.trim();
    const phoneNumber = editPhone.trim();
    const avatarUrl   = editAvatarUrl.trim();
    const roleExtra   = editRoleExtra.trim();

    const handleSuccess = (nextUser?: unknown) => {
      if (nextUser && typeof nextUser === 'object') {
        setUser(nextUser as AuthUserInfo);
      } else if (info) {
        setUser({
          ...info,
          fullName,
          phoneNumber,
          avatarUrl: canUpdateAvatar ? avatarUrl : (info.avatarUrl ?? null),
        } as AuthUserInfo);
      }
      notify.success('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
    };

    const handleError = (err: unknown) => {
      const responseMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const genericMsg  = err instanceof Error ? err.message : null;
      notify.error(responseMsg ?? genericMsg ?? 'Cập nhật thất bại. Vui lòng thử lại.');
    };

    if (isStaff) {
      updateStaffProfile.mutate(
        { fullName, phoneNumber, department: roleExtra || undefined },
        { onSuccess: () => handleSuccess(), onError: handleError },
      );
      return;
    }
    if (isTeacher) {
      updateTeacherProfile.mutate(
        { fullName, phoneNumber, schoolName: roleExtra || undefined },
        { onSuccess: () => handleSuccess(), onError: handleError },
      );
      return;
    }
    if (isExpert) {
      updateExpertProfile.mutate(
        { fullName, phoneNumber, bio: roleExtra.length > 0 ? roleExtra : null },
        {
          onSuccess: () => { void refetchExpertProfile(); handleSuccess(); },
          onError: handleError,
        },
      );
      return;
    }
    updateMe.mutate(
      { fullName, phoneNumber, avatarUrl },
      { onSuccess: (res) => handleSuccess(res?.result), onError: handleError },
    );
  };

  return (
    <motion.div key="profile"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Thông tin cá nhân</h2>
              <p className="text-xs text-gray-400">Chi tiết tài khoản của bạn</p>
            </div>
          </div>
          {!isProfileLoading && !isEditing && (
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PencilLine className="w-3.5 h-3.5" />
              Chỉnh sửa
            </button>
          )}
        </div>

        {isProfileLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : isEditing ? (
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="Nhập họ và tên"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-100 select-none">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-gray-500">{info?.email ?? '—'}</span>
                <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md whitespace-nowrap">Không thể thay đổi</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="Nhập số điện thoại"
              />
            </div>
            {roleExtraLabel && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{roleExtraLabel}</label>
                {isExpert ? (
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-blue-50/70 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Giới thiệu chuyên gia</span>
                      <span className="text-[11px] text-indigo-500">{editRoleExtra.length}/500</span>
                    </div>
                    <textarea
                      value={editRoleExtra}
                      onChange={(e) => setEditRoleExtra(e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="w-full px-3.5 py-3 border border-indigo-100 rounded-xl text-sm bg-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all resize-none leading-6"
                      placeholder="Ví dụ: Chuyên gia STEM với 8 năm kinh nghiệm thiết kế học liệu số..."
                    />
                    <p className="mt-2 text-[11px] text-indigo-600/80">
                      Bio ngắn gọn giúp học viên hiểu chuyên môn và kinh nghiệm của bạn.
                    </p>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editRoleExtra}
                    onChange={(e) => setEditRoleExtra(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    placeholder={`Nhập ${roleExtraLabel.toLowerCase()}`}
                  />
                )}
              </div>
            )}
            {canUpdateAvatar && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="relative group flex-shrink-0 rounded-full overflow-hidden"
                  >
                    {(avatarLocalPreview ?? editAvatarUrl) ? (
                      <img
                        src={avatarLocalPreview ?? editAvatarUrl}
                        alt="Ảnh đại diện"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
                        {initial}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {avatarUploading ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Đang tải lên...</span> : 'Chọn ảnh'}
                    </button>
                    <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, GIF · Tối đa 5 MB</p>
                  </div>
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFileSelect(f); e.target.value = ''; }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={profileUpdatePending || avatarUploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {profileUpdatePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {profileUpdatePending ? 'Đang lưu...' : avatarUploading ? 'Đợi ảnh tải lên...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={() => { setAvatarLocalPreview(null); setAvatarUploading(false); setIsEditing(false); }}
                disabled={profileUpdatePending}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
              <div className="space-y-5 sm:pr-8">
                <InfoField icon={User}     label="Họ và tên"     value={info?.fullName}    />
                <InfoField icon={User}     label="Tên đăng nhập" value={info?.username}    />
                <InfoField icon={Mail}     label="Email"         value={info?.email}       />
              </div>
              <div className="space-y-5 pt-5 sm:pt-0 sm:pl-8">
                <InfoField icon={Phone}    label="Số điện thoại" value={info?.phoneNumber} />
                {isExpert && <InfoField icon={BadgeCheck} label="Mã người dùng" value={expertUserCode} />}
                {roleLabel && <InfoField icon={BadgeCheck} label="Vai trò" value={roleLabel} />}
                {roleExtraLabel && !isExpert && <InfoField icon={FileText} label={roleExtraLabel} value={roleExtraValue} />}
                {isExpert && (
                  <InfoField
                    icon={ShieldCheck}
                    label="Xác minh chuyên gia"
                    value={expertVerificationText}
                    highlight={expertIsVerified}
                  />
                )}
                {isStaff && <InfoField icon={Clock} label="Ngày tuyển dụng" value={staffHireDate} />}
              </div>
            </div>
            {isExpert && (
              <div className="px-6 pb-6">
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5 text-indigo-700">
                    <FileText className="w-4 h-4" />
                    <p className="text-xs font-semibold uppercase tracking-wide">Giới thiệu chuyên gia</p>
                  </div>
                  <p className={`text-sm leading-6 whitespace-pre-wrap ${roleExtraValue ? 'text-gray-700' : 'text-gray-500 italic'}`}>
                    {roleExtraValue || 'Chưa có bio. Hãy thêm phần giới thiệu để hồ sơ của bạn chuyên nghiệp hơn.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────

function InfoField({
  icon: Icon, label, value, highlight = false,
}: {
  icon: React.ElementType; label: string; value?: string | null; highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}
