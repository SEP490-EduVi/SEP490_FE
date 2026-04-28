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

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const MIN_AMOUNT = 200_000;
const MAX_BANK_ACCOUNT_LEN = 30;
const MAX_BANK_NAME_LEN = 100;
const MAX_HOLDER_NAME_LEN = 100;

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// Status (theo guide): 1=CONFIRMED (Ä‘ang xá»­ lÃ½/amber), 2=SUCCESS (xanh), 3=REJECTED (Ä‘á»)
const mapStatus = (status?: number | string | null) => {
  if (status === 1 || status === 'CONFIRMED') return { label: 'Äang xá»­ lÃ½', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', icon: Clock };
  if (status === 2 || status === 'SUCCESS')   return { label: 'ThÃ nh cÃ´ng',  color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2 };
  if (status === 3 || status === 'REJECTED')  return { label: 'Tá»« chá»‘i',     color: 'bg-red-50 text-red-700 ring-1 ring-red-200', icon: XCircle };
  return { label: 'KhÃ´ng rÃµ', color: 'bg-gray-100 text-gray-500', icon: Clock };
};

// â”€â”€ Step 1 form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ OTP Countdown hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const validateForm = (): boolean => {
    const errs: Partial<Step1Fields> = {};
    if (!fields.bankName.trim()) errs.bankName = 'TÃªn ngÃ¢n hÃ ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.';
    else if (fields.bankName.length > MAX_BANK_NAME_LEN) errs.bankName = `Tá»‘i Ä‘a ${MAX_BANK_NAME_LEN} kÃ½ tá»±.`;
    if (!fields.bankAccountNumber.trim()) errs.bankAccountNumber = 'Sá»‘ tÃ i khoáº£n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.';
    else if (fields.bankAccountNumber.length > MAX_BANK_ACCOUNT_LEN) errs.bankAccountNumber = `Tá»‘i Ä‘a ${MAX_BANK_ACCOUNT_LEN} kÃ½ tá»±.`;
    if (!fields.accountHolderName.trim()) errs.accountHolderName = 'TÃªn chá»§ tÃ i khoáº£n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.';
    else if (fields.accountHolderName.length > MAX_HOLDER_NAME_LEN) errs.accountHolderName = `Tá»‘i Ä‘a ${MAX_HOLDER_NAME_LEN} kÃ½ tá»±.`;
    if (amountNum < MIN_AMOUNT) errs.amount = `Sá»‘ tiá»n tá»‘i thiá»ƒu lÃ  ${formatVND(MIN_AMOUNT)}.`;
    else if (amountNum > balance) errs.amount = `Sá»‘ dÆ° khÃ´ng Ä‘á»§. Hiá»‡n cÃ³: ${formatVND(balance)}.`;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // â”€â”€ Initiate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      notify.success('MÃ£ OTP Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n email cá»§a báº¡n.');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'KhÃ´ng thá»ƒ gá»­i yÃªu cáº§u. Vui lÃ²ng thá»­ láº¡i.';
      notify.error(msg);
    }
  };

  // â”€â”€ Resend OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleResend = async () => {
    try {
      await doInitiate();
      setOtp('');
      startCountdown();
      notify.success('MÃ£ OTP má»›i Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n email cá»§a báº¡n.');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'KhÃ´ng thá»ƒ gá»­i láº¡i OTP.';
      notify.error(msg);
    }
  };

  // â”€â”€ Confirm OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) { notify.error('Vui lÃ²ng nháº­p mÃ£ OTP 6 chá»¯ sá»‘.'); return; }
    if (expired) { notify.error('MÃ£ OTP Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng gá»­i láº¡i.'); return; }
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
      notify.success('YÃªu cáº§u rÃºt tiá»n Ä‘Ã£ Ä‘Æ°á»£c táº¡o thÃ nh cÃ´ng!');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'OTP khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n.';
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
    { key: 'form', label: 'Nháº­p thÃ´ng tin' },
    { key: 'otp',  label: 'XÃ¡c nháº­n OTP' },
    { key: 'done', label: 'HoÃ n táº¥t' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">RÃºt tiá»n</h1>
          <p className="mt-1 text-sm text-slate-500">Gá»­i yÃªu cáº§u rÃºt tiá»n tá»« vÃ­ EduCoin vá» tÃ i khoáº£n ngÃ¢n hÃ ng.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* â”€â”€ Sidebar â”€â”€ */}
          <div className="space-y-4 lg:col-span-1">
            {/* Wallet balance */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5"><Wallet className="h-5 w-5" /></div>
                <span className="text-sm font-medium opacity-90">Sá»‘ dÆ° vÃ­</span>
              </div>
              <p className="text-3xl font-bold">{formatVND(balance)}</p>
              <p className="mt-1 text-xs opacity-70">EduCoin kháº£ dá»¥ng</p>
            </div>

            {/* Step indicator */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Tiáº¿n trÃ¬nh</p>
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
              <p className="font-semibold">LÆ°u Ã½ quan trá»ng</p>
              <p>â€¢ Sá»‘ tiá»n tá»‘i thiá»ƒu: {formatVND(MIN_AMOUNT)}</p>
              <p>â€¢ MÃ£ OTP cÃ³ hiá»‡u lá»±c <strong>5 phÃºt</strong></p>
              <p>â€¢ Tiá»n bá»‹ khÃ³a táº¡m sau khi xÃ¡c nháº­n OTP</p>
              <p>â€¢ Admin sáº½ duyá»‡t trong thá»i gian sá»›m nháº¥t</p>
            </div>
          </div>

          {/* â”€â”€ Wizard â”€â”€ */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <AnimatePresence mode="wait">

                {/* STEP 1: Form */}
                {step === 'form' && (
                  <motion.form key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    onSubmit={(e) => void handleInitiate(e)} className="space-y-5">
                    <h2 className="text-lg font-semibold text-slate-800">ThÃ´ng tin rÃºt tiá»n</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Bank name */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          <Building2 className="mr-1 inline h-4 w-4 text-slate-400" />
                          TÃªn ngÃ¢n hÃ ng <span className="text-red-500">*</span>
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
                          Sá»‘ tÃ i khoáº£n <span className="text-red-500">*</span>
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
                          Chá»§ tÃ i khoáº£n <span className="text-red-500">*</span>
                        </label>
                        <input type="text" maxLength={MAX_HOLDER_NAME_LEN} placeholder="TÃªn chá»§ tÃ i khoáº£n"
                          value={fields.accountHolderName} onChange={setField('accountHolderName')} className={inputCls(formErrors.accountHolderName)} />
                        {formErrors.accountHolderName && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{formErrors.accountHolderName}</p>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          <Wallet className="mr-1 inline h-4 w-4 text-slate-400" />
                          Sá»‘ tiá»n rÃºt (â‚«) <span className="text-red-500">*</span>
                        </label>
                        <input type="number" min={MIN_AMOUNT} step={1000} placeholder={`Tá»‘i thiá»ƒu ${formatVND(MIN_AMOUNT)}`}
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
                        ? <><RefreshCw className="h-4 w-4 animate-spin" /> Äang gá»­i OTP...</>
                        : <>Gá»­i OTP <ChevronRight className="h-4 w-4" /></>}
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
                      <h2 className="text-lg font-semibold text-slate-800">XÃ¡c nháº­n OTP</h2>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600 space-y-1">
                      <p><span className="font-medium">NgÃ¢n hÃ ng:</span> {fields.bankName}</p>
                      <p><span className="font-medium">Sá»‘ TK:</span> {fields.bankAccountNumber} â€” <span className="font-medium">{fields.accountHolderName}</span></p>
                      <p><span className="font-medium">Sá»‘ tiá»n:</span> <span className="font-semibold text-emerald-600">{formatVND(amountNum)}</span></p>
                    </div>

                    {/* OTP input + countdown */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">
                          <KeyRound className="mr-1 inline h-4 w-4 text-slate-400" />
                          MÃ£ OTP (6 chá»¯ sá»‘) <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-xs font-semibold tabular-nums ${expired ? 'text-red-500' : remaining < 60 ? 'text-orange-500' : 'text-slate-400'}`}>
                          {expired ? 'Háº¿t háº¡n' : formatCountdown(remaining)}
                        </span>
                      </div>
                      <input
                        type="text" inputMode="numeric" maxLength={6} pattern="\d{6}"
                        placeholder="â€¢ â€¢ â€¢ â€¢ â€¢ â€¢"
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
                        <p className="text-sm text-red-600"><AlertCircle className="mr-1 inline h-4 w-4" />MÃ£ OTP Ä‘Ã£ háº¿t háº¡n.</p>
                        <button type="button" disabled={initiateMutation.isPending} onClick={() => void handleResend()}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 whitespace-nowrap">
                          <RefreshCw className={`h-3.5 w-3.5 ${initiateMutation.isPending ? 'animate-spin' : ''}`} />
                          Gá»­i láº¡i OTP
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        ChÆ°a nháº­n Ä‘Æ°á»£c? Gá»­i láº¡i sau <span className={remaining < 60 ? 'font-semibold text-orange-500' : ''}>{formatCountdown(remaining)}</span>.
                      </p>
                    )}

                    <button type="submit" disabled={confirmMutation.isPending || otp.length !== 6 || expired}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
                      {confirmMutation.isPending
                        ? <><RefreshCw className="h-4 w-4 animate-spin" /> Äang xÃ¡c nháº­n...</>
                        : <>XÃ¡c nháº­n rÃºt tiá»n <CheckCircle2 className="h-4 w-4" /></>}
                    </button>
                  </motion.form>
                )}

                {/* STEP 3: Done */}
                {step === 'done' && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="rounded-full bg-emerald-100 p-5"><CheckCircle2 className="h-10 w-10 text-emerald-600" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">YÃªu cáº§u Ä‘Ã£ Ä‘Æ°á»£c gá»­i!</h2>
                      <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
                        YÃªu cáº§u rÃºt <span className="font-semibold text-emerald-600">{formatVND(lastWithdrawal?.amount)}</span> Ä‘Ã£ Ä‘Æ°á»£c táº¡o.
                        Admin sáº½ duyá»‡t trong thá»i gian sá»›m nháº¥t.
                      </p>
                    </div>

                    {/* Tracking ID */}
                    {lastWithdrawal?.withdrawalId != null && (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                        <span className="text-xs text-slate-500">MÃ£ yÃªu cáº§u:</span>
                        <span className="font-mono text-sm font-semibold text-slate-800">#{lastWithdrawal.withdrawalId}</span>
                        <button type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(String(lastWithdrawal.withdrawalId));
                            notify.success('ÄÃ£ copy mÃ£ yÃªu cáº§u.');
                          }}
                          className="rounded p-0.5 text-slate-400 hover:text-slate-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3 mt-1">
                      <button type="button" onClick={handleReset}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                        Táº¡o yÃªu cáº§u má»›i
                      </button>
                      <button type="button"
                        onClick={() => {
                          void refetchHistory();
                          document.getElementById('withdrawal-history')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                        Xem lá»‹ch sá»­
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* â”€â”€ History â”€â”€ */}
        <div className="mt-10" id="withdrawal-history">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Lá»‹ch sá»­ rÃºt tiá»n</h2>
            <button type="button" onClick={() => void refetchHistory()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              <RefreshCw className="h-3.5 w-3.5" /> LÃ m má»›i
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {historyLoading ? (
              <div className="flex items-center justify-center py-14">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : withdrawals.length === 0 ? (
              <p className="py-14 text-center text-sm text-slate-400">ChÆ°a cÃ³ yÃªu cáº§u rÃºt tiá»n nÃ o.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {['MÃ£', 'Sá»‘ tiá»n', 'NgÃ¢n hÃ ng', 'Tráº¡ng thÃ¡i', 'Thá»i gian', 'Ghi chÃº Admin'].map((h) => (
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
                          <p className="text-xs text-slate-400">{w.accountHolderName} Â· {w.bankAccountNumber}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>
                            <StatusIcon className="h-3 w-3" />{s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN') : 'â€”'}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {w.adminNote ? <span className="text-red-600">{w.adminNote}</span> : <span className="text-slate-400">â€”</span>}
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
