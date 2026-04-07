'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Zap, Star, Crown, Loader2, ArrowRight } from 'lucide-react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import AppHeader from '@/components/sidebar/AppHeader';
import { useSubscriptionPlans, useBuySubscription } from '@/hooks/usePaymentApi';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const PLAN_ICONS: Record<number, React.ReactNode> = {
  1: <Zap className="w-6 h-6" />,
  2: <Star className="w-6 h-6" />,
  3: <Crown className="w-6 h-6" />,
};

const PLAN_COLORS: Record<number, { bg: string; icon: string; border: string; btn: string }> = {
  1: {
    bg: 'from-blue-50 to-blue-100/50',
    icon: 'bg-blue-500',
    border: 'border-blue-200 hover:border-blue-400',
    btn: 'bg-blue-600 hover:bg-blue-700',
  },
  2: {
    bg: 'from-indigo-50 to-purple-100/50',
    icon: 'bg-indigo-500',
    border: 'border-indigo-200 hover:border-indigo-400 ring-2 ring-indigo-500/20',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
  },
  3: {
    bg: 'from-amber-50 to-orange-100/50',
    icon: 'bg-gradient-to-br from-amber-500 to-orange-500',
    border: 'border-amber-200 hover:border-amber-400',
    btn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
  },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price);
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const { data: plans, isLoading, error } = useSubscriptionPlans();
  const { mutate: buyPlan, isPending: isBuying } = useBuySubscription();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const activePlans = plans?.filter((p) => p.isActive && p.description && !p.description.includes('Test')) ?? [];

  const handleBuy = (planId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setSelectedPlanId(planId);
    buyPlan(planId, {
      onSuccess: (res) => {
        toast.success(`Mua gói thành công! +${res.analysisQuotaAdded} EduCoin`);
        setSelectedPlanId(null);
      },
      onError: () => {
        toast.error('Mua gói thất bại. Vui lòng kiểm tra số dư ví.');
        setSelectedPlanId(null);
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {isHydrated && user ? <AppHeader /> : <PublicHeader />}

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Bảng giá
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Chọn gói phù hợp với bạn
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mua EduCoin để sử dụng các tính năng AI phân tích bài giảng. Gói càng lớn, tiết kiệm càng nhiều.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 sm:py-20 -mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-gray-500">Đang tải bảng giá...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">Không thể tải bảng giá. Vui lòng thử lại.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {activePlans.map((plan, index) => {
                const colorIdx = Math.min(index + 1, 3);
                const colors = PLAN_COLORS[colorIdx];
                const icon = PLAN_ICONS[colorIdx];
                const isPopular = index === 1;

                return (
                  <div
                    key={plan.planId}
                    className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl border ${colors.border} p-8 transition-all hover:shadow-xl flex flex-col`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                        Phổ biến nhất
                      </div>
                    )}

                    <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center text-white mb-5`}>
                      {icon}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.planName}</h3>
                    <p className="text-sm text-gray-500 mb-5">{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-extrabold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">đ</span>
                      <span className="text-gray-400 text-sm"> / {plan.durationDays} ngày</span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-2.5 text-sm text-gray-700">
                        <CheckCircle className="w-4.5 h-4.5 text-green-500 shrink-0 mt-0.5" />
                        <span><strong>{plan.analysisQuotaAmount.toLocaleString()}</strong> EduCoin phân tích AI</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-gray-700">
                        <CheckCircle className="w-4.5 h-4.5 text-green-500 shrink-0 mt-0.5" />
                        <span>Hiệu lực {plan.durationDays} ngày</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-gray-700">
                        <CheckCircle className="w-4.5 h-4.5 text-green-500 shrink-0 mt-0.5" />
                        <span>Tạo slide & video bài giảng</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-gray-700">
                        <CheckCircle className="w-4.5 h-4.5 text-green-500 shrink-0 mt-0.5" />
                        <span>Truy cập kho tài liệu</span>
                      </li>
                      {index >= 1 && (
                        <li className="flex items-start gap-2.5 text-sm text-gray-700">
                          <CheckCircle className="w-4.5 h-4.5 text-green-500 shrink-0 mt-0.5" />
                          <span>Hỗ trợ ưu tiên</span>
                        </li>
                      )}
                    </ul>

                    <button
                      onClick={() => handleBuy(plan.planId)}
                      disabled={isBuying && selectedPlanId === plan.planId}
                      className={`w-full py-3 rounded-xl text-sm font-semibold text-white ${colors.btn} transition-all flex items-center justify-center gap-2 disabled:opacity-60`}
                    >
                      {isBuying && selectedPlanId === plan.planId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Mua ngay
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'EduCoin là gì?',
                a: 'EduCoin là đơn vị tiêu dùng trên nền tảng EduVi. Mỗi lần sử dụng tính năng AI phân tích bài giảng sẽ tiêu tốn một số EduCoin nhất định.',
              },
              {
                q: 'Tôi có thể nạp tiền vào ví không?',
                a: 'Có, bạn có thể nạp tiền trực tiếp vào ví EduVi qua nhiều phương thức thanh toán khác nhau trong phần Quản lý tài khoản.',
              },
              {
                q: 'EduCoin có hết hạn không?',
                a: 'EduCoin có hiệu lực theo thời hạn của gói bạn đã mua. Sau khi hết hạn, EduCoin chưa sử dụng sẽ không còn hiệu lực.',
              },
              {
                q: 'Tôi có thể đổi gói không?',
                a: 'Bạn có thể mua thêm gói bất kỳ lúc nào. EduCoin mới sẽ được cộng thêm vào tài khoản hiện tại.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
