'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Download, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import AppHeader from '@/components/sidebar/AppHeader';
import { usePendingVerifications, useReviewVerification } from '@/hooks/useStaffApi';
import { downloadVerificationFile } from '@/services/staffServices';
import { notify, MSGS } from '@/components/common';

function InlinePreview({ url, fileType }: { url: string; fileType: string }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(url);
  if (isImage) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={fileType} className="max-h-[500px] w-full object-contain" />
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
      <iframe src={url} className="w-full h-[560px]" title={fileType} />
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
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

const FILE_TYPE_LABEL: Record<string, string> = {
  degree: 'Bằng cấp',
  certificate: 'Chứng chỉ',
  id_card: 'CMND / CCCD',
  transcript: 'Bảng điểm',
};

export default function StaffVerificationsPage() {
  const { data = [], isLoading, isError } = usePendingVerifications();
  const reviewVerification = useReviewVerification();

  const [reasons, setReasons]           = useState<Record<string, string>>({});
  const [reasonErrors, setReasonErrors] = useState<Record<string, boolean>>({});
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen]   = useState<Record<string, boolean>>({});
  const [blobUrls, setBlobUrls]         = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const handleTogglePreview = async (verificationCode: string, fileUrl: string | null) => {
    if (previewOpen[verificationCode]) {
      setPreviewOpen((p) => ({ ...p, [verificationCode]: false }));
      return;
    }
    if (fileUrl) {
      setPreviewOpen((p) => ({ ...p, [verificationCode]: true }));
      return;
    }
    // Fallback: fetch blob → objectURL
    try {
      setPreviewLoading(verificationCode);
      const { blob } = await downloadVerificationFile(verificationCode);
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrls((p) => ({ ...p, [verificationCode]: objectUrl }));
      setPreviewOpen((p) => ({ ...p, [verificationCode]: true }));
    } catch {
      notify.error(MSGS.material.staff.previewDownloadError);
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleDownloadFile = async (verificationCode: string) => {
    try {
      setDownloadingCode(verificationCode);
      const { blob, fileName } = await downloadVerificationFile(verificationCode);
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      notify.error(MSGS.material.staff.downloadError);
    } finally {
      setDownloadingCode(null);
    }
  };

  const handleDecision = (verificationCode: string, approved: boolean) => {
    if (!approved) {
      const reason = (reasons[verificationCode] || '').trim();
      if (!reason) {
        setReasonErrors((p) => ({ ...p, [verificationCode]: true }));
        return;
      }
    }
    setReasonErrors((p) => ({ ...p, [verificationCode]: false }));

    reviewVerification.mutate(
      {
        verificationCode,
        input: {
          approved,
          rejectionReason: approved ? undefined : (reasons[verificationCode] || '').trim(),
        },
      },
      {
        onSuccess: () => notify.success(approved ? MSGS.staff.approveSuccess : MSGS.staff.rejectSuccess),
        onError: () => notify.error(MSGS.staff.processError),
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Duyệt hồ sơ xác minh Expert</h1>
            <p className="text-sm text-gray-500">Hồ sơ đang chờ duyệt từ chuyên gia.</p>
          </div>
          {data.length > 0 && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold text-white bg-violet-600">
              {data.length}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
            <p className="text-sm">Đang tải dữ liệu...</p>
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">Không thể tải danh sách hồ sơ.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-4">
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ShieldCheck className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium">Không có hồ sơ chờ duyệt</p>
              </div>
            ) : (
              data.map((item) => {
                const previewUrl = item.fileUrl || blobUrls[item.verificationCode] || null;
                const isPreviewOpen = previewOpen[item.verificationCode] ?? false;
                const hasReasonError = reasonErrors[item.verificationCode] ?? false;

                return (
                  <div key={item.verificationCode} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">

                    {/* Expert info row */}
                    <div className="flex items-start gap-4">
                      <ExpertAvatar name={item.expertName} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.expertName}</p>
                            <p className="text-xs text-gray-400">{item.expertEmail}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleTogglePreview(item.verificationCode, item.fileUrl)}
                              disabled={previewLoading === item.verificationCode}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${
                                isPreviewOpen
                                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {previewLoading === item.verificationCode
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : isPreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              {isPreviewOpen ? 'Ẩn file' : 'Xem file'}
                            </button>
                            <button
                              onClick={() => handleDownloadFile(item.verificationCode)}
                              disabled={downloadingCode === item.verificationCode}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              {downloadingCode === item.verificationCode
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Download className="w-3.5 h-3.5" />}
                              Tải về
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-xs font-medium">
                            {FILE_TYPE_LABEL[item.fileType] ?? item.fileType}
                          </span>
                          <span className="text-xs text-gray-400">
                            Nộp lúc: {new Date(item.uploadedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Inline preview */}
                    {isPreviewOpen && previewUrl && (
                      <InlinePreview url={previewUrl} fileType={item.fileType} />
                    )}
                    {isPreviewOpen && !previewUrl && (
                      <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
                        Không có file để xem trước.
                      </div>
                    )}

                    {/* Rejection reason — required when rejecting */}
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Lý do từ chối <span className="text-red-500">*</span>
                        <span className="font-normal text-gray-400 ml-1">(bắt buộc khi từ chối)</span>
                      </label>
                      <input
                        type="text"
                        value={reasons[item.verificationCode] || ''}
                        onChange={(e) => {
                          setReasons((p) => ({ ...p, [item.verificationCode]: e.target.value }));
                          if (e.target.value.trim()) {
                            setReasonErrors((p) => ({ ...p, [item.verificationCode]: false }));
                          }
                        }}
                        placeholder="Nhập lý do cụ thể để expert biết cần cải thiện gì..."
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition ${
                          hasReasonError
                            ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400'
                            : 'border-gray-200 focus:ring-violet-200 focus:border-violet-400'
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
                    <div className="flex items-center gap-2.5 mt-4">
                      <button
                        onClick={() => handleDecision(item.verificationCode, true)}
                        disabled={reviewVerification.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleDecision(item.verificationCode, false)}
                        disabled={reviewVerification.isPending}
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
