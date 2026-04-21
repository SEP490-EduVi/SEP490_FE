'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, CheckCircle, Mail,
} from 'lucide-react';
import {
  useConfirmWithdrawalOtp,
  useInitiateWithdrawal,
  useMyWithdrawals,
  useWalletInfo,
} from '@/hooks/usePaymentApi';
import { notify, MSGS } from '@/components/common';

function formatEduCoin(value: number | null | undefined): string {
  const amount = Number.isFinite(value) ? Number(value) : 0;
  return `${amount.toLocaleString('vi-VN')} EduCoin`;
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

export default function WithdrawalTab({
  isExpert,
  expertIsVerified,
}: {
  isExpert: boolean;
  expertIsVerified: boolean;
}) {
  const [withdrawAmount, setWithdrawAmount] = useState('200000');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [withdrawOtp, setWithdrawOtp] = useState('');
  const [withdrawStep, setWithdrawStep] = useState<'form' | 'otp'>('form');
  const [withdrawHint, setWithdrawHint] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const { refetch: refetchWallet } = useWalletInfo({ enabled: isExpert });
  const initiateWithdrawal = useInitiateWithdrawal();
  const confirmWithdrawal = useConfirmWithdrawalOtp();
  const { data: myWithdrawals, isLoading: myWithdrawalsLoading } = useMyWithdrawals(1, 10, {
    enabled: isExpert && expertIsVerified,
  });

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
          notify.success(MSGS.withdrawalRequest.otpSentSuccess);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          const text = msg ?? MSGS.withdrawalRequest.otpSentError;
          setPaymentError(text);
          notify.error(MSGS.withdrawalRequest.otpSentError);
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
          notify.success(MSGS.withdrawalRequest.confirmSuccess);
          void refetchWallet();
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          const text = msg ?? MSGS.withdrawalRequest.confirmError;
          setPaymentError(text);
          notify.error(MSGS.withdrawalRequest.confirmError);
        },
      },
    );
  };

  return (
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
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="Tên ngân hàng" />
          <input type="text" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="Chủ tài khoản" />
          <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="Số tài khoản" />
          <input type="number" min={200000} step={1000} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="Số tiền rút (>= 200.000)" />
        </div>

        {withdrawStep === 'otp' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={withdrawOtp} onChange={(e) => setWithdrawOtp(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Nhập OTP xác nhận" />
            <button onClick={handleConfirmWithdrawal} disabled={confirmWithdrawal.isPending}
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
          <button onClick={handleInitiateWithdrawal} disabled={initiateWithdrawal.isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {initiateWithdrawal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {initiateWithdrawal.isPending ? 'Đang gửi OTP...' : 'Gửi OTP rút tiền'}
          </button>
          {withdrawStep === 'otp' && (
            <button
              onClick={() => { setWithdrawStep('form'); setWithdrawOtp(''); setWithdrawHint(null); }}
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
  );
}
