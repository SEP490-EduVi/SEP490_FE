'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, CheckCircle, CreditCard, ArrowRight,
} from 'lucide-react';
import {
  useBuySubscription,
  useSubscriptionPlans,
  useTopUpWallet,
  useVerifyTopUp,
  useWalletInfo,
  useWalletTransactions,
} from '@/hooks/usePaymentApi';
import { notify, MSGS } from '@/components/common';

function formatEduCoin(value: number | null | undefined): string {
  const amount = Number.isFinite(value) ? Number(value) : 0;
  return `${amount.toLocaleString('vi-VN')} EduCoin`;
}

export default function PaymentTab({ isStaff }: { isStaff: boolean }) {
  const searchParams = useSearchParams();
  const [topUpAmount, setTopUpAmount] = useState('10000');
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<number | null>(null);

  const { data: wallet, isLoading: walletLoading, isError: walletError, refetch: refetchWallet } = useWalletInfo({ enabled: !isStaff });
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(1, 10, { enabled: !isStaff });
  const topUpWallet = useTopUpWallet();
  const verifyTopUp = useVerifyTopUp();

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
        const msg = MSGS.topUp.verifySuccess(result.orderCode, result.status);
        setPaymentMessage(`Đã xác minh giao dịch #${result.orderCode} (${result.status}).`);
        notify.success(msg);
        void refetchWallet();
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        const text = msg ?? MSGS.topUp.verifyError;
        setPaymentError(text);
        notify.error(text);
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
      { amount, description: `Nap EduCoin ${amount}`, returnUrl, cancelUrl: returnUrl },
      {
        onSuccess: (res) => {
          if (res.checkoutUrl) {
            notify.info(MSGS.topUp.redirecting);
            window.location.href = res.checkoutUrl;
            return;
          }
          const err = MSGS.topUp.noCheckoutUrl;
          setPaymentError(err);
          notify.error(err);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          const text = msg ?? MSGS.topUp.createError;
          setPaymentError(text);
          notify.error(text);
        },
      },
    );
  };

  return (
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
  );
}
