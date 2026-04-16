'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShieldCheck, CheckCircle,
  Eye, EyeOff, Loader2, AlertCircle, Camera,
  Upload, Trash2, FileText, Clock, CheckCircle2, XCircle,
  Mail, Phone, BadgeCheck, LockKeyhole, Wallet, CreditCard,
  PencilLine, X, Check, ArrowRight, Layers, Film, Library,
} from 'lucide-react';
import type { UserInfo as AuthUserInfo } from '@/types/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetMeService, useChangePasswordService, useUpdateMeService } from '@/services/authServices';
import { uploadAvatarToGcs } from '@/services/gcsServices';
import { getVerificationFile } from '@/services/expertServices';
import {
  useExpertProfile,
  useUpdateExpertProfile,
  useVerifications,
  useSubmitVerification,
  useDeleteVerification,
} from '@/hooks/useExpertApi';
import { useStaffProfile, useUpdateStaffProfile } from '@/hooks/useStaffApi';
import { useTeacherProfile, useUpdateTeacherProfile } from '@/hooks/useTeacherApi';
import {
  useBuySubscription,
  useConfirmWithdrawalOtp,
  useInitiateWithdrawal,
  useMyWithdrawals,
  useSubscriptionPlans,
  useTopUpWallet,
  useVerifyTopUp,
  useWalletInfo,
  useWalletTransactions,
  useUserQuota,
} from '@/hooks/usePaymentApi';
import { useAllProducts } from '@/hooks/useProductApi';
import { useAllVideos } from '@/hooks/usePipelineApi';
import { usePurchasedMaterials } from '@/hooks/useMaterialShopApi';
import { useDocumentStore } from '@/store/useDocumentStore';
import * as productService from '@/services/productServices';
import VideoPlayerModal from '@/components/projects/VideoPlayerModal';
import type { VideoProductDto } from '@/types/api';
import AppHeader from '@/components/sidebar/AppHeader';
import { notify } from '@/components/common';

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'security' | 'payment' | 'withdrawal' | 'certificate' | 'slides' | 'videos' | 'library';
type ProfileRole = 'guest' | 'admin' | 'teacher' | 'staff' | 'expert';

function resolveProfileRole(roleName?: string | null): ProfileRole {
  if (!roleName) return 'guest';
  const normalized = roleName.trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'staff') return 'staff';
  if (normalized === 'expert') return 'expert';
  return 'guest';
}

function toRoleDisplayName(role: ProfileRole): string {
  if (role === 'admin') return 'Admin';
  if (role === 'teacher') return 'Teacher';
  if (role === 'staff') return 'Staff';
  if (role === 'expert') return 'Expert';
  return '';
}

function formatIsoDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
}

function formatEduCoin(value: number | null | undefined): string {
  const amount = Number.isFinite(value) ? Number(value) : 0;
  return `${amount.toLocaleString('vi-VN')} EduCoin`;
}

function formatQuota(value: number | null | undefined): string {
  const amount = Number.isFinite(value) ? Number(value) : 0;
  return amount.toLocaleString('vi-VN');
}

function getWithdrawalStatusLabel(status?: number | string, statusName?: string | null): string {
  if (typeof status === 'number') {
    if (status === 0) return 'Đang chờ duyệt';
    if (status === 1) return 'Đã duyệt';
    if (status === 2) return 'Đã từ chối';
  }

  if (typeof status === 'string' && status.trim()) {
    const s = status.trim().toUpperCase();
    if (s === 'CONFIRMED') return 'Đang chờ duyệt';
    if (s === 'SUCCESS') return 'Đã duyệt';
    if (s === 'REJECTED') return 'Đã từ chối';
    return status;
  }

  return statusName || 'Không xác định';
}

// ── Password strength ──────────────────────────────────────────────────────
function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (score === 1) return { level: 1, label: 'Yếu',        color: 'bg-red-400'    };
  if (score === 2) return { level: 2, label: 'Trung bình',  color: 'bg-amber-400'  };
  return             { level: 3, label: 'Mạnh',        color: 'bg-emerald-500' };
}

