'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Package,
  TrendingUp,
  Crown,
  Brain,
  Gamepad2,
  Video,
  Presentation,
  Loader2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import AppHeader from '@/components/sidebar/AppHeader';
import { useSubscriptionPlans, useBuySubscription } from '@/hooks/usePaymentApi';
import { useAuthStore } from '@/store/useAuthStore';
import { notify, MSGS } from '@/components/common';

const PLAN_ICONS: Record<number, React.ReactNode> = {
  1: <Package className="w-6 h-6" />,
  2: <TrendingUp className="w-6 h-6" />,
  3: <Crown className="w-6 h-6" />,
  4: <Brain className="w-6 h-6" />,
  5: <Gamepad2 className="w-6 h-6" />,
  6: <Video className="w-6 h-6" />,
  7: <Presentation className="w-6 h-6" />,
};

const PLAN_COLORS: Record<number, { gradient: string; icon: string; border: string; hoverBorder: string; btn: string; shadow: string; badge?: string }> = {
  1: {
    gradient: 'from-blue-50/80 to-indigo-50/30',
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-200',
    btn: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    shadow: 'shadow-blue-500/15 hover:shadow-blue-500/25',
  },
  2: {
    gradient: 'from-violet-50/80 to-purple-50/30',
    icon: 'bg-gradient-to-br from-indigo-500 to-violet-600',
    border: 'border-indigo-100',
    hoverBorder: 'hover:border-indigo-200',
    btn: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700',
    shadow: 'shadow-indigo-500/15 hover:shadow-indigo-500/25',
    badge: 'bg-gradient-to-r from-indigo-600 to-violet-600',
  },
  3: {
    gradient: 'from-amber-50/80 to-orange-50/30',
    icon: 'bg-gradient-to-br from-amber-500 to-orange-500',
    border: 'border-amber-100',
    hoverBorder: 'hover:border-amber-200',
    btn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
    shadow: 'shadow-amber-500/15 hover:shadow-amber-500/25',
  },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price);
}

