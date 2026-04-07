'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShieldCheck, CheckCircle,
  Eye, EyeOff, Loader2, AlertCircle, Camera,
  Upload, Trash2, FileText, Clock, CheckCircle2, XCircle,
  Mail, Phone, BadgeCheck, LockKeyhole, Wallet, CreditCard,
  PencilLine, X, Check, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetMeService, useChangePasswordService, useUpdateMeService } from '@/services/authServices';
import { uploadAvatarToGcs } from '@/services/gcsServices';
import { useVerifications, useSubmitVerification, useDeleteVerification } from '@/hooks/useExpertApi';
import { useBuySubscription, useSubscriptionPlans, useTopUpWallet, useVerifyTopUp, useWalletInfo, useWalletTransactions, useUserQuota } from '@/hooks/usePaymentApi';
import AppHeader from '@/components/sidebar/AppHeader';
import { notify } from '@/components/common';

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'security' | 'payment' | 'certificate';

function formatEduCoin(value: number | null | undefined): string {
  const amount = Number.isFinite(value) ? Number(value) : 0;
  return `${amount.toLocaleString('vi-VN')} EduCoin`;
}

function formatQuota(value: number | null | undefined): string {
  const amount = Number.isFinite(value) ? Number(value) : 0;
  return amount.toLocaleString('vi-VN');
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
const CERT_STATUS_CONFIG: Record<string, { label: string; textColor: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  pending:  { label: 'Chờ duyệt', textColor: 'text-amber-700',   bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',   icon: Clock        },
  approved: { label: 'Đã duyệt',  textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: CheckCircle2  },
  rejected: { label: 'Từ chối',   textColor: 'text-red-700',     bgColor: 'bg-red-50',     borderColor: 'border-red-200',     icon: XCircle      },
};

const FILE_TYPE_OPTIONS = [
  { value: 'degree',          label: 'Bằng cấp'             },
  { value: 'certificate',     label: 'Chứng chỉ'            },
  { value: 'work_experience', label: 'Kinh nghiệm làm việc' },
  { value: 'other',           label: 'Khác'                 },
];

function CertStatusBadge({ status }: { status: string }) {
  const cfg = CERT_STATUS_CONFIG[status] ?? CERT_STATUS_CONFIG['pending'];
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
  const searchParams    = useSearchParams();
  const { user, role, setUser } = useAuthStore();

  const defaultTab = (): Tab => {
    const t = searchParams.get('tab');
    if (t === 'security')    return 'security';
    if (t === 'payment')     return 'payment';
    if (t === 'certificate') return 'certificate';
    return 'profile';
  };
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  // ── GET /me ──────────────────────────────────────────────────────────────
  const { data: meData, isLoading: isMeLoading } = useGetMeService({ enabled: true });
  useEffect(() => {
    if (meData?.result) setUser(meData.result);
  }, [meData, setUser]);
  const info = meData?.result ?? user;

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
  const updateMe = useUpdateMeService();
  const [avatarImgError, setAvatarImgError] = useState(false);
  useEffect(() => { setAvatarImgError(false); }, [info?.avatarUrl]);
  const [avatarLocalPreview, setAvatarLocalPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const openEdit = () => {
    setEditFullName(info?.fullName ?? '');
    setEditPhone(info?.phoneNumber ?? '');
    setEditAvatarUrl(info?.avatarUrl ?? '');
    setAvatarLocalPreview(null);
    setIsEditing(true);
  };

  const handleAvatarFileSelect = (file: File) => {
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
    updateMe.mutate(
      { fullName: editFullName.trim(), phoneNumber: editPhone.trim(), avatarUrl: editAvatarUrl.trim() },
      {
        onSuccess: (res) => {
          if (res?.result) setUser(res.result);
          notify.success('Cập nhật hồ sơ thành công!');
          setIsEditing(false);
          window.location.reload();
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          notify.error(msg ?? 'Cập nhật thất bại. Vui lòng thử lại.');
        },
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

  // ── Payment ──────────────────────────────────────────────────────────────
  const [topUpAmount, setTopUpAmount] = useState('10000');
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<number | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const {
    data: wallet,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useWalletInfo();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(1, 10);
  const { data: userQuota, isLoading: quotaLoading } = useUserQuota();
  const topUpWallet = useTopUpWallet();
  const verifyTopUp = useVerifyTopUp();
  const buySubscription = useBuySubscription();

  useEffect(() => {
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
  }, [searchParams, verifyTopUp, verifyingOrder, refetchWallet]);

  const handleTopUp = () => {
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

  const handleCertSubmit = () => {
    if (!certFile) return;
    submitVerification.mutate(
      { file: certFile, fileType: certFileType, description: certDesc || undefined },
      {
        onSuccess: () => {
          notify.success('Nộp hồ sơ thành công! Đang chờ phê duyệt.');
          setCertFile(null); setCertDesc(''); setCertFileType('degree');
          setShowCertForm(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      },
    );
  };

  const handleCertDelete = (code: string) => {
    deleteVerification.mutate(code, {
      onSuccess: () => { setConfirmDelete(null); notify.success('Đã xóa hồ sơ thành công'); },
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayName = info?.fullName || info?.username || 'Tài khoản';
  const initial     = displayName.charAt(0).toUpperCase();
  const roleLabel   = info?.role?.roleName ?? '';
  const isExpert    = role === 'expert';
  const isActive    = info?.status === 1;
  const cert        = verifications[0] ?? null;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile',  label: 'Hồ sơ',    icon: User       },
    { key: 'security', label: 'Bảo mật',  icon: LockKeyhole},
    { key: 'payment',  label: 'Thanh toán', icon: Wallet    },
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
                    {isMeLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : initial}
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
            {role === 'teacher' && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pb-3 border-b border-gray-100 -mx-8 px-8">
                {quotaLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : userQuota ? (
                  <>
                    {[
                      { label: 'Phân tích', available: userQuota.availableAnalysisQuota, total: userQuota.totalAnalysisQuota, color: 'bg-blue-100 text-blue-700' },
                      { label: 'Slide', available: userQuota.availableSlideQuota, total: userQuota.totalSlideQuota, color: 'bg-violet-100 text-violet-700' },
                      { label: 'Video', available: userQuota.availableVideoQuota, total: userQuota.totalVideoQuota, color: 'bg-rose-100 text-rose-700' },
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
                  {!isMeLoading && !isEditing && (
                    <button
                      onClick={openEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {isMeLoading ? (
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
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={updateMe.isPending || avatarUploading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {updateMe.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {updateMe.isPending ? 'Đang lưu...' : avatarUploading ? 'Đợi ảnh tải lên...' : 'Lưu thay đổi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAvatarLocalPreview(null); setAvatarUploading(false); setIsEditing(false); }}
                        disabled={updateMe.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
                    <div className="space-y-5 sm:pr-8">
                      <InfoField icon={User}     label="Họ và tên"     value={info?.fullName}    />
                      <InfoField icon={User}     label="Tên đăng nhập" value={info?.username}    />
                      <InfoField icon={Mail}     label="Email"         value={info?.email}       />
                    </div>
                    <div className="space-y-5 pt-5 sm:pt-0 sm:pl-8">
                      <InfoField icon={Phone}    label="Số điện thoại" value={info?.phoneNumber} />
                      {roleLabel && <InfoField icon={BadgeCheck} label="Vai trò" value={roleLabel} />}
                    </div>
                  </div>
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
          {activeTab === 'payment' && (
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

              {/* Quota section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Quota sử dụng</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {userQuota ? `Cập nhật: ${new Date(userQuota.updatedAt).toLocaleString('vi-VN')}` : 'Lượt dùng tính năng AI của bạn'}
                    </p>
                  </div>
                </div>
                {quotaLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                ) : userQuota ? (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Phân tích AI', total: userQuota.totalAnalysisQuota, available: userQuota.availableAnalysisQuota, used: userQuota.usedAnalysisQuota, color: 'blue' },
                      { label: 'Tạo Slide', total: userQuota.totalSlideQuota, available: userQuota.availableSlideQuota, used: userQuota.usedSlideQuota, color: 'violet' },
                      { label: 'Tạo Video', total: userQuota.totalVideoQuota, available: userQuota.availableVideoQuota, used: userQuota.usedVideoQuota, color: 'rose' },
                    ].map((q) => {
                      const pct = q.total > 0 ? Math.round((q.used / q.total) * 100) : 0;
                      const barColor = q.color === 'blue' ? 'bg-blue-500' : q.color === 'violet' ? 'bg-violet-500' : 'bg-rose-500';
                      const textColor = q.color === 'blue' ? 'text-blue-600' : q.color === 'violet' ? 'text-violet-600' : 'text-rose-600';
                      return (
                        <div key={q.label} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">{q.label}</span>
                            <span className={`text-xs font-semibold ${textColor}`}>{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2.5">
                            <div
                              className={`${barColor} h-2 rounded-full transition-all`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Còn lại: <span className="font-semibold text-gray-800">{q.available.toLocaleString('vi-VN')}</span></span>
                            <span>Tổng: {q.total.toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-6 py-6 text-sm text-gray-400">Không có dữ liệu quota.</p>
                )}
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

          {/* ════ Chứng chỉ ════ */}
          {activeTab === 'certificate' && isExpert && (
            <motion.div key="certificate"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              {/* Loading */}
              {certLoading && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                </div>
              )}

              {/* Error */}
              {certError && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16">
                  <AlertCircle className="w-10 h-10 text-red-300 mb-3" />
                  <p className="text-sm text-gray-500">Không thể tải thông tin chứng chỉ.</p>
                </div>
              )}

              {/* No cert → empty state or upload form */}
              {!certLoading && !certError && !cert && (
                <>
                  {!showCertForm ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-blue-300" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có chứng chỉ nào</h3>
                      <p className="text-sm text-gray-400 mb-5 max-w-xs">Nộp chứng chỉ để xác minh danh tính chuyên gia của bạn.</p>
                      <button
                        onClick={() => setShowCertForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-lg shadow-blue-600/20"
                      >
                        <Upload className="w-4 h-4" />
                        Nộp chứng chỉ
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Nộp chứng chỉ</h3>
                          <p className="text-xs text-gray-400">Mỗi chuyên gia chỉ được nộp một chứng chỉ</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Dropzone */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Tệp chứng chỉ <span className="text-red-500">*</span>
                          </label>
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setCertFile(f); }}
                            className={`border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${
                              certFile ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
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

                        {/* Type - full width */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Loại chứng chỉ <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={certFileType}
                            onChange={(e) => setCertFileType(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                          >
                            {FILE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>

                        {/* Description - full width textarea */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">Mô tả</label>
                          <textarea
                            value={certDesc}
                            onChange={(e) => setCertDesc(e.target.value)}
                            placeholder="Mô tả ngắn về chứng chỉ..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all resize-none"
                          />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3 pt-1">
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`h-1.5 w-full ${
                    cert.status === 'approved' ? 'bg-emerald-400' :
                    cert.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${(CERT_STATUS_CONFIG[cert.status] ?? CERT_STATUS_CONFIG['pending']).bgColor}`}>
                          <ShieldCheck className={`w-5 h-5 ${(CERT_STATUS_CONFIG[cert.status] ?? CERT_STATUS_CONFIG['pending']).textColor}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Chứng chỉ của bạn</h3>
                          <p className="text-xs text-gray-400">
                            Nộp: {new Date(cert.uploadedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {cert.reviewedAt && ` · Duyệt: ${new Date(cert.reviewedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                          </p>
                        </div>
                      </div>
                      <CertStatusBadge status={cert.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-medium text-gray-400 mb-0.5">Loại chứng chỉ</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {FILE_TYPE_OPTIONS.find(o => o.value === cert.fileType)?.label ?? cert.fileType}
                        </p>
                      </div>
                      {cert.description && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-medium text-gray-400 mb-0.5">Mô tả</p>
                          <p className="text-sm text-gray-700">{cert.description}</p>
                        </div>
                      )}
                    </div>

                    {cert.rejectionReason && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-4">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-700 mb-0.5">Lý do từ chối</p>
                          <p className="text-xs text-red-600">{cert.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {cert.status === 'approved' && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <p className="text-xs font-medium text-emerald-700">Chứng chỉ đã được xác minh. Bạn có thể đăng tài liệu lên nền tảng.</p>
                      </div>
                    )}

                    {cert.status !== 'approved' && (
                      <div className="mt-4 flex items-center gap-3">
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
