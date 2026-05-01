'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle, FileText,
  Film, Music, ImageIcon, LayoutTemplate, ArrowLeft, Clock, BookOpen,
  GraduationCap, Tag,
} from 'lucide-react';
import AppHeader from '@/components/sidebar/AppHeader';
import { usePendingMaterials, useReviewMaterial } from '@/hooks/useStaffApi';
import { getMaterialReviewDetail } from '@/services/staffServices';
import { notify, resolveGcsUrl, MSGS } from '@/components/common';

function InlinePreview({ url, type }: { url: string; type: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm text-gray-600">Không thể hiển thị trực tiếp nội dung này.</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          Mở nội dung ở tab mới
        </a>
      </div>
    );
  }

  const t = type?.toLowerCase();
  if (t === 'video') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-blue-100 bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={url} controls className="w-full max-h-[480px]" onError={() => setFailed(true)} />
      </div>
    );
  }
  if (t === 'image') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-blue-100 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Xem trước" className="max-h-[480px] w-full object-contain" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-blue-100 bg-gray-50">
      <iframe src={url} className="w-full h-[560px]" title="Xem trước nội dung" onError={() => setFailed(true)} />
    </div>
  );
}

function ExpertAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const colors = [
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

const MATERIAL_TYPE_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  document: { label: 'Tài liệu',  Icon: FileText,       color: 'text-blue-700',    bg: 'bg-blue-50' },
  video:    { label: 'Video',     Icon: Film,            color: 'text-violet-700',  bg: 'bg-violet-50' },
  slide:    { label: 'Slide',     Icon: LayoutTemplate,  color: 'text-indigo-700',  bg: 'bg-indigo-50' },
  image:    { label: 'Hình ảnh', Icon: ImageIcon,       color: 'text-emerald-700', bg: 'bg-emerald-50' },
  audio:    { label: 'Âm thanh', Icon: Music,           color: 'text-amber-700',   bg: 'bg-amber-50' },
};

function pickPreviewSource(type: string, previewUrl?: string | null, resourceUrl?: string | null) {
  const t = (type || '').toLowerCase();
  if (t === 'video' || t === 'audio' || t === 'document' || t === 'slide') return resourceUrl || previewUrl || null;
  if (t === 'image') return previewUrl || resourceUrl || null;
  return resourceUrl || previewUrl || null;
}

async function resolvePreviewUrl(rawUrl: string): Promise<string> {
  if (!rawUrl) throw new Error('Missing preview url');
  if (!rawUrl.startsWith('gs://')) return rawUrl;
  return resolveGcsUrl(rawUrl);
}