function resolvePlanDurationDays(durationDays?: number | null, description?: string | null): number | null {
  if (typeof durationDays === 'number' && Number.isFinite(durationDays) && durationDays > 0) {
    return durationDays;
  }
  const parsedFromDescription = description?.match(/(\d+)\s*ngày/i)?.[1];
  if (!parsedFromDescription) return null;
  const parsed = Number(parsedFromDescription);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        open ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-6 py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-gray-900 leading-snug">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100/60 pt-4">
          {a}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, role, isHydrated } = useAuthStore();
  const isStaff = role === 'staff';
  const { data: plans, isLoading, error } = useSubscriptionPlans({ enabled: !isStaff });
  const { mutate: buyPlan, isPending: isBuying } = useBuySubscription();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  useEffect(() => {
    if (isHydrated && isStaff) {
      router.replace('/staff');
    }
  }, [isHydrated, isStaff, router]);

  const activePlans = (plans ?? [])
    .filter((p) => {
      if (!p.isActive) return false;
      const searchableText = `${p.planName} ${p.description ?? ''}`.toLowerCase();
      return !searchableText.includes('test');
    })
    .sort((a, b) => a.price - b.price || a.planId - b.planId);

  const handleBuy = (planId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setSelectedPlanId(planId);
    buyPlan(planId, {
      onSuccess: (res) => {
        notify.success(MSGS.subscription.buySuccess(res.planName, res.analysisQuotaAdded));
        setSelectedPlanId(null);
      },
      onError: () => {
        notify.error(MSGS.subscription.buyError);
        setSelectedPlanId(null);
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {isHydrated && user ? <AppHeader /> : <PublicHeader />}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f5ff] via-[#f6f9ff] to-white py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-24 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px]" />
          <div className="absolute -top-20 right-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/60 text-blue-700 rounded-full text-sm font-medium mb-8 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Bảng giá
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Chọn gói
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent"> phù hợp với bạn</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Các gói EduCoin linh hoạt theo nhu cầu sử dụng. Bạn có thể nâng cấp bất kỳ lúc nào.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 sm:pb-28 -mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-24 rounded-3xl border border-gray-100 bg-white shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-500">Đang tải bảng giá...</span>
            </div>
          ) : error ? (
            <div className="text-center py-24 rounded-3xl border border-red-100 bg-white">
              <p className="text-red-500 mb-4">Không thể tải bảng giá. Vui lòng thử lại.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 text-sm font-medium bg-gray-50 text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Plans (3 main plans) */}
              <div className="flex justify-center">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-5xl">
                  {activePlans.filter(p => [1, 2, 3].includes(p.planId)).sort((a, b) => a.planId - b.planId).map((plan, index) => {
                    const colorIdx = Math.min(index + 1, 3);
                    const colors = PLAN_COLORS[plan.planId] ?? PLAN_COLORS[colorIdx];
                    const icon = PLAN_ICONS[plan.planId] ?? PLAN_ICONS[colorIdx];
                    const isPopular = plan.planId === 2; // Gói Tiêu Chuẩn là phổ biến
                    const durationDays = resolvePlanDurationDays(plan.durationDays, plan.description);

                    return (
                      <div
                        key={plan.planId}
                        className={`relative bg-gradient-to-br ${colors.gradient} rounded-3xl border ${colors.border} ${colors.hoverBorder} p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${colors.shadow} flex flex-col`}
                      >
                        {isPopular && colors.badge && (
                          <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 ${colors.badge} text-white text-xs font-bold rounded-full shadow-lg`}>
                            Phổ biến nhất
                          </div>
                        )}

                        <div className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                          {icon}
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.planName}</h3>
                        <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                        <div className="mb-8">
                          <span className="text-4xl font-extrabold text-gray-900">
                            {formatPrice(plan.price)}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">đ</span>
                          {durationDays ? <span className="text-gray-400 text-sm"> / {durationDays} ngày</span> : null}
                        </div>

                        <ul className="space-y-3.5 mb-8 flex-1">
                          <li className="flex items-start gap-3 text-sm text-gray-600">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">{plan.analysisQuotaAmount.toLocaleString('vi-VN')}</strong> EduCoin phân tích AI</span>
                          </li>
                          {durationDays ? (
                            <li className="flex items-start gap-3 text-sm text-gray-600">
                              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>Hiệu lực <strong className="text-gray-900">{durationDays} ngày</strong></span>
                            </li>
                          ) : null}
                          <li className="flex items-start gap-3 text-sm text-gray-600">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">{plan.slideQuotaAmount.toLocaleString('vi-VN')}</strong> slide quota</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm text-gray-600">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">{plan.videoQuotaAmount.toLocaleString('vi-VN')}</strong> video quota</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm text-gray-600">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">{(plan.gameQuotaAmount ?? 0).toLocaleString('vi-VN')}</strong> game quota</span>
                          </li>
                        </ul>

                        <button
                          onClick={() => handleBuy(plan.planId)}
                          disabled={isBuying && selectedPlanId === plan.planId}
                          className={`w-full py-3.5 rounded-2xl text-sm font-semibold text-white ${colors.btn} transition-all shadow-lg ${colors.shadow} hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0`}
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
              </div>

              {/* Other Plans */}
              {activePlans.filter(p => ![1, 2, 3].includes(p.planId)).length > 0 && (
                <div className="pt-8 border-t border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Các gói khác</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {activePlans.filter(p => ![1, 2, 3].includes(p.planId)).sort((a, b) => a.price - b.price).map((plan) => {
                      const colorIdx = Math.min([4, 5, 6, 7].indexOf(plan.planId) + 1, 3);
                      const colors = PLAN_COLORS[colorIdx];
                      const icon = PLAN_ICONS[plan.planId] ?? PLAN_ICONS[colorIdx];
                      const durationDays = resolvePlanDurationDays(plan.durationDays, plan.description);

                      return (
                        <div
                          key={plan.planId}
                          className={`relative bg-gradient-to-br ${colors.gradient} rounded-2xl border ${colors.border} ${colors.hoverBorder} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colors.shadow} flex flex-col`}
                        >
                          <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center text-white mb-4 shadow-md`}>
                            {icon}
                          </div>

                          <h3 className="text-base font-bold text-gray-900 mb-1">{plan.planName}</h3>
                          <p className="text-xs text-gray-500 mb-4">{plan.description}</p>

                          <div className="mb-6">
                            <span className="text-2xl font-extrabold text-gray-900">
                              {formatPrice(plan.price)}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">đ</span>
                            {durationDays ? <span className="text-gray-400 text-xs"> / {durationDays} ngày</span> : null}
                          </div>

                          <ul className="space-y-2 mb-6 flex-1 text-xs">
                            {plan.analysisQuotaAmount > 0 && (
                              <li className="flex items-start gap-2 text-gray-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span><strong>{plan.analysisQuotaAmount.toLocaleString('vi-VN')}</strong> phân tích</span>
                              </li>
                            )}
                            {plan.slideQuotaAmount > 0 && (
                              <li className="flex items-start gap-2 text-gray-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span><strong>{plan.slideQuotaAmount.toLocaleString('vi-VN')}</strong> slide</span>
                              </li>
                            )}
                            {plan.videoQuotaAmount > 0 && (
                              <li className="flex items-start gap-2 text-gray-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span><strong>{plan.videoQuotaAmount.toLocaleString('vi-VN')}</strong> video</span>
                              </li>
                            )}
                            {(plan.gameQuotaAmount ?? 0) > 0 && (
                              <li className="flex items-start gap-2 text-gray-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span><strong>{(plan.gameQuotaAmount ?? 0).toLocaleString('vi-VN')}</strong> game</span>
                              </li>
                            )}
                          </ul>

                          <button
                            onClick={() => handleBuy(plan.planId)}
                            disabled={isBuying && selectedPlanId === plan.planId}
                            className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white ${colors.btn} transition-all shadow-md ${colors.shadow} hover:-translate-y-0.5 flex items-center justify-center gap-1 disabled:opacity-60 disabled:hover:translate-y-0`}
                          >
                            {isBuying && selectedPlanId === plan.planId ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Xử lý...
                              </>
                            ) : (
                              <>
                                Mua
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-gray-50/60 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 mb-6 shadow-sm">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Câu hỏi thường gặp
            </h2>
            <p className="text-gray-500">Giải đáp những thắc mắc phổ biến về gói dịch vụ</p>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'EduCoin là gì?',
                a: 'EduCoin là đơn vị tiêu dùng trên nền tảng EduVi. Mỗi lần thanh toán sẽ tiêu tốn EduCoin trong việc mua các gói dịch vụ để sử dụng tính năng AI.',
              },
              {
                q: 'Tôi có thể nạp tiền vào ví không?',
                a: 'Có, bạn có thể nạp tiền trực tiếp vào ví EduVi qua phương thức thanh toán trong phần Quản lý tài khoản.',
              },
              {
                q: 'EduCoin có hết hạn không?',
                a: 'EduCoin không có hiệu lực theo thời hạn của gói bạn đã mua.',
              },
              {
                q: 'Tôi có thể đổi gói không?',
                a: 'Bạn có thể mua thêm gói bất kỳ lúc nào. EduCoin mới sẽ được cộng thêm vào tài khoản hiện tại.',
              },
            ].map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
