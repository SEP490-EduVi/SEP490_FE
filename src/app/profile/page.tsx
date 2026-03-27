'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShieldCheck, CheckCircle,
  Eye, EyeOff, Loader2, AlertCircle, Camera,
  Upload, Trash2, FileText, Clock, CheckCircle2, XCircle,
  Mail, Phone, BadgeCheck, Activity, KeyRound, LockKeyhole, Wallet, CreditCard,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetMeService, useChangePasswordService } from '@/services/authServices';
import { useVerifications, useSubmitVerification, useDeleteVerification } from '@/hooks/useExpertApi';
import { useBuySubscription, useSubscriptionPlans, useTopUpWallet, useVerifyTopUp, useWalletInfo, useWalletTransactions } from '@/hooks/usePaymentApi';
import AppHeader from '@/components/sidebar/AppHeader';

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'security' | 'payment' | 'certificate';

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

  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp.'); return; }
    if (newPw.length < 8)   { setPwError('Mật khẩu mới cần ít nhất 8 ký tự.'); return; }
    changePassword.mutate(
      { currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw },
      {
        onSuccess: () => {
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
  const [topUpAmount, setTopUpAmount] = useState('100000');
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<number | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWalletInfo();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(1, 10);
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
        setPaymentMessage(`Mua gói ${res.planName} thành công. Số dư còn lại: ${res.walletBalanceAfter.toLocaleString('vi-VN')} EduCoin.`);
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
          setCertFile(null); setCertDesc(''); setCertFileType('degree');
          setShowCertForm(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      },
    );
  };

  const handleCertDelete = (code: string) => {
    deleteVerification.mutate(code, { onSuccess: () => setConfirmDelete(null) });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayName = info?.fullName || info?.username || 'Tài khoản';
  const initial     = displayName.charAt(0).toUpperCase();
  const roleLabel   = info?.role?.roleName ?? '';
  const isExpert    = role === 'expert';
  const isActive    = info?.status === 1;

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
          <div className="h-36 bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-700 relative">
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
          <div className="bg-white px-8 py-10 -mt-12 rounded-t-2xl shadow-lg relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12-">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                {info?.avatarUrl ? (
                  <img
                    src={info.avatarUrl}
                    alt={displayName}
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white shadow-lg">
                    {isMeLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : initial}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 pb-1">
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

            {/* Tab bar (underline style) */}
            <div className="flex items-center gap-0 mt-6 border-b border-gray-100 -mx-8 px-8">
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
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Thông tin cá nhân</h2>
                    <p className="text-xs text-gray-400">Chi tiết tài khoản của bạn</p>
                  </div>
                </div>

                {isMeLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
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
                      <InfoField
                        icon={Activity}
                        label="Trạng thái"
                        value={isActive ? 'Hoạt động' : 'Không hoạt động'}
                        highlight={isActive}
                      />
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
                      <><KeyRound className="w-4 h-4" />Cập nhật mật khẩu</>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {walletLoading ? '...' : `${(wallet?.balance ?? 0).toLocaleString('vi-VN')} EduCoin`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cập nhật: {wallet?.lastUpdated ? new Date(wallet.lastUpdated).toLocaleString('vi-VN') : '—'}
                  </p>
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
                      placeholder="Nhập số tiền (VND)"
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
                  <p className="text-xs text-gray-400 mt-2">Tối thiểu 10.000 VND mỗi lần nạp.</p>
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
                  <h3 className="text-sm font-semibold text-gray-900">Gói subscription</h3>
                  <p className="text-xs text-gray-400 mt-1">Chọn gói để mua bằng EduCoin trong ví.</p>
                </div>

                {plansLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.filter((p) => p.isActive).map((plan) => (
                      <div key={plan.planId} className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm font-semibold text-gray-900">{plan.planName}</p>
                        <p className="text-xs text-gray-500 mt-1 min-h-8">{plan.description || 'Không có mô tả'}</p>
                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                          <p>Giá: <span className="font-semibold text-gray-900">{plan.price.toLocaleString('vi-VN')} EduCoin</span></p>
                          <p>Thời hạn: {plan.durationDays} ngày</p>
                          <p>Quota: {plan.quotaAmount.toLocaleString('vi-VN')}</p>
                        </div>
                        <button
                          onClick={() => handleBuyPlan(plan.planId)}
                          disabled={buySubscription.isPending || role !== 'teacher'}
                          className="mt-4 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {buySubscription.isPending ? 'Đang xử lý...' : role !== 'teacher' ? 'Chỉ dành cho giáo viên' : 'Mua gói'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                            <td className="px-5 py-3 text-gray-900 font-medium">{tx.amount.toLocaleString('vi-VN')}</td>
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
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Tổng nộp',   value: verifications.length,
                    icon: FileText,    bg: 'bg-blue-50',    text: 'text-blue-600' },
                  { label: 'Chờ duyệt',  value: verifications.filter(v => v.status === 'pending').length,
                    icon: Clock,       bg: 'bg-amber-50',   text: 'text-amber-600' },
                  { label: 'Đã duyệt',   value: verifications.filter(v => v.status === 'approved').length,
                    icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { label: 'Từ chối',    value: verifications.filter(v => v.status === 'rejected').length,
                    icon: XCircle,     bg: 'bg-red-50',     text: 'text-red-600' },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                        <Icon className={`w-4.5 h-4.5 ${s.text}`} style={{ width: 18, height: 18 }} />
                      </div>
                      <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Header row with action */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Danh sách chứng chỉ</h2>
                <button
                  onClick={() => setShowCertForm(s => !s)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all text-sm font-medium shadow-lg shadow-blue-600/20"
                >
                  <Upload className="w-4 h-4" />
                  Nộp chứng chỉ
                </button>
              </div>

              {/* Upload form */}
              <AnimatePresence>
                {showCertForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5"
                  >
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Nộp chứng chỉ mới</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Tệp chứng chỉ <span className="text-red-500">*</span>
                          </label>
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) setCertFile(f); }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                            {certFile && (
                              <p className="mt-2 text-xs text-blue-600 font-medium">
                                {certFile.name} · {(certFile.size / 1024).toFixed(0)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Loại chứng chỉ <span className="text-red-500">*</span>
                            </label>
                            <select value={certFileType} onChange={(e) => setCertFileType(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            >
                              {FILE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
                            <input type="text" value={certDesc} onChange={(e) => setCertDesc(e.target.value)}
                              placeholder="Mô tả ngắn..."
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <button onClick={handleCertSubmit}
                            disabled={!certFile || submitVerification.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-lg shadow-blue-600/20"
                          >
                            {submitVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {submitVerification.isPending ? 'Đang tải lên...' : 'Nộp chứng chỉ'}
                          </button>
                          <button onClick={() => { setShowCertForm(false); setCertFile(null); setCertDesc(''); }}
                            className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                          >Huỷ</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  <p className="text-sm text-gray-500">Không thể tải danh sách chứng chỉ.</p>
                </div>
              )}

              {/* Empty */}
              {!certLoading && !certError && verifications.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-blue-300" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có chứng chỉ nào</h3>
                  <p className="text-sm text-gray-400 mb-5 max-w-xs">Nộp chứng chỉ để xác minh danh tính chuyên gia của bạn.</p>
                  <button onClick={() => setShowCertForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Nộp chứng chỉ đầu tiên
                  </button>
                </div>
              )}

              {/* List */}
              {!certLoading && !certError && verifications.length > 0 && (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {verifications.map((v) => {
                      const statusCfg = CERT_STATUS_CONFIG[v.status] ?? CERT_STATUS_CONFIG['pending'];
                      return (
                        <motion.div key={v.verificationCode} layout
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Status accent bar */}
                          <div className={`h-1 w-full ${
                            v.status === 'approved' ? 'bg-emerald-400' :
                            v.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                          }`} />
                          <div className="p-5 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusCfg.bgColor}`}>
                                <FileText className={`w-5 h-5 ${statusCfg.textColor}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {FILE_TYPE_OPTIONS.find(o => o.value === v.fileType)?.label ?? v.fileType}
                                  </p>
                                  <CertStatusBadge status={v.status} />
                                </div>
                                {v.description && (
                                  <p className="text-sm text-gray-500 line-clamp-1 mb-1">{v.description}</p>
                                )}
                                <p className="text-xs text-gray-400">
                                  Nộp: {new Date(v.uploadedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  {v.reviewedAt && (
                                    <span> · Duyệt: {new Date(v.reviewedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                  )}
                                </p>
                                {v.rejectionReason && (
                                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    {v.rejectionReason}
                                  </p>
                                )}
                              </div>
                            </div>

                            {confirmDelete === v.verificationCode ? (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => handleCertDelete(v.verificationCode)}
                                  disabled={deleteVerification.isPending}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                                >
                                  {deleteVerification.isPending ? 'Đang xoá...' : 'Xác nhận'}
                                </button>
                                <button onClick={() => setConfirmDelete(null)}
                                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                >Huỷ</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDelete(v.verificationCode)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
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
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
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
