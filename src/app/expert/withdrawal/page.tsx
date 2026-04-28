'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Building2,
  User,
  CreditCard,
  KeyRound,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Copy,
} from 'lucide-react';
import {
  useInitiateWithdrawal,
  useConfirmWithdrawalOtp,
  useMyWithdrawals,
  useWalletInfo,
} from '@/hooks/usePaymentApi';
import { notify } from '@/components/common';
import { AppHeader } from '@/components';
import type { WithdrawalDto } from '@/types/api';

// ── Constants ──────────────────────────────────────────────────────────────

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const MIN_AMOUNT = 200_000;
const MAX_BANK_ACCOUNT_LEN = 30;
const MAX_BANK_NAME_LEN = 100;
const MAX_HOLDER_NAME_LEN = 100;

// ── Helpers ────────────────────────────────────────────────────────────────

const formatVND = (n?: number | null) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const formatCountdown = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// Status (theo guide): 1=CONFIRMED (đang xử lý/amber), 2=SUCCESS (xanh), 3=REJECTED (đỏ)
const mapStatus = (status?: number | string | null) => {
  if (status === 1 || status === 'CONFIRMED') return { label: 'Đang xử lý', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', icon: Clock };
  if (status === 2 || status === 'SUCCESS')   return { label: 'Thành công',  color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2 };
  if (status === 3 || status === 'REJECTED')  return { label: 'Từ chối',     color: 'bg-red-50 text-red-700 ring-1 ring-red-200', icon: XCircle };
  return { label: 'Không rõ', color: 'bg-gray-100 text-gray-500', icon: Clock };
};

// ── Step 1 form ────────────────────────────────────────────────────────────

interface Step1Fields {
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  amount: string;
}

const EMPTY_STEP1: Step1Fields = {
  bankAccountNumber: '',
  bankName: '',
  accountHolderName: '',
  amount: '',
};

// ── OTP Countdown hook ─────────────────────────────────────────────────────

function useOtpCountdown(active: boolean) {
  const [remaining, setRemaining] = useState(OTP_TTL_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(OTP_TTL_SECONDS);
  }, []);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  return { remaining, expired: remaining === 0, start };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ExpertWithdrawalPage() {
  const { data: wallet } = useWalletInfo();
  const { data: withdrawalsResult, isLoading: historyLoading, refetch: refetchHistory } = useMyWithdrawals(1, 20);
  const withdrawals: WithdrawalDto[] = withdrawalsResult?.items ?? [];

  const initiateMutation = useInitiateWithdrawal();
  const confirmMutation = useConfirmWithdrawalOtp();

  // Wizard: 'form' | 'otp' | 'done'
  const [step, setStep] = useState<'form' | 'otp' | 'done'>('form');
  const [fields, setFields] = useState<Step1Fields>(EMPTY_STEP1);
  const [otp, setOtp] = useState('');
  const [lastWithdrawal, setLastWithdrawal] = useState<{ withdrawalId?: number; amount?: number } | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Step1Fields>>({});

  const { remaining, expired, start: startCountdown } = useOtpCountdown(step === 'otp');

  const amountNum = Number(fields.amount) || 0;
  const balance = wallet?.balance ?? 0;

  // ── Validation ─────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errs: Partial<Step1Fields> = {};
    if (!fields.bankName.trim()) errs.bankName = 'Tên ngân hàng không được để trống.';
    else if (fields.bankName.length > MAX_BANK_NAME_LEN) errs.bankName = `Tối đa ${MAX_BANK_NAME_LEN} ký tự.`;
    if (!fields.bankAccountNumber.trim()) errs.bankAccountNumber = 'Số tài khoản không được để trống.';
    else if (fields.bankAccountNumber.length > MAX_BANK_ACCOUNT_LEN) errs.bankAccountNumber = `Tối đa ${MAX_BANK_ACCOUNT_LEN} ký tự.`;
    if (!fields.accountHolderName.trim()) errs.accountHolderName = 'Tên chủ tài khoản không được để trống.';
    else if (fields.accountHolderName.length > MAX_HOLDER_NAME_LEN) errs.accountHolderName = `Tối đa ${MAX_HOLDER_NAME_LEN} ký tự.`;
    if (amountNum < MIN_AMOUNT) errs.amount = `Số tiền tối thiểu là ${formatVND(MIN_AMOUNT)}.`;
    else if (amountNum > balance) errs.amount = `Số dư không đủ. Hiện có: ${formatVND(balance)}.`;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Initiate ───────────────────────────────────────────────────────────

  const doInitiate = async () => {
    await initiateMutation.mutateAsync({
      bankAccountNumber: fields.bankAccountNumber.trim(),
      bankName: fields.bankName.trim(),
      accountHolderName: fields.accountHolderName.trim(),
      amount: amountNum,
    });
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await doInitiate();
      setOtp('');
      startCountdown();
      setStep('otp');
      notify.success('Mã OTP đã được gửi đến email của bạn.');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Không thể gửi yêu cầu. Vui lòng thử lại.';
      notify.error(msg);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────

  const handleResend = async () => {
    try {
      await doInitiate();
      setOtp('');
      startCountdown();
      notify.success('Mã OTP mới đã được gửi đến email của bạn.');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Không thể gửi lại OTP.';
      notify.error(msg);
    }
  };

  // ── Confirm OTP ────────────────────────────────────────────────────────

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) { notify.error('Vui lòng nhập mã OTP 6 chữ số.'); return; }
    if (expired) { notify.error('Mã OTP đã hết hạn. Vui lòng gửi lại.'); return; }
    try {
      const result = await confirmMutation.mutateAsync({
        bankAccountNumber: fields.bankAccountNumber.trim(),
        bankName: fields.bankName.trim(),
        accountHolderName: fields.accountHolderName.trim(),
        amount: amountNum,
        otpCode: otp.trim(),
      });
      setLastWithdrawal(result as unknown as { withdrawalId?: number; amount?: number });
      setStep('done');
      void refetchHistory();
      notify.success('Yêu cầu rút tiền đã được tạo thành công!');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'OTP không hợp lệ hoặc đã hết hạn.';
      notify.error(msg);
    }
  };

  const handleReset = () => {
    setStep('form');
    setFields(EMPTY_STEP1);
    setOtp('');
    setLastWithdrawal(null);
    setFormErrors({});
  };

  const setField = (key: keyof Step1Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (formErrors[key]) setFormErrors((p) => ({ ...p, [key]: undefined }));
  };

  const inputCls = (err?: string) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
      err ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
    }`;

  const stepsConfig = [
    { key: 'form', label: 'Nhập thông tin' },
    { key: 'otp',  label: 'Xác nhận OTP' },
    { key: 'done', label: 'Hoàn tất' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Rút tiền</h1>
          <p className="mt-1 text-sm text-slate-500">Gửi yêu cầu rút tiền từ ví EduCoin về tài khoản ngân hàng.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Sidebar ── */}
          <div className="space-y-4 lg:col-span-1">
            {/* Wallet balance */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5"><Wallet className="h-5 w-5" /></div>
                <span className="text-sm font-medium opacity-90">Số dư ví</span>
              </div>
              <p className="text-3xl font-bold">{formatVND(balance)}</p>
              <p className="mt-1 text-xs opacity-70">EduCoin khả dụng</p>
            </div>

            {/* Step indicator */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Tiến trình</p>
              {stepsConfig.map((s, i) => {
                const isActive = step === s.key;
                const stepIdx = stepsConfig.findIndex((x) => x.key === step);
                const isDone = i < stepIdx;
                return (
                  <div key={s.key} className="flex items-center gap-3 py-2">
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isDone ? 'bg-emerald-100 text-emerald-600' : isActive ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-300' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-sm ${isActive ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700 space-y-1.5">
              <p className="font-semibold">Lưu ý quan trọng</p>
              <p>• Số tiền tối thiểu: {formatVND(MIN_AMOUNT)}</p>
              <p>• Mã OTP có hiệu lực <strong>5 phút</strong></p>
              <p>• Tiền bị khóa tạm sau khi xác nhận OTP</p>
              <p>• Admin sẽ duyệt trong thời gian sớm nhất</p>
            </div>
          </div>

          {/* ── Wizard ── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <AnimatePresence mode="wait">

                {/* STEP 1: Form */}
                {step === 'form' && (
                  <motion.form key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    onSubmit={(e) => void handleInitiate(e)} className="space-y-5">
                    <h2 className="text-lg font-semibold text-slate-800">Thông tin rút tiền</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Bank name */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          <Building2 className="mr-1 inline h-4 w-4 text-slate-400" />
                          Tên ngân hàng <span className="text-red-500">*</span>
                        </label>
                        <input type="text" maxLength={MAX_BANK_NAME_LEN} placeholder="VD: Vietcombank, Techcombank..."
                          value={fields.bankName} onChange={setField('bankName')} className={inputCls(formErrors.bankName)} />
                        {formErrors.bankName && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{formErrors.bankName}</p>
                        )}
                      </div>

                      {/* Account number */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          <CreditCard className="mr-1 inline h-4 w-4 text-slate-400" />
                          Số tài khoản <span className="text-red-500">*</span>
                        </label>
                        <input type="text" maxLength={MAX_BANK_ACCOUNT_LEN} placeholder="VD: 1234567890"
                          value={fields.bankAccountNumber} onChange={setField('bankAccountNumber')} className={inputCls(formErrors.bankAccountNumber)} />
                        {formErrors.bankAccountNumber ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{formErrors.bankAccountNumber}</p>
                        ) : (
                          <p className="mt-0.5 text-right text-[10px] text-slate-400">{fields.bankAccountNumber.length}/{MAX_BANK_ACCOUNT_LEN}</p>
                        )}
                      </div>

                      {/* Holder */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          <User className="mr-1 inline h-4 w-4 text-slate-400" />
                          Chủ tài khoản <span className="text-red-500">*</span>
                        </label>
                        <input type="text" maxLength={MAX_HOLDER_NAME_LEN} placeholder="Tên chủ tài khoản"
                          value={fields.accountHolderName} onChange={setField('accountHolderName')} className={inputCls(formErrors.accountHolderName)} />
                        {formErrors.accountHolderName && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{formErrors.accountHolderName}</p>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          <Wallet className="mr-1 inline h-4 w-4 text-slate-400" />
                          Số tiền rút (₫) <span className="text-red-500">*</span>
                        </label>
                        <input type="number" min={MIN_AMOUNT} step={1000} placeholder={`Tối thiểu ${formatVND(MIN_AMOUNT)}`}
                          value={fields.amount} onChange={setField('amount')} className={inputCls(formErrors.amount)} />
                        {formErrors.amount ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{formErrors.amount}</p>
                        ) : amountNum > 0 ? (
                          <p className="mt-1 text-xs font-medium text-emerald-600">{formatVND(amountNum)}</p>
                        ) : null}
                      </div>
                    </div>

                    <button type="submit" disabled={initiateMutation.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
                      {initiateMutation.isPending
                        ? <><RefreshCw className="h-4 w-4 animate-spin" /> Đang gửi OTP...</>
                        : <>Gửi OTP <ChevronRight className="h-4 w-4" /></>}
                    </button>
                  </motion.form>
                )}

                {/* STEP 2: OTP */}
                {step === 'otp' && (
                  <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    onSubmit={(e) => void handleConfirm(e)} className="space-y-5">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setStep('form')}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <h2 className="text-lg font-semibold text-slate-800">Xác nhận OTP</h2>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600 space-y-1">
                      <p><span className="font-medium">Ngân hàng:</span> {fields.bankName}</p>
                      <p><span className="font-medium">Số TK:</span> {fields.bankAccountNumber} — <span className="font-medium">{fields.accountHolderName}</span></p>
                      <p><span className="font-medium">Số tiền:</span> <span className="font-semibold text-emerald-600">{formatVND(amountNum)}</span></p>
                    </div>

                    {/* OTP input + countdown */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">
                          <KeyRound className="mr-1 inline h-4 w-4 text-slate-400" />
                          Mã OTP (6 chữ số) <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-xs font-semibold tabular-nums ${expired ? 'text-red-500' : remaining < 60 ? 'text-orange-500' : 'text-slate-400'}`}>
                          {expired ? 'Hết hạn' : formatCountdown(remaining)}
                        </span>
                      </div>
                      <input
                        type="text" inputMode="numeric" maxLength={6} pattern="\d{6}"
                        placeholder="• • • • • •"
                        value={otp} disabled={expired}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={`w-full rounded-xl border px-4 py-3 text-center text-2xl font-bold tracking-widest outline-none transition focus:ring-2 ${
                          expired ? 'border-red-200 bg-red-50/50 text-red-400 cursor-not-allowed' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                        }`}
                      />
                      {/* Progress bar */}
                      {!expired && (
                        <div className="mt-2 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-linear ${remaining < 60 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                            style={{ width: `${(remaining / OTP_TTL_SECONDS) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Expired: resend */}
                    {expired ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-red-600"><AlertCircle className="mr-1 inline h-4 w-4" />Mã OTP đã hết hạn.</p>
                        <button type="button" disabled={initiateMutation.isPending} onClick={() => void handleResend()}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 whitespace-nowrap">
                          <RefreshCw className={`h-3.5 w-3.5 ${initiateMutation.isPending ? 'animate-spin' : ''}`} />
                          Gửi lại OTP
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Chưa nhận được? Gửi lại sau <span className={remaining < 60 ? 'font-semibold text-orange-500' : ''}>{formatCountdown(remaining)}</span>.
                      </p>
                    )}

                    <button type="submit" disabled={confirmMutation.isPending || otp.length !== 6 || expired}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
                      {confirmMutation.isPending
                        ? <><RefreshCw className="h-4 w-4 animate-spin" /> Đang xác nhận...</>
                        : <>Xác nhận rút tiền <CheckCircle2 className="h-4 w-4" /></>}
                    </button>
                  </motion.form>
                )}

                {/* STEP 3: Done */}
                {step === 'done' && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="rounded-full bg-emerald-100 p-5"><CheckCircle2 className="h-10 w-10 text-emerald-600" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Yêu cầu đã được gửi!</h2>
                      <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
                        Yêu cầu rút <span className="font-semibold text-emerald-600">{formatVND(lastWithdrawal?.amount)}</span> đã được tạo.
                        Admin sẽ duyệt trong thời gian sớm nhất.
                      </p>
                    </div>

                    {/* Tracking ID */}
                    {lastWithdrawal?.withdrawalId != null && (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                        <span className="text-xs text-slate-500">Mã yêu cầu:</span>
                        <span className="font-mono text-sm font-semibold text-slate-800">#{lastWithdrawal.withdrawalId}</span>
                        <button type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(String(lastWithdrawal.withdrawalId));
                            notify.success('Đã copy mã yêu cầu.');
                          }}
                          className="rounded p-0.5 text-slate-400 hover:text-slate-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3 mt-1">
                      <button type="button" onClick={handleReset}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                        Tạo yêu cầu mới
                      </button>
                      <button type="button"
                        onClick={() => {
                          void refetchHistory();
                          document.getElementById('withdrawal-history')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                        Xem lịch sử
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── History ── */}
        <div className="mt-10" id="withdrawal-history">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Lịch sử rút tiền</h2>
            <button type="button" onClick={() => void refetchHistory()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {historyLoading ? (
              <div className="flex items-center justify-center py-14">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : withdrawals.length === 0 ? (
              <p className="py-14 text-center text-sm text-slate-400">Chưa có yêu cầu rút tiền nào.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {['Mã', 'Số tiền', 'Ngân hàng', 'Trạng thái', 'Thời gian', 'Ghi chú Admin'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => {
                    const s = mapStatus(w.status);
                    const StatusIcon = s.icon;
                    return (
                      <tr key={w.withdrawalId} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">#{w.withdrawalId}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{formatVND(w.amount)}</td>
                        <td className="px-5 py-3 text-slate-600">
                          <p className="font-medium">{w.bankName}</p>
                          <p className="text-xs text-slate-400">{w.accountHolderName} · {w.bankAccountNumber}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>
                            <StatusIcon className="h-3 w-3" />{s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {w.adminNote ? <span className="text-red-600">{w.adminNote}</span> : <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
