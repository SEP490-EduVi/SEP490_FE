'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle, FileText } from 'lucide-react';
import AppHeader from '@/components/sidebar/AppHeader';
import { usePendingMaterials, useReviewMaterial } from '@/hooks/useStaffApi';
import { getMaterialReviewDetail } from '@/services/staffServices';
import { notify, resolveGcsUrl } from '@/components/common';

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
      <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={url} controls className="w-full max-h-[480px]" onError={() => setFailed(true)} />
      </div>
    );
  }
  if (t === 'image') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Xem trước" className="max-h-[480px] w-full object-contain" onError={() => setFailed(true)} />
      </div>
    );
  }
  // document / slide / audio / fallback → iframe
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
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
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

const MATERIAL_TYPE_LABEL: Record<string, string> = {
  document: 'Tài liệu',
  video: 'Video',
  slide: 'Slide',
  image: 'Hình ảnh',
  audio: 'Âm thanh',
};

function pickPreviewSource(type: string, previewUrl?: string | null, resourceUrl?: string | null) {
  const t = (type || '').toLowerCase();
  if (t === 'video' || t === 'audio' || t === 'document' || t === 'slide') {
    return resourceUrl || previewUrl || null;
  }
  if (t === 'image') {
    return previewUrl || resourceUrl || null;
  }
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

  const [reasons, setReasons]           = useState<Record<string, string>>({});
  const [reasonErrors, setReasonErrors] = useState<Record<string, boolean>>({});
  const [previewUrls, setPreviewUrls]   = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen]   = useState<Record<string, boolean>>({});
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

    // Already resolved
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
        if (raw) {
          resolved = await resolvePreviewUrl(raw);
        }
      }

      if (resolved) {
        setPreviewUrls((p) => ({ ...p, [materialCode]: resolved as string }));
        setPreviewOpen((p) => ({ ...p, [materialCode]: true }));
      } else {
        notify.error('Không có nội dung để xem trước.');
      }
    } catch {
      notify.error('Không thể tải nội dung xem trước. Vui lòng thử lại.');
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
        onSuccess: () => notify.success(approved ? 'Đã duyệt học liệu thành công' : 'Đã từ chối học liệu'),
        onError: () => notify.error('Thao tác thất bại. Vui lòng thử lại.'),
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Duyệt học liệu</h1>
            <p className="text-sm text-gray-500">Danh sách material đang chờ phê duyệt.</p>
          </div>
          {data.length > 0 && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold text-white bg-blue-600">
              {data.length}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
            <p className="text-sm">Đang tải dữ liệu...</p>
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">Không thể tải danh sách học liệu.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-4">
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium">Không có học liệu chờ duyệt</p>
              </div>
            ) : (
              data.map((item) => {
                const isPreviewOpen = previewOpen[item.materialCode] ?? false;
                const hasReasonError = reasonErrors[item.materialCode] ?? false;

                return (
                  <div key={item.materialCode} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">

                    {/* Material title + preview toggle */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{item.description || 'Không có mô tả'}</p>
                      </div>
                      <button
                        onClick={() => handleTogglePreview(item.materialCode, item.type, item.previewUrl, item.resourceUrl)}
                        disabled={previewLoading === item.materialCode}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 flex-shrink-0 ${
                          isPreviewOpen
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {previewLoading === item.materialCode
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : isPreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {isPreviewOpen ? 'Ẩn nội dung' : 'Xem nội dung'}
                      </button>
                    </div>

                    {/* Inline preview */}
                    {isPreviewOpen && previewUrls[item.materialCode] && (
                      <InlinePreview url={previewUrls[item.materialCode]} type={item.type} />
                    )}
                    {isPreviewOpen && !previewUrls[item.materialCode] && previewLoading !== item.materialCode && (
                      <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
                        Không có nội dung để xem trước.
                      </div>
                    )}

                    {/* Meta tags */}
                    <div className="flex flex-wrap gap-2 mb-4 mt-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                        {MATERIAL_TYPE_LABEL[item.type?.toLowerCase()] ?? item.type}
                      </span>
                      {item.subjectName && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                          {item.subjectName}
                        </span>
                      )}
                      {item.gradeName && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                          {item.gradeName}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                        {(item.price ?? 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {/* Expert info */}
                    {item.expertName && (
                      <div className="flex items-center gap-2.5 mb-4 p-3 bg-gray-50 rounded-xl">
                        <ExpertAvatar name={item.expertName} />
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{item.expertName}</p>
                          <p className="text-xs text-gray-400">Expert</p>
                        </div>
                      </div>
                    )}

                    {/* Rejection reason — required when rejecting */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Lý do từ chối <span className="text-red-500">*</span>
                        <span className="font-normal text-gray-400 ml-1">(bắt buộc khi từ chối)</span>
                      </label>
                      <input
                        type="text"
                        value={reasons[item.materialCode] || ''}
                        onChange={(e) => {
                          setReasons((p) => ({ ...p, [item.materialCode]: e.target.value }));
                          if (e.target.value.trim()) {
                            setReasonErrors((p) => ({ ...p, [item.materialCode]: false }));
                          }
                        }}
                        placeholder="Nhập lý do cụ thể để expert biết cần cải thiện gì..."
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition ${
                          hasReasonError
                            ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400'
                            : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                      />
                      {hasReasonError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Vui lòng nhập lý do từ chối trước khi xác nhận.
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleReview(item.materialCode, true)}
                        disabled={reviewMaterial.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReview(item.materialCode, false)}
                        disabled={reviewMaterial.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-white text-red-600 border border-red-300 hover:bg-red-50 disabled:opacity-50 transition-colors font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Từ chối
                      </button>
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