// ── Certificate helpers ────────────────────────────────────────────────────
const CERT_STATUS_CONFIG: Record<number, { label: string; textColor: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  0: { label: 'Chờ duyệt', textColor: 'text-amber-700',   bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',   icon: Clock       },
  1: { label: 'Đã duyệt',  textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: CheckCircle2 },
  2: { label: 'Từ chối',   textColor: 'text-red-700',     bgColor: 'bg-red-50',     borderColor: 'border-red-200',     icon: XCircle     },
};

function normalizeVerificationStatus(status: number | string | null | undefined): 0 | 1 | 2 {
  if (typeof status === 'number') {
    if (status === 1) return 1;
    if (status === 2) return 2;
    return 0;
  }

  const value = (status ?? '').toString().trim().toLowerCase();
  if (value === 'approved' || value === '1') return 1;
  if (value === 'rejected' || value === '2') return 2;
  return 0;
}

const FILE_TYPE_OPTIONS = [
  { value: 'degree',      label: 'Bằng cấp'  },
  { value: 'certificate', label: 'Chứng chỉ' },
  { value: 'cccd',        label: 'CCCD'      },
];

function CertStatusBadge({ status }: { status: number | string }) {
  const normalizedStatus = normalizeVerificationStatus(status);
  const cfg = CERT_STATUS_CONFIG[normalizedStatus] ?? CERT_STATUS_CONFIG[0];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── Inner page (needs Suspense because of useSearchParams) ───────────────
function ProfilePageInner() {
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const { user, role: storeRole, setUser } = useAuthStore();
  const setDocument     = useDocumentStore((s) => s.setDocument);

  // Fallback only: role-specific profile is the source of truth for profile data.
  const { data: meData, isLoading: isMeLoading } = useGetMeService({ enabled: !user });

  useEffect(() => {
    if (meData?.result && !user) setUser(meData.result);
  }, [meData, setUser, user]);

  const effectiveRole = storeRole !== 'guest'
    ? storeRole
    : resolveProfileRole(meData?.result?.role?.roleName ?? user?.role?.roleName ?? null);

  const isStaff = effectiveRole === 'staff';
  const isExpert = effectiveRole === 'expert';
  const isTeacher = effectiveRole === 'teacher';

  const defaultTab = (): Tab => {
    const t = searchParams.get('tab');
    if (t === 'security')    return 'security';
    if (t === 'payment' && !isStaff) return 'payment';
    if (t === 'withdrawal' && isExpert) return 'withdrawal';
    if (t === 'slides' && isTeacher) return 'slides';
    if (t === 'videos' && isTeacher) return 'videos';
    if (t === 'library' && isTeacher) return 'library';
    if (t === 'certificate') return 'certificate';
    return 'profile';
  };
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    if (isStaff && (activeTab === 'payment' || activeTab === 'withdrawal')) {
      setActiveTab('profile');
    }
  }, [isStaff, activeTab]);

  const { data: staffProfile, isLoading: isStaffProfileLoading } = useStaffProfile({ enabled: isStaff });
  const {
    data: expertProfile,
    isLoading: isExpertProfileLoading,
    refetch: refetchExpertProfile,
  } = useExpertProfile({ enabled: isExpert });
  const { data: teacherProfile, isLoading: isTeacherProfileLoading } = useTeacherProfile({ enabled: isTeacher });

  const roleProfile = isStaff
    ? staffProfile
    : isExpert
      ? expertProfile
      : isTeacher
        ? teacherProfile
        : null;

  const isRoleProfileLoading = (isStaff && !staffProfile && isStaffProfileLoading)
    || (isExpert && !expertProfile && isExpertProfileLoading)
    || (isTeacher && !teacherProfile && isTeacherProfileLoading);

  const isProfileLoading = isRoleProfileLoading || (isMeLoading && !user && !meData?.result);

  const baseInfo = (user ?? meData?.result ?? null) as ({
    userId?: number;
    userCode?: string | null;
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    username?: string | null;
    role?: { roleName?: string | null };
    status?: number;
    expertId?: number | null;
    expertIsVerified?: boolean | null;
  } | null);

  const info = {
    ...(baseInfo ?? {}),
    fullName: roleProfile?.fullName ?? baseInfo?.fullName ?? null,
    email: roleProfile?.email ?? baseInfo?.email ?? null,
    phoneNumber: roleProfile?.phoneNumber ?? baseInfo?.phoneNumber ?? null,
    avatarUrl: roleProfile?.avatarUrl ?? baseInfo?.avatarUrl ?? null,
  };

  const roleExtraLabel = isStaff ? 'Phòng ban' : isTeacher ? 'Trường học' : isExpert ? 'Giới thiệu' : null;
  const roleExtraValue = isStaff
    ? (staffProfile?.department ?? null)
    : isTeacher
      ? (teacherProfile?.schoolName ?? null)
      : isExpert
        ? (expertProfile?.bio ?? null)
        : null;
  const staffHireDate = isStaff ? formatIsoDate(staffProfile?.hireDate) : null;
  const expertUserCode = isExpert
    ? (expertProfile?.userCode ?? baseInfo?.userCode ?? null)
    : null;
  const expertVerificationText = isExpert
    ? (expertProfile?.isVerified == null
      ? null
      : expertProfile.isVerified
        ? 'Đã xác minh'
        : 'Chưa xác minh')
    : null;

  const expertIsVerified = isExpert && Boolean(
    expertProfile?.isVerified ?? (baseInfo as { expertIsVerified?: boolean | null } | null)?.expertIsVerified,
  );

  // ── Change password ───────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurr,  setShowCurr]  = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError,   setPwError]   = useState<string | null>(null);
  const changePassword = useChangePasswordService();
  const strength       = passwordStrength(newPw);
  // ── Edit profile ─────────────────────────────────────────────────────────────────────
  const [isEditing,      setIsEditing]      = useState(false);
  const [editFullName,   setEditFullName]   = useState('');
  const [editPhone,      setEditPhone]      = useState('');
  const [editAvatarUrl,  setEditAvatarUrl]  = useState('');
  const [editRoleExtra,  setEditRoleExtra]  = useState('');
  const updateMe = useUpdateMeService();
  const updateExpertProfile = useUpdateExpertProfile();
  const updateStaffProfile = useUpdateStaffProfile();
  const updateTeacherProfile = useUpdateTeacherProfile();
  const canUpdateAvatar = !isStaff && !isTeacher && !isExpert;
  const profileUpdatePending =
    updateMe.isPending ||
    updateExpertProfile.isPending ||
    updateStaffProfile.isPending ||
    updateTeacherProfile.isPending;
  const [avatarImgError, setAvatarImgError] = useState(false);
  useEffect(() => { setAvatarImgError(false); }, [info?.avatarUrl]);
  const [avatarLocalPreview, setAvatarLocalPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

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

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarLocalPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to GCS
    setAvatarUploading(true);
    uploadAvatarToGcs(file, info?.userId)
      .then((publicUrl) => {
        setEditAvatarUrl(publicUrl);
      })
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

    const fullName = editFullName.trim();
    const phoneNumber = editPhone.trim();
    const avatarUrl = editAvatarUrl.trim();
    const roleExtra = editRoleExtra.trim();

    const handleSuccess = (nextUser?: unknown) => {
      if (nextUser && typeof nextUser === 'object') {
        setUser(nextUser as AuthUserInfo);
      } else if (baseInfo) {
        setUser({
          ...baseInfo,
          fullName,
          phoneNumber,
          avatarUrl: canUpdateAvatar ? avatarUrl : (baseInfo.avatarUrl ?? null),
        } as AuthUserInfo);
      }
      notify.success('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
    };

    const handleError = (err: unknown) => {
      const responseMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const genericMsg = err instanceof Error ? err.message : null;
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
          onSuccess: () => {
            void refetchExpertProfile();
            handleSuccess();
          },
          onError: handleError,
        },
      );
      return;
    }

    updateMe.mutate(
      { fullName, phoneNumber, avatarUrl },
      {
        onSuccess: (res) => handleSuccess(res?.result),
        onError: handleError,
      },
    );
  };
  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp.'); return; }
    if (newPw.length < 8)   { setPwError('Mật khẩu mới cần ít nhất 8 ký tự.'); return; }
    changePassword.mutate(
      { currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw },
      {
        onSuccess: () => {
          notify.success('Đổi mật khẩu thành công!');
          setPwSuccess(true);
          setCurrentPw(''); setNewPw(''); setConfirmPw('');
          setTimeout(() => setPwSuccess(false), 4000);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setPwError(msg ?? 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
        },
      },
    );
  };

  // ── Certificate (expert only) ─────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: verifications = [], isLoading: certLoading, isError: certError } = useVerifications();
  const submitVerification = useSubmitVerification();
  const deleteVerification = useDeleteVerification();
  const [showCertForm,  setShowCertForm]  = useState(false);
  const [certFile,      setCertFile]      = useState<File | null>(null);
  const [certFileType,  setCertFileType]  = useState('degree');
  const [certDesc,      setCertDesc]      = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openingCertFile, setOpeningCertFile] = useState(false);

  // ── Payment ──────────────────────────────────────────────────────────────
  const [topUpAmount, setTopUpAmount] = useState('10000');
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('200000');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [withdrawOtp, setWithdrawOtp] = useState('');
  const [withdrawStep, setWithdrawStep] = useState<'form' | 'otp'>('form');
  const [withdrawHint, setWithdrawHint] = useState<string | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans({ enabled: !isStaff });
  const {
    data: wallet,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useWalletInfo({ enabled: !isStaff });
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(1, 10, { enabled: !isStaff });
  const { data: userQuota, isLoading: quotaLoading } = useUserQuota({ enabled: !isStaff });
  const topUpWallet = useTopUpWallet();
  const verifyTopUp = useVerifyTopUp();
  const buySubscription = useBuySubscription();
  const initiateWithdrawal = useInitiateWithdrawal();
  const confirmWithdrawal = useConfirmWithdrawalOtp();
  const { data: myWithdrawals, isLoading: myWithdrawalsLoading } = useMyWithdrawals(1, 10, {
    enabled: !isStaff && isExpert && expertIsVerified,
  });

  useEffect(() => {
    if (isStaff) return;

    const orderCodeRaw = searchParams.get('orderCode');
    if (!orderCodeRaw) return;
    const orderCode = Number(orderCodeRaw);
    if (!Number.isFinite(orderCode) || orderCode <= 0) return;
    if (verifyingOrder === orderCode) return;

    setVerifyingOrder(orderCode);
    setPaymentError(null);
    verifyTopUp.mutate(orderCode, {
      onSuccess: (result) => {
        setPaymentMessage(`Đã xác minh giao dịch #${result.orderCode} (${result.status}).`);
        void refetchWallet();
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setPaymentError(msg ?? 'Không thể xác minh giao dịch nạp tiền.');
      },
    });
  }, [searchParams, verifyTopUp, verifyingOrder, refetchWallet, isStaff]);

  const handleTopUp = () => {
    if (isStaff) return;

    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount < 10000) {
      setPaymentError('Số tiền nạp tối thiểu là 10.000.');
      return;
    }

    setPaymentError(null);
    setPaymentMessage(null);

    const returnUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/profile?tab=payment`
      : '/profile?tab=payment';

    topUpWallet.mutate(
      {
        amount,
        description: `Nap EduCoin ${amount}`,
        returnUrl,
        cancelUrl: returnUrl,
      },
      {
        onSuccess: (res) => {
          if (res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
            return;
          }
          setPaymentError('Không nhận được đường dẫn thanh toán từ hệ thống.');
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setPaymentError(msg ?? 'Tạo yêu cầu nạp tiền thất bại.');
        },
      },
    );
  };

  const handleBuyPlan = (planId: number) => {
    if (isStaff) return;

    setPaymentError(null);
    setPaymentMessage(null);

    buySubscription.mutate(planId, {
      onSuccess: (res) => {
        notify.success(`Mua gói ${res.planName} thành công!`);
        setPaymentMessage(`Mua gói ${res.planName} thành công. Số dư còn lại: ${formatEduCoin(res.walletBalanceAfter)}.`);
        void refetchWallet();
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setPaymentError(msg ?? 'Mua gói thất bại.');
      },
    });
  };

  const handleInitiateWithdrawal = () => {
    if (!isExpert) return;
    if (!expertIsVerified) {
      setPaymentError('Tài khoản Expert chưa được xác minh nên chưa thể rút tiền.');
      return;
    }

    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount < 200000) {
      setPaymentError('Số tiền rút tối thiểu là 200.000.');
      return;
    }
    if (!bankAccountNumber.trim() || !bankName.trim() || !accountHolderName.trim()) {
      setPaymentError('Vui lòng nhập đầy đủ thông tin ngân hàng để nhận OTP.');
      return;
    }

    setPaymentError(null);
    setPaymentMessage(null);
    setWithdrawHint(null);

    initiateWithdrawal.mutate(
      {
        bankAccountNumber: bankAccountNumber.trim(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        amount,
      },
      {
        onSuccess: () => {
          setWithdrawStep('otp');
          setWithdrawHint('Mã OTP đã được gửi đến email của bạn (hiệu lực 5 phút).');
          notify.success('Đã gửi OTP xác nhận rút tiền.');
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setPaymentError(msg ?? 'Không thể gửi OTP rút tiền. Vui lòng thử lại.');
        },
      },
    );
  };

  const handleConfirmWithdrawal = () => {
    if (!isExpert) return;
    if (!expertIsVerified) {
      setPaymentError('Tài khoản Expert chưa được xác minh nên chưa thể rút tiền.');
      return;
    }

    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount < 200000) {
      setPaymentError('Số tiền rút tối thiểu là 200.000.');
      return;
    }
    if (!withdrawOtp.trim()) {
      setPaymentError('Vui lòng nhập OTP để xác nhận rút tiền.');
      return;
    }

    setPaymentError(null);
    setPaymentMessage(null);

    confirmWithdrawal.mutate(
      {
        bankAccountNumber: bankAccountNumber.trim(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        amount,
        otpCode: withdrawOtp.trim(),
      },
      {
        onSuccess: () => {
          setPaymentMessage('Tạo yêu cầu rút tiền thành công. Số dư tương ứng đã được freeze chờ admin duyệt.');
          setWithdrawOtp('');
          setWithdrawStep('form');
          setWithdrawHint(null);
          notify.success('Yêu cầu rút tiền đã được tạo.');
          void refetchWallet();
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setPaymentError(msg ?? 'OTP không hợp lệ hoặc đã hết hạn.');
        },
      },
    );
  };

  const handleCertSubmit = () => {
    if (!certFile) return;
    const expertId = (info as { expertId?: number | null } | null)?.expertId;
    if (!expertId) {
      notify.error('Tài khoản chưa có hồ sơ Expert trong hệ thống. Vui lòng đăng xuất/đăng nhập lại hoặc liên hệ admin.');
      return;
    }
    submitVerification.mutate(
      { file: certFile, fileType: certFileType, description: certDesc || undefined },
      {
        onSuccess: () => {
          notify.success('Nộp hồ sơ thành công! Đang chờ phê duyệt.');
          setCertFile(null); setCertDesc(''); setCertFileType('degree');
          setShowCertForm(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (err: unknown) => {
          const responseData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
          const msg = responseData?.message;
          const firstValidationError = responseData?.errors
            ? Object.values(responseData.errors).flat()[0]
            : undefined;
          const rawError = (firstValidationError ?? msg ?? '').toString().toLowerCase();
          if (rawError.includes('expert') && rawError.includes('không tồn tại')) {
            notify.error('Backend chưa có bản ghi Expert cho tài khoản này. Vui lòng liên hệ admin để tạo hồ sơ Expert hoặc đăng nhập lại để cập nhật claim.');
            return;
          }
          notify.error(firstValidationError ?? msg ?? 'Upload chứng chỉ thất bại. Vui lòng thử lại.');
        },
      },
    );
  };

  const handleCertDelete = (code: string) => {
    deleteVerification.mutate(code, {
      onSuccess: () => { setConfirmDelete(null); notify.success('Đã xóa hồ sơ thành công'); },
    });
  };

  const handleOpenCertFile = async () => {
    if (!cert) return;

    try {
      setOpeningCertFile(true);
      const { blob } = await getVerificationFile(cert.verificationCode, cert.fileUrl);
      const url = URL.createObjectURL(blob);

      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        const fallbackLink = document.createElement('a');
        fallbackLink.href = url;
        fallbackLink.download = `${cert.verificationCode}`;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        fallbackLink.remove();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify.error(msg ?? 'Không thể mở file chứng chỉ. Vui lòng thử lại.');
    } finally {
      setOpeningCertFile(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayName = info?.fullName || info?.username || 'Tài khoản';
  const initial     = displayName.charAt(0).toUpperCase();
  const roleLabel   = info?.role?.roleName ?? toRoleDisplayName(effectiveRole);
  const isActive    = info?.status === 1;
  const cert        = verifications[0] ?? null;
  const certStatus  = normalizeVerificationStatus(cert?.status);

  // ── Slides / Videos / Library data ────────────────────────────────────────
  const { data: allProducts = [], isLoading: slidesLoading } = useAllProducts();
  const { data: allVideos = [], isLoading: videosLoading } = useAllVideos();
  const { data: purchasedMaterials = [], isLoading: libLoading } = usePurchasedMaterials();
  const mySlides = allProducts.filter((p) => p.hasSlide);
  const myVideos = allVideos.filter((v) => v.status === 'completed');

  const [viewSlideLoading, setViewSlideLoading] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoProductDto | null>(null);

  const handleViewSlide = async (productCode: string, hasEditedSlide: boolean) => {
    setViewSlideLoading(productCode);
    try {
      let slideDoc;
      if (hasEditedSlide) {
        const r = await productService.getProductEditedSlide(productCode);
        slideDoc = r.slideEditedDocument;
      } else {
        const r = await productService.getProductSlide(productCode);
        slideDoc = r.slideDocument;
      }
      setDocument(slideDoc, productCode, '', hasEditedSlide);
      router.push('/teacher/editor');
    } catch { notify.error('Không thể mở slide. Vui lòng thử lại.'); }
    finally { setViewSlideLoading(null); }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile',  label: 'Hồ sơ',    icon: User       },
    { key: 'security', label: 'Bảo mật',  icon: LockKeyhole},
    ...(!isStaff ? [{ key: 'payment' as Tab, label: 'Thanh toán', icon: Wallet }] : []),
    ...(isExpert ? [{ key: 'withdrawal' as Tab, label: 'Rút tiền', icon: CreditCard }] : []),
    ...(isTeacher ? [
      { key: 'slides'  as Tab, label: 'Slide', icon: Layers  },
      { key: 'videos'  as Tab, label: 'Video', icon: Film    },
      { key: 'library' as Tab, label: 'Thư viện', icon: Library },
    ] : []),
    ...(isExpert ? [{ key: 'certificate' as Tab, label: 'Chứng chỉ', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      {/* ── Hero ── */}
      <div className="max-w-4xl mx-auto px-6 mt-4">
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">

          {/* Cover banner */}
          <div className="h-28 bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-700 relative">
            {/* subtle dot pattern overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          {/* Profile info row */}
          <div className="bg-white px-8 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative group flex-shrink-0 -mt-10">
                {info?.avatarUrl && !avatarImgError ? (
                  <img
                    src={info.avatarUrl}
                    alt={displayName}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                    onError={() => setAvatarImgError(true)}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg select-none">
                    {isProfileLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : initial}
                  </div>
                )}
                {/* <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-gray-500" />
                </div> */}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 pt-3 sm:pt-0 pb-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">{displayName}</h1>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Không hoạt động
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  {info?.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {info.email}
                    </span>
                  )}
                  {info?.phoneNumber && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {info.phoneNumber}
                    </span>
                  )}
                  {roleLabel && (
                    <span className="flex items-center gap-1.5 font-medium text-blue-600">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {roleLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quota summary — teacher only */}
            {isTeacher && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pb-3 border-b border-gray-100 -mx-8 px-8">
                {quotaLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : userQuota ? (
                  <>
                    {[
                      { label: 'Phân tích', available: userQuota.availableAnalysisQuota, total: userQuota.totalAnalysisQuota, color: 'bg-blue-100 text-blue-700' },
                      { label: 'Slide', available: userQuota.availableSlideQuota, total: userQuota.totalSlideQuota, color: 'bg-violet-100 text-violet-700' },
                      { label: 'Video', available: userQuota.availableVideoQuota, total: userQuota.totalVideoQuota, color: 'bg-rose-100 text-rose-700' },
                      { label: 'Game', available: userQuota.availableGameQuota, total: userQuota.totalGameQuota, color: 'bg-amber-100 text-amber-700' },
                    ].map((q) => (
                      <span key={q.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${q.color}`}>
                        <span className="font-semibold">{q.available.toLocaleString('vi-VN')}</span>
                        <span className="opacity-60">/</span>
                        <span className="opacity-70">{q.total.toLocaleString('vi-VN')}</span>
                        <span className="ml-0.5">{q.label}</span>
                      </span>
                    ))}
                  </>
                ) : null}
              </div>
            )}

            {/* Tab bar (underline style) */}
            <div className="flex items-center gap-0 mt-0 border-b border-gray-100 -mx-8 px-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors mr-1 ${
                      active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {active && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">

          {/* ════ Hồ sơ ════ */}
          {activeTab === 'profile' && (
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
          )}

          {/* ════ Bảo mật ════ */}
          {activeTab === 'security' && (
            <motion.div key="security"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="max-w-lg"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <LockKeyhole className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Đổi mật khẩu</h2>
                    <p className="text-xs text-gray-400">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                  </div>
                </div>

                <form onSubmit={handleChangePw} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
                    <PasswordInput value={currentPw} onChange={setCurrentPw} show={showCurr}
                      onToggle={() => setShowCurr(v => !v)} placeholder="Nhập mật khẩu hiện tại" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                    <PasswordInput value={newPw} onChange={setNewPw} show={showNew}
                      onToggle={() => setShowNew(v => !v)} placeholder="Tối thiểu 8 ký tự" />
                    {newPw && (
                      <div className="mt-2.5">
                        <div className="flex gap-1.5 mb-1">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              strength.level >= i ? strength.color : 'bg-gray-100'
                            }`} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          Độ mạnh: <span className={`font-semibold ${
                            strength.level === 1 ? 'text-red-500' :
                            strength.level === 2 ? 'text-amber-500' : 'text-emerald-600'
                          }`}>{strength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                    <PasswordInput value={confirmPw} onChange={setConfirmPw} show={showConf}
                      onToggle={() => setShowConf(v => !v)} placeholder="Nhập lại mật khẩu mới" />
                  </div>

                  <AnimatePresence>
                    {pwError && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {pwError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {pwSuccess && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2.5 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        Đổi mật khẩu thành công!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit"
                    disabled={changePassword.isPending || !currentPw || !newPw || !confirmPw}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {changePassword.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Đang cập nhật...</>
                    ) : (
                      <><Check className="w-4 h-4" />Cập nhật mật khẩu</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ════ Thanh toán ════ */}
          {!isStaff && activeTab === 'payment' && (
            <motion.div key="payment"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-1">
                  <p className="text-xs text-gray-500 mb-1">Số dư hiện tại</p>
                  {walletLoading ? (
                    <p className="text-2xl font-bold text-gray-900">...</p>
                  ) : walletError ? (
                    <>
                      <p className="text-sm font-medium text-red-600">Không tải được dữ liệu ví</p>
                      <button
                        onClick={() => void refetchWallet()}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Tải lại ví
                      </button>
                    </>
                  ) : wallet ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{formatEduCoin(wallet.balance)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Cập nhật: {wallet.lastUpdated ? new Date(wallet.lastUpdated).toLocaleString('vi-VN') : '—'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-amber-700">Ví chưa sẵn sàng</p>
                      <p className="text-xs text-gray-400 mt-1">Bạn có thể nạp tiền để hệ thống khởi tạo ví.</p>
                    </>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Nạp tiền vào ví</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="number"
                      min={10000}
                      step={1000}
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="Nhập số EduCoin muốn nạp"
                    />
                    <button
                      onClick={handleTopUp}
                      disabled={topUpWallet.isPending}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {topUpWallet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      {topUpWallet.isPending ? 'Đang tạo link...' : 'Nạp tiền'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Tối thiểu 10.000 EduCoin mỗi lần nạp.</p>
                </div>
              </div>


              <AnimatePresence>
                {paymentError && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {paymentError}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {paymentMessage && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {paymentMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Gói subscription</h3>
                  <p className="text-xs text-gray-500 mt-1">Xem và mua các gói EduCoin để sử dụng tính năng AI.</p>
                </div>
                <Link
                  href="/subscription"
                  className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  Xem bảng giá
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Lịch sử giao dịch gần đây</h3>
                </div>

                {txLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                ) : transactions?.items?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-5 py-3 text-left font-medium">Loại</th>
                          <th className="px-5 py-3 text-left font-medium">Số tiền</th>
                          <th className="px-5 py-3 text-left font-medium">Trạng thái</th>
                          <th className="px-5 py-3 text-left font-medium">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.items.map((tx) => (
                          <tr key={tx.transactionId} className="border-t border-gray-100">
                            <td className="px-5 py-3 text-gray-700">{tx.transactionType}</td>
                            <td className="px-5 py-3 text-gray-900 font-medium">{formatEduCoin(tx.amount)}</td>
                            <td className="px-5 py-3 text-gray-600">{tx.status}</td>
                            <td className="px-5 py-3 text-gray-500">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-10 text-sm text-gray-400 text-center">Chưa có giao dịch nào.</div>
                )}
              </div>

            </motion.div>
          )}

          {/* ════ Rút tiền ════ */}
          {isExpert && activeTab === 'withdrawal' && (
            <motion.div key="withdrawal"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {!expertIsVerified && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                  Tài khoản Expert của bạn chưa được xác minh nên chưa thể sử dụng chức năng rút tiền.
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Rút tiền cho chuyên gia</h3>
                <p className="text-xs text-gray-500">Bước 1: nhập thông tin ngân hàng và số tiền để nhận OTP. Bước 2: nhập OTP để tạo yêu cầu rút.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Tên ngân hàng"
                  />
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Chủ tài khoản"
                  />
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Số tài khoản"
                  />
                  <input
                    type="number"
                    min={200000}
                    step={1000}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Số tiền rút (>= 200.000)"
                  />
                </div>

                {withdrawStep === 'otp' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={withdrawOtp}
                      onChange={(e) => setWithdrawOtp(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="Nhập OTP xác nhận"
                    />
                    <button
                      onClick={handleConfirmWithdrawal}
                      disabled={confirmWithdrawal.isPending}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {confirmWithdrawal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Xác nhận OTP
                    </button>
                  </div>
                )}

                {withdrawHint && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{withdrawHint}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleInitiateWithdrawal}
                    disabled={initiateWithdrawal.isPending}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {initiateWithdrawal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {initiateWithdrawal.isPending ? 'Đang gửi OTP...' : 'Gửi OTP rút tiền'}
                  </button>
                  {withdrawStep === 'otp' && (
                    <button
                      onClick={() => {
                        setWithdrawStep('form');
                        setWithdrawOtp('');
                        setWithdrawHint(null);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Hủy OTP
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {paymentError && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {paymentError}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {paymentMessage && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {paymentMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Lịch sử rút tiền</h3>
                </div>

                {myWithdrawalsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                ) : myWithdrawals?.items?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-5 py-3 text-left font-medium">Số tiền</th>
                          <th className="px-5 py-3 text-left font-medium">Ngân hàng</th>
                          <th className="px-5 py-3 text-left font-medium">Trạng thái</th>
                          <th className="px-5 py-3 text-left font-medium">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myWithdrawals.items.map((wd) => (
                          <tr key={wd.withdrawalId} className="border-t border-gray-100">
                            <td className="px-5 py-3 text-gray-900 font-medium">{formatEduCoin(wd.amount)}</td>
                            <td className="px-5 py-3 text-gray-700">{wd.bankName} · {wd.bankAccountNumber}</td>
                            <td className="px-5 py-3 text-gray-600">{getWithdrawalStatusLabel(wd.status, wd.statusName)}</td>
                            <td className="px-5 py-3 text-gray-500">{wd.createdAt ? new Date(wd.createdAt).toLocaleString('vi-VN') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-10 text-sm text-gray-400 text-center">Chưa có yêu cầu rút tiền nào.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ Slide của tôi ════ */}
          {activeTab === 'slides' && isTeacher && (
            <motion.div key="slides"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Slide của tôi</h2>
                      <p className="text-xs text-gray-400">{slidesLoading ? '…' : `${mySlides.length} bộ slide`}</p>
                    </div>
                  </div>
                        <Link href="/teacher/slides" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                    Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {slidesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  </div>
                ) : mySlides.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Layers className="w-10 h-10 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Chưa có slide nào</p>
                    <p className="text-xs text-gray-400 mt-1">Tạo slide từ trang Dự án của bạn</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {mySlides.slice(0, 10).map((s) => (
                      <div key={s.productCode} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <Layers className="w-4 h-4 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.productName}</p>
                          <p className="text-xs text-gray-400">
                            {(s.slideEditedAt ?? s.slideGeneratedAt) ? new Date((s.slideEditedAt ?? s.slideGeneratedAt)!).toLocaleDateString('vi-VN') : '—'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewSlide(s.productCode, s.hasEditedSlide)}
                          disabled={viewSlideLoading === s.productCode}
                          className="px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors flex-shrink-0 disabled:opacity-40 flex items-center gap-1"
                        >
                          {viewSlideLoading === s.productCode && <Loader2 className="w-3 h-3 animate-spin" />}
                          Mở
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ Video của tôi ════ */}
          {activeTab === 'videos' && isTeacher && (
            <motion.div key="videos"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                      <Film className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Video của tôi</h2>
                      <p className="text-xs text-gray-400">{videosLoading ? '…' : `${myVideos.length} video`}</p>
                    </div>
                  </div>
                  <Link href="/teacher/videos" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {videosLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                  </div>
                ) : myVideos.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Film className="w-10 h-10 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Chưa có video nào</p>
                    <p className="text-xs text-gray-400 mt-1">Video được tạo qua Pipeline từ trang Dự án</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {myVideos.slice(0, 10).map((v) => (
                      <div key={v.productVideoCode} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                          <Film className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{v.productName}</p>
                          <p className="text-xs text-gray-400">{v.completedAt ? new Date(v.completedAt).toLocaleDateString('vi-VN') : new Date(v.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <button
                          onClick={() => setPlayingVideo(v)}
                          className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          Xem
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ Thư viện ════ */}
          {activeTab === 'library' && isTeacher && (
            <motion.div key="library"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Library className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Thư viện của tôi</h2>
                      <p className="text-xs text-gray-400">{libLoading ? '…' : `${purchasedMaterials.length} tài liệu`}</p>
                    </div>
                  </div>
                  <Link href="/teacher/material-lib" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {libLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                ) : purchasedMaterials.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Library className="w-10 h-10 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Thư viện trống</p>
                    <p className="text-xs text-gray-400 mt-1">Mua tài liệu từ Cửa hàng học liệu</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {purchasedMaterials.slice(0, 10).map((m) => (
                        <div key={m.materialCode} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                            <p className="text-xs text-gray-400">{m.expertName}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ Chứng chỉ ════ */}
          {activeTab === 'certificate' && isExpert && (
            <motion.div key="certificate"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-7 text-white shadow-xl shadow-blue-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.24),transparent_42%)]" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium mb-3">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Xác minh chuyên gia
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">Trung tâm Chứng chỉ</h2>
                  <p className="text-sm sm:text-base text-blue-100 mt-1.5 max-w-2xl">
                    Hồ sơ chứng chỉ giúp tăng độ tin cậy và mở quyền đăng học liệu lên nền tảng.
                  </p>
                </div>
                <div className="absolute -right-12 -top-12 w-44 h-44 bg-white/10 rounded-full" />
                <div className="absolute -right-10 -bottom-16 w-64 h-64 bg-white/10 rounded-full" />
              </div>

              {/* Loading */}
              {certLoading && (
                <div className="bg-white/90 backdrop-blur rounded-2xl border border-blue-100 shadow-sm flex items-center justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                </div>
              )}

              {/* Error */}
              {certError && (
                <div className="bg-white/90 backdrop-blur rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center py-16">
                  <AlertCircle className="w-10 h-10 text-red-300 mb-3" />
                  <p className="text-sm text-gray-500">Không thể tải thông tin chứng chỉ.</p>
                </div>
              )}

              {/* No cert → empty state or upload form */}
              {!certLoading && !certError && !cert && (
                <>
                  {!showCertForm ? (
                    <div className="bg-white/90 backdrop-blur rounded-3xl border border-blue-100 shadow-sm p-8 sm:p-10 text-center">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">Bạn chưa nộp chứng chỉ</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        Nộp chứng chỉ để hoàn tất hồ sơ chuyên gia và tăng độ tin cậy khi chia sẻ học liệu trên hệ thống.
                      </p>
                      <button
                        onClick={() => setShowCertForm(true)}
                        className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-lg shadow-blue-600/20"
                      >
                        <Upload className="w-4 h-4" />
                        Nộp chứng chỉ
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white/90 backdrop-blur rounded-3xl border border-blue-100 shadow-sm p-6 sm:p-7">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">Nộp hồ sơ chứng chỉ</h3>
                          <p className="text-xs text-gray-500">Bạn chỉ có thể duy trì một hồ sơ chứng chỉ đang hoạt động</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* Dropzone */}
                        <div className="lg:col-span-3">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Tệp chứng chỉ <span className="text-red-500">*</span>
                          </label>
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setCertFile(f); }}
                            className={`border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${
                              certFile ? 'border-blue-300 bg-blue-50' : 'border-blue-100 hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                          >
                            {certFile ? (
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-blue-700 truncate">{certFile.name}</p>
                                  <p className="text-xs text-blue-400">{(certFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setCertFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-600">Kéo thả hoặc nhấn để chọn file</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG · Tối đa 10 MB</p>
                              </div>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) setCertFile(f); }}
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Type + note */}
                        <div className="lg:col-span-2 space-y-4">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Loại chứng chỉ <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={certFileType}
                            onChange={(e) => setCertFileType(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                          >
                            {FILE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>

                          <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-3">
                            <p className="text-xs font-medium text-blue-700 mb-1">Lưu ý</p>
                            <p className="text-xs text-blue-600">Hệ thống ưu tiên file PDF rõ nét. Ảnh chụp cần hiển thị đầy đủ thông tin và không bị cắt góc.</p>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="lg:col-span-5">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">Mô tả</label>
                          <textarea
                            value={certDesc}
                            onChange={(e) => setCertDesc(e.target.value)}
                            placeholder="Mô tả ngắn về chứng chỉ..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                          />
                        </div>

                        {/* Buttons */}
                        <div className="lg:col-span-5 flex items-center gap-3 pt-1">
                          <button
                            onClick={handleCertSubmit}
                            disabled={!certFile || submitVerification.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-lg shadow-blue-600/20"
                          >
                            {submitVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {submitVerification.isPending ? 'Đang tải lên...' : 'Nộp chứng chỉ'}
                          </button>
                          <button
                            onClick={() => { setShowCertForm(false); setCertFile(null); setCertDesc(''); }}
                            className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Has cert → single status card */}
              {!certLoading && !certError && cert && (
                <div className="bg-white/90 backdrop-blur rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
                  <div className="p-6 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${(CERT_STATUS_CONFIG[certStatus] ?? CERT_STATUS_CONFIG[0]).bgColor}`}>
                          <ShieldCheck className={`w-5 h-5 ${(CERT_STATUS_CONFIG[certStatus] ?? CERT_STATUS_CONFIG[0]).textColor}`} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">Hồ sơ chứng chỉ hiện tại</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Nộp: {new Date(cert.uploadedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {cert.reviewedAt && ` · Duyệt: ${new Date(cert.reviewedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                          </p>
                        </div>
                      </div>
                      <CertStatusBadge status={cert.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">Loại chứng chỉ</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {FILE_TYPE_OPTIONS.find(o => o.value === cert.fileType)?.label ?? cert.fileType}
                        </p>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">Trạng thái</p>
                        <p className="text-sm font-semibold text-gray-800">{(CERT_STATUS_CONFIG[certStatus] ?? CERT_STATUS_CONFIG[0]).label}</p>
                      </div>
                      <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Mô tả</p>
                        <p className="text-sm text-gray-700">{cert.description?.trim() || 'Không có mô tả bổ sung.'}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <button
                        onClick={handleOpenCertFile}
                        disabled={openingCertFile}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {openingCertFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        {openingCertFile ? 'Đang mở file...' : 'Xem file đã nộp'}
                      </button>
                    </div>

                    {cert.rejectionReason && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl mb-4">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-700 mb-0.5">Lý do từ chối</p>
                          <p className="text-xs text-red-600">{cert.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {certStatus === 1 && (
                      <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <p className="text-xs sm:text-sm font-medium text-emerald-700">Chứng chỉ đã được xác minh. Tài khoản của bạn đủ điều kiện đăng tải học liệu.</p>
                      </div>
                    )}

                    {certStatus !== 1 && (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {confirmDelete === cert.verificationCode ? (
                          <>
                            <span className="text-xs text-gray-500">Xác nhận rút lại chứng chỉ?</span>
                            <button
                              onClick={() => handleCertDelete(cert.verificationCode)}
                              disabled={deleteVerification.isPending}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              {deleteVerification.isPending ? 'Đang xoá...' : 'Xác nhận xóa'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Huỷ
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(cert.verificationCode)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Rút lại chứng chỉ
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

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

function PasswordInput({
  value, onChange, show, onToggle, placeholder,
}: {
  value: string; onChange: (val: string) => void; show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
      />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