export default function StaffMaterialsPage() {
  const { data = [], isLoading, isError } = usePendingMaterials();
  const reviewMaterial = useReviewMaterial();

  const [reasons, setReasons]               = useState<Record<string, string>>({});
  const [reasonErrors, setReasonErrors]     = useState<Record<string, boolean>>({});
  const [previewUrls, setPreviewUrls]       = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen]       = useState<Record<string, boolean>>({});
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const handleTogglePreview = async (
    materialCode: string,
    type: string,
    previewUrl?: string | null,
    resourceUrl?: string | null,
  ) => {
    if (previewOpen[materialCode]) {
      setPreviewOpen((p) => ({ ...p, [materialCode]: false }));
      return;
    }
    if (previewUrls[materialCode]) {
      setPreviewOpen((p) => ({ ...p, [materialCode]: true }));
      return;
    }
    const rawUrl = pickPreviewSource(type, previewUrl, resourceUrl);
    try {
      setPreviewLoading(materialCode);
      let resolved: string | null = null;
      if (rawUrl) {
        resolved = await resolvePreviewUrl(rawUrl);
      } else {
        const detail = await getMaterialReviewDetail(materialCode);
        const raw = pickPreviewSource(type || detail.type || '', detail.previewUrl, detail.resourceUrl);
        if (raw) resolved = await resolvePreviewUrl(raw);
      }
      if (resolved) {
        setPreviewUrls((p) => ({ ...p, [materialCode]: resolved as string }));
        setPreviewOpen((p) => ({ ...p, [materialCode]: true }));
      } else {
        notify.error(MSGS.material.staff.previewError);
      }
    } catch {
      notify.error(MSGS.material.staff.previewLoadError);
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleReview = (materialCode: string, approved: boolean) => {
    if (!approved) {
      const reason = (reasons[materialCode] || '').trim();
      if (!reason) {
        setReasonErrors((p) => ({ ...p, [materialCode]: true }));
        return;
      }
    }
    setReasonErrors((p) => ({ ...p, [materialCode]: false }));

    reviewMaterial.mutate(
      {
        materialCode,
        input: {
          approved,
          rejectionReason: approved ? undefined : (reasons[materialCode] || '').trim(),
        },
      },
      {
        onSuccess: () => notify.success(approved ? MSGS.material.staff.approveSuccess : MSGS.material.staff.rejectSuccess),
        onError: () => notify.error(MSGS.material.staff.reviewError),
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">Duyệt học liệu</h1>
              <p className="text-sm text-gray-500">Danh sách học liệu đang chờ phê duyệt.</p>
            </div>
            {data.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-blue-600">
                <Clock className="w-3 h-3" />
                {data.length} chờ duyệt
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
            <p className="text-sm">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">Không thể tải danh sách học liệu.</p>
          </div>
        )}

        {/* List */}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-200" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Không có học liệu chờ duyệt</p>
                <p className="text-xs text-gray-400 mt-1">Tất cả học liệu đã được xử lý</p>
              </div>
            ) : (
              data.map((item) => {
                const isPreviewOpen  = previewOpen[item.materialCode] ?? false;
                const hasReasonError = reasonErrors[item.materialCode] ?? false;
                const typeKey        = (item.type || '').toLowerCase();
                const typeCfg        = MATERIAL_TYPE_CONFIG[typeKey] ?? { label: item.type, Icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' };
                const TypeIcon       = typeCfg.Icon;

                return (
                  <div
                    key={item.materialCode}
                    className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Card body */}
                    <div className="p-5">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl ${typeCfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</h3>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Preview toggle */}
                        <button
                          onClick={() => handleTogglePreview(item.materialCode, item.type, item.previewUrl, item.resourceUrl)}
                          disabled={previewLoading === item.materialCode}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition-colors disabled:opacity-50 flex-shrink-0 font-medium ${
                            isPreviewOpen
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {previewLoading === item.materialCode
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : isPreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {isPreviewOpen ? 'Ẩn' : 'Xem'}
                        </button>
                      </div>

                      {/* Meta tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${typeCfg.bg} ${typeCfg.color} text-xs font-medium`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeCfg.label}
                        </span>
                        {item.subjectName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                            <BookOpen className="w-3 h-3" />
                            {item.subjectName}
                          </span>
                        )}
                        {item.gradeName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                            <GraduationCap className="w-3 h-3" />
                            {item.gradeName}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                          <Tag className="w-3 h-3" />
                          {(item.price ?? 0) === 0 ? 'Miễn phí' : `${(item.price ?? 0).toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>

                      {/* Expert info */}
                      {item.expertName && (
                        <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                          <ExpertAvatar name={item.expertName} />
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{item.expertName}</p>
                            <p className="text-[10px] text-gray-400">Chuyên gia</p>
                          </div>
                        </div>
                      )}

                      {/* Inline preview */}
                      {isPreviewOpen && previewUrls[item.materialCode] && (
                        <InlinePreview url={previewUrls[item.materialCode]} type={item.type} />
                      )}
                      {isPreviewOpen && !previewUrls[item.materialCode] && previewLoading !== item.materialCode && (
                        <div className="mt-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-6 text-center text-sm text-gray-400">
                          Không có nội dung để xem trước.
                        </div>
                      )}
                    </div>

                    {/* Action footer */}
                    <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100 space-y-3">
                      {/* Rejection reason */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Lý do từ chối
                          <span className="text-red-500 ml-0.5">*</span>
                          <span className="font-normal text-gray-400 ml-1">(bắt buộc khi từ chối)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={reasons[item.materialCode] || ''}
                          onChange={(e) => {
                            setReasons((p) => ({ ...p, [item.materialCode]: e.target.value }));
                            if (e.target.value.trim()) setReasonErrors((p) => ({ ...p, [item.materialCode]: false }));
                          }}
                          placeholder="Nhập lý do cụ thể để expert biết cần cải thiện gì..."
                          className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition resize-none ${
                            hasReasonError
                              ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400'
                              : 'border-gray-200 bg-white focus:ring-blue-200 focus:border-blue-400'
                          }`}
                        />
                        {hasReasonError && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Vui lòng nhập lý do từ chối trước khi xác nhận.
                          </p>
                        )}
                      </div>

                      {/* Approve / Reject */}
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleReview(item.materialCode, true)}
                          disabled={reviewMaterial.isPending}
                          className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors font-semibold shadow-sm shadow-emerald-200"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Duyệt học liệu
                        </button>
                        <button
                          onClick={() => handleReview(item.materialCode, false)}
                          disabled={reviewMaterial.isPending}
                          className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold shadow-sm shadow-red-200"
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
