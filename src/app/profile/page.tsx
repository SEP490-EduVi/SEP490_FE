'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShieldCheck, Loader2, FileText,
  Mail, Phone, BadgeCheck, LockKeyhole, Wallet, CreditCard,
  ArrowRight, Layers, Film, Library,
} from 'lucide-react';
import type { UserInfo as AuthUserInfo } from '@/types/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetMeService } from '@/services/authServices';

import { useExpertProfile } from '@/hooks/useExpertApi';
import { useStaffProfile } from '@/hooks/useStaffApi';
import { useTeacherProfile } from '@/hooks/useTeacherApi';
import { useUserQuota } from '@/hooks/usePaymentApi';
import { useAllProducts } from '@/hooks/useProductApi';
import { useAllVideos } from '@/hooks/usePipelineApi';
import { usePurchasedMaterials } from '@/hooks/useMaterialShopApi';
import { useDocumentStore } from '@/store/useDocumentStore';
import * as productService from '@/services/productServices';
import VideoPlayerModal from '@/components/projects/VideoPlayerModal';
import type { VideoProductDto } from '@/types/api';
import AppHeader from '@/components/sidebar/AppHeader';
import { notify, MSGS } from '@/components/common';
import SecurityTab from '@/components/profile/SecurityTab';
import PaymentTab from '@/components/profile/PaymentTab';
import CertificateTab from '@/components/profile/CertificateTab';
import ProfileTab from '@/components/profile/ProfileTab';
import WithdrawalTab from '@/components/profile/WithdrawalTab';

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'security' | 'payment' | 'certificate' | 'slides' | 'videos' | 'library' | 'withdrawal';
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

// ── Inner page (needs Suspense because of useSearchParams) ───────────────
function ProfilePageInner() {
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const { user, role: storeRole, setUser } = useAuthStore();
  const setDocument     = useDocumentStore((s) => s.setDocument);

  // Fallback only: role-specific profile is the source of truth for profile data.
  const { data: meData, isLoading: isMeLoading } = useGetMeService({ enabled: !user });
  const meResponse = meData as { result?: AuthUserInfo } | undefined;
  const meResult = meResponse?.result;

  useEffect(() => {
    if (meResult && !user) setUser(meResult);
  }, [meResult, setUser, user]);

  const effectiveRole = storeRole !== 'guest'
    ? storeRole
    : resolveProfileRole(meResult?.role?.roleName ?? user?.role?.roleName ?? null);

  const isStaff = effectiveRole === 'staff';
  const isExpert = effectiveRole === 'expert';
  const isTeacher = effectiveRole === 'teacher';

  const defaultTab = (): Tab => {
    const t = searchParams.get('tab');
    if (t === 'security')    return 'security';
    if (t === 'payment' && !isStaff) return 'payment';

    if (t === 'slides' && isTeacher) return 'slides';
    if (t === 'videos' && isTeacher) return 'videos';
    if (t === 'library' && isTeacher) return 'library';
    if (t === 'certificate') return 'certificate';
    return 'profile';
  };
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    if (isStaff && activeTab === 'payment') {
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

  const isProfileLoading = isRoleProfileLoading || (isMeLoading && !user && !meResult);

  const baseInfo = (user ?? meResult ?? null) as ({
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

  const [avatarImgError, setAvatarImgError] = useState(false);
  useEffect(() => { setAvatarImgError(false); }, [info?.avatarUrl]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayName = info?.fullName || info?.username || 'Tài khoản';
  const initial     = displayName.charAt(0).toUpperCase();
  const roleLabel   = info?.role?.roleName ?? toRoleDisplayName(effectiveRole);
  const isActive    = info?.status === 1;

  // ── Quota (teacher) ───────────────────────────────────────────────────────
  const { data: userQuota, isLoading: quotaLoading } = useUserQuota({ enabled: isTeacher });

  // ── Slides / Videos / Library data ────────────────────────────────────────
  const { data: allProducts = [], isLoading: slidesLoading } = useAllProducts();
  const { data: allVideos = [], isLoading: videosLoading } = useAllVideos();
  const { data: purchasedMaterials = [], isLoading: libLoading } = usePurchasedMaterials();
  const mySlides = allProducts.filter((p) => p.hasSlide);
  const myVideos = allVideos.filter((v) => v.status?.toLowerCase() === 'completed');

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
    } catch { notify.error(MSGS.slide.openError); }
    finally { setViewSlideLoading(null); }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile',  label: 'Hồ sơ',    icon: User       },
    { key: 'security', label: 'Bảo mật',  icon: LockKeyhole},
    ...(!isStaff ? [{ key: 'payment' as Tab, label: isExpert ? 'Ví tiền' : 'Thanh toán', icon: Wallet }] : []),
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
            <ProfileTab
              info={info}
              isProfileLoading={isProfileLoading}
              isStaff={isStaff}
              isTeacher={isTeacher}
              isExpert={isExpert}
              roleExtraLabel={roleExtraLabel}
              roleExtraValue={roleExtraValue}
              staffHireDate={staffHireDate}
              expertUserCode={expertUserCode}
              expertVerificationText={expertVerificationText}
              expertIsVerified={expertIsVerified}
              roleLabel={roleLabel}
              initial={initial}
              refetchExpertProfile={refetchExpertProfile}
            />
          )}

          {/* ════ Bảo mật ════ */}
          {activeTab === 'security' && <SecurityTab />}

          {/* ════ Thanh toán ════ */}
          {!isStaff && activeTab === 'payment' && <PaymentTab isStaff={isStaff} isExpert={isExpert} />}



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
            <CertificateTab expertId={(info as { expertId?: number | null } | null)?.expertId ?? null} />
          )}

          {/* ════ Rút tiền ════ */}
          {activeTab === 'withdrawal' && isExpert && (
            <WithdrawalTab />
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
